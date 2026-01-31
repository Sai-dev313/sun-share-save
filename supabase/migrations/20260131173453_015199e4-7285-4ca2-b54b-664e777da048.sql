-- Fix the security definer view warning by using security invoker instead
-- Drop the existing view
DROP VIEW IF EXISTS public.marketplace_listings_public;

-- Recreate the view with security_invoker = true (executes with the caller's permissions)
CREATE VIEW public.marketplace_listings_public
WITH (security_invoker = true, security_barrier = true)
AS SELECT 
  id,
  credits_available,
  price_per_credit,
  created_at,
  status
FROM public.marketplace_listings
WHERE status = 'active';

-- Revoke all permissions on the view from public/anon
REVOKE ALL ON public.marketplace_listings_public FROM PUBLIC;
REVOKE ALL ON public.marketplace_listings_public FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.marketplace_listings_public TO authenticated;