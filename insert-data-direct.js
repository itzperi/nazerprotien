// Direct data insertion script that bypasses RLS issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://csatoabqaxaszgfhrjjj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYXRvYWJxYXhhc3pnZmhyampqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjE4NjQsImV4cCI6MjA3MzQzNzg2NH0.pdRXpKaE7uAzPB-li6U9fBpPflAZp9uFIZyHrHSdU80";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function insertDataDirect() {
  console.log('🚀 Direct Data Insertion');
  console.log('========================');
  
  try {
    // First, let's try to insert data one by one to see which tables work
    
    console.log('1. Testing products insertion...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .insert([
        { name: 'Chicken Live', business_id: 'santhosh1' },
        { name: 'Chicken Cut', business_id: 'santhosh1' }
      ])
      .select();
    
    if (productsError) {
      console.log('❌ Products insertion failed:', productsError.message);
      console.log('   This is likely due to RLS policies. Please run the SQL script in Supabase dashboard.');
    } else {
      console.log('✅ Products inserted successfully:', productsData?.length || 0);
    }
    
    console.log('\n2. Testing customers insertion...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .insert([
        { name: 'Test Customer', phone: '9999999999', balance: 0, business_id: 'santhosh1' }
      ])
      .select();
    
    if (customersError) {
      console.log('❌ Customers insertion failed:', customersError.message);
      console.log('   This is likely due to RLS policies. Please run the SQL script in Supabase dashboard.');
    } else {
      console.log('✅ Customers inserted successfully:', customersData?.length || 0);
    }
    
    console.log('\n3. Testing business_info insertion...');
    const { data: businessData, error: businessError } = await supabase
      .from('business_info')
      .insert([
        {
          business_id: 'test_business',
          business_name: 'Test Business',
          address: 'Test Address',
          gst_number: 'TEST12345678901'
        }
      ])
      .select();
    
    if (businessError) {
      console.log('❌ Business info insertion failed:', businessError.message);
      console.log('   The business_info table might not exist. Please run the SQL script in Supabase dashboard.');
    } else {
      console.log('✅ Business info inserted successfully:', businessData?.length || 0);
    }
    
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('If you see any ❌ errors above, it means:');
    console.log('1. RLS policies are blocking data insertion');
    console.log('2. Some tables might not exist');
    console.log('3. You need to run the SQL script in Supabase dashboard');
    console.log('\nPlease follow the instructions in URGENT_SETUP.md');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

insertDataDirect();
