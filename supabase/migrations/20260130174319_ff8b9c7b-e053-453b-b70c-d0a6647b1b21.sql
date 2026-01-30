-- Create server-side RPC function for logging energy with validation
CREATE OR REPLACE FUNCTION public.log_energy(p_generated numeric, p_used numeric)
RETURNS TABLE(success boolean, message text, sent_to_grid numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_sent_to_grid NUMERIC;
  v_today DATE := CURRENT_DATE;
  v_existing_id UUID;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Validate inputs: must be non-negative
  IF p_generated < 0 THEN
    RETURN QUERY SELECT false, 'Generated energy cannot be negative'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF p_used < 0 THEN
    RETURN QUERY SELECT false, 'Used energy cannot be negative'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Validate realistic ranges (max 10,000 kWh per day for residential solar)
  IF p_generated > 10000 THEN
    RETURN QUERY SELECT false, 'Generated energy exceeds maximum allowed (10000 kWh)'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF p_used > 10000 THEN
    RETURN QUERY SELECT false, 'Used energy exceeds maximum allowed (10000 kWh)'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calculate sent to grid
  v_sent_to_grid := GREATEST(0, p_generated - p_used);
  
  -- Check if log exists for today
  SELECT id INTO v_existing_id 
  FROM energy_logs 
  WHERE user_id = v_user_id AND log_date = v_today;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing log
    UPDATE energy_logs 
    SET generated = p_generated, used = p_used, sent_to_grid = v_sent_to_grid
    WHERE id = v_existing_id;
  ELSE
    -- Insert new log
    INSERT INTO energy_logs (user_id, generated, used, sent_to_grid, log_date)
    VALUES (v_user_id, p_generated, p_used, v_sent_to_grid, v_today);
  END IF;
  
  RETURN QUERY SELECT true, 'Energy logged successfully'::TEXT, v_sent_to_grid;
END;
$$;