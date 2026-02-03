-- Update bill_payments table to include provider and consumer info
ALTER TABLE public.bill_payments 
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'MSEDCL',
ADD COLUMN IF NOT EXISTS consumer_number TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS consumer_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS billing_month TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS meter_number TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS units_consumed NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rate_per_unit NUMERIC NOT NULL DEFAULT 6;

-- Update the INSERT policy to allow RPC-based inserts
DROP POLICY IF EXISTS "Prevent direct bill payment inserts" ON public.bill_payments;

-- Create a new policy that allows system inserts (via RPC)
CREATE POLICY "Allow RPC bill payment inserts"
ON public.bill_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update pay_bill function to include provider and consumer details
CREATE OR REPLACE FUNCTION public.pay_bill(
  p_bill_amount NUMERIC, 
  p_credits_to_use NUMERIC,
  p_provider TEXT DEFAULT 'MSEDCL',
  p_consumer_number TEXT DEFAULT '',
  p_consumer_name TEXT DEFAULT '',
  p_billing_month TEXT DEFAULT '',
  p_meter_number TEXT DEFAULT '',
  p_units_consumed NUMERIC DEFAULT 0
)
RETURNS TABLE(success boolean, message text, credits_remaining numeric, cash_remaining numeric, receipt_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user profiles%ROWTYPE;
  v_credit_savings NUMERIC;
  v_cash_to_pay NUMERIC;
  v_user_id UUID;
  v_receipt_id UUID;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;

  -- Validate inputs
  IF p_bill_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Bill amount must be positive'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_credits_to_use < 0 THEN
    RETURN QUERY SELECT false, 'Credits cannot be negative'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;
  
  -- Lock and validate user
  SELECT * INTO v_user FROM profiles WHERE id = v_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_user.credits < p_credits_to_use THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, 0::NUMERIC, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;
  
  -- Calculate savings (₹2 per credit)
  v_credit_savings := p_credits_to_use * 2;
  v_cash_to_pay := GREATEST(0, p_bill_amount - v_credit_savings);
  
  -- Note: We don't check cash balance anymore since remaining is paid via UPI (simulated)
  
  -- Update profile credits only (cash not deducted as it's paid via UPI)
  UPDATE profiles SET 
    credits = credits - p_credits_to_use
  WHERE id = v_user_id;
  
  -- Log the bill payment with all details
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
$$;