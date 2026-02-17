-- Enhanced supplier management and walk-in customer handling

-- 1) Ensure suppliers table exists with proper structure
CREATE TABLE IF NOT EXISTS public.suppliers (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  business_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint for business_id + name combination
DO $$ BEGIN
  ALTER TABLE public.suppliers
    ADD CONSTRAINT suppliers_business_name_unique UNIQUE (business_id, name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_business_name ON public.suppliers (business_id, name);

-- 2) Ensure customers table has proper structure for walk-in customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS is_walkin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add unique constraint for business_id + phone combination
DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_business_phone_unique UNIQUE (business_id, phone);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Function to create or get walk-in customer
CREATE OR REPLACE FUNCTION public.create_or_get_walkin_customer(
  p_phone text,
  p_business_id text
) RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer_id bigint;
  v_customer_name text;
BEGIN
  -- Format walk-in customer name
  v_customer_name := 'Walk-in Customer (' || p_phone || ')';
  
  -- Try to find existing customer by phone
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE phone = p_phone AND business_id = p_business_id
  LIMIT 1;
  
  -- If not found, create new walk-in customer
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, business_id, balance, is_walkin)
    VALUES (v_customer_name, p_phone, p_business_id, 0, true)
    RETURNING id INTO v_customer_id;
  END IF;
  
  RETURN v_customer_id;
END;
$$;

-- 4) Function to get supplier suggestions
CREATE OR REPLACE FUNCTION public.get_supplier_suggestions(
  p_business_id text,
  p_search_term text DEFAULT ''
) RETURNS TABLE (
  id bigint,
  name text
) 
LANGUAGE sql
STABLE
AS $$
  SELECT s.id, s.name
  FROM public.suppliers s
  WHERE s.business_id = p_business_id
    AND (p_search_term = '' OR s.name ILIKE '%' || p_search_term || '%')
  ORDER BY s.name
  LIMIT 10;
$$;

-- 5) Update trigger for suppliers
CREATE OR REPLACE FUNCTION public.update_suppliers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_suppliers_updated_at();

-- 6) Update trigger for customers
CREATE OR REPLACE FUNCTION public.update_customers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_customers_updated_at();
