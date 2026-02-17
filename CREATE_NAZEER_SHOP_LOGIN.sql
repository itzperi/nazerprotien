-- CREATE LOGIN FOR NAZEER SHOP
-- This script creates a new shop login for Nazeer

-- 1. First, ensure the shops_logins table exists (it should, but just in case)
CREATE TABLE IF NOT EXISTS public.shops_logins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  business_id TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert the new shop login for Nazeer
-- Note: 'nazeer_business' is the ID we'll use for other tables
INSERT INTO public.shops_logins (
    username,
    password,
    business_id,
    logo_url,
    created_at
) VALUES (
    'Nazeer',
    '123456',
    'nazeer_business',
    NULL,
    NOW()
) ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    business_id = EXCLUDED.business_id;

-- 3. Create business_info entry for Nazeer
DO $$
BEGIN
    -- Check if business_info table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_info' AND table_schema = 'public') THEN
        -- Insert or Update business information
        INSERT INTO public.business_info (
            business_id,
            business_name,
            address,
            gst_number,
            phone,
            email,
            created_at,
            updated_at
        ) VALUES (
            'nazeer_business',
            'Nazeer Chicken Shop',
            'No. 12, Main Street, Market Area, Chennai',
            '33AAAAA0000A1Z5',
            '+91 9988776655',
            'nazeer@shop.com',
            NOW(),
            NOW()
        ) ON CONFLICT (business_id) DO UPDATE SET
            business_name = EXCLUDED.business_name,
            address = EXCLUDED.address,
            phone = EXCLUDED.phone,
            updated_at = NOW();
        
        RAISE NOTICE '✅ Business info created for Nazeer';
    ELSE
        RAISE NOTICE '⚠️ business_info table does not exist, skipping business info creation';
    END IF;
END $$;

-- 4. Insert some default products for the new shop
INSERT INTO public.products (name, business_id) 
VALUES 
  ('Chicken Live', 'nazeer_business'),
  ('Chicken Cut', 'nazeer_business'),
  ('Chicken Leg', 'nazeer_business'),
  ('Chicken Breast', 'nazeer_business')
ON CONFLICT DO NOTHING;

-- 5. Verification Notice
DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: Login for Nazeer created successfully!';
    RAISE NOTICE '📋 Username: Nazeer';
    RAISE NOTICE '📋 Password: 123456';
    RAISE NOTICE '📋 Business ID: nazeer_business';
END $$;
