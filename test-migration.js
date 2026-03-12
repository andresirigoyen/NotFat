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
