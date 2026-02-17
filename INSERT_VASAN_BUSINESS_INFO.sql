-- INSERT VASAN BUSINESS INFO INTO DATABASE
-- This script ensures Vasan's business information is properly stored

-- 1. Create business_info table if it doesn't exist
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

-- 2. Enable RLS if needed
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all on business_info" ON public.business_info;

-- 4. Create policy to allow all operations
CREATE POLICY "Allow all on business_info" ON public.business_info FOR ALL USING (true);

-- 5. Delete existing Vasan business info to avoid conflicts
DELETE FROM public.business_info 
WHERE business_id IN ('vasan', 'vasan_chicken_perambur');

-- 6. Insert Vasan's business information
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

-- 7. Grant necessary permissions
GRANT ALL ON public.business_info TO authenticated;
GRANT ALL ON public.business_info TO anon;
GRANT USAGE, SELECT ON SEQUENCE business_info_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE business_info_id_seq TO anon;

-- 8. Verify the business info was created
SELECT 
    'SUCCESS: Vasan business info created!' as status,
    business_id,
    business_name,
    shop_name,
    address,
    gst_number,
    phone,
    email
FROM public.business_info 
WHERE business_id = 'vasan_chicken_perambur';
