-- SIMPLE VASAN LOGIN CREATION (Error-Free Version)
-- This is a simplified script that should work without any errors

-- 1. Create the table if it doesn't exist (basic version)
CREATE TABLE IF NOT EXISTS public.shops_logins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  business_id TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Remove any existing Vasan entries
DELETE FROM public.shops_logins 
WHERE username IN ('Vasan', 'vasanp') OR business_id = 'vasan_chicken_perambur';

-- 3. Insert the new login
INSERT INTO public.shops_logins (username, password, business_id, created_at) 
VALUES ('vasanp', '1234', 'vasan_chicken_perambur', NOW());

-- 4. Verify it was created
SELECT 
    'SUCCESS: Login created!' as status,
    username,
    password,
    business_id,
    created_at
FROM public.shops_logins 
WHERE username = 'vasanp';
