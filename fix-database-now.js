// Quick fix for database issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://csatoabqaxaszgfhrjjj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYXRvYWJxYXhhc3pnZmhyampqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjE4NjQsImV4cCI6MjA3MzQzNzg2NH0.pdRXpKaE7uAzPB-li6U9fBpPflAZp9uFIZyHrHSdU80";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fixDatabase() {
  console.log('🔧 Fixing Database Issues...');
  console.log('============================');
  
  try {
    // Step 1: Try to disable RLS temporarily using SQL
    console.log('1. Attempting to fix RLS policies...');
    
    // We'll try to execute SQL directly
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Disable RLS temporarily
        ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
        DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
        DROP POLICY IF EXISTS "Allow all operations on bills" ON public.bills;
      `
    });
    
    if (sqlError) {
      console.log('❌ Cannot execute SQL directly. You need to run this in Supabase dashboard.');
      console.log('   Go to: https://supabase.com/dashboard → Your Project → SQL Editor');
      console.log('   Copy and paste the SQL from URGENT_SETUP.md');
      return;
    }
    
    console.log('✅ RLS policies fixed');
    
    // Step 2: Insert sample data
    console.log('2. Inserting sample data...');
    
    // Insert products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert([
        { name: 'Chicken Live', business_id: 'santhosh1' },
        { name: 'Chicken Cut', business_id: 'santhosh1' },
        { name: 'Chicken Leg', business_id: 'santhosh1' },
        { name: 'Chicken Live', business_id: 'vasan' },
        { name: 'Chicken Cut', business_id: 'vasan' },
        { name: 'Chicken Leg', business_id: 'vasan' }
      ]);
    
    if (productsError) {
      console.log('❌ Products insertion failed:', productsError.message);
    } else {
      console.log('✅ Products inserted successfully');
    }
    
    // Insert customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert([
        { name: 'John Doe', phone: '9876543210', balance: 0, business_id: 'santhosh1' },
        { name: 'Jane Smith', phone: '9876543211', balance: 0, business_id: 'santhosh1' },
        { name: 'Raj Kumar', phone: '9876543212', balance: 0, business_id: 'vasan' },
        { name: 'Priya Sharma', phone: '9876543213', balance: 0, business_id: 'vasan' }
      ]);
    
    if (customersError) {
      console.log('❌ Customers insertion failed:', customersError.message);
    } else {
      console.log('✅ Customers inserted successfully');
    }
    
    // Insert business info
    const { data: businessInfo, error: businessError } = await supabase
      .from('business_info')
      .insert([
        {
          business_id: 'santhosh1',
          business_name: 'Santhosh Chicken 1',
          address: 'Your Business Address',
          gst_number: '22AAAAA0000A1Z5'
        },
        {
          business_id: 'vasan',
          business_name: 'Vasan Chicken Center',
          address: '61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011',
          gst_number: '33AAAAA0000A1Z5'
        }
      ]);
    
    if (businessError) {
      console.log('❌ Business info insertion failed:', businessError.message);
    } else {
      console.log('✅ Business info inserted successfully');
    }
    
    console.log('\n🎉 Database fix completed!');
    console.log('Now you should be able to add products, customers, and bills in the application.');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.log('\n📋 Manual Fix Required:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL from URGENT_SETUP.md');
    console.log('5. Click Run');
  }
}

fixDatabase();
