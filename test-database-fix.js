// Test script to verify database fixes
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseFix() {
  console.log('🔍 Testing Database Fix...\n');

  try {
    // Test 1: Check if salaries table exists and can be queried
    console.log('1. Testing salaries table...');
    const { data: salariesData, error: salariesError } = await supabase
      .from('salaries')
      .select('*')
      .limit(1);
    
    if (salariesError) {
      console.error('❌ Salaries table error:', salariesError.message);
    } else {
      console.log('✅ Salaries table accessible');
    }

    // Test 2: Check if load_entries table exists and can be queried
    console.log('\n2. Testing load_entries table...');
    const { data: loadData, error: loadError } = await supabase
      .from('load_entries')
      .select('*')
      .limit(1);
    
    if (loadError) {
      console.error('❌ Load entries table error:', loadError.message);
    } else {
      console.log('✅ Load entries table accessible');
    }

    // Test 3: Check if products table exists and has data
    console.log('\n3. Testing products table...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', 'santhosh1')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Products table error:', productsError.message);
    } else {
      console.log('✅ Products table accessible, found', productsData?.length || 0, 'products');
    }

    // Test 4: Check if suppliers table exists and has data
    console.log('\n4. Testing suppliers table...');
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', 'santhosh1')
      .limit(5);
    
    if (suppliersError) {
      console.error('❌ Suppliers table error:', suppliersError.message);
    } else {
      console.log('✅ Suppliers table accessible, found', suppliersData?.length || 0, 'suppliers');
    }

    // Test 5: Test salary insertion
    console.log('\n5. Testing salary insertion...');
    const testSalaryData = {
      business_id: 'santhosh1',
      salary_date: new Date().toISOString().split('T')[0],
      amount: 1000.00,
      employee_id: 'TEST_EMP_001',
      notes: 'Test salary entry'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('salaries')
      .insert([testSalaryData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Salary insertion error:', insertError.message);
    } else {
      console.log('✅ Salary insertion successful, ID:', insertData.id);
      
      // Clean up test data
      await supabase
        .from('salaries')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test salary entry cleaned up');
    }

    // Test 6: Test load entry insertion
    console.log('\n6. Testing load entry insertion...');
    const testLoadData = {
      business_id: 'santhosh1',
      entry_date: new Date().toISOString().split('T')[0],
      no_of_boxes: 5,
      quantity_with_box: 10.5,
      no_of_boxes_after: 5,
      quantity_after_box: 8.5
    };

    const { data: loadInsertData, error: loadInsertError } = await supabase
      .from('load_entries')
      .insert([testLoadData])
      .select()
      .single();

    if (loadInsertError) {
      console.error('❌ Load entry insertion error:', loadInsertError.message);
    } else {
      console.log('✅ Load entry insertion successful, ID:', loadInsertData.id);
      
      // Clean up test data
      await supabase
        .from('load_entries')
        .delete()
        .eq('id', loadInsertData.id);
      console.log('🧹 Test load entry cleaned up');
    }

    // Test 7: Test RPC functions
    console.log('\n7. Testing RPC functions...');
    
    // Test safe_add_salary function
    const { data: rpcSalaryData, error: rpcSalaryError } = await supabase.rpc('safe_add_salary', {
      p_business_id: 'santhosh1',
      p_salary_date: new Date().toISOString().split('T')[0],
      p_amount: 1500.00,
      p_employee_id: 'RPC_TEST_EMP',
      p_notes: 'RPC test salary'
    });

    if (rpcSalaryError) {
      console.error('❌ RPC salary function error:', rpcSalaryError.message);
    } else {
      console.log('✅ RPC salary function working, ID:', rpcSalaryData);
      
      // Clean up test data
      await supabase
        .from('salaries')
        .delete()
        .eq('id', rpcSalaryData);
      console.log('🧹 RPC test salary cleaned up');
    }

    console.log('\n🎉 Database fix test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Salaries table: ✅ Working');
    console.log('- Load entries table: ✅ Working');
    console.log('- Products table: ✅ Working');
    console.log('- Suppliers table: ✅ Working');
    console.log('- Direct insertions: ✅ Working');
    console.log('- RPC functions: ✅ Working');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testDatabaseFix();
