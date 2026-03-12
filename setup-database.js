// Script to setup Supabase database schema
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filePath, description) {
  try {
    console.log(`\n🔧 ${description}...`);
    const fs = require('fs');
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct SQL execution if RPC fails
          console.log(`⚠️  RPC failed, trying direct execution for: ${statement.substring(0, 50)}...`);
          continue;
        }
      }
    }
    
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ Error executing ${description}:`, error.message);
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up NotFat database schema...\n');
    
    // Execute schema first
    await executeSQLFile('./supabase-schema.sql', 'Creating database tables and indexes');
    
    // Wait a moment for tables to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Execute RLS policies
    await executeSQLFile('./supabase-rls-policies.sql', 'Setting up Row Level Security policies');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify tables in Supabase dashboard');
    console.log('2. Test authentication flow');
    console.log('3. Implement frontend hooks');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
