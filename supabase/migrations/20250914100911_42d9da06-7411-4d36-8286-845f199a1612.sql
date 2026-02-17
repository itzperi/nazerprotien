-- Create products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bills table
CREATE TABLE public.bills (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  bill_no TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create load_entries table
CREATE TABLE public.load_entries (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  entry_date DATE NOT NULL,
  no_of_boxes INTEGER NOT NULL DEFAULT 0,
  quantity_with_box DECIMAL(10,2) NOT NULL DEFAULT 0,
  no_of_boxes_after INTEGER NOT NULL DEFAULT 0,
  quantity_after_box DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory table
CREATE TABLE public.inventory (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  remaining_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchases table (if needed)
CREATE TABLE public.purchases (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Users can access products for their business" 
ON public.products 
FOR ALL 
USING (true);

-- Create policies for customers table
CREATE POLICY "Users can access customers for their business" 
ON public.customers 
FOR ALL 
USING (true);

-- Create policies for bills table
CREATE POLICY "Users can access bills for their business" 
ON public.bills 
FOR ALL 
USING (true);

-- Create policies for load_entries table
CREATE POLICY "Users can access load entries for their business" 
ON public.load_entries 
FOR ALL 
USING (true);

-- Create policies for inventory table
CREATE POLICY "Users can access inventory for their business" 
ON public.inventory 
FOR ALL 
USING (true);

-- Create policies for purchases table
CREATE POLICY "Users can access purchases for their business" 
ON public.purchases 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_customers_business_id ON public.customers(business_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_bills_business_id ON public.bills(business_id);
CREATE INDEX idx_bills_timestamp ON public.bills(timestamp);
CREATE INDEX idx_load_entries_business_id ON public.load_entries(business_id);
CREATE INDEX idx_load_entries_date ON public.load_entries(entry_date);
CREATE INDEX idx_inventory_business_id ON public.inventory(business_id);
CREATE INDEX idx_purchases_business_id ON public.purchases(business_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();