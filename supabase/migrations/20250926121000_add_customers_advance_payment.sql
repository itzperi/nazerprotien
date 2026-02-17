-- Add advance_payment tracking to customers and ensure non-negative balances

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS advance_payment numeric DEFAULT 0;

UPDATE public.customers
SET advance_payment = COALESCE(advance_payment, 0),
    balance = GREATEST(COALESCE(balance, 0), 0);

DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_balance_non_negative CHECK (balance >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_advance_non_negative CHECK (advance_payment >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


