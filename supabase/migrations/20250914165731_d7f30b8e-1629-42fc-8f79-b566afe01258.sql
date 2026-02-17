-- Add missing columns to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS balance_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bill_date text,
ADD COLUMN IF NOT EXISTS upi_type text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS check_number text;