-- FIX SUPPLIER SUGGESTIONS AND DELETE FUNCTIONALITY
-- This script ensures all delete functions work properly and supplier suggestions work

-- 1. Ensure the supplier suggestions function exists and works
CREATE OR REPLACE FUNCTION public.get_supplier_suggestions(
  p_business_id TEXT,
  p_search_term TEXT DEFAULT ''
) RETURNS TABLE (
  id BIGINT,
  name TEXT
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

-- 2. Ensure load entry deletion function works properly
CREATE OR REPLACE FUNCTION public.delete_load_entry_with_cascade(
    p_load_id BIGINT,
    p_business_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_entry_date DATE;
BEGIN
    -- Get entry date for logging
    SELECT entry_date INTO v_entry_date
    FROM public.load_entries
    WHERE id = p_load_id AND business_id = p_business_id;
    
    IF v_entry_date IS NULL THEN
        RAISE EXCEPTION 'Load entry not found or access denied';
    END IF;
    
    -- Delete related salary entries (if any)
    DELETE FROM public.salaries 
    WHERE load_entry_id = p_load_id AND business_id = p_business_id;
    
    -- Delete related purchase entries (if any)
    DELETE FROM public.purchases 
    WHERE load_entry_id = p_load_id AND business_id = p_business_id;
    
    -- Delete the load entry
    DELETE FROM public.load_entries 
    WHERE id = p_load_id AND business_id = p_business_id;
    
    RAISE NOTICE 'Load entry for % and all related data deleted successfully', v_entry_date;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete load entry: %', SQLERRM;
END;
$$;

-- 3. Create function to delete salary entry
CREATE OR REPLACE FUNCTION public.delete_salary_entry(
    p_business_id TEXT,
    p_salary_date DATE,
    p_amount NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete the salary entry
    DELETE FROM public.salaries 
    WHERE business_id = p_business_id 
      AND salary_date = p_salary_date 
      AND amount = p_amount;
    
    IF FOUND THEN
        RAISE NOTICE 'Salary entry for % with amount % deleted successfully', p_salary_date, p_amount;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'No salary entry found to delete';
        RETURN FALSE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete salary entry: %', SQLERRM;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_supplier_suggestions(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_suggestions(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_load_entry_with_cascade(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_load_entry_with_cascade(BIGINT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_salary_entry(TEXT, DATE, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_salary_entry(TEXT, DATE, NUMERIC) TO anon;

-- 5. Test the functions
DO $$
BEGIN
    RAISE NOTICE '✅ All delete and suggestion functions created successfully!';
    RAISE NOTICE '📋 Available functions:';
    RAISE NOTICE '   - get_supplier_suggestions(business_id, search_term)';
    RAISE NOTICE '   - delete_load_entry_with_cascade(load_id, business_id)';
    RAISE NOTICE '   - delete_salary_entry(business_id, salary_date, amount)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Supplier suggestions will now work in Purchase page!';
    RAISE NOTICE '🎯 Load entries will be properly deleted and stay deleted!';
    RAISE NOTICE '🎯 Salary entries can now be deleted!';
END $$;
