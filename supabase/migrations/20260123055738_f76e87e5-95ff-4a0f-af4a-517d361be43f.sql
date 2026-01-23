-- First, fix any invalid data before adding constraints

-- Fix negative values in energy_logs
UPDATE public.energy_logs SET generated = 0 WHERE generated < 0 OR generated IS NULL;
UPDATE public.energy_logs SET used = 0 WHERE used < 0 OR used IS NULL;
UPDATE public.energy_logs SET sent_to_grid = 0 WHERE sent_to_grid < 0 OR sent_to_grid IS NULL;

-- Fix any NULL values in profiles
UPDATE public.profiles SET credits = 0 WHERE credits IS NULL OR credits < 0;
UPDATE public.profiles SET cash = 0 WHERE cash IS NULL OR cash < 0;

-- Now add CHECK constraints

-- Profiles table constraints
ALTER TABLE public.profiles 
  ADD CONSTRAINT credits_non_negative CHECK (credits >= 0),
  ADD CONSTRAINT cash_non_negative CHECK (cash >= 0),
  ADD CONSTRAINT credits_reasonable CHECK (credits <= 10000000),
  ADD CONSTRAINT cash_reasonable CHECK (cash <= 100000000);

-- Energy logs table constraints  
ALTER TABLE public.energy_logs
  ADD CONSTRAINT generated_non_negative CHECK (generated >= 0),
  ADD CONSTRAINT used_non_negative CHECK (used >= 0),
  ADD CONSTRAINT sent_to_grid_non_negative CHECK (sent_to_grid >= 0);

-- Marketplace listings constraints
ALTER TABLE public.marketplace_listings
  ADD CONSTRAINT credits_available_positive CHECK (credits_available > 0),
  ADD CONSTRAINT price_reasonable CHECK (price_per_credit > 0 AND price_per_credit <= 1000);

-- Transactions table constraints
ALTER TABLE public.transactions
  ADD CONSTRAINT transaction_credits_positive CHECK (credits_amount > 0),
  ADD CONSTRAINT transaction_price_non_negative CHECK (total_price >= 0);

-- Remove direct INSERT policy on transactions table
-- Transactions should ONLY be created through the atomic purchase_listing RPC function
DROP POLICY IF EXISTS "Users can insert transactions" ON public.transactions;