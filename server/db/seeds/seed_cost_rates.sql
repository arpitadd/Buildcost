-- ==============================================================================
-- Seed Script: seed_cost_rates.sql
-- Description: Populates baseline cost_rates table with sample regional rates
-- 
-- WARNING / NOTICE:
-- *** PLACEHOLDER DATA ***
-- The cost rates below are synthetic placeholder estimates provided for 
-- system testing and demonstration purposes only. They MUST BE REPLACED 
-- with verified, real sourced data (RSMeans, local contractor surveys, etc.) 
-- before being used in production.
-- ==============================================================================

INSERT INTO cost_rates (region_code, category, unit, unit_cost)
VALUES
  -- ---------------------------------------------------------------------------
  -- Region 1: US-CA-NOR (Northern California - High Cost Tier)
  -- ---------------------------------------------------------------------------
  ('US-CA-NOR', 'foundation', 'sqft', 24.50),
  ('US-CA-NOR', 'framing', 'sqft', 45.00),
  ('US-CA-NOR', 'roofing', 'sqft', 18.25),
  ('US-CA-NOR', 'electrical', 'sqft', 22.00),
  ('US-CA-NOR', 'plumbing', 'sqft', 26.50),
  ('US-CA-NOR', 'interior_finish', 'sqft', 58.00),
  ('US-CA-NOR', 'exterior_finish', 'sqft', 34.00),
  ('US-CA-NOR', 'permits', 'sqft', 12.50),
  ('US-CA-NOR', 'labor_general', 'sqft', 65.00),

  -- ---------------------------------------------------------------------------
  -- Region 2: US-TX-AUS (Central Texas - Moderate Cost Tier)
  -- ---------------------------------------------------------------------------
  ('US-TX-AUS', 'foundation', 'sqft', 16.00),
  ('US-TX-AUS', 'framing', 'sqft', 32.50),
  ('US-TX-AUS', 'roofing', 'sqft', 12.00),
  ('US-TX-AUS', 'electrical', 'sqft', 15.75),
  ('US-TX-AUS', 'plumbing', 'sqft', 18.00),
  ('US-TX-AUS', 'interior_finish', 'sqft', 40.00),
  ('US-TX-AUS', 'exterior_finish', 'sqft', 24.50),
  ('US-TX-AUS', 'permits', 'sqft', 6.00),
  ('US-TX-AUS', 'labor_general', 'sqft', 42.00),

  -- ---------------------------------------------------------------------------
  -- Region 3: US-OH-COL (Midwest Ohio - Low/Standard Cost Tier)
  -- ---------------------------------------------------------------------------
  ('US-OH-COL', 'foundation', 'sqft', 12.50),
  ('US-OH-COL', 'framing', 'sqft', 26.00),
  ('US-OH-COL', 'roofing', 'sqft', 9.50),
  ('US-OH-COL', 'electrical', 'sqft', 12.00),
  ('US-OH-COL', 'plumbing', 'sqft', 14.50),
  ('US-OH-COL', 'interior_finish', 'sqft', 32.00),
  ('US-OH-COL', 'exterior_finish', 'sqft', 19.00),
  ('US-OH-COL', 'permits', 'sqft', 4.50),
  ('US-OH-COL', 'labor_general', 'sqft', 33.00)

ON CONFLICT (region_code, category)
DO UPDATE SET
  unit = EXCLUDED.unit,
  unit_cost = EXCLUDED.unit_cost,
  updated_at = CURRENT_TIMESTAMP;
