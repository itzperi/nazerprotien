
-- Create load_entries table for tracking chicken purchases
CREATE TABLE public.load_entries (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  no_of_boxes INTEGER NOT NULL,
  quantity_with_box DECIMAL(10,2) NOT NULL,
  no_of_boxes_after INTEGER NOT NULL,
  quantity_after_box DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_load_entries_business_date ON public.load_entries(business_id, entry_date);

-- Add trigger to update inventory when load entries are added
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

-- Create trigger
CREATE TRIGGER trigger_update_inventory_from_load
  AFTER INSERT ON public.load_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_from_load();
