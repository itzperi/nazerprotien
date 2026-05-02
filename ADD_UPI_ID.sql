-- Add upi_id column to shops_logins table
ALTER TABLE public.shops_logins 
ADD COLUMN IF NOT EXISTS upi_id TEXT DEFAULT NULL;
