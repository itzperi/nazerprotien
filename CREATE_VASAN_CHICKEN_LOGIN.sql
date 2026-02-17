-- CREATE LOGIN FOR VASAN CHICKEN PERAMBUR
-- This script creates a new shop login for Vasan Chicken Perambur

-- 1. First, ensure the shops_logins table exists
CREATE TABLE IF NOT EXISTS public.shops_logins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  business_id TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS and set policies if not already done
ALTER TABLE public.shops_logins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all on shops_logins" ON public.shops_logins;

-- Create policy to allow all operations (can be restricted later)
CREATE POLICY "Allow all on shops_logins" ON public.shops_logins FOR ALL USING (true);

-- 3. Check if Vasan login already exists and remove if it does (to avoid conflicts)
DELETE FROM public.shops_logins 
WHERE username IN ('Vasan', 'vasanp') OR business_id = 'vasan_chicken_perambur';

-- 4. Insert the new shop login for Vasan Chicken Perambur
INSERT INTO public.shops_logins (
    username,
    password,
    business_id,
    logo_url,
    created_at
) VALUES (
    'vasanp',
    '1234',
    'vasan_chicken_perambur',
    NULL,
    NOW()
);

-- 5. Create business_info entry for Vasan Chicken Perambur (if table exists)
DO $$
BEGIN
    -- Check if business_info table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_info' AND table_schema = 'public') THEN
        -- Delete existing entry if it exists
        DELETE FROM public.business_info WHERE business_id = 'vasan_chicken_perambur';
        
        -- Insert business information
        INSERT INTO public.business_info (
            business_id,
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
            '61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011',
            '33AAAAA0000A1Z5',
            '+91 9876543210',
            'vasanchicken@gmail.com',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Business info created for Vasan Chicken Perambur';
    ELSE
        RAISE NOTICE '⚠️ business_info table does not exist, skipping business info creation';
    END IF;
END $$;

-- 6. Grant necessary permissions
GRANT ALL ON public.shops_logins TO authenticated;
GRANT ALL ON public.shops_logins TO anon;
GRANT USAGE, SELECT ON SEQUENCE shops_logins_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE shops_logins_id_seq TO anon;

-- 7. Verify the login was created successfully
DO $$
DECLARE
    login_record RECORD;
BEGIN
    SELECT * INTO login_record 
    FROM public.shops_logins 
    WHERE username = 'vasanp';
    
    IF FOUND THEN
        RAISE NOTICE '✅ SUCCESS: Vasan Chicken Perambur login created successfully!';
        RAISE NOTICE '📋 Login Details:';
        RAISE NOTICE '   - Username: %', login_record.username;
        RAISE NOTICE '   - Password: %', login_record.password;
        RAISE NOTICE '   - Business ID: %', login_record.business_id;
        RAISE NOTICE '   - Created: %', login_record.created_at;
        RAISE NOTICE '';
        RAISE NOTICE '🏪 Shop Information:';
        RAISE NOTICE '   - Shop Name: Vasan Chicken Perambur';
        RAISE NOTICE '   - Address: 61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011';
        RAISE NOTICE '   - GST Number: 33AAAAA0000A1Z5';
        RAISE NOTICE '';
        RAISE NOTICE '🔑 Login Credentials:';
        RAISE NOTICE '   - Username: vasanp';
        RAISE NOTICE '   - Password: 1234';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 The shop can now login using these credentials!';
    ELSE
        RAISE EXCEPTION '❌ FAILED: Could not create login for Vasan Chicken Perambur';
    END IF;
END $$;

-- 8. Display current shops count
DO $$
DECLARE
    shops_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO shops_count FROM public.shops_logins;
    RAISE NOTICE '📊 Total shops in system: %', shops_count;
END $$;
