import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Customer {
  name: string;
  phone: string;
  balance: number;
}

interface Bill {
  id: number;
  billNumber?: string;
  customer: string;
  customerPhone: string;
  date: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  cleaningCharge?: number;
  deliveryCharge?: number;
  advanceAmount?: number;
  paymentMethod: 'cash' | 'upi' | 'check' | 'cash_gpay';
  upiType?: string;
  bankName?: string;
  checkNumber?: string;
  cashAmount?: number;
  gpayAmount?: number;
  timestamp: Date;
}

interface BillItem {
  no: number;
  item: string;
  weight: string;
  rate: string;
  amount: number;
}

interface Purchase {
  id: number;
  purchaseDate: string;
  productId: number | null;
  supplierId: number | null;
  quantityKg: number | null;
  pricePerKg: number | null;
}

interface SalaryRow {
  id: number;
  salaryDate: string;
  amount: number;
}

export const useSupabaseData = (businessId: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [suppliersFull, setSuppliersFull] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [salaries, setSalaries] = useState<SalaryRow[]>([]);

  const refreshCustomersData = async () => {
    try {
      console.log('[BALANCE SYNC] Fetching latest customer data from database...');
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .order('name');
      
      if (error) {
        console.error('[BALANCE SYNC] Database query failed:', error);
        throw error;
      }
      
      if (!customersData) {
        console.warn('[BALANCE SYNC] No customer data received from database');
        return;
      }
      
      const mappedCustomers = customersData.map(c => ({
        name: c.name,
        phone: c.phone,
        balance: parseFloat(c.balance?.toString() || '0')
      }));
      
      console.log('[BALANCE SYNC] Successfully updated customer balances:', 
        mappedCustomers.map(c => `${c.name}: ₹${c.balance}`));
      
      setCustomers(mappedCustomers);
    } catch (error) {
      console.error('[BALANCE SYNC] Critical error refreshing customers:', error);
      // Still continue operation even if refresh fails
    }
  };

  // Get real-time customer balance by name - DEDICATED BALANCE FETCHER
  const getRealTimeBalance = async (customerName: string): Promise<number> => {
    try {
      console.log(`[BALANCE FETCH] Getting real-time balance for: ${customerName}`);
      
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('balance')
        .eq('name', customerName)
        .eq('business_id', businessId)
        .single();
      
      if (error) {
        console.error(`[BALANCE FETCH] Database error for ${customerName}:`, error);
        return 0;
      }
      
      const balance = customerData?.balance ? parseFloat(customerData.balance.toString()) : 0;
      console.log(`[BALANCE FETCH] Retrieved balance for ${customerName}: ₹${balance}`);
      
      return balance;
    } catch (error) {
      console.error(`[BALANCE FETCH] Critical error fetching balance for ${customerName}:`, error);
      return 0;
    }
  };

  // Get real-time customer balance by phone - DEDICATED BALANCE FETCHER
  const getRealTimeBalanceByPhone = async (phone: string): Promise<{balance: number, name?: string}> => {
    try {
      console.log(`[BALANCE FETCH] Getting real-time balance for phone: ${phone}`);
      
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('name, balance')
        .eq('phone', phone)
        .eq('business_id', businessId)
        .single();
      
      if (error) {
        console.error(`[BALANCE FETCH] Database error for phone ${phone}:`, error);
        return { balance: 0 };
      }
      
      const balance = customerData?.balance ? parseFloat(customerData.balance.toString()) : 0;
      console.log(`[BALANCE FETCH] Retrieved balance for phone ${phone}: ₹${balance}, Customer: ${customerData?.name}`);
      
      return { 
        balance, 
        name: customerData?.name 
      };
    } catch (error) {
      console.error(`[BALANCE FETCH] Critical error fetching balance for phone ${phone}:`, error);
      return { balance: 0 };
    }
  };

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        console.log(`[DATA LOAD] Loading data for business_id: ${businessId}`);
        
        // Load products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('business_id', businessId)
          .order('name');
        
        if (productsError) {
          console.error('[DATA LOAD] Error loading products:', productsError);
        } else {
          console.log(`[DATA LOAD] Loaded ${productsData?.length || 0} products`);
        }
        
        // Load customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessId)
          .order('name');
        
        if (customersError) {
          console.error('[DATA LOAD] Error loading customers:', customersError);
        } else {
          console.log(`[DATA LOAD] Loaded ${customersData?.length || 0} customers`);
        }
        
        // Load suppliers
        const { data: suppliersData, error: suppliersError } = await (supabase as any)
          .from('suppliers')
          .select('id, name')
          .eq('business_id', businessId)
          .order('name');

        if (suppliersError) {
          console.error('[DATA LOAD] Error loading suppliers:', suppliersError);
        }
        // Load purchases
        const { data: purchasesData, error: purchasesError } = await (supabase as any)
          .from('purchases')
          .select('id, purchase_date, product_id, supplier_id, quantity_kg, price_per_kg')
          .eq('business_id', businessId)
          .order('purchase_date', { ascending: false });

        if (purchasesError) {
          console.error('[DATA LOAD] Error loading purchases:', purchasesError);
        } else {
          console.log(`[DATA LOAD] Loaded ${purchasesData?.length || 0} purchases`);
        }

        // Load bills
        const { data: billsData, error: billsError } = await supabase
          .from('bills')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (billsError) {
          console.error('[DATA LOAD] Error loading bills:', billsError);
        } else {
          console.log(`[DATA LOAD] Loaded ${billsData?.length || 0} bills`);
        }

        setProducts(productsData || []);
        setSuppliers((suppliersData || []).map(s => (s as any).name));
        setSuppliersFull((suppliersData || []).map((s: any) => ({ id: s.id, name: s.name })));
        setCustomers((customersData || []).map(c => ({
          name: c.name,
          phone: c.phone,
          balance: parseFloat(c.balance?.toString() || '0')
        })));
        setPurchases((purchasesData || []).map((p: any) => ({
          id: p.id,
          purchaseDate: p.purchase_date,
          productId: p.product_id ?? null,
          supplierId: p.supplier_id ?? null,
          quantityKg: p.quantity_kg != null ? parseFloat(p.quantity_kg) : null,
          pricePerKg: p.price_per_kg != null ? parseFloat(p.price_per_kg) : null
        })));
        
        setBills((billsData || []).map(b => ({
          id: b.id,
          billNumber: (b as any).bill_number || undefined,
          customer: b.customer_name,
          customerPhone: b.customer_phone,
          date: (b as any).bill_date,
          items: (b.items as unknown as BillItem[]) || [],
          totalAmount: parseFloat(b.total_amount.toString()),
          paidAmount: parseFloat((b as any).paid_amount?.toString() || '0'),
          balanceAmount: parseFloat((b as any).balance_amount?.toString() || '0'),
          cleaningCharge: (b as any).cleaning_charge != null ? parseFloat((b as any).cleaning_charge) : 0,
          deliveryCharge: (b as any).delivery_charge != null ? parseFloat((b as any).delivery_charge) : 0,
          advanceAmount: (b as any).advance_amount != null ? parseFloat((b as any).advance_amount) : 0,
          paymentMethod: b.payment_method as 'cash' | 'upi' | 'check' | 'cash_gpay',
          upiType: (b as any).upi_type || undefined,
          bankName: (b as any).bank_name || undefined,
          checkNumber: (b as any).check_number || undefined,
          cashAmount: (b as any).cash_amount ? parseFloat((b as any).cash_amount.toString()) : undefined,
          gpayAmount: (b as any).gpay_amount ? parseFloat((b as any).gpay_amount.toString()) : undefined,
          timestamp: new Date(b.created_at || '')
        })));
        
        // Show helpful message if no data found
        if ((!productsData || productsData.length === 0) && 
            (!customersData || customersData.length === 0) && 
            (!billsData || billsData.length === 0)) {
          console.warn('[DATA LOAD] No data found. Please check database setup.');
          alert('No data found. Please follow the database setup instructions in MANUAL_DATABASE_SETUP.md');
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please check your Supabase connection and database setup.');
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      loadData();
    }
  }, [businessId]);

  // Add product
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      console.log(`[ADD PRODUCT] Adding product: ${product.name} for business: ${businessId}`);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ name: product.name, business_id: businessId }])
        .select()
        .single();

      if (error) {
        console.error('[ADD PRODUCT] Database error:', error);
        if (error.code === '42501') {
          throw new Error('Cannot add product: Database security policies are blocking this operation. Please follow the setup instructions in EMERGENCY_FIX.md');
        }
        throw error;
      }
      
      console.log('[ADD PRODUCT] Product added successfully:', data);
      setProducts(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: number, name: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ name })
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // Add customer
  // Add supplier
  const addSupplier = async (name: string) => {
    try {
      console.log(`[ADD SUPPLIER] Adding supplier: ${name} for business: ${businessId}`);
      
      if (!name.trim()) {
        throw new Error('Supplier name is required');
      }
      
      const cleanName = name.trim();
      
      // Try using the safe database function first
      try {
        const { data: supplierData, error: rpcError } = await (supabase as any).rpc('get_or_create_supplier', {
          p_business_id: businessId,
          p_supplier_name: cleanName
        });
        
        if (rpcError) {
          console.warn('[ADD SUPPLIER] RPC function failed, trying direct insert:', rpcError);
          throw new Error(`RPC failed: ${rpcError.message}`);
        }
        
        if (supplierData && supplierData.length > 0) {
          const supplier = supplierData[0];
          console.log(`[ADD SUPPLIER] Supplier ${supplier.is_new ? 'created' : 'found'}:`, supplier);
          
          // Update local state
          setSuppliers(prev => [...prev, supplier.supplier_name]);
          setSuppliersFull(prev => {
            const exists = prev.find(s => s.id === supplier.supplier_id);
            if (!exists) {
              return [...prev, { id: supplier.supplier_id, name: supplier.supplier_name }];
            }
            return prev;
          });
          
          return supplier;
        } else {
          throw new Error('No supplier data returned from RPC');
        }
      } catch (rpcError) {
        console.warn('[ADD SUPPLIER] RPC failed, trying direct insert:', rpcError);
        
        // Fallback to direct insertion
        const { data, error } = await (supabase as any)
          .from('suppliers')
          .insert([{ name: cleanName, business_id: businessId }])
          .select('id, name')
          .single();
        
        if (error) {
          console.error('[ADD SUPPLIER] Direct insert error:', error);
          if (error.code === '23505') {
            throw new Error('Supplier with this name already exists');
          }
          throw error;
        }
        
        console.log('[ADD SUPPLIER] Supplier added successfully via direct insert:', data);
        setSuppliers(prev => [...prev, data.name]);
        setSuppliersFull(prev => [...prev, { id: (data as any).id, name: data.name }]);
        return data;
      }
    } catch (error) {
      console.error('[ADD SUPPLIER] Error adding supplier:', error);
      throw error;
    }
  };

  // Get supplier suggestions for autocomplete
  const getSupplierSuggestions = async (searchTerm: string = '') => {
    try {
      const { data, error } = await (supabase as any).rpc('get_supplier_suggestions', {
        p_business_id: businessId,
        p_search_term: searchTerm
      });
      
      if (error) {
        console.error('Error fetching supplier suggestions:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSupplierSuggestions:', error);
      return [];
    }
  };

  // Enhanced customer creation with comprehensive error handling
  const safeCreateCustomer = async (name: string, phone: string, balance: number = 0) => {
    try {
      console.log(`[SAFE CREATE] Creating customer: ${name}, phone: ${phone}`);
      
      const { data, error } = await (supabase as any).rpc('safe_get_or_create_customer', {
        p_name: name,
        p_phone: phone,
        p_business_id: businessId,
        p_balance: balance
      });
      
      if (error) {
        console.error('[SAFE CREATE] RPC error:', error);
        throw new Error(`Customer creation failed: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No customer data returned');
      }
      
      const customerData = data[0];
      console.log(`[SAFE CREATE] Customer ${customerData.is_new ? 'created' : 'found'}:`, customerData);
      
      // Update local state
      setCustomers(prev => {
        const exists = prev.find(c => c.phone === phone);
        if (!exists) {
          return [...prev, {
            name: customerData.customer_name,
            phone: phone,
            balance: balance
          }];
        }
        return prev;
      });
      
      return customerData;
    } catch (error) {
      console.error('[SAFE CREATE] Error:', error);
      throw error;
    }
  };
  const addCustomer = async (customer: Customer) => {
    try {
      console.log(`[ADD CUSTOMER] Adding customer: ${customer.name} for business: ${businessId}`);
      
      // Validate required fields
      if (!customer.name || customer.name.trim() === '') {
        throw new Error('Customer name is required');
      }
      
      if (!customer.phone || customer.phone.trim() === '') {
        throw new Error('Customer phone is required');
      }

      // Check for existing customer with same phone
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('phone', customer.phone)
        .eq('business_id', businessId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[ADD CUSTOMER] Error checking existing customer:', checkError);
        throw new Error(`Database check failed: ${checkError.message}`);
      }

      if (existingCustomer) {
        console.log(`[ADD CUSTOMER] Customer with phone ${customer.phone} already exists:`, existingCustomer);
        // Update local state with existing customer
        setCustomers(prev => {
          const exists = prev.find(c => c.phone === customer.phone);
          if (!exists) {
            return [...prev, {
              name: existingCustomer.name,
              phone: existingCustomer.phone,
              balance: 0 // Will be updated by refresh
            }];
          }
          return prev;
        });
        return existingCustomer;
      }
      
      // Insert new customer
      const insertData = {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        balance: customer.balance || 0,
        business_id: businessId,
        is_walkin: customer.name.includes('Walk-in Customer') || false
      };

      console.log('[ADD CUSTOMER] Inserting customer data:', insertData);

      const { data, error } = await supabase
        .from('customers')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('[ADD CUSTOMER] Database error:', error);
        if (error.code === '42501') {
          throw new Error('Cannot add customer: Database security policies are blocking this operation. Please follow the setup instructions in EMERGENCY_FIX.md');
        } else if (error.code === '23505') {
          throw new Error('Customer with this phone number already exists');
        } else if (error.code === '23502') {
          throw new Error('Required field is missing');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('[ADD CUSTOMER] Customer added successfully:', data);
      
      // Update local state
      setCustomers(prev => [...prev, {
        name: data.name,
        phone: data.phone,
        balance: parseFloat(data.balance?.toString() || '0')
      }]);
      
      return data;
    } catch (error) {
      console.error('[ADD CUSTOMER] Error adding customer:', error);
      throw error;
    }
  };

  // Add purchase
  const addPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    try {
      const insertData = {
        business_id: businessId,
        purchase_date: purchase.purchaseDate,
        product_id: purchase.productId,
        supplier_id: purchase.supplierId,
        quantity_kg: purchase.quantityKg,
        price_per_kg: purchase.pricePerKg
      } as any;
      const { data, error } = await (supabase as any)
        .from('purchases')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      setPurchases(prev => [{
        id: data.id,
        purchaseDate: data.purchase_date,
        productId: data.product_id,
        supplierId: data.supplier_id,
        quantityKg: data.quantity_kg != null ? parseFloat(data.quantity_kg) : null,
        pricePerKg: data.price_per_kg != null ? parseFloat(data.price_per_kg) : null
      }, ...prev]);
    } catch (error) {
      console.error('Error adding purchase:', error);
      throw error;
    }
  };

  // Add salary
  const addSalary = async (row: Omit<SalaryRow, 'id'>) => {
    try {
      const insertData = {
        business_id: businessId,
        salary_date: row.salaryDate,
        amount: row.amount
      } as any;
      const { data, error } = await (supabase as any)
        .from('salaries')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      setSalaries(prev => [{
        id: (data as any).id,
        salaryDate: (data as any).salary_date,
        amount: parseFloat((data as any).amount)
      }, ...prev]);
    } catch (error) {
      console.error('Error adding salary:', error);
      throw error;
    }
  };

  const updateCustomer = async (index: number, customer: Customer) => {
    try {
      const existingCustomer = customers[index];
      
      // Update in database using the original customer's name as identifier
      const { error } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          phone: customer.phone,
          balance: customer.balance
        })
        .eq('name', existingCustomer.name)
        .eq('phone', existingCustomer.phone)
        .eq('business_id', businessId);

      if (error) throw error;
      
      // Update local state
      setCustomers(prev => prev.map((c, i) => i === index ? customer : c));
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const updateCustomerBalance = async (customerName: string, newBalance: number) => {
    try {
      console.log(`[BALANCE UPDATE] Updating ${customerName} balance to ₹${newBalance}`);
      
      const { error } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('name', customerName)
        .eq('business_id', businessId);

      if (error) {
        console.error(`[BALANCE UPDATE] Database update failed for ${customerName}:`, error);
        throw error;
      }
      
      console.log(`[BALANCE UPDATE] Successfully updated ${customerName} balance in database`);
      
      // Update local state immediately for instant UI feedback
      setCustomers(prev => prev.map(c => 
        c.name === customerName ? { ...c, balance: newBalance } : c
      ));
      
      // Critical: Refresh all customer data to ensure 100% synchronization across all views
      await refreshCustomersData();
      
      console.log(`[BALANCE UPDATE] Balance synchronization complete for ${customerName}`);
    } catch (error) {
      console.error(`[BALANCE UPDATE] Critical error updating balance for ${customerName}:`, error);
      throw error;
    }
  };

  const deleteCustomer = async (customerName: string) => {
    try {
      // Attempt cascade deletion via RPC if available
      // 1) Fetch customer id
      const { data: customerRow, error: findErr } = await supabase
        .from('customers')
        .select('id')
        .eq('name', customerName)
        .eq('business_id', businessId)
        .single();

      if (!findErr && customerRow && (customerRow as any).id) {
        // 2) Call cascade delete
        const { error: rpcErr } = await (supabase as any).rpc('delete_customer_with_cascade', {
          p_customer_id: (customerRow as any).id,
          p_business_id: businessId
        });

        if (!rpcErr) {
          setCustomers(prev => prev.filter(c => c.name !== customerName));
          return;
        }
        console.warn('[DELETE CUSTOMER] RPC cascade failed, falling back:', rpcErr);
      }

      // Fallback path (no RPC): remove bills then customer
      const { error: delBillsErr } = await supabase
        .from('bills')
        .delete()
        .eq('customer_name', customerName)
        .eq('business_id', businessId);
      if (delBillsErr) throw delBillsErr;

      const { error: delCustErr } = await supabase
        .from('customers')
        .delete()
        .eq('name', customerName)
        .eq('business_id', businessId);
      if (delCustErr) throw delCustErr;

      setCustomers(prev => prev.filter(c => c.name !== customerName));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  // Enhanced Add bill with comprehensive error handling and validation
  const addBill = async (bill: Omit<Bill, 'id' | 'timestamp'>) => {
    try {
      // Validate required fields before database insertion
      if (!bill.customer || !bill.customerPhone || !bill.date) {
        throw new Error('Missing required bill information');
      }

      if (!bill.items || bill.items.length === 0) {
        console.warn('Creating bill with no items - this is a balance-only transaction');
      }

      // Server-side safety: recompute key monetary fields using cents
      const { toCents, computeTotals } = await import('../lib/utils');
      const prevC = toCents((await getRealTimeBalance(bill.customer)) || 0);
      const itemsTotalC = toCents(bill.items.reduce((s, it) => s + (it.amount || 0), 0));
      const cleaningC = toCents((bill as any).cleaningCharge || 0);
      const deliveryC = toCents((bill as any).deliveryCharge || 0);
      const paidC = toCents(bill.paidAmount || 0);
      const totals = computeTotals({
        previousBalance: prevC,
        itemsTotal: itemsTotalC,
        deliveryCharge: deliveryC,
        cleaningCharge: cleaningC,
        paidAmount: paidC,
      });

      const computedTotal = totals.transactionAmount / 100;
      const computedBalance = totals.newBalance / 100;
      const computedAdvance = 0; // per latest requirement: no advance tracking

      // Create the insert object with comprehensive field mapping
      const insertData = {
        customer_name: bill.customer,
        customer_phone: bill.customerPhone,
        bill_date: bill.date,
        items: bill.items as any,
        total_amount: computedTotal,
        paid_amount: bill.paidAmount || 0,
        balance_amount: computedBalance,
        cleaning_charge: (bill as any).cleaningCharge ?? 0,
        delivery_charge: (bill as any).deliveryCharge ?? 0,
        advance_amount: computedAdvance,
        payment_method: bill.paymentMethod,
        upi_type: bill.upiType || null,
        bank_name: bill.bankName || null,
        check_number: bill.checkNumber || null,
        cash_amount: bill.cashAmount || null,
        gpay_amount: bill.gpayAmount || null,
        business_id: businessId,
        timestamp: new Date().toISOString()
      };

      console.log('Inserting bill data:', insertData);

      const { data, error } = await supabase
        .from('bills')
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        console.error('Database error while adding bill:', error);
        throw new Error(`Failed to save bill: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from bill insertion');
      }

      // Create validated bill object with safe property access
      const newBill: Bill = {
        id: data.id,
        billNumber: (data as any).bill_number || `B${data.id}`,
        customer: data.customer_name,
        customerPhone: data.customer_phone,
        date: (data as any).bill_date || bill.date,
        items: (data.items as unknown as BillItem[]) || [],
        totalAmount: parseFloat(data.total_amount?.toString() || '0'),
        paidAmount: parseFloat((data as any).paid_amount?.toString() || '0'),
        balanceAmount: parseFloat((data as any).balance_amount?.toString() || '0'),
        cleaningCharge: (data as any).cleaning_charge ? parseFloat((data as any).cleaning_charge) : 0,
        deliveryCharge: (data as any).delivery_charge ? parseFloat((data as any).delivery_charge) : 0,
        advanceAmount: (data as any).advance_amount ? parseFloat((data as any).advance_amount) : 0,
        paymentMethod: data.payment_method as 'cash' | 'upi' | 'check' | 'cash_gpay',
        upiType: (data as any).upi_type || undefined,
        bankName: (data as any).bank_name || undefined,
        checkNumber: (data as any).check_number || undefined,
        cashAmount: (data as any).cash_amount ? parseFloat((data as any).cash_amount.toString()) : undefined,
        gpayAmount: (data as any).gpay_amount ? parseFloat((data as any).gpay_amount.toString()) : undefined,
        timestamp: new Date(data.created_at || data.timestamp || new Date())
      };
      
      // Automatically update customer balance in database (no advance)
      try {
        const { error: custErr } = await supabase
          .from('customers')
          .update({
            balance: computedBalance
          })
          .eq('name', bill.customer)
          .eq('business_id', businessId);
        if (custErr) throw custErr;
      } catch (e) {
        console.error('[ADD BILL] Failed updating customer advance/balance:', e);
      }
      
      setBills(prev => [newBill, ...prev]);
      console.log('Bill successfully added:', newBill);
      return newBill;
    } catch (error) {
      console.error('Error adding bill:', error);
      
      // Provide user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('balance_amount')) {
          throw new Error('Database schema error. Please refresh the page and try again.');
        }
        throw error;
      }
      
      throw new Error('Unexpected error occurred while saving bill');
    }
  };

  // Update bill with balance recalculation
  const updateBill = async (bill: Bill) => {
    try {
      // First, get the original bill to calculate balance difference
      const originalBill = bills.find(b => b.id === bill.id);
      if (!originalBill) throw new Error('Original bill not found');

      // Recompute monetary fields server-side for integrity
      const { toCents, computeTotals } = await import('../lib/utils');
      const prevC = toCents((await getRealTimeBalance(bill.customer)) || 0);
      const itemsTotalC = toCents(bill.items.reduce((s, it) => s + (it.amount || 0), 0));
      const cleaningC = toCents((bill as any).cleaningCharge || 0);
      const deliveryC = toCents((bill as any).deliveryCharge || 0);
      const paidC = toCents(bill.paidAmount || 0);
      const totals = computeTotals({
        previousBalance: prevC,
        itemsTotal: itemsTotalC,
        deliveryCharge: deliveryC,
        cleaningCharge: cleaningC,
        paidAmount: paidC,
      });

      const computedTotal = totals.transactionAmount / 100;
      const computedBalance = totals.newBalance / 100;
      const computedAdvance = 0; // per latest requirement: no advance tracking

      // Update the bill in database
      const { error } = await supabase
        .from('bills')
        .update({
          bill_number: bill.billNumber,
          customer_name: bill.customer,
          customer_phone: bill.customerPhone,
          bill_date: bill.date,
          items: bill.items as any,
          total_amount: computedTotal,
          paid_amount: bill.paidAmount,
          balance_amount: computedBalance,
          cleaning_charge: (bill as any).cleaningCharge ?? 0,
          delivery_charge: (bill as any).deliveryCharge ?? 0,
          advance_amount: computedAdvance,
          payment_method: bill.paymentMethod,
          upi_type: bill.upiType,
          bank_name: bill.bankName,
          check_number: bill.checkNumber,
          cash_amount: bill.cashAmount,
          gpay_amount: bill.gpayAmount
        })
        .eq('id', bill.id)
        .eq('business_id', businessId);

      if (error) throw error;

      // Calculate the difference in balance and update customer balance
      const balanceDifference = computedBalance - originalBill.balanceAmount;
      if (balanceDifference !== 0) {
        const customer = customers.find(c => c.name === bill.customer);
        if (customer) {
          const newCustomerBalance = customer.balance + balanceDifference;
          await updateCustomerBalance(bill.customer, newCustomerBalance);
        }
      }
      
      // Update customer balance as well (no advance)
      try {
        const { error: custErr } = await supabase
          .from('customers')
          .update({
            balance: computedBalance
          })
          .eq('name', bill.customer)
          .eq('business_id', businessId);
        if (custErr) throw custErr;
      } catch (e) {
        console.error('[UPDATE BILL] Failed updating customer advance/balance:', e);
      }

      setBills(prev => prev.map(b => b.id === bill.id ? { ...bill, totalAmount: computedTotal, balanceAmount: computedBalance, advanceAmount: computedAdvance } : b));
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  };

  // Delete bill with balance adjustment
  const deleteBill = async (id: number) => {
    try {
      // Get the bill to be deleted
      const billToDelete = bills.find(b => b.id === id);
      if (!billToDelete) throw new Error('Bill not found');

      // Delete from database
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;

      // Adjust customer balance (subtract the deleted bill's balance)
      const customer = customers.find(c => c.name === billToDelete.customer);
      if (customer) {
        const newCustomerBalance = customer.balance - billToDelete.balanceAmount;
        await updateCustomerBalance(billToDelete.customer, newCustomerBalance);
      }
      
      setBills(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  };

  // Get latest balance for a customer by phone number
  const getLatestBalanceByPhone = (customerPhone: string): number => {
    const customerBills = bills.filter(bill => bill.customerPhone === customerPhone);
    if (customerBills.length > 0) {
      // Sort by date descending and get the latest bill
      const latestBill = customerBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return latestBill.balanceAmount || 0;
    }
    return 0; // First bill for this customer
  };

  // Delete supplier with cascade delete
  const deleteSupplier = async (supplierId: number) => {
    try {
      console.log(`[DELETE SUPPLIER] Deleting supplier ID: ${supplierId} for business: ${businessId}`);
      
      // Use the database function for cascade delete
      const { error } = await (supabase as any).rpc('delete_supplier_with_cascade', {
        p_supplier_id: supplierId,
        p_business_id: businessId
      });
      
      if (error) {
        console.error('[DELETE SUPPLIER] Database error:', error);
        throw error;
      }
      
      // Update local state
      setSuppliers(prev => prev.filter(s => {
        if (typeof s === 'string') return true; // Keep string entries
        return s.id !== supplierId;
      }));
      
      setSuppliersFull(prev => prev.filter(s => s.id !== supplierId));
      
      // Also remove from purchases and salaries if they exist
      setPurchases(prev => prev.filter(p => p.supplier_id !== supplierId));
      setSalaries(prev => prev.filter(s => s.supplier_id !== supplierId));
      
      console.log('[DELETE SUPPLIER] Supplier and all related data deleted successfully');
      
    } catch (error) {
      console.error('[DELETE SUPPLIER] Error deleting supplier:', error);
      throw error;
    }
  };

  return {
    products,
    customers,
    bills,
    loading,
    suppliers,
    suppliersFull,
    purchases,
    salaries,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    safeCreateCustomer,
    updateCustomer,
    updateCustomerBalance,
    deleteCustomer,
    addSupplier,
    deleteSupplier,
    getSupplierSuggestions,
    addPurchase,
    addSalary,
    addBill,
    updateBill,
    deleteBill,
    getLatestBalanceByPhone,
    refreshCustomersData,
    getRealTimeBalance,
    getRealTimeBalanceByPhone
  };
};
