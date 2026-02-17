
-- Fix the unique constraint issue for inventory table
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_business_id_unique;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_business_id_unique UNIQUE (business_id);

-- Recreate the trigger function to handle the conflict properly
CREATE OR REPLACE FUNCTION update_inventory_from_load()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update inventory record
  INSERT INTO public.inventory (business_id, chicken_stock_kg, last_updated)
  VALUES (NEW.business_id, NEW.quantity_after_box, NOW())
  ON CONFLICT (business_id) 
  DO UPDATE SET 
    chicken_stock_kg = EXCLUDED.chicken_stock_kg,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
