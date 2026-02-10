
-- Create platform_impact_snapshot table
CREATE TABLE public.platform_impact_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_units_sent_to_grid numeric NOT NULL DEFAULT 0,
  total_co2_avoided_kg numeric NOT NULL DEFAULT 0,
  equivalent_trees integer NOT NULL DEFAULT 0,
  last_updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_impact_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read impact snapshot"
  ON public.platform_impact_snapshot FOR SELECT
  USING (true);

-- Seed with initial data
INSERT INTO public.platform_impact_snapshot
  (total_units_sent_to_grid, total_co2_avoided_kg, equivalent_trees, last_updated_at)
VALUES (0, 0, 0, now());

-- Function to refresh the snapshot deterministically
CREATE OR REPLACE FUNCTION public.refresh_impact_snapshot()
RETURNS void AS $$
DECLARE
  total_units numeric;
  co2_kg numeric;
  trees int;
BEGIN
  SELECT COALESCE(SUM(sent_to_grid), 0) INTO total_units FROM public.energy_logs;
  co2_kg := total_units * 0.82;
  trees := FLOOR(co2_kg / 22);

  UPDATE public.platform_impact_snapshot
  SET total_units_sent_to_grid = total_units,
      total_co2_avoided_kg = co2_kg,
      equivalent_trees = trees,
      last_updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function to auto-refresh on energy_logs changes
CREATE OR REPLACE FUNCTION public.trigger_refresh_impact()
RETURNS trigger AS $$
BEGIN
  PERFORM public.refresh_impact_snapshot();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on energy_logs INSERT/UPDATE
CREATE TRIGGER refresh_impact_on_energy_log
AFTER INSERT OR UPDATE ON public.energy_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_impact();
