-- Fix #1: Create atomic database functions to prevent race conditions
-- Fix #2: Create a public view to hide seller_id from marketplace listings

-- ===== ATOMIC FUNCTION: Purchase Listing =====
CREATE OR REPLACE FUNCTION public.purchase_listing(
  p_buyer_id UUID,
  p_listing_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
  v_buyer profiles%ROWTYPE;
  v_total_cost NUMERIC;
BEGIN
  -- Lock and validate listing
  SELECT * INTO v_listing
  FROM marketplace_listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Listing not available'::TEXT;
    RETURN;
  END IF;
  
  -- Validate not buying own listing
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN QUERY SELECT false, 'Cannot buy own listing'::TEXT;
    RETURN;
  END IF;
  
  v_total_cost := v_listing.credits_available * v_listing.price_per_credit;
  
  -- Lock and validate buyer
  SELECT * INTO v_buyer FROM profiles WHERE id = p_buyer_id FOR UPDATE;
  IF v_buyer.cash < v_total_cost THEN
    RETURN QUERY SELECT false, 'Insufficient funds'::TEXT;
    RETURN;
  END IF;
  
  -- Execute all updates atomically
  UPDATE profiles SET
    credits = credits + v_listing.credits_available,
    cash = cash - v_total_cost
  WHERE id = p_buyer_id;
  
  UPDATE profiles SET
    cash = cash + v_total_cost
  WHERE id = v_listing.seller_id;
  
  UPDATE marketplace_listings SET status = 'sold' WHERE id = p_listing_id;
  
  INSERT INTO transactions (buyer_id, seller_id, listing_id, credits_amount, total_price)
  VALUES (p_buyer_id, v_listing.seller_id, p_listing_id, v_listing.credits_available, v_total_cost);
  
  RETURN QUERY SELECT true, 'Purchase successful'::TEXT;
END;
$$;

-- ===== ATOMIC FUNCTION: Create Listing =====
CREATE OR REPLACE FUNCTION public.create_listing(
  p_seller_id UUID,
  p_credits NUMERIC,
  p_price_per_credit NUMERIC
)
RETURNS TABLE(success BOOLEAN, message TEXT, listing_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_seller profiles%ROWTYPE;
  v_new_listing_id UUID;
BEGIN
  -- Validate inputs
  IF p_credits <= 0 THEN
    RETURN QUERY SELECT false, 'Credits must be positive'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_price_per_credit <= 0 THEN
    RETURN QUERY SELECT false, 'Price must be positive'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Lock and validate seller
  SELECT * INTO v_seller FROM profiles WHERE id = p_seller_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_seller.credits < p_credits THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Deduct credits atomically
  UPDATE profiles SET credits = credits - p_credits WHERE id = p_seller_id;
  
  -- Create listing
  INSERT INTO marketplace_listings (seller_id, credits_available, price_per_credit, status)
  VALUES (p_seller_id, p_credits, p_price_per_credit, 'active')
  RETURNING id INTO v_new_listing_id;
  
  RETURN QUERY SELECT true, 'Listing created'::TEXT, v_new_listing_id;
END;
$$;

-- ===== ATOMIC FUNCTION: Redeem Credits (Consumer) =====
CREATE OR REPLACE FUNCTION public.redeem_credits(
  p_user_id UUID,
  p_credits NUMERIC
)
RETURNS TABLE(success BOOLEAN, message TEXT, savings NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user profiles%ROWTYPE;
  v_savings NUMERIC;
BEGIN
  -- Validate input
  IF p_credits <= 0 THEN
    RETURN QUERY SELECT false, 'Credits must be positive'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Lock and validate user
  SELECT * INTO v_user FROM profiles WHERE id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF v_user.credits < p_credits THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calculate savings (₹2 per credit)
  v_savings := p_credits * 2;
  
  -- Update profile atomically
  UPDATE profiles SET 
    credits = credits - p_credits,
    cash = cash + v_savings
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT true, 'Credits redeemed'::TEXT, v_savings;
END;
$$;

-- ===== ATOMIC FUNCTION: Earn Credits (Producer) =====
CREATE OR REPLACE FUNCTION public.earn_credits(
  p_user_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, credits_earned NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_energy_log energy_logs%ROWTYPE;
  v_credits NUMERIC;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Lock and get today's energy log
  SELECT * INTO v_energy_log 
  FROM energy_logs 
  WHERE user_id = p_user_id AND log_date = v_today
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No energy log for today'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  v_credits := COALESCE(v_energy_log.sent_to_grid, 0);
  
  IF v_credits <= 0 THEN
    RETURN QUERY SELECT false, 'No energy to convert'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Update profile credits atomically
  UPDATE profiles SET credits = credits + v_credits WHERE id = p_user_id;
  
  -- Reset sent_to_grid
  UPDATE energy_logs SET sent_to_grid = 0 WHERE id = v_energy_log.id;
  
  RETURN QUERY SELECT true, 'Credits earned'::TEXT, v_credits;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.purchase_listing TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_listing TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.earn_credits TO authenticated;

-- ===== Fix #2: Create public view without seller_id =====
-- Create a view that excludes seller_id for public listing display
CREATE VIEW public.marketplace_listings_public
WITH (security_invoker = on) AS
SELECT 
  id,
  credits_available,
  price_per_credit,
  status,
  created_at
FROM public.marketplace_listings
WHERE status = 'active';

-- Grant select on the view
GRANT SELECT ON public.marketplace_listings_public TO authenticated;

-- Create a function to check if current user owns a listing (for UI purposes)
CREATE OR REPLACE FUNCTION public.is_own_listing(p_listing_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM marketplace_listings 
    WHERE id = p_listing_id AND seller_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_own_listing TO authenticated;