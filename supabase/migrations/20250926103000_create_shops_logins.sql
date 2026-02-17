-- Create shops_logins table for admin-managed shop accounts
CREATE TABLE IF NOT EXISTS public.shops_logins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  business_id TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.shops_logins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on shops_logins" ON public.shops_logins;
CREATE POLICY "Allow all on shops_logins" ON public.shops_logins FOR ALL USING (true);


