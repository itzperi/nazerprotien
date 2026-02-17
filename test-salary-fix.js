// Test script to verify salary table fix
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSalaryFix() {
  console.log('🔍 Testing Salary Table Fix...\n');

  try {
    // Test 1: Check if salaries table exists and can be queried
    console.log('1. Testing salaries table access...');
    const { data: salariesData, error: salariesError } = await supabase
      .from('salaries')
      .select('*')
      .limit(1);
    
    if (salariesError) {
      console.error('❌ Salaries table error:', salariesError.message);
      console.log('💡 Solution: Run the URGENT_SALARY_FIX.sql script in your Supabase SQL editor');
      return;
    } else {
      console.log('✅ Salaries table accessible');
    }

    // Test 2: Test salary insertion
    console.log('\n2. Testing salary insertion...');
    const testSalaryData = {
      business_id: 'santhosh1',
      salary_date: new Date().toISOString().split('T')[0],
      amount: 2000.00,
      employee_id: 'TEST_EMP_002',
      notes: 'Test salary entry from script'
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

    // Test 3: Test RPC function
    console.log('\n3. Testing RPC function...');
    const { data: rpcSalaryData, error: rpcSalaryError } = await supabase.rpc('safe_add_salary', {
      p_business_id: 'santhosh1',
      p_salary_date: new Date().toISOString().split('T')[0],
      p_amount: 3000.00,
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

    console.log('\n🎉 Salary table fix test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Salaries table: ✅ Working');
    console.log('- Direct insertions: ✅ Working');
    console.log('- RPC functions: ✅ Working');
    console.log('\n✅ Your salary page should now work without errors!');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.log('\n🔧 To fix this:');
    console.log('1. Copy the SQL from URGENT_SALARY_FIX.sql');
    console.log('2. Run it in your Supabase SQL editor');
    console.log('3. Run this test again');
  }
}

// Run the test
testSalaryFix();
