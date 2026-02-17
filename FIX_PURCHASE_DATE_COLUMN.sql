-- FIX PURCHASE DATE COLUMN ISSUE
-- This will add the missing 'date' column that the Purchase Page is looking for

-- Step 1: Add the 'date' column that the Purchase Page expects
DO $$ 
BEGIN
    -- Add date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'date' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add purchase_date if it doesn't exist (for future compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'purchase_date' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN purchase_date date NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add business_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'business_id' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN business_id text NOT NULL DEFAULT 'default';
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
    
    -- Fix amount column if it exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' 
        AND column_name = 'amount' 
        AND table_schema = 'public' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.purchases ALTER COLUMN amount DROP NOT NULL;
        ALTER TABLE public.purchases ALTER COLUMN amount SET DEFAULT 0;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'created_at' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'updated_at' AND table_schema = 'public') THEN
        ALTER TABLE public.purchases ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Step 2: Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
DROP POLICY IF EXISTS purchases_select_policy ON public.purchases;
DROP POLICY IF EXISTS purchases_insert_policy ON public.purchases;
DROP POLICY IF EXISTS purchases_update_policy ON public.purchases;
DROP POLICY IF EXISTS purchases_delete_policy ON public.purchases;

CREATE POLICY purchases_select_policy ON public.purchases FOR SELECT USING (true);
CREATE POLICY purchases_insert_policy ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY purchases_update_policy ON public.purchases FOR UPDATE USING (true);
CREATE POLICY purchases_delete_policy ON public.purchases FOR DELETE USING (true);

-- Step 4: Grant permissions
GRANT ALL ON public.purchases TO anon;
GRANT ALL ON public.purchases TO authenticated;
GRANT USAGE ON SEQUENCE public.purchases_id_seq TO anon;
GRANT USAGE ON SEQUENCE public.purchases_id_seq TO authenticated;

-- Step 5: Verify the fix
SELECT 'PURCHASE DATE COLUMN FIXED SUCCESSFULLY' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND table_schema = 'public'
ORDER BY ordinal_position;
