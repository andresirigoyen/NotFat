// Script para testing de Edge Functions
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunction(functionName, payload) {
  console.log(`\n🧪 Testing ${functionName}...`);
  
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    if (error) {
      console.error(`❌ ${functionName} failed:`, error);
      return { success: false, error };
    }

    console.log(`✅ ${functionName} success:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ ${functionName} error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Edge Functions Testing...\n');

  // Test 1: Query Product Function
  console.log('📦 Testing Query Product Function...');
  const testBarcode = '7622300411233'; // Common barcode
  await testEdgeFunction('query-product', { barcode: testBarcode });

  // Test 2: Calculate Health Score Function
  console.log('\n🏥 Testing Health Score Function...');
  const testNutritionData = {
    totalCalories: 2000,
    totalProtein: 80,
    totalCarbs: 250,
    totalFat: 65,
    totalFiber: 25,
    totalSugar: 40,
    totalSodium: 2000,
    mealCount: 3,
  };
  
  // Get a test user ID (you'll need to replace this with a real user ID)
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  if (users && users.length > 0) {
    const testUserId = users[0].id;
    await testEdgeFunction('calculate-health-score', {
      nutritionData: testNutritionData,
      userId: testUserId,
      date: new Date().toISOString().split('T')[0],
    });
  } else {
    console.log('⚠️  No users found for health score test');
  }

  // Test 3: Process Voice Input Function
  console.log('\n🎤 Testing Voice Input Function...');
  const testTaskId = 'test-task-id-' + Date.now();
  await testEdgeFunction('process-voice-input', {
    taskId: testTaskId,
  });

  console.log('\n🎉 Edge Functions Testing Complete!');
  console.log('\n📋 Summary:');
  console.log('- Query Product: Tests barcode lookup from Open Food Facts');
  console.log('- Health Score: Tests scientific nutrition analysis');
  console.log('- Voice Input: Tests audio processing pipeline');
  console.log('\n💡 Next Steps:');
  console.log('1. Deploy functions to Supabase');
  console.log('2. Test with real mobile app');
  console.log('3. Monitor function logs and performance');
}

// Check if functions exist
async function checkFunctionsExist() {
  console.log('🔍 Checking if Edge Functions exist...\n');
  
  const functions = [
    'query-product',
    'calculate-health-score', 
    'process-voice-input'
  ];

  for (const funcName of functions) {
    try {
      // Try to call the function with minimal payload to check if it exists
      const { data, error } = await supabase.functions.invoke(funcName, {
        body: { test: true },
      });

      if (error && error.message?.includes('Function not found')) {
        console.log(`❌ ${funcName}: Function not found - needs deployment`);
      } else if (error) {
        console.log(`⚠️  ${funcName}: Function exists but has error - ${error.message}`);
      } else {
        console.log(`✅ ${funcName}: Function exists and accessible`);
      }
    } catch (error) {
      console.log(`❌ ${funcName}: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  await checkFunctionsExist();
  await runTests();
}

main().catch(console.error);
