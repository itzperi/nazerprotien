# 🚨 URGENT: Database Setup Required

## Current Status
❌ **No data in database** - All tables are empty  
❌ **Business info table missing** - Needs to be created  
❌ **RLS policies blocking data** - Need to be fixed  

## Quick Fix (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in and select your project
3. Go to **SQL Editor** (left sidebar)

### Step 2: Run This Complete Setup Script
Copy and paste this ENTIRE script into the SQL Editor and click **Run**:

```sql
-- COMPLETE DATABASE SETUP SCRIPT
-- This will fix all issues and add sample data

-- 1. Create business_info table
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

-- 2. Fix RLS policies for all tables
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on bills" ON public.bills;
DROP POLICY IF EXISTS "Allow all operations on business_info" ON public.business_info;

-- Disable RLS temporarily
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_info DISABLE ROW LEVEL SECURITY;

-- 3. Insert business information
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
  );

-- 4. Insert sample products
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
  ('Chicken Wings', 'vasan');

-- 5. Insert sample customers
INSERT INTO public.customers (name, phone, balance, business_id) 
VALUES 
  ('John Doe', '9876543210', 0, 'santhosh1'),
  ('Jane Smith', '9876543211', 0, 'santhosh1'),
  ('Mike Johnson', '9876543212', 0, 'santhosh1'),
  ('Sarah Wilson', '9876543213', 0, 'santhosh1'),
  ('Raj Kumar', '9876543214', 0, 'vasan'),
  ('Priya Sharma', '9876543215', 0, 'vasan'),
  ('Amit Patel', '9876543216', 0, 'vasan'),
  ('Sneha Singh', '9876543217', 0, 'vasan');

-- 6. Insert sample bills
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
  );

-- 7. Update customer balances
UPDATE public.customers 
SET balance = (
  SELECT COALESCE(SUM(balance_amount), 0)
  FROM public.bills 
  WHERE bills.customer_name = customers.name 
  AND bills.business_id = customers.business_id
);

-- 8. Re-enable RLS with proper policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- 9. Create new policies
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on bills" ON public.bills FOR ALL USING (true);
CREATE POLICY "Allow all operations on business_info" ON public.business_info FOR ALL USING (true);

-- 10. Verify data
SELECT 'SUCCESS: Database setup completed!' as status;
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

### Step 3: Test the Application
1. Open your browser to `http://localhost:5173` (or whatever port the dev server shows)
2. Test login with:
   - **Mathan**: username `mathan`, password `050467`
   - **Vasan**: username `Vasan`, password `1234@`
3. Verify data loads on all pages

## Expected Results After Setup
✅ **5 products** for each business (santhosh1 and vasan)  
✅ **4 customers** for each business  
✅ **2 sample bills** for each business  
✅ **2 business info records**  
✅ **All pages load data correctly**  
✅ **Login works for both users**  

## If You Still Have Issues
1. Check browser console for errors
2. Verify Supabase URL and API key are correct
3. Make sure you ran the ENTIRE SQL script above
4. Check that the dev server is running: `npm run dev`

## Quick Verification
Run this in your terminal to check if data was inserted:
```bash
node quick-test.js
```

You should see:
- Products: 10 (5 for each business)
- Customers: 8 (4 for each business)  
- Bills: 4 (2 for each business)
- Business Info: 2
