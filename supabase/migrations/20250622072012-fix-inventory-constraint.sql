
-- Add unique constraint to inventory table for business_id
ALTER TABLE public.inventory ADD CONSTRAINT inventory_business_id_unique UNIQUE (business_id);

-- Update the trigger function to handle the conflict properly
CREATE OR REPLACE FUNCTION update_inventory_from_load()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update inventory record
  INSERT INTO public.inventory (business_id, chicken_stock_kg, last_updated)
  VALUES (NEW.business_id, NEW.quantity_after_box, NOW())
  ON CONFLICT (business_id) 
  DO UPDATE SET 
    chicken_stock_kg = inventory.chicken_stock_kg + NEW.quantity_after_box,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
