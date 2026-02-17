-- Enhanced walk-in customer handling with improved error handling and validation

-- 1) Ensure customers table has all required columns
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS is_walkin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2) Add constraints to prevent invalid data
DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_name_not_empty CHECK (length(trim(name)) > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_phone_format CHECK (phone ~ '^[0-9]{10}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Enhanced walk-in customer function with better error handling
CREATE OR REPLACE FUNCTION public.create_or_get_walkin_customer(
  p_phone text,
  p_business_id text
) RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer_id bigint;
  v_customer_name text;
  v_clean_phone text;
BEGIN
  -- Validate and clean phone number
  v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  IF length(v_clean_phone) != 10 THEN
    RAISE EXCEPTION 'Invalid phone number: must be exactly 10 digits';
  END IF;
  
  -- Validate business_id
  IF p_business_id IS NULL OR trim(p_business_id) = '' THEN
    RAISE EXCEPTION 'Business ID is required';
  END IF;
  
  -- Format walk-in customer name
  v_customer_name := 'Walk-in Customer (' || v_clean_phone || ')';
  
  -- Try to find existing customer by phone
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE phone = v_clean_phone 
    AND business_id = p_business_id
  LIMIT 1;
  
  -- If found, return existing ID
  IF v_customer_id IS NOT NULL THEN
    RETURN v_customer_id;
  END IF;
  
  -- Create new walk-in customer
  BEGIN
    INSERT INTO public.customers (name, phone, business_id, balance, is_walkin)
    VALUES (v_customer_name, v_clean_phone, p_business_id, 0, true)
    RETURNING id INTO v_customer_id;
    
    RETURN v_customer_id;
  EXCEPTION
    WHEN unique_violation THEN
      -- Customer was created by another process, fetch the ID
      SELECT id INTO v_customer_id
      FROM public.customers
      WHERE phone = v_clean_phone 
        AND business_id = p_business_id
      LIMIT 1;
      
      IF v_customer_id IS NOT NULL THEN
        RETURN v_customer_id;
      ELSE
        RAISE EXCEPTION 'Failed to create or find customer after unique violation';
      END IF;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create walk-in customer: %', SQLERRM;
  END;
END;
$$;

-- 4) Function to safely get or create customer with comprehensive error handling
CREATE OR REPLACE FUNCTION public.safe_get_or_create_customer(
  p_name text,
  p_phone text,
  p_business_id text,
  p_balance numeric DEFAULT 0
) RETURNS TABLE (
  customer_id bigint,
  customer_name text,
  is_new boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer_id bigint;
  v_customer_name text;
  v_clean_phone text;
  v_is_new boolean := false;
BEGIN
  -- Validate inputs
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RAISE EXCEPTION 'Phone number is required';
  END IF;
  
  IF p_business_id IS NULL OR trim(p_business_id) = '' THEN
    RAISE EXCEPTION 'Business ID is required';
  END IF;
  
  -- Clean phone number
  v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  IF length(v_clean_phone) != 10 THEN
    RAISE EXCEPTION 'Invalid phone number: must be exactly 10 digits';
  END IF;
  
  -- Set default name if not provided
  v_customer_name := COALESCE(NULLIF(trim(p_name), ''), 'Walk-in Customer (' || v_clean_phone || ')');
  
  -- Try to find existing customer
  SELECT id, name INTO v_customer_id, v_customer_name
  FROM public.customers
  WHERE phone = v_clean_phone 
    AND business_id = p_business_id
  LIMIT 1;
  
  -- If found, return existing customer
  IF v_customer_id IS NOT NULL THEN
    RETURN QUERY SELECT v_customer_id, v_customer_name, false;
    RETURN;
  END IF;
  
  -- Create new customer
  BEGIN
    INSERT INTO public.customers (name, phone, business_id, balance, is_walkin)
    VALUES (v_customer_name, v_clean_phone, p_business_id, COALESCE(p_balance, 0), v_customer_name LIKE 'Walk-in Customer%')
    RETURNING id, name INTO v_customer_id, v_customer_name;
    
    v_is_new := true;
    RETURN QUERY SELECT v_customer_id, v_customer_name, v_is_new;
  EXCEPTION
    WHEN unique_violation THEN
      -- Customer was created by another process, fetch the existing one
      SELECT id, name INTO v_customer_id, v_customer_name
      FROM public.customers
      WHERE phone = v_clean_phone 
        AND business_id = p_business_id
      LIMIT 1;
      
      IF v_customer_id IS NOT NULL THEN
        RETURN QUERY SELECT v_customer_id, v_customer_name, false;
      ELSE
        RAISE EXCEPTION 'Failed to create or find customer after unique violation';
      END IF;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create customer: %', SQLERRM;
  END;
END;
$$;

-- 5) Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone_business ON public.customers (phone, business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_walkin ON public.customers (business_id, is_walkin);

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

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_customers_updated_at();
