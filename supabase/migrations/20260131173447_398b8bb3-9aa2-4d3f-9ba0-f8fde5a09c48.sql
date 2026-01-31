-- Fix 1: Enable RLS on the marketplace_listings_public view
-- Views don't support RLS directly, but we can secure them by making sure
-- only authenticated users can access the view through a security definer function

-- Drop the existing view
DROP VIEW IF EXISTS public.marketplace_listings_public;

-- Recreate the view with security barrier to prevent leaking data through filters
CREATE VIEW public.marketplace_listings_public
WITH (security_barrier = true)
AS SELECT 
  id,
  credits_available,
  price_per_credit,
  created_at,
  status
FROM public.marketplace_listings
WHERE status = 'active';

-- Revoke all permissions on the view from public
REVOKE ALL ON public.marketplace_listings_public FROM PUBLIC;
REVOKE ALL ON public.marketplace_listings_public FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.marketplace_listings_public TO authenticated;