import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://csatoabqaxaszgfhrjjj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYXRvYWJxYXhhc3pnZmhyampqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjE4NjQsImV4cCI6MjA3MzQzNzg2NH0.pdRXpKaE7uAzPB-li6U9fBpPflAZp9uFIZyHrHSdU80";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runNazeerSetup() {
  console.log('🚀 Setting up Nazeer Shop Login...');
  
  try {
    const sqlPath = path.join(__dirname, 'CREATE_NAZEER_SHOP_LOGIN.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('1. Attempting to execute SQL via RPC...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      console.log('\nAlternative: Please copy the content of CREATE_NAZEER_SHOP_LOGIN.sql');
      console.log('and run it manually in the Supabase SQL Editor.');
      return;
    }
    
    console.log('✅ SQL executed successfully!');
    
    console.log('2. Verifying login credentials...');
    const { data: loginData, error: loginError } = await supabase
      .from('shops_logins')
      .select('*')
      .eq('username', 'Nazeer')
      .single();
      
    if (loginError) {
      console.error('❌ Could not find the new login:', loginError.message);
    } else {
      console.log('✅ Login verified:', loginData.username);
    }
    
    console.log('\n🎉 Setup complete for Nazeer!');
    
  } catch (err) {
    console.error('💥 An unexpected error occurred:', err);
  }
}

runNazeerSetup();
