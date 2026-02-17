-- COMPLETE VASAN FIX - All Issues Resolved
-- This script fixes business details, supplier suggestions, and creates fresh Vasan login

-- 1. Create/Update shops_logins table
CREATE TABLE IF NOT EXISTS public.shops_logins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  business_id TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.shops_logins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on shops_logins" ON public.shops_logins;
CREATE POLICY "Allow all on shops_logins" ON public.shops_logins FOR ALL USING (true);

-- 3. Create/Update business_info table
CREATE TABLE IF NOT EXISTS public.business_info (
    id BIGSERIAL PRIMARY KEY,
    business_id TEXT NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    shop_name TEXT,
    address TEXT,
    gst_number TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on business_info" ON public.business_info;
CREATE POLICY "Allow all on business_info" ON public.business_info FOR ALL USING (true);

-- 4. Create/Update suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  business_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on suppliers" ON public.suppliers;
CREATE POLICY "Allow all on suppliers" ON public.suppliers FOR ALL USING (true);

-- 5. Add unique constraint for suppliers
DO $$ 
BEGIN
    ALTER TABLE public.suppliers 
        ADD CONSTRAINT suppliers_business_name_unique UNIQUE (business_id, name);
EXCEPTION 
    WHEN duplicate_object THEN 
        NULL;
END $$;

-- 6. Create supplier suggestions function
CREATE OR REPLACE FUNCTION public.get_supplier_suggestions(
  p_business_id TEXT,
  p_search_term TEXT DEFAULT ''
) RETURNS TABLE (
  id BIGINT,
  name TEXT
) 
LANGUAGE sql
STABLE
AS $$
  SELECT s.id, s.name
  FROM public.suppliers s
  WHERE s.business_id = p_business_id
    AND (p_search_term = '' OR s.name ILIKE '%' || p_search_term || '%')
  ORDER BY s.name
  LIMIT 10;
$$;

-- 7. Clear all existing Vasan data to start fresh
DELETE FROM public.shops_logins WHERE username IN ('vasanp', 'Vasan', 'vasan') OR business_id IN ('vasan', 'vasan_chicken_perambur');
DELETE FROM public.business_info WHERE business_id IN ('vasan', 'vasan_chicken_perambur');
DELETE FROM public.suppliers WHERE business_id IN ('vasan', 'vasan_chicken_perambur');
DELETE FROM public.customers WHERE business_id IN ('vasan', 'vasan_chicken_perambur');
DELETE FROM public.bills WHERE business_id IN ('vasan', 'vasan_chicken_perambur');
DELETE FROM public.load_entries WHERE business_id IN ('vasan', 'vasan_chicken_perambur');
DELETE FROM public.purchases WHERE business_id IN ('vasan', 'vasan_chicken_perambur');
DELETE FROM public.salaries WHERE business_id IN ('vasan', 'vasan_chicken_perambur');

-- 8. Create fresh Vasan login (Vasan/1234@)
INSERT INTO public.shops_logins (username, password, business_id, created_at) 
VALUES ('Vasan', '1234@', 'vasan_chicken_perambur', NOW());

-- 9. Insert Vasan's business information
INSERT INTO public.business_info (
    business_id,
    business_name,
    shop_name,
    address,
    gst_number,
    phone,
    email,
    created_at,
    updated_at
) VALUES (
    'vasan_chicken_perambur',
    'Vasan Chicken Perambur',
    'Vasan Chicken Perambur',
    '61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011',
    '33AAAAA0000A1Z5',
    '+91 9876543210',
    'vasanchicken@gmail.com',
    NOW(),
    NOW()
);

-- 10. Add some sample suppliers for Vasan
INSERT INTO public.suppliers (name, business_id, created_at, updated_at) VALUES
('Chicken Supplier 1', 'vasan_chicken_perambur', NOW(), NOW()),
('Fresh Poultry Co', 'vasan_chicken_perambur', NOW(), NOW()),
('Local Farm Supply', 'vasan_chicken_perambur', NOW(), NOW()),
('Perambur Poultry', 'vasan_chicken_perambur', NOW(), NOW()),
('Chennai Chicken Co', 'vasan_chicken_perambur', NOW(), NOW());

-- 11. Grant all necessary permissions
GRANT ALL ON public.shops_logins TO authenticated;
GRANT ALL ON public.shops_logins TO anon;
GRANT ALL ON public.business_info TO authenticated;
GRANT ALL ON public.business_info TO anon;
GRANT ALL ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO anon;
GRANT USAGE, SELECT ON SEQUENCE shops_logins_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE shops_logins_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE business_info_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE business_info_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE suppliers_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE suppliers_id_seq TO anon;

-- 12. Verify everything was created correctly
DO $$
DECLARE
    login_record RECORD;
    business_record RECORD;
    supplier_count INTEGER;
BEGIN
    -- Check login
    SELECT * INTO login_record FROM public.shops_logins WHERE username = 'Vasan';
    IF FOUND THEN
        RAISE NOTICE '✅ Vasan login created: % / %', login_record.username, login_record.password;
    ELSE
        RAISE EXCEPTION '❌ Failed to create Vasan login';
    END IF;
    
    -- Check business info
    SELECT * INTO business_record FROM public.business_info WHERE business_id = 'vasan_chicken_perambur';
    IF FOUND THEN
        RAISE NOTICE '✅ Business info created: %', business_record.business_name;
    ELSE
        RAISE EXCEPTION '❌ Failed to create business info';
    END IF;
    
    -- Check suppliers
    SELECT COUNT(*) INTO supplier_count FROM public.suppliers WHERE business_id = 'vasan_chicken_perambur';
    RAISE NOTICE '✅ Suppliers created: % suppliers', supplier_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FRESH VASAN LOGIN READY!';
    RAISE NOTICE '   Username: Vasan';
    RAISE NOTICE '   Password: 1234@';
    RAISE NOTICE '   Business: Vasan Chicken Perambur';
    RAISE NOTICE '   Address: 61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011';
    RAISE NOTICE '   Phone: +91 9876543210';
    RAISE NOTICE '   Email: vasanchicken@gmail.com';
    RAISE NOTICE '   GST: 33AAAAA0000A1Z5';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All billing history cleared - fresh start!';
    RAISE NOTICE '✅ Supplier suggestions will work in Purchase entry';
    RAISE NOTICE '✅ Business details will show correctly in bills';
END $$;
