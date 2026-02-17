// Test to verify if database fix worked
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://csatoabqaxaszgfhrjjj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYXRvYWJxYXhhc3pnZmhyampqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjE4NjQsImV4cCI6MjA3MzQzNzg2NH0.pdRXpKaE7uAzPB-li6U9fBpPflAZp9uFIZyHrHSdU80";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testAfterFix() {
  console.log('🧪 Testing After Database Fix');
  console.log('==============================');
  
  try {
    // Test 1: Check if we can read data
    console.log('1. Testing data reading...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.log('❌ Cannot read products:', productsError.message);
    } else {
      console.log(`✅ Products: ${products?.length || 0} records`);
    }
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.log('❌ Cannot read customers:', customersError.message);
    } else {
      console.log(`✅ Customers: ${customers?.length || 0} records`);
    }
    
    const { data: businessInfo, error: businessError } = await supabase
      .from('business_info')
      .select('*');
    
    if (businessError) {
      console.log('❌ Cannot read business info:', businessError.message);
    } else {
      console.log(`✅ Business Info: ${businessInfo?.length || 0} records`);
    }
    
    // Test 2: Try to insert a test record
    console.log('\n2. Testing data insertion...');
    
    const { data: testProduct, error: testError } = await supabase
      .from('products')
      .insert([
        { name: 'Test Product', business_id: 'test' }
      ])
      .select();
    
    if (testError) {
      console.log('❌ Cannot insert products:', testError.message);
      console.log('   You still need to run the SQL script in Supabase dashboard');
    } else {
      console.log('✅ Can insert products! Database is working.');
      
      // Clean up test data
      await supabase
        .from('products')
        .delete()
        .eq('name', 'Test Product')
        .eq('business_id', 'test');
    }
    
    // Test 3: Summary
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`Products: ${products?.length || 0}`);
    console.log(`Customers: ${customers?.length || 0}`);
    console.log(`Business Info: ${businessInfo?.length || 0}`);
    
    if ((products?.length || 0) > 0 && (customers?.length || 0) > 0) {
      console.log('\n🎉 SUCCESS! Database is working correctly.');
      console.log('You can now add products, customers, and bills in the application.');
    } else {
      console.log('\n⚠️  Database still needs setup.');
      console.log('Please follow the instructions in EMERGENCY_FIX.md');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAfterFix();
