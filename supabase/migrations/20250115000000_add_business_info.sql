-- Create business information table
CREATE TABLE public.business_info (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  address TEXT NOT NULL,
  gst_number TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (since we're not using auth.users)
CREATE POLICY "Allow all operations on business_info" ON public.business_info FOR ALL USING (true);

-- Insert default business information for Vasan
INSERT INTO public.business_info (business_id, business_name, address, gst_number, phone, email) 
VALUES (
  'vasan', 
  'Vasan Chicken Center', 
  '61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011',
  '33AAAAA0000A1Z5',
  '+91-9876543210',
  'vasan@chickencenter.com'
);

-- Insert default business information for Mathan (Santhosh Chicken 1)
INSERT INTO public.business_info (business_id, business_name, address, gst_number, phone, email) 
VALUES (
  'santhosh1', 
  'Santhosh Chicken 1', 
  'Your Business Address',
  '22AAAAA0000A1Z5',
  '+91-9876543211',
  'santhosh1@chickencenter.com'
);
