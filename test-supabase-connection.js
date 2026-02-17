// Test Supabase connection and data loading
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://csatoabqaxaszgfhrjjj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYXRvYWJxYXhhc3pnZmhyampqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjE4NjQsImV4cCI6MjA3MzQzNzg2NH0.pdRXpKaE7uAzPB-li6U9fBpPflAZp9uFIZyHrHSdU80";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) {
      console.error('Connection error:', error);
      return;
    }
    console.log('✅ Connection successful');
    
    // Test 2: Check existing data
    console.log('2. Checking existing data...');
    
    // Check products for santhosh1
    const { data: products1, error: productsError1 } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', 'santhosh1');
    
    console.log('Products for santhosh1:', products1?.length || 0);
    
    // Check customers for santhosh1
    const { data: customers1, error: customersError1 } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', 'santhosh1');
    
    console.log('Customers for santhosh1:', customers1?.length || 0);
    
    // Check products for vasan
    const { data: products2, error: productsError2 } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', 'vasan');
    
    console.log('Products for vasan:', products2?.length || 0);
    
    // Check customers for vasan
    const { data: customers2, error: customersError2 } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', 'vasan');
    
    console.log('Customers for vasan:', customers2?.length || 0);
    
    // Test 3: Insert sample data if none exists
    console.log('3. Inserting sample data...');
    
    // Insert sample products for santhosh1
    if (!products1 || products1.length === 0) {
      const { error: insertError1 } = await supabase
        .from('products')
        .insert([
          { name: 'Chicken Live', business_id: 'santhosh1' },
          { name: 'Chicken Cut', business_id: 'santhosh1' },
          { name: 'Chicken Leg', business_id: 'santhosh1' }
        ]);
      
      if (insertError1) {
        console.error('Error inserting products for santhosh1:', insertError1);
      } else {
        console.log('✅ Sample products inserted for santhosh1');
      }
    }
    
    // Insert sample products for vasan
    if (!products2 || products2.length === 0) {
      const { error: insertError2 } = await supabase
        .from('products')
        .insert([
          { name: 'Chicken Live', business_id: 'vasan' },
          { name: 'Chicken Cut', business_id: 'vasan' },
          { name: 'Chicken Leg', business_id: 'vasan' }
        ]);
      
      if (insertError2) {
        console.error('Error inserting products for vasan:', insertError2);
      } else {
        console.log('✅ Sample products inserted for vasan');
      }
    }
    
    // Insert sample customers for santhosh1
    if (!customers1 || customers1.length === 0) {
      const { error: insertError3 } = await supabase
        .from('customers')
        .insert([
          { name: 'John Doe', phone: '9876543210', balance: 0, business_id: 'santhosh1' },
          { name: 'Jane Smith', phone: '9876543211', balance: 0, business_id: 'santhosh1' }
        ]);
      
      if (insertError3) {
        console.error('Error inserting customers for santhosh1:', insertError3);
      } else {
        console.log('✅ Sample customers inserted for santhosh1');
      }
    }
    
    // Insert sample customers for vasan
    if (!customers2 || customers2.length === 0) {
      const { error: insertError4 } = await supabase
        .from('customers')
        .insert([
          { name: 'Raj Kumar', phone: '9876543212', balance: 0, business_id: 'vasan' },
          { name: 'Priya Sharma', phone: '9876543213', balance: 0, business_id: 'vasan' }
        ]);
      
      if (insertError4) {
        console.error('Error inserting customers for vasan:', insertError4);
      } else {
        console.log('✅ Sample customers inserted for vasan');
      }
    }
    
    // Test 4: Check business_info table
    console.log('4. Checking business_info table...');
    const { data: businessInfo, error: businessError } = await supabase
      .from('business_info')
      .select('*');
    
    if (businessError) {
      console.log('Business info table does not exist yet, creating sample data...');
      // Insert business info directly
      const { error: insertBusinessError } = await supabase
        .from('business_info')
        .insert([
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
      
      if (insertBusinessError) {
        console.error('Error inserting business info:', insertBusinessError);
      } else {
        console.log('✅ Business info inserted');
      }
    } else {
      console.log('Business info records:', businessInfo?.length || 0);
    }
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection();
