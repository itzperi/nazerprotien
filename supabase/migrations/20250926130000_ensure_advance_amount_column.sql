-- Ensure advance_amount exists for backward compatibility across environments

ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS advance_amount numeric DEFAULT 0;

-- Normalize NULLs to 0 for safe arithmetic
UPDATE public.bills
SET advance_amount = COALESCE(advance_amount, 0);

-- Optional: tighten to NOT NULL if your RLS and writers are ready
DO $$ BEGIN
  ALTER TABLE public.bills ALTER COLUMN advance_amount SET NOT NULL;
EXCEPTION WHEN others THEN
  -- leave as nullable if existing rows or policies block it; defaults keep it safe
  NULL;
END $$;


