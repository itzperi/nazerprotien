-- Add cleaning, delivery charges and advance amount to bills
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS cleaning_charge numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_charge numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_amount numeric DEFAULT 0;

-- Backfill NULLs to 0 to avoid calculation issues
UPDATE public.bills
SET cleaning_charge = COALESCE(cleaning_charge, 0),
    delivery_charge = COALESCE(delivery_charge, 0),
    advance_amount = COALESCE(advance_amount, 0);


