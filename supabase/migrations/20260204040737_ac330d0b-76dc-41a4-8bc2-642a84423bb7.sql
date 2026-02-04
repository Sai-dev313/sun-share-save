-- Fix: Add DELETE policy to marketplace_listings to prevent unauthorized deletions
-- This prevents any user from deleting listings (deletions should only happen via RPC if needed)
CREATE POLICY "No direct listing deletions" 
ON public.marketplace_listings 
FOR DELETE 
USING (false);