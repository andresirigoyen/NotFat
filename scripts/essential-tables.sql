-- Crear tablas esenciales para NotFat

-- Tabla profiles (ya debería existir)
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "gender" TEXT,
    "date_of_birth" TEXT,
    "height" DECIMAL,
    "height_unit" TEXT,
    "weight" DECIMAL,
    "weight_unit" TEXT,
    "target_weight" DECIMAL,
    "activity_level" DECIMAL,
    "goal" TEXT,
    
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- Tabla meals
CREATE TABLE IF NOT EXISTS "meals" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "meal_type" TEXT NOT NULL,
    "source_type" TEXT,
    "status" TEXT,
    "llm_model" TEXT,
    "image_url" TEXT,
    "text_input" TEXT,
    "notes" TEXT,
    "total_calories" DECIMAL DEFAULT 0,
    "total_protein" DECIMAL DEFAULT 0,
    "total_carbs" DECIMAL DEFAULT 0,
    "total_fat" DECIMAL DEFAULT 0,
    "profilesId" UUID,
    
    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- Tabla food_items
CREATE TABLE IF NOT EXISTS "food_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "quantity" DECIMAL,
    "unit" TEXT,
    "calories" DECIMAL,
    "protein" DECIMAL,
    "carbs" DECIMAL,
    "fat" DECIMAL,
    "barcode_number" TEXT,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "servings" DECIMAL,
    "contributed" BOOLEAN NOT NULL DEFAULT false,
    "nutriscore_grade" TEXT,
    "nova_group" INTEGER,
    "notfat_score" INTEGER,
    "labels_tags" JSONB,
    "additives_tags" JSONB,
    "notfat_score_breakdown" JSONB,
    "additives_details" JSONB,
    "is_alcoholic" BOOLEAN NOT NULL DEFAULT false,
    "has_ingredients_data" BOOLEAN,
    "meal_id" TEXT NOT NULL,
    "profilesId" UUID,
    
    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- Tabla water_logs
CREATE TABLE IF NOT EXISTS "water_logs" (
    "id" UUID DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "profilesId" UUID,
    
    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- Crear índices básicos
CREATE INDEX IF NOT EXISTS "meals_user_id_idx" ON "meals"("user_id");
CREATE INDEX IF NOT EXISTS "meals_date_idx" ON "meals"("date");
CREATE INDEX IF NOT EXISTS "food_items_meal_id_idx" ON "food_items"("meal_id");
CREATE INDEX IF NOT EXISTS "food_items_user_id_idx" ON "food_items"("user_id");
CREATE INDEX IF NOT EXISTS "water_logs_user_id_idx" ON "water_logs"("user_id");
