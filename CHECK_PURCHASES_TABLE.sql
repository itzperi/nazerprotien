-- CHECK PURCHASES TABLE STRUCTURE
-- This will show you what columns exist in your purchases table

-- Check if purchases table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases' AND table_schema = 'public') 
        THEN 'purchases table EXISTS' 
        ELSE 'purchases table DOES NOT EXIST' 
    END as table_status;

-- If table exists, show all columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
    'purchase_date' as column_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'purchase_date' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'paid_amount' as column_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'paid_amount' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'balance_amount' as column_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'balance_amount' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'total_amount' as column_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'total_amount' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;
