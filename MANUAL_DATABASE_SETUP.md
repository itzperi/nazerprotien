# Manual Database Setup Instructions

Since the Supabase CLI is not available, please follow these steps to set up the database manually:

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `csatoabqaxaszgfhrjjj`

## Step 2: Create Business Info Table

1. Go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Create business_info table
CREATE TABLE IF NOT EXISTS public.business_info (
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

-- Enable RLS
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on business_info" ON public.business_info FOR ALL USING (true);
```

4. Click **Run** to execute the query

## Step 3: Fix RLS Policies for Existing Tables

1. In the SQL Editor, run this query to fix RLS policies:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on bills" ON public.bills;

-- Create new policies that allow all operations
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on bills" ON public.bills FOR ALL USING (true);
```

## Step 4: Insert Sample Data

1. Run this query to insert business information:

```sql
-- Insert business information
INSERT INTO public.business_info (business_id, business_name, address, gst_number, phone, email) 
VALUES 
  (
    'santhosh1', 
    'Santhosh Chicken 1', 
    'Your Business Address',
    '22AAAAA0000A1Z5',
    '+91-9876543211',
    'santhosh1@chickencenter.com'
  ),
  (
    'vasan', 
    'Vasan Chicken Center', 
    '61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011',
    '33AAAAA0000A1Z5',
    '+91-9876543210',
    'vasan@chickencenter.com'
  )
ON CONFLICT (business_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  address = EXCLUDED.address,
  gst_number = EXCLUDED.gst_number,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  updated_at = NOW();
```

2. Run this query to insert sample products:

```sql
-- Insert sample products
INSERT INTO public.products (name, business_id) 
VALUES 
  ('Chicken Live', 'santhosh1'),
  ('Chicken Cut', 'santhosh1'),
  ('Chicken Leg', 'santhosh1'),
  ('Chicken Breast', 'santhosh1'),
  ('Chicken Wings', 'santhosh1'),
  ('Chicken Live', 'vasan'),
  ('Chicken Cut', 'vasan'),
  ('Chicken Leg', 'vasan'),
  ('Chicken Breast', 'vasan'),
  ('Chicken Wings', 'vasan')
ON CONFLICT DO NOTHING;
```

3. Run this query to insert sample customers:

```sql
-- Insert sample customers
INSERT INTO public.customers (name, phone, balance, business_id) 
VALUES 
  ('John Doe', '9876543210', 0, 'santhosh1'),
  ('Jane Smith', '9876543211', 0, 'santhosh1'),
  ('Mike Johnson', '9876543212', 0, 'santhosh1'),
  ('Sarah Wilson', '9876543213', 0, 'santhosh1'),
  ('Raj Kumar', '9876543214', 0, 'vasan'),
  ('Priya Sharma', '9876543215', 0, 'vasan'),
  ('Amit Patel', '9876543216', 0, 'vasan'),
  ('Sneha Singh', '9876543217', 0, 'vasan')
ON CONFLICT DO NOTHING;
```

4. Run this query to insert sample bills:

```sql
-- Insert sample bills
INSERT INTO public.bills (customer_name, customer_phone, bill_date, items, total_amount, paid_amount, balance_amount, payment_method, business_id, timestamp) 
VALUES 
  (
    'John Doe', 
    '9876543210', 
    '2024-01-15', 
    '[{"no": 1, "item": "Chicken Live", "weight": "2.5", "rate": "180", "amount": 450}]'::jsonb,
    450.00,
    400.00,
    50.00,
    'cash',
    'santhosh1',
    NOW()
  ),
  (
    'Jane Smith', 
    '9876543211', 
    '2024-01-15', 
    '[{"no": 1, "item": "Chicken Cut", "weight": "1.5", "rate": "200", "amount": 300}]'::jsonb,
    300.00,
    300.00,
    0.00,
    'upi',
    'santhosh1',
    NOW()
  ),
  (
    'Raj Kumar', 
    '9876543214', 
    '2024-01-15', 
    '[{"no": 1, "item": "Chicken Live", "weight": "3.0", "rate": "175", "amount": 525}]'::jsonb,
    525.00,
    500.00,
    25.00,
    'cash',
    'vasan',
    NOW()
  ),
  (
    'Priya Sharma', 
    '9876543215', 
    '2024-01-15', 
    '[{"no": 1, "item": "Chicken Leg", "weight": "2.0", "rate": "220", "amount": 440}]'::jsonb,
    440.00,
    440.00,
    0.00,
    'upi',
    'vasan',
    NOW()
  )
ON CONFLICT DO NOTHING;
```

## Step 5: Update Customer Balances

```sql
-- Update customer balances based on bills
UPDATE public.customers 
SET balance = (
  SELECT COALESCE(SUM(balance_amount), 0)
  FROM public.bills 
  WHERE bills.customer_name = customers.name 
  AND bills.business_id = customers.business_id
);
```

## Step 6: Verify Data

```sql
-- Verify all data was inserted correctly
SELECT 'Products for santhosh1:' as info, COUNT(*) as count FROM public.products WHERE business_id = 'santhosh1'
UNION ALL
SELECT 'Products for vasan:', COUNT(*) FROM public.products WHERE business_id = 'vasan'
UNION ALL
SELECT 'Customers for santhosh1:', COUNT(*) FROM public.customers WHERE business_id = 'santhosh1'
UNION ALL
SELECT 'Customers for vasan:', COUNT(*) FROM public.customers WHERE business_id = 'vasan'
UNION ALL
SELECT 'Bills for santhosh1:', COUNT(*) FROM public.bills WHERE business_id = 'santhosh1'
UNION ALL
SELECT 'Bills for vasan:', COUNT(*) FROM public.bills WHERE business_id = 'vasan'
UNION ALL
SELECT 'Business info records:', COUNT(*) FROM public.business_info;
```

## Step 7: Test the Application

1. Start the development server: `npm run dev`
2. Test login with:
   - **Mathan**: username `mathan`, password `050467`
   - **Vasan**: username `Vasan`, password `1234@`
3. Verify that data loads correctly on all pages

## Troubleshooting

If you still have issues:

1. Check the **Table Editor** in Supabase to see if data was inserted
2. Check the **Authentication** section to ensure RLS policies are correct
3. Check browser console for any JavaScript errors
4. Verify the Supabase URL and API key are correct in `client.ts`

## Expected Results

After setup, you should see:
- 5 products for each business (santhosh1 and vasan)
- 4 customers for each business
- 2 sample bills for each business
- 2 business info records
- All pages should load data correctly
- Login should work for both users
