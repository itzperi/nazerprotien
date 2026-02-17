// Quick test to check current database state
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://csatoabqaxaszgfhrjjj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYXRvYWJxYXhhc3pnZmhyampqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjE4NjQsImV4cCI6MjA3MzQzNzg2NH0.pdRXpKaE7uAzPB-li6U9fBpPflAZp9uFIZyHrHSdU80";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function quickTest() {
  console.log('🔍 Quick Database Test');
  console.log('====================');
  
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful');
    
    // Test 2: Check existing tables
    console.log('\n2. Checking existing data...');
    
    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.log('❌ Products table error:', productsError.message);
    } else {
      console.log(`📦 Products: ${products?.length || 0} records`);
      if (products && products.length > 0) {
        const byBusiness = products.reduce((acc, p) => {
          acc[p.business_id] = (acc[p.business_id] || 0) + 1;
          return acc;
        }, {});
        console.log('   By business:', byBusiness);
      }
    }
    
    // Check customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.log('❌ Customers table error:', customersError.message);
    } else {
      console.log(`👥 Customers: ${customers?.length || 0} records`);
      if (customers && customers.length > 0) {
        const byBusiness = customers.reduce((acc, c) => {
          acc[c.business_id] = (acc[c.business_id] || 0) + 1;
          return acc;
        }, {});
        console.log('   By business:', byBusiness);
      }
    }
    
    // Check bills
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*');
    
    if (billsError) {
      console.log('❌ Bills table error:', billsError.message);
    } else {
      console.log(`🧾 Bills: ${bills?.length || 0} records`);
      if (bills && bills.length > 0) {
        const byBusiness = bills.reduce((acc, b) => {
          acc[b.business_id] = (acc[b.business_id] || 0) + 1;
          return acc;
        }, {});
        console.log('   By business:', byBusiness);
      }
    }
    
    // Check business_info
    const { data: businessInfo, error: businessInfoError } = await supabase
      .from('business_info')
      .select('*');
    
    if (businessInfoError) {
      console.log('❌ Business info table error:', businessInfoError.message);
    } else {
      console.log(`🏢 Business info: ${businessInfo?.length || 0} records`);
      if (businessInfo && businessInfo.length > 0) {
        businessInfo.forEach(bi => {
          console.log(`   - ${bi.business_id}: ${bi.business_name}`);
        });
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`Products: ${products?.length || 0}`);
    console.log(`Customers: ${customers?.length || 0}`);
    console.log(`Bills: ${bills?.length || 0}`);
    console.log(`Business Info: ${businessInfo?.length || 0}`);
    
    if ((products?.length || 0) === 0 && (customers?.length || 0) === 0) {
      console.log('\n⚠️  No data found! Please follow MANUAL_DATABASE_SETUP.md');
    } else {
      console.log('\n✅ Data found! Application should work.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickTest();
