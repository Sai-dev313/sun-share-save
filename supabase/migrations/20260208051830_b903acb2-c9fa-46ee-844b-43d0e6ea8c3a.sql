-- Add column to track if role was explicitly selected
ALTER TABLE public.profiles 
ADD COLUMN role_selected boolean DEFAULT false;

-- Update existing users to have role_selected = true (they already made a choice)
UPDATE public.profiles SET role_selected = true WHERE role IS NOT NULL;

-- Update trigger to set role_selected based on whether role was provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, credits, cash, role, role_selected)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    0, 
    5000, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer'),
    -- role_selected is true if role was explicitly provided in metadata
    (NEW.raw_user_meta_data->>'role') IS NOT NULL
  );
  RETURN NEW;
END;
$$;