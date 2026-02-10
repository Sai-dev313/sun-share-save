
-- Update pay_bill function: change credit savings from ₹2 to ₹3 per credit
CREATE OR REPLACE FUNCTION public.pay_bill(p_bill_amount numeric, p_credits_to_use numeric, p_provider text DEFAULT 'MSEDCL'::text, p_consumer_number text DEFAULT ''::text, p_consumer_name text DEFAULT ''::text, p_billing_month text DEFAULT ''::text, p_meter_number text DEFAULT ''::text, p_units_consumed numeric DEFAULT 0)
 RETURNS TABLE(success boolean, message text, credits_remaining numeric, cash_remaining numeric, receipt_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user profiles%ROWTYPE;
  v_credit_savings NUMERIC;
  v_cash_to_pay NUMERIC;
  v_user_id UUID;
  v_receipt_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;

  IF p_bill_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Bill amount must be positive'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_credits_to_use < 0 THEN
    RETURN QUERY SELECT false, 'Credits cannot be negative'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;
  
  SELECT * INTO v_user FROM profiles WHERE id = v_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_user.credits < p_credits_to_use THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;
  
  -- Changed from * 2 to * 3 (₹3 per credit)
  v_credit_savings := p_credits_to_use * 3;
  v_cash_to_pay := GREATEST(0, p_bill_amount - v_credit_savings);
  
  UPDATE profiles SET 
    credits = credits - p_credits_to_use
  WHERE id = v_user_id;
  
  INSERT INTO bill_payments (
    user_id, bill_amount, credits_used, credit_savings, cash_paid,
    provider, consumer_number, consumer_name, billing_month, meter_number, units_consumed
  )
  VALUES (
    v_user_id, p_bill_amount, p_credits_to_use, v_credit_savings, v_cash_to_pay,
    p_provider, p_consumer_number, p_consumer_name, p_billing_month, p_meter_number, p_units_consumed
  )
  RETURNING id INTO v_receipt_id;
  
  RETURN QUERY SELECT 
    true, 
    'Bill paid successfully'::TEXT, 
    (v_user.credits - p_credits_to_use)::NUMERIC,
    v_user.cash::NUMERIC,
    v_receipt_id;
END;
$function$;

-- Update pay_bill (simple version) to use * 3
CREATE OR REPLACE FUNCTION public.pay_bill(p_bill_amount numeric, p_credits_to_use numeric)
 RETURNS TABLE(success boolean, message text, credits_remaining numeric, cash_remaining numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user profiles%ROWTYPE;
  v_credit_savings NUMERIC;
  v_cash_to_pay NUMERIC;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  IF p_bill_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Bill amount must be positive'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF p_credits_to_use < 0 THEN
    RETURN QUERY SELECT false, 'Credits cannot be negative'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  SELECT * INTO v_user FROM profiles WHERE id = v_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF v_user.credits < p_credits_to_use THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Changed from * 2 to * 3
  v_credit_savings := p_credits_to_use * 3;
  v_cash_to_pay := GREATEST(0, p_bill_amount - v_credit_savings);
  
  IF v_user.cash < v_cash_to_pay THEN
    RETURN QUERY SELECT false, 'Insufficient cash balance'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  UPDATE profiles SET 
    credits = credits - p_credits_to_use,
    cash = cash - v_cash_to_pay
  WHERE id = v_user_id;
  
  INSERT INTO bill_payments (user_id, bill_amount, credits_used, credit_savings, cash_paid)
  VALUES (v_user_id, p_bill_amount, p_credits_to_use, v_credit_savings, v_cash_to_pay);
  
  RETURN QUERY SELECT 
    true, 
    'Bill paid successfully'::TEXT, 
    (v_user.credits - p_credits_to_use)::NUMERIC,
    (v_user.cash - v_cash_to_pay)::NUMERIC;
END;
$function$;

-- Update redeem_credits to use * 3
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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  IF p_credits <= 0 THEN
    RETURN QUERY SELECT false, 'Credits must be positive'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  SELECT * INTO v_user FROM profiles WHERE id = v_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF v_user.credits < p_credits THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Changed from * 2 to * 3
  v_savings := p_credits * 3;
  
  UPDATE profiles SET 
    credits = credits - p_credits,
    cash = cash + v_savings
  WHERE id = v_user_id;
  
  RETURN QUERY SELECT true, 'Credits redeemed'::TEXT, v_savings;
END;
$function$;

-- Update redeem_credits (legacy version with user_id param) to use * 3
CREATE OR REPLACE FUNCTION public.redeem_credits(p_user_id uuid, p_credits numeric)
 RETURNS TABLE(success boolean, message text, savings numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user profiles%ROWTYPE;
  v_savings NUMERIC;
BEGIN
  IF p_credits <= 0 THEN
    RETURN QUERY SELECT false, 'Credits must be positive'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  SELECT * INTO v_user FROM profiles WHERE id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF v_user.credits < p_credits THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Changed from * 2 to * 3
  v_savings := p_credits * 3;
  
  UPDATE profiles SET 
    credits = credits - p_credits,
    cash = cash + v_savings
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT true, 'Credits redeemed'::TEXT, v_savings;
END;
$function$;

-- Update create_listing to enforce price range 0.5-2.5
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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF p_credits <= 0 THEN
    RETURN QUERY SELECT false, 'Credits must be positive'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_price_per_credit < 0.5 OR p_price_per_credit > 2.5 THEN
    RETURN QUERY SELECT false, 'Price per credit must be between ₹0.50 and ₹2.50'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  SELECT * INTO v_seller FROM profiles WHERE id = v_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_seller.credits < p_credits THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  UPDATE profiles SET credits = credits - p_credits WHERE id = v_user_id;
  
  INSERT INTO marketplace_listings (seller_id, credits_available, price_per_credit, status)
  VALUES (v_user_id, p_credits, p_price_per_credit, 'active')
  RETURNING id INTO v_new_listing_id;
  
  RETURN QUERY SELECT true, 'Listing created'::TEXT, v_new_listing_id;
END;
$function$;

-- Update create_listing (legacy version with seller_id param)
CREATE OR REPLACE FUNCTION public.create_listing(p_seller_id uuid, p_credits numeric, p_price_per_credit numeric)
 RETURNS TABLE(success boolean, message text, listing_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_seller profiles%ROWTYPE;
  v_new_listing_id UUID;
BEGIN
  IF p_credits <= 0 THEN
    RETURN QUERY SELECT false, 'Credits must be positive'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_price_per_credit < 0.5 OR p_price_per_credit > 2.5 THEN
    RETURN QUERY SELECT false, 'Price per credit must be between ₹0.50 and ₹2.50'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  SELECT * INTO v_seller FROM profiles WHERE id = p_seller_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_seller.credits < p_credits THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  UPDATE profiles SET credits = credits - p_credits WHERE id = p_seller_id;
  
  INSERT INTO marketplace_listings (seller_id, credits_available, price_per_credit, status)
  VALUES (p_seller_id, p_credits, p_price_per_credit, 'active')
  RETURNING id INTO v_new_listing_id;
  
  RETURN QUERY SELECT true, 'Listing created'::TEXT, v_new_listing_id;
END;
$function$;
