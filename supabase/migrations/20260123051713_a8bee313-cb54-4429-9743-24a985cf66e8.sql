-- Fix SECURITY DEFINER functions to use auth.uid() directly instead of trusting client-supplied user_id

-- 1. Fix create_listing - use auth.uid() instead of p_seller_id parameter
CREATE OR REPLACE FUNCTION public.create_listing(p_credits numeric, p_price_per_credit numeric)
 RETURNS TABLE(success boolean, message text, listing_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_seller profiles%ROWTYPE;
  v_new_listing_id UUID;
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Validate inputs
  IF p_credits <= 0 THEN
    RETURN QUERY SELECT false, 'Credits must be positive'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_price_per_credit <= 0 THEN
    RETURN QUERY SELECT false, 'Price must be positive'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Lock and validate seller using auth.uid()
  SELECT * INTO v_seller FROM profiles WHERE id = v_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_seller.credits < p_credits THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Deduct credits atomically
  UPDATE profiles SET credits = credits - p_credits WHERE id = v_user_id;
  
  -- Create listing
  INSERT INTO marketplace_listings (seller_id, credits_available, price_per_credit, status)
  VALUES (v_user_id, p_credits, p_price_per_credit, 'active')
  RETURNING id INTO v_new_listing_id;
  
  RETURN QUERY SELECT true, 'Listing created'::TEXT, v_new_listing_id;
END;
$function$;

-- 2. Fix redeem_credits - use auth.uid() instead of p_user_id parameter
CREATE OR REPLACE FUNCTION public.redeem_credits(p_credits numeric)
 RETURNS TABLE(success boolean, message text, savings numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user profiles%ROWTYPE;
  v_savings NUMERIC;
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Validate input
  IF p_credits <= 0 THEN
    RETURN QUERY SELECT false, 'Credits must be positive'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Lock and validate user using auth.uid()
  SELECT * INTO v_user FROM profiles WHERE id = v_user_id FOR UPDATE;
  
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
  WHERE id = v_user_id;
  
  RETURN QUERY SELECT true, 'Credits redeemed'::TEXT, v_savings;
END;
$function$;

-- 3. Fix earn_credits - use auth.uid() instead of p_user_id parameter
CREATE OR REPLACE FUNCTION public.earn_credits()
 RETURNS TABLE(success boolean, message text, credits_earned numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_energy_log energy_logs%ROWTYPE;
  v_credits NUMERIC;
  v_today DATE := CURRENT_DATE;
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Lock and get today's energy log using auth.uid()
  SELECT * INTO v_energy_log 
  FROM energy_logs 
  WHERE user_id = v_user_id AND log_date = v_today
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
  UPDATE profiles SET credits = credits + v_credits WHERE id = v_user_id;
  
  -- Reset sent_to_grid
  UPDATE energy_logs SET sent_to_grid = 0 WHERE id = v_energy_log.id;
  
  RETURN QUERY SELECT true, 'Credits earned'::TEXT, v_credits;
END;
$function$;

-- 4. Fix purchase_listing - add auth.uid() validation (already validates buyer != seller, but should validate buyer matches caller)
CREATE OR REPLACE FUNCTION public.purchase_listing(p_listing_id uuid)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
  v_buyer profiles%ROWTYPE;
  v_total_cost NUMERIC;
  v_buyer_id UUID;
BEGIN
  -- Get authenticated user ID
  v_buyer_id := auth.uid();
  
  IF v_buyer_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT;
    RETURN;
  END IF;

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
  IF v_listing.seller_id = v_buyer_id THEN
    RETURN QUERY SELECT false, 'Cannot buy own listing'::TEXT;
    RETURN;
  END IF;
  
  v_total_cost := v_listing.credits_available * v_listing.price_per_credit;
  
  -- Lock and validate buyer
  SELECT * INTO v_buyer FROM profiles WHERE id = v_buyer_id FOR UPDATE;
  IF v_buyer.cash < v_total_cost THEN
    RETURN QUERY SELECT false, 'Insufficient funds'::TEXT;
    RETURN;
  END IF;
  
  -- Execute all updates atomically
  UPDATE profiles SET
    credits = credits + v_listing.credits_available,
    cash = cash - v_total_cost
  WHERE id = v_buyer_id;
  
  UPDATE profiles SET
    cash = cash + v_total_cost
  WHERE id = v_listing.seller_id;
  
  UPDATE marketplace_listings SET status = 'sold' WHERE id = p_listing_id;
  
  INSERT INTO transactions (buyer_id, seller_id, listing_id, credits_amount, total_price)
  VALUES (v_buyer_id, v_listing.seller_id, p_listing_id, v_listing.credits_available, v_total_cost);
  
  RETURN QUERY SELECT true, 'Purchase successful'::TEXT;
END;
$function$;