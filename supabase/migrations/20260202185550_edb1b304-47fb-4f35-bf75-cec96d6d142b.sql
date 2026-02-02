-- Add INSERT policy to prevent direct transaction insertions
-- Transactions should only be created through the purchase_listing RPC function
CREATE POLICY "Prevent direct transaction inserts"
ON public.transactions
FOR INSERT
WITH CHECK (false);