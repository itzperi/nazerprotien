-- Create products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table  
CREATE TABLE public.customers (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE public.bills (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create load_entries table
CREATE TABLE public.load_entries (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  no_of_boxes INTEGER NOT NULL,
  quantity_with_box INTEGER NOT NULL,
  no_of_boxes_after INTEGER NOT NULL,
  quantity_after_box INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE public.inventory (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now since no auth is implemented)
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on bills" ON public.bills FOR ALL USING (true);
CREATE POLICY "Allow all operations on load_entries" ON public.load_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations on inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchases" ON public.purchases FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_customers_business_id ON public.customers(business_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_bills_business_id ON public.bills(business_id);
CREATE INDEX idx_bills_timestamp ON public.bills(timestamp);
CREATE INDEX idx_load_entries_business_id ON public.load_entries(business_id);
CREATE INDEX idx_inventory_business_id ON public.inventory(business_id);
CREATE INDEX idx_purchases_business_id ON public.purchases(business_id);