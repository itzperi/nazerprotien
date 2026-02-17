-- UPDATE VASAN LOGIN CREDENTIALS
-- This script updates the existing Vasan login to use username: vasanp and password: 1234

-- 1. Update existing Vasan login credentials
UPDATE public.shops_logins 
SET 
    username = 'vasanp',
    password = '1234',
    updated_at = NOW()
WHERE business_id = 'vasan_chicken_perambur' OR username IN ('Vasan', 'vasanp');

-- 2. If no existing record was updated, insert a new one
INSERT INTO public.shops_logins (
    username,
    password,
    business_id,
    logo_url,
    created_at
)
SELECT 
    'vasanp',
    '1234',
    'vasan_chicken_perambur',
    NULL,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.shops_logins 
    WHERE business_id = 'vasan_chicken_perambur'
);

-- 3. Verify the credentials are correct
DO $$
DECLARE
    login_record RECORD;
BEGIN
    SELECT * INTO login_record 
    FROM public.shops_logins 
    WHERE username = 'vasanp' AND password = '1234';
    
    IF FOUND THEN
        RAISE NOTICE '✅ SUCCESS: Vasan login credentials updated successfully!';
        RAISE NOTICE '🔑 New Login Credentials:';
        RAISE NOTICE '   - Username: %', login_record.username;
        RAISE NOTICE '   - Password: %', login_record.password;
        RAISE NOTICE '   - Business ID: %', login_record.business_id;
        RAISE NOTICE '';
        RAISE NOTICE '🎯 You can now login with: vasanp / 1234';
    ELSE
        RAISE EXCEPTION '❌ FAILED: Could not update Vasan login credentials';
    END IF;
END $$;
