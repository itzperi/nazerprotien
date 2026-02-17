
-- Create products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  business_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table  
CREATE TABLE public.customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  business_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table for history
CREATE TABLE public.bills (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  bill_date DATE NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL,
  balance_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  upi_type TEXT,
  bank_name TEXT,
  check_number TEXT,
  business_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - though we'll keep it simple for now
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (since we're not using auth.users)
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on bills" ON public.bills FOR ALL USING (true);
