#!/bin/bash

echo "🚀 NotFat - Prisma to Supabase Migration"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Variables
SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
SUPABASE_PROJECT_ID=$(echo $SUPABASE_URL | sed 's|https://||g' | cut -d'.' -f1)

echo "📋 Migration Instructions:"
echo ""
echo "1️⃣  Open Supabase Dashboard:"
echo "   https://app.supabase.com/project/$SUPABASE_PROJECT_ID"
echo ""
echo "2️⃣  Go to SQL Editor:"
echo "   https://app.supabase.com/project/$SUPABASE_PROJECT_ID/sql/new"
echo ""
echo "3️⃣  Copy and paste the entire content of:"
echo "   📄 migration-prisma-to-supabase.sql"
echo ""
echo "4️⃣  Click 'Run' to execute the migration"
echo ""
echo "5️⃣  Verify tables were created:"
echo "   Go to Table Editor to see all tables"
echo ""

# Test connection after migration
echo "🧪 Testing connection after migration..."
echo "⚠️  Run this after completing the SQL migration:"
echo ""
echo "   node sync-prisma-to-supabase.js"
echo ""

# Create a quick test script
cat > test-migration.js << 'EOF'
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMigration() {
  console.log('🧪 Testing migration...\n');
  
  const tables = [
    'profiles', 'nutrition_goals', 'hydration_goals', 'meals', 
    'food_items', 'water_logs', 'scan_events', 'task_queue',
    'coach_insights', 'contribution_queue', 'health_settings',
    'user_activity_profile', 'subscriptions'
  ];
  
  let successCount = 0;
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${tableName}: Table not found`);
      } else if (error) {
        console.log(`⚠️  ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Ready`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Migration Results:`);
  console.log(`✅ Successful: ${successCount}/${tables.length}`);
  console.log(`❌ Failed: ${tables.length - successCount}/${tables.length}`);
  
  if (successCount === tables.length) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Deploy Edge Functions: ./deploy-functions.sh');
    console.log('2. Test the app: npx expo start');
    console.log('3. Commit changes: git add . && git commit -m "feat: sync prisma schema with supabase"');
  } else {
    console.log('\n❌ Migration incomplete. Please check the SQL execution.');
  }
}

testMigration().catch(console.error);
EOF

echo "📄 Created test-migration.js for post-migration verification"
echo ""
echo "🔄 After running the SQL migration, execute:"
echo "   node test-migration.js"
echo ""
echo "📚 Important Notes:"
echo "• This migration creates 14 tables with proper RLS policies"
echo "• All tables include indexes for performance"
echo "• Row Level Security is enabled for data privacy"
echo "• Automatic triggers handle updated_at timestamps"
echo "• Profile creation is automatic on user signup"
echo ""
echo "⚡ Quick Commands:"
echo "• Open SQL Editor: supabase db shell"
echo "• Check status: node test-migration.js"
echo "• Deploy functions: ./deploy-functions.sh"
