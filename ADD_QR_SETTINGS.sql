-- Add qr_image_path and qr_enabled columns to shops_logins table
ALTER TABLE public.shops_logins 
ADD COLUMN IF NOT EXISTS qr_image_path TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS qr_enabled BOOLEAN DEFAULT FALSE;

-- Create policy or ensure update works (assuming RLS is handled or permissive for now)
-- Assuming authenticated users can update their own row based on business_id or id
