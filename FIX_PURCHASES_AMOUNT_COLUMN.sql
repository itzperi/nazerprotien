-- FIX PURCHASES AMOUNT COLUMN ISSUE
-- This will fix the amount column constraint issue

-- Step 1: Check if amount column exists and what constraints it has
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND table_schema = 'public'
AND column_name IN ('amount', 'total_amount', 'paid_amount', 'balance_amount')
ORDER BY column_name;

-- Step 2: If amount column exists and has NOT NULL constraint, make it nullable or add default
DO $$ 
BEGIN
    -- Check if amount column exists and is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' 
        AND column_name = 'amount' 
        AND table_schema = 'public' 
        AND is_nullable = 'NO'
    ) THEN
        -- Make amount column nullable
        ALTER TABLE public.purchases ALTER COLUMN amount DROP NOT NULL;
        -- Set default value
        ALTER TABLE public.purchases ALTER COLUMN amount SET DEFAULT 0;
    END IF;
END $$;

-- Step 3: Ensure all required columns exist with proper defaults
DO $$ 
BEGIN
    -- Add total_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'total_amount' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN total_amount numeric(10,2) DEFAULT 0;
    END IF;
    
    -- Add paid_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'paid_amount' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN paid_amount numeric(10,2) DEFAULT 0;
    END IF;
    
    -- Add balance_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'balance_amount' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN balance_amount numeric(10,2) DEFAULT 0;
    END IF;
    
    -- Add purchase_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'purchase_date' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN purchase_date date DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add product_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'product_id' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN product_id bigint;
    END IF;
    
    -- Add supplier_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'supplier_id' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN supplier_id bigint;
    END IF;
    
    -- Add quantity_kg if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'quantity_kg' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN quantity_kg numeric(10,2);
    END IF;
    
    -- Add price_per_kg if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'price_per_kg' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN price_per_kg numeric(10,2);
    END IF;
END $$;

-- Step 4: Verify the table structure
SELECT 'PURCHASES TABLE FIXED' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND table_schema = 'public'
ORDER BY ordinal_position;
