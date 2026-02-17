-- ADD COMPREHENSIVE DELETE FUNCTIONALITY
-- This script adds delete functions with cascade deletes for suppliers, load entries, and other data

-- 1. Create function to delete supplier with cascade delete
CREATE OR REPLACE FUNCTION public.delete_supplier_with_cascade(
    p_supplier_id BIGINT,
    p_business_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_supplier_name TEXT;
BEGIN
    -- Get supplier name for logging
    SELECT name INTO v_supplier_name
    FROM public.suppliers
    WHERE id = p_supplier_id AND business_id = p_business_id;
    
    IF v_supplier_name IS NULL THEN
        RAISE EXCEPTION 'Supplier not found or access denied';
    END IF;
    
    -- Delete related salary entries
    DELETE FROM public.salaries 
    WHERE supplier_id = p_supplier_id AND business_id = p_business_id;
    
    -- Delete related purchase entries
    DELETE FROM public.purchases 
    WHERE supplier_id = p_supplier_id AND business_id = p_business_id;
    
    -- Delete related load entries
    DELETE FROM public.load_entries 
    WHERE supplier_id = p_supplier_id AND business_id = p_business_id;
    
    -- Finally delete the supplier
    DELETE FROM public.suppliers 
    WHERE id = p_supplier_id AND business_id = p_business_id;
    
    RAISE NOTICE 'Supplier "%" and all related data deleted successfully', v_supplier_name;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete supplier: %', SQLERRM;
END;
$$;

-- 2. Create function to delete load entry with cascade delete
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

-- 3. Create function to delete customer with cascade delete
CREATE OR REPLACE FUNCTION public.delete_customer_with_cascade(
    p_customer_id BIGINT,
    p_business_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_name TEXT;
BEGIN
    -- Get customer name for logging
    SELECT name INTO v_customer_name
    FROM public.customers
    WHERE id = p_customer_id AND business_id = p_business_id;
    
    IF v_customer_name IS NULL THEN
        RAISE EXCEPTION 'Customer not found or access denied';
    END IF;
    
    -- Delete related bills
    DELETE FROM public.bills 
    WHERE customer_id = p_customer_id AND business_id = p_business_id;
    
    -- Delete the customer
    DELETE FROM public.customers 
    WHERE id = p_customer_id AND business_id = p_business_id;
    
    RAISE NOTICE 'Customer "%" and all related data deleted successfully', v_customer_name;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete customer: %', SQLERRM;
END;
$$;

-- 4. Create function to delete product with cascade delete
CREATE OR REPLACE FUNCTION public.delete_product_with_cascade(
    p_product_id BIGINT,
    p_business_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_name TEXT;
BEGIN
    -- Get product name for logging
    SELECT name INTO v_product_name
    FROM public.products
    WHERE id = p_product_id AND business_id = p_business_id;
    
    IF v_product_name IS NULL THEN
        RAISE EXCEPTION 'Product not found or access denied';
    END IF;
    
    -- Delete related bill items
    DELETE FROM public.bill_items 
    WHERE product_id = p_product_id AND business_id = p_business_id;
    
    -- Delete related load entries
    DELETE FROM public.load_entries 
    WHERE product_id = p_product_id AND business_id = p_business_id;
    
    -- Delete related purchases
    DELETE FROM public.purchases 
    WHERE product_id = p_product_id AND business_id = p_business_id;
    
    -- Delete the product
    DELETE FROM public.products 
    WHERE id = p_product_id AND business_id = p_business_id;
    
    RAISE NOTICE 'Product "%" and all related data deleted successfully', v_product_name;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete product: %', SQLERRM;
END;
$$;

-- 5. Create function to get supplier usage count (for confirmation dialogs)
CREATE OR REPLACE FUNCTION public.get_supplier_usage_count(
    p_supplier_id BIGINT,
    p_business_id TEXT
) RETURNS TABLE (
    salary_count BIGINT,
    purchase_count BIGINT,
    load_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        (SELECT COUNT(*) FROM public.salaries WHERE supplier_id = p_supplier_id AND business_id = p_business_id) as salary_count,
        (SELECT COUNT(*) FROM public.purchases WHERE supplier_id = p_supplier_id AND business_id = p_business_id) as purchase_count,
        (SELECT COUNT(*) FROM public.load_entries WHERE supplier_id = p_supplier_id AND business_id = p_business_id) as load_count;
$$;

-- 6. Create function to get load entry usage count
CREATE OR REPLACE FUNCTION public.get_load_entry_usage_count(
    p_load_id BIGINT,
    p_business_id TEXT
) RETURNS TABLE (
    salary_count BIGINT,
    purchase_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        (SELECT COUNT(*) FROM public.salaries WHERE load_entry_id = p_load_id AND business_id = p_business_id) as salary_count,
        (SELECT COUNT(*) FROM public.purchases WHERE load_entry_id = p_load_id AND business_id = p_business_id) as purchase_count;
$$;

-- 7. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION public.delete_supplier_with_cascade(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_supplier_with_cascade(BIGINT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_load_entry_with_cascade(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_load_entry_with_cascade(BIGINT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_customer_with_cascade(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_customer_with_cascade(BIGINT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_product_with_cascade(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_with_cascade(BIGINT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_supplier_usage_count(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_usage_count(BIGINT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_load_entry_usage_count(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_load_entry_usage_count(BIGINT, TEXT) TO anon;

-- 8. Test the functions
DO $$
BEGIN
    RAISE NOTICE '✅ Delete functionality functions created successfully!';
    RAISE NOTICE '📋 Available functions:';
    RAISE NOTICE '   - delete_supplier_with_cascade(supplier_id, business_id)';
    RAISE NOTICE '   - delete_load_entry_with_cascade(load_id, business_id)';
    RAISE NOTICE '   - delete_customer_with_cascade(customer_id, business_id)';
    RAISE NOTICE '   - delete_product_with_cascade(product_id, business_id)';
    RAISE NOTICE '   - get_supplier_usage_count(supplier_id, business_id)';
    RAISE NOTICE '   - get_load_entry_usage_count(load_id, business_id)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 All functions include cascade deletes for related data!';
END $$;
