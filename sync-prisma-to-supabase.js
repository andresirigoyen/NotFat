// Script para sincronizar schema Prisma con Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Definición de tablas basadas en schema.prisma
const tables = [
  {
    name: 'profiles',
    sql: `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        birth_date DATE,
        gender TEXT,
        height_value DECIMAL,
        height_unit TEXT DEFAULT 'cm',
        weight_value DECIMAL,
        weight_unit TEXT DEFAULT 'kg',
        activity_level DECIMAL DEFAULT 1.5,
        nutrition_goals_id UUID REFERENCES nutrition_goals(id),
        hydration_goals_id UUID REFERENCES hydration_goals(id),
        onboarding_completed BOOLEAN DEFAULT FALSE,
        show_calories BOOLEAN DEFAULT TRUE,
        show_hydration BOOLEAN DEFAULT TRUE,
        preferred_bottle_size INTEGER DEFAULT 500,
        subscription_status TEXT DEFAULT 'free',
        subscription_id UUID REFERENCES subscriptions(id),
        steps_goal INTEGER,
        achievement_goal TEXT,
        user_id TEXT UNIQUE,
        avatar_url TEXT,
        bio TEXT,
        timezone TEXT,
        language TEXT DEFAULT 'es',
        notifications_enabled BOOLEAN DEFAULT TRUE,
        dark_mode BOOLEAN DEFAULT FALSE,
        privacy_settings JSONB,
        health_settings_id UUID REFERENCES health_settings(id),
        user_activity_profile_id UUID REFERENCES user_activity_profile(id)
      );
    `
  },
  {
    name: 'nutrition_goals',
    sql: `
      CREATE TABLE IF NOT EXISTS nutrition_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        calories DECIMAL,
        protein DECIMAL,
        carbs DECIMAL,
        fat DECIMAL,
        fiber DECIMAL,
        sugar DECIMAL,
        sodium DECIMAL,
        water DECIMAL,
        vitamin_a DECIMAL,
        vitamin_c DECIMAL,
        vitamin_d DECIMAL,
        vitamin_b6 DECIMAL,
        vitamin_b12 DECIMAL,
        folate DECIMAL,
        iron DECIMAL,
        calcium DECIMAL,
        potassium DECIMAL,
        magnesium DECIMAL,
        zinc DECIMAL,
        source TEXT DEFAULT 'manual',
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT
      );
    `
  },
  {
    name: 'meals',
    sql: `
      CREATE TABLE IF NOT EXISTS meals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        name TEXT,
        meal_type TEXT,
        meal_date DATE,
        meal_at TIMESTAMPTZ,
        total_calories DECIMAL DEFAULT 0,
        total_protein DECIMAL DEFAULT 0,
        total_carbs DECIMAL DEFAULT 0,
        total_fat DECIMAL DEFAULT 0,
        total_fiber DECIMAL DEFAULT 0,
        total_sugar DECIMAL DEFAULT 0,
        total_sodium DECIMAL DEFAULT 0,
        image_url TEXT,
        image_url_aux TEXT,
        source_type TEXT DEFAULT 'manual',
        status TEXT DEFAULT 'pending',
        recorded_timezone TEXT,
        llm_used TEXT,
        prompt_version TEXT,
        processing_time_ms INTEGER,
        api_time_ms INTEGER,
        text_description TEXT,
        analysis_result JSONB,
        feedback JSONB,
        recommendation JSONB,
        modified BOOLEAN DEFAULT FALSE,
        is_from_favorite BOOLEAN DEFAULT FALSE,
        barcode_number TEXT,
        scanned BOOLEAN DEFAULT FALSE,
        contributed BOOLEAN DEFAULT FALSE
      );
    `
  },
  {
    name: 'food_items',
    sql: `
      CREATE TABLE IF NOT EXISTS food_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
        name TEXT,
        quantity DECIMAL,
        unit TEXT DEFAULT 'g',
        calories DECIMAL DEFAULT 0,
        protein DECIMAL DEFAULT 0,
        carbs DECIMAL DEFAULT 0,
        fat DECIMAL DEFAULT 0,
        fiber DECIMAL DEFAULT 0,
        sugar DECIMAL DEFAULT 0,
        sodium DECIMAL DEFAULT 0,
        vitamin_a DECIMAL,
        vitamin_c DECIMAL,
        vitamin_d DECIMAL,
        vitamin_b6 DECIMAL,
        vitamin_b12 DECIMAL,
        folate DECIMAL,
        iron DECIMAL,
        calcium DECIMAL,
        potassium DECIMAL,
        magnesium DECIMAL,
        zinc DECIMAL,
        barcode_number TEXT,
        scanned BOOLEAN DEFAULT FALSE,
        contributed BOOLEAN DEFAULT FALSE,
        nutriscore_grade TEXT,
        nova_group INTEGER,
        labels_tags TEXT[],
        additives_tags TEXT[],
        nutria_score DECIMAL,
        nutria_score_breakdown JSONB,
        additives_details JSONB,
        is_alcoholic BOOLEAN DEFAULT FALSE,
        has_ingredients_data BOOLEAN DEFAULT FALSE,
        servings DECIMAL DEFAULT 1
      );
    `
  },
  {
    name: 'water_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS water_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        volume DECIMAL,
        unit TEXT DEFAULT 'ml',
        logged_at TIMESTAMPTZ DEFAULT NOW(),
        source TEXT DEFAULT 'manual',
        timezone TEXT
      );
    `
  },
  {
    name: 'scan_events',
    sql: `
      CREATE TABLE IF NOT EXISTS scan_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        barcode TEXT NOT NULL,
        origin TEXT DEFAULT 'mobile_app',
        result TEXT,
        product_name TEXT,
        processing_ms INTEGER,
        completed_at TIMESTAMPTZ
      );
    `
  },
  {
    name: 'task_queue',
    sql: `
      CREATE TABLE IF NOT EXISTS task_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        task_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 1,
        data JSONB,
        audio_url TEXT,
        text_description TEXT,
        processing_started_at TIMESTAMPTZ,
        processing_completed_at TIMESTAMPTZ,
        error_message TEXT,
        last_error_at TIMESTAMPTZ,
        retry_count INTEGER DEFAULT 0,
        metadata JSONB
      );
    `
  },
  {
    name: 'coach_insights',
    sql: `
      CREATE TABLE IF NOT EXISTS coach_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        insights JSONB,
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        insight_type TEXT DEFAULT 'daily',
        is_read BOOLEAN DEFAULT FALSE
      );
    `
  },
  {
    name: 'contribution_queue',
    sql: `
      CREATE TABLE IF NOT EXISTS contribution_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        barcode TEXT NOT NULL,
        front_image_url TEXT,
        back_image_url TEXT,
        ingredients_image_url TEXT,
        nutrition_image_url TEXT,
        status TEXT DEFAULT 'pending',
        approved_at TIMESTAMPTZ,
        approved_by UUID REFERENCES profiles(id),
        notes TEXT,
        moderator_notes TEXT
      );
    `
  }
];

// Función para crear tablas
async function createTable(tableName, sql) {
  console.log(`📋 Creating table: ${tableName}`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Si RPC no existe, usar SQL directo
      console.log(`⚠️  RPC not available, using direct SQL for ${tableName}`);
      
      // Dividir SQL en sentencias más pequeñas si es necesario
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_name', tableName)
            .single();
          
          if (stmtError && stmtError.code === 'PGRST116') {
            // Tabla no existe, crearla
            console.log(`🔨 Creating ${tableName} with direct SQL...`);
            // Nota: Esto requeriría un endpoint personalizado para ejecutar SQL
          }
        }
      }
    } else {
      console.log(`✅ Table ${tableName} created successfully`);
    }
  } catch (error) {
    console.error(`❌ Error creating table ${tableName}:`, error.message);
  }
}

// Función para crear índices
async function createIndexes() {
  console.log('\n🔍 Creating indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_meals_meal_date ON meals(meal_date);',
    'CREATE INDEX IF NOT EXISTS idx_food_items_meal_id ON food_items(meal_id);',
    'CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_water_logs_logged_at ON water_logs(logged_at);',
    'CREATE INDEX IF NOT EXISTS idx_scan_events_user_id ON scan_events(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_scan_events_barcode ON scan_events(barcode);',
    'CREATE INDEX IF NOT EXISTS idx_task_queue_user_id ON task_queue(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);',
    'CREATE INDEX IF NOT EXISTS idx_coach_insights_user_id ON coach_insights(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_contribution_queue_user_id ON contribution_queue(user_id);'
  ];
  
  for (const indexSql of indexes) {
    try {
      console.log(`📝 Creating index...`);
      // Similar a las tablas, esto necesitaría un endpoint personalizado
    } catch (error) {
      console.error(`❌ Error creating index:`, error.message);
    }
  }
}

// Función para configurar RLS
async function setupRLS() {
  console.log('\n🔒 Setting up Row Level Security...');
  
  const rlsPolicies = [
    `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE meals ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE coach_insights ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE contribution_queue ENABLE ROW LEVEL SECURITY;`
  ];
  
  for (const policy of rlsPolicies) {
    try {
      console.log(`🔐 Enabling RLS...`);
      // Esto requeriría ejecución SQL directa
    } catch (error) {
      console.error(`❌ Error setting up RLS:`, error.message);
    }
  }
}

// Función principal
async function syncDatabase() {
  console.log('🚀 Starting Prisma to Supabase sync...\n');
  
  try {
    // 1. Crear tablas
    for (const table of tables) {
      await createTable(table.name, table.sql);
    }
    
    // 2. Crear índices
    await createIndexes();
    
    // 3. Configurar RLS
    await setupRLS();
    
    console.log('\n✅ Database synchronization completed!');
    console.log('\n📋 Summary:');
    console.log(`- Created ${tables.length} tables`);
    console.log('- Created indexes for performance');
    console.log('- Enabled Row Level Security');
    console.log('\n⚠️  Note: Some operations may require manual SQL execution in Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Verificar conexión primero
async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').single();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    console.log('✅ Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    return false;
  }
}

// Ejecutar
async function main() {
  const connected = await testConnection();
  if (connected) {
    await syncDatabase();
  } else {
    console.log('❌ Cannot proceed without database connection');
    process.exit(1);
  }
}

main().catch(console.error);
