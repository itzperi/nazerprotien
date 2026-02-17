
-- Add cash_amount and gpay_amount columns to bills table for Cash + GPay payment method
ALTER TABLE public.bills 
ADD COLUMN cash_amount numeric,
ADD COLUMN gpay_amount numeric;
