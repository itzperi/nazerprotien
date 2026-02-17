// Setup database with sample data
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://csatoabqaxaszgfhrjjj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYXRvYWJxYXhhc3pnZmhyampqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjE4NjQsImV4cCI6MjA3MzQzNzg2NH0.pdRXpKaE7uAzPB-li6U9fBpPflAZp9uFIZyHrHSdU80";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function setupDatabase() {
  console.log('Setting up database...');
  
  try {
    // 1. Create business_info table
    console.log('1. Creating business_info table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.business_info (
          id SERIAL PRIMARY KEY,
          business_id TEXT NOT NULL UNIQUE,
          business_name TEXT NOT NULL,
          address TEXT NOT NULL,
          gst_number TEXT,
          phone TEXT,
          email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createTableError) {
      console.log('Table might already exist, continuing...');
    } else {
      console.log('✅ Business info table created');
    }
    
    // 2. Insert business information
    console.log('2. Inserting business information...');
    const { error: businessError } = await supabase
      .from('business_info')
      .upsert([
        {
          business_id: 'santhosh1',
          business_name: 'Santhosh Chicken 1',
          address: 'Your Business Address',
          gst_number: '22AAAAA0000A1Z5',
          phone: '+91-9876543211',
          email: 'santhosh1@chickencenter.com'
        },
        {
          business_id: 'vasan',
          business_name: 'Vasan Chicken Center',
          address: '61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011',
          gst_number: '33AAAAA0000A1Z5',
          phone: '+91-9876543210',
          email: 'vasan@chickencenter.com'
        }
      ]);
    
    if (businessError) {
      console.error('Error inserting business info:', businessError);
    } else {
      console.log('✅ Business information inserted');
    }
    
    // 3. Insert sample products
    console.log('3. Inserting sample products...');
    const { error: productsError } = await supabase
      .from('products')
      .upsert([
        { name: 'Chicken Live', business_id: 'santhosh1' },
        { name: 'Chicken Cut', business_id: 'santhosh1' },
        { name: 'Chicken Leg', business_id: 'santhosh1' },
        { name: 'Chicken Breast', business_id: 'santhosh1' },
        { name: 'Chicken Wings', business_id: 'santhosh1' },
        { name: 'Chicken Live', business_id: 'vasan' },
        { name: 'Chicken Cut', business_id: 'vasan' },
        { name: 'Chicken Leg', business_id: 'vasan' },
        { name: 'Chicken Breast', business_id: 'vasan' },
        { name: 'Chicken Wings', business_id: 'vasan' }
      ]);
    
    if (productsError) {
      console.error('Error inserting products:', productsError);
    } else {
      console.log('✅ Sample products inserted');
    }
    
    // 4. Insert sample customers
    console.log('4. Inserting sample customers...');
    const { error: customersError } = await supabase
      .from('customers')
      .upsert([
        { name: 'John Doe', phone: '9876543210', balance: 0, business_id: 'santhosh1' },
        { name: 'Jane Smith', phone: '9876543211', balance: 0, business_id: 'santhosh1' },
        { name: 'Mike Johnson', phone: '9876543212', balance: 0, business_id: 'santhosh1' },
        { name: 'Sarah Wilson', phone: '9876543213', balance: 0, business_id: 'santhosh1' },
        { name: 'Raj Kumar', phone: '9876543214', balance: 0, business_id: 'vasan' },
        { name: 'Priya Sharma', phone: '9876543215', balance: 0, business_id: 'vasan' },
        { name: 'Amit Patel', phone: '9876543216', balance: 0, business_id: 'vasan' },
        { name: 'Sneha Singh', phone: '9876543217', balance: 0, business_id: 'vasan' }
      ]);
    
    if (customersError) {
      console.error('Error inserting customers:', customersError);
    } else {
      console.log('✅ Sample customers inserted');
    }
    
    // 5. Insert sample bills
    console.log('5. Inserting sample bills...');
    const { error: billsError } = await supabase
      .from('bills')
      .upsert([
        {
          customer_name: 'John Doe',
          customer_phone: '9876543210',
          bill_date: '2024-01-15',
          items: [{ no: 1, item: 'Chicken Live', weight: '2.5', rate: '180', amount: 450 }],
          total_amount: 450.00,
          paid_amount: 400.00,
          balance_amount: 50.00,
          payment_method: 'cash',
          business_id: 'santhosh1'
        },
        {
          customer_name: 'Jane Smith',
          customer_phone: '9876543211',
          bill_date: '2024-01-15',
          items: [{ no: 1, item: 'Chicken Cut', weight: '1.5', rate: '200', amount: 300 }],
          total_amount: 300.00,
          paid_amount: 300.00,
          balance_amount: 0.00,
          payment_method: 'upi',
          business_id: 'santhosh1'
        },
        {
          customer_name: 'Raj Kumar',
          customer_phone: '9876543214',
          bill_date: '2024-01-15',
          items: [{ no: 1, item: 'Chicken Live', weight: '3.0', rate: '175', amount: 525 }],
          total_amount: 525.00,
          paid_amount: 500.00,
          balance_amount: 25.00,
          payment_method: 'cash',
          business_id: 'vasan'
        },
        {
          customer_name: 'Priya Sharma',
          customer_phone: '9876543215',
          bill_date: '2024-01-15',
          items: [{ no: 1, item: 'Chicken Leg', weight: '2.0', rate: '220', amount: 440 }],
          total_amount: 440.00,
          paid_amount: 440.00,
          balance_amount: 0.00,
          payment_method: 'upi',
          business_id: 'vasan'
        }
      ]);
    
    if (billsError) {
      console.error('Error inserting bills:', billsError);
    } else {
      console.log('✅ Sample bills inserted');
    }
    
    // 6. Update customer balances
    console.log('6. Updating customer balances...');
    const { data: customers } = await supabase
      .from('customers')
      .select('name, business_id');
    
    if (customers) {
      for (const customer of customers) {
        const { data: bills } = await supabase
          .from('bills')
          .select('balance_amount')
          .eq('customer_name', customer.name)
          .eq('business_id', customer.business_id);
        
        const totalBalance = bills?.reduce((sum, bill) => sum + (bill.balance_amount || 0), 0) || 0;
        
        await supabase
          .from('customers')
          .update({ balance: totalBalance })
          .eq('name', customer.name)
          .eq('business_id', customer.business_id);
      }
      console.log('✅ Customer balances updated');
    }
    
    // 7. Verify data
    console.log('7. Verifying data...');
    const { data: products1 } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', 'santhosh1');
    
    const { data: products2 } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', 'vasan');
    
    const { data: customers1 } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', 'santhosh1');
    
    const { data: customers2 } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', 'vasan');
    
    const { data: businessInfo } = await supabase
      .from('business_info')
      .select('*');
    
    console.log('📊 Data Summary:');
    console.log(`Products for santhosh1: ${products1?.length || 0}`);
    console.log(`Products for vasan: ${products2?.length || 0}`);
    console.log(`Customers for santhosh1: ${customers1?.length || 0}`);
    console.log(`Customers for vasan: ${customers2?.length || 0}`);
    console.log(`Business info records: ${businessInfo?.length || 0}`);
    
    console.log('✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupDatabase();
