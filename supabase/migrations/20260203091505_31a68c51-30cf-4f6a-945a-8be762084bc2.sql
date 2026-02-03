-- Create bill_payments table to track bill payment history
CREATE TABLE public.bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bill_amount NUMERIC NOT NULL CHECK (bill_amount >= 0),
  credits_used NUMERIC NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  credit_savings NUMERIC NOT NULL DEFAULT 0 CHECK (credit_savings >= 0),
  cash_paid NUMERIC NOT NULL DEFAULT 0 CHECK (cash_paid >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own bill payments
CREATE POLICY "Users can view own bill payments"
ON public.bill_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Prevent direct inserts (will be done via RPC)
CREATE POLICY "Prevent direct bill payment inserts"
ON public.bill_payments
FOR INSERT
WITH CHECK (false);

-- No updates or deletes allowed
CREATE POLICY "No bill payment updates"
ON public.bill_payments
FOR UPDATE
USING (false);

CREATE POLICY "No bill payment deletes"
ON public.bill_payments
FOR DELETE
USING (false);

-- Update redeem_credits function to log bill payments
CREATE OR REPLACE FUNCTION public.pay_bill(p_bill_amount NUMERIC, p_credits_to_use NUMERIC)
RETURNS TABLE(success boolean, message text, credits_remaining numeric, cash_remaining numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user profiles%ROWTYPE;
  v_credit_savings NUMERIC;
  v_cash_to_pay NUMERIC;
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  -- Validate inputs
  IF p_bill_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Bill amount must be positive'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF p_credits_to_use < 0 THEN
    RETURN QUERY SELECT false, 'Credits cannot be negative'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Lock and validate user
  SELECT * INTO v_user FROM profiles WHERE id = v_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profile not found'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF v_user.credits < p_credits_to_use THEN
    RETURN QUERY SELECT false, 'Insufficient credits'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calculate savings (₹2 per credit)
  v_credit_savings := p_credits_to_use * 2;
  v_cash_to_pay := GREATEST(0, p_bill_amount - v_credit_savings);
  
  IF v_user.cash < v_cash_to_pay THEN
    RETURN QUERY SELECT false, 'Insufficient cash balance'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Update profile atomically
  UPDATE profiles SET 
    credits = credits - p_credits_to_use,
    cash = cash - v_cash_to_pay
  WHERE id = v_user_id;
  
  -- Log the bill payment
  INSERT INTO bill_payments (user_id, bill_amount, credits_used, credit_savings, cash_paid)
  VALUES (v_user_id, p_bill_amount, p_credits_to_use, v_credit_savings, v_cash_to_pay);
  
  RETURN QUERY SELECT 
    true, 
    'Bill paid successfully'::TEXT, 
    (v_user.credits - p_credits_to_use)::NUMERIC,
    (v_user.cash - v_cash_to_pay)::NUMERIC;
END;
$$;