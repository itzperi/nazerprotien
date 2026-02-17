-- Billing calculations hardening: fields, constraints, trigger-based computation, and audit logs
-- This migration is idempotent and safe to re-run.

-- 1) Extend bills table with required fields (defaults to 0)
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS cleaning_charge numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_charge numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_bill_amount numeric DEFAULT 0, -- items + charges
  ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0,       -- previous balance + total_bill_amount
  ADD COLUMN IF NOT EXISTS new_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_payment numeric DEFAULT 0;

-- Backward compatibility: ensure advance_amount exists and mirrors advance_payment
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS advance_amount numeric DEFAULT 0;

-- Normalize NULLs
UPDATE public.bills
SET cleaning_charge = COALESCE(cleaning_charge, 0),
    delivery_charge = COALESCE(delivery_charge, 0),
    total_bill_amount = COALESCE(total_bill_amount, 0),
    total_amount = COALESCE(total_amount, 0),
    new_balance = COALESCE(new_balance, 0),
    advance_payment = COALESCE(advance_payment, 0),
    advance_amount = COALESCE(advance_amount, 0);

-- 2) Basic validation constraints (reject invalid negative charges)
DO $$ BEGIN
  ALTER TABLE public.bills
    ADD CONSTRAINT bills_cleaning_charge_non_negative CHECK (cleaning_charge >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.bills
    ADD CONSTRAINT bills_delivery_charge_non_negative CHECK (delivery_charge >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Audit log table for discrepancies and important calculation events
CREATE TABLE IF NOT EXISTS public.billing_audit_logs (
  id bigserial PRIMARY KEY,
  bill_id bigint,
  business_id text,
  customer_name text,
  event_type text NOT NULL, -- e.g., 'CALCULATION', 'VALIDATION_ERROR'
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Calculation function to compute amounts and validate
CREATE OR REPLACE FUNCTION public.calculate_bill_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_items_total numeric := 0;
  v_prev_balance numeric := 0;
  v_paid numeric := 0;
BEGIN
  -- Default charges to 0 if NULL
  NEW.cleaning_charge := COALESCE(NEW.cleaning_charge, 0);
  NEW.delivery_charge := COALESCE(NEW.delivery_charge, 0);
  NEW.paid_amount := COALESCE(NEW.paid_amount, 0);

  -- Validate charges (non-negative)
  IF NEW.cleaning_charge < 0 OR NEW.delivery_charge < 0 THEN
    INSERT INTO public.billing_audit_logs (bill_id, business_id, customer_name, event_type, message)
    VALUES (NEW.id, NEW.business_id, NEW.customer_name, 'VALIDATION_ERROR', 'Negative cleaning/delivery charge rejected');
    RAISE EXCEPTION 'Invalid negative charge values';
  END IF;

  -- Items total from JSON array 'items' -> sum of amount fields
  IF NEW.items IS NOT NULL THEN
    SELECT COALESCE(SUM((item->>'amount')::numeric), 0) INTO v_items_total
    FROM jsonb_array_elements(NEW.items) AS item
    WHERE (item->>'amount') IS NOT NULL;
  ELSE
    v_items_total := 0;
  END IF;

  -- Paid amount normalized
  v_paid := COALESCE(NEW.paid_amount, 0);

  -- Previous balance from customers table for the same business and customer
  -- If not found, assume zero to avoid blocking billing
  SELECT COALESCE(balance, 0) INTO v_prev_balance
  FROM public.customers c
  WHERE c.name = NEW.customer_name AND c.business_id = NEW.business_id
  LIMIT 1;

  -- Compute totals per business rules:
  -- total_bill_amount = items_total + cleaning + delivery
  NEW.total_bill_amount := COALESCE(v_items_total, 0) + NEW.cleaning_charge + NEW.delivery_charge;

  -- total_amount = previous_balance + total_bill_amount
  NEW.total_amount := COALESCE(v_prev_balance, 0) + COALESCE(NEW.total_bill_amount, 0);

  -- new_balance = max(total_amount - paid, 0)
  NEW.new_balance := GREATEST(NEW.total_amount - v_paid, 0);

  -- per latest requirement: do not track advance; clamp to zero
  NEW.advance_payment := 0;
  NEW.advance_amount := 0;

  -- Prevent negative balances stored
  IF NEW.new_balance < 0 THEN
    INSERT INTO public.billing_audit_logs (bill_id, business_id, customer_name, event_type, message)
    VALUES (NEW.id, NEW.business_id, NEW.customer_name, 'CALCULATION', 'New balance clamped to zero');
    NEW.new_balance := 0;
  END IF;

  -- Optional: Log calculation snapshot for auditing
  INSERT INTO public.billing_audit_logs (bill_id, business_id, customer_name, event_type, message)
  VALUES (
    NEW.id,
    NEW.business_id,
    NEW.customer_name,
    'CALCULATION',
    'items_total='||COALESCE(v_items_total,0)||', cleaning='||NEW.cleaning_charge||', delivery='||NEW.delivery_charge||
    ', total_bill='||NEW.total_bill_amount||', prev_balance='||COALESCE(v_prev_balance,0)||
    ', total_amount='||NEW.total_amount||', paid='||v_paid||', new_balance='||NEW.new_balance||', advance='||NEW.advance_payment
  );

  RETURN NEW;
END;
$$;

-- 5) Triggers for INSERT and UPDATE on bills
DROP TRIGGER IF EXISTS trg_bills_calculate_before_ins ON public.bills;
CREATE TRIGGER trg_bills_calculate_before_ins
BEFORE INSERT ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.calculate_bill_fields();

DROP TRIGGER IF EXISTS trg_bills_calculate_before_upd ON public.bills;
CREATE TRIGGER trg_bills_calculate_before_upd
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.calculate_bill_fields();


