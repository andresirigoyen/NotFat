-- Create missing tables in NotFat based on App Source and Reference DB

-- 1. Subscriptions & Payments
CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "mercadopago_id" TEXT,
    "plan_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DECIMAL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "start_date" TIMESTAMP WITH TIME ZONE,
    "trial_end_date" TIMESTAMP WITH TIME ZONE,
    "end_date" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "payment_provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "provider_subscription_id" TEXT,
    "revenuecat_id" TEXT,
    "environment" TEXT,
    "offer_code" TEXT,
    "applied_offer_code" VARCHAR(50),
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "mercadopago_payment_id" TEXT,
    "status" TEXT NOT NULL,
    "status_detail" TEXT,
    "payment_type" TEXT,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "payment_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "last_modified" TIMESTAMP WITH TIME ZONE NOT NULL,
    "payment_data" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "operation_type" TEXT,
    "revenuecat_payment_id" TEXT,
    "environment" TEXT,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."payments_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "is_chilean" BOOLEAN,
    "ab_test_group" VARCHAR(1),
    "plan_type" VARCHAR(20),
    "payment_method" VARCHAR(20),
    "transaction_id" VARCHAR(100),
    "amount" DECIMAL,
    "currency" VARCHAR(3),
    "is_successful" BOOLEAN,
    "error_message" TEXT,
    "error_code" VARCHAR(50),
    "platform" VARCHAR(20),
    "app_version" VARCHAR(20),
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "payments_analytics_pkey" PRIMARY KEY ("id")
);

-- 2. Recipes & Recommendations
CREATE TABLE IF NOT EXISTS "public"."recommendation_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "meal_type" TEXT,
    "available_ingredients" TEXT,
    "remaining_calories" DOUBLE PRECISION,
    "remaining_protein" DOUBLE PRECISION,
    "remaining_carbs" DOUBLE PRECISION,
    "remaining_fat" DOUBLE PRECISION,
    "fridge_image_url" TEXT,
    "llm_used" TEXT,
    "api_time_ms" INTEGER,
    "total_time_ms" INTEGER,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "recommendation_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT[],
    "prep_time_minutes" INTEGER,
    "servings" INTEGER,
    "total_calories" DOUBLE PRECISION,
    "total_protein" DOUBLE PRECISION,
    "total_carbs" DOUBLE PRECISION,
    "total_fat" DOUBLE PRECISION,
    "image_url" TEXT,
    "source_type" TEXT DEFAULT 'ia',
    "recommendation_session_id" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipes_session_fkey" FOREIGN KEY ("recommendation_session_id") REFERENCES "public"."recommendation_sessions"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "public"."recipe_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipe_items_recipe_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE
);

-- 3. Professional Services & Nutritionists
CREATE TABLE IF NOT EXISTS "public"."institutions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "creator_id" UUID,
    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."nutritionists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "gender" TEXT,
    "institution_id" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "auth_id" UUID,
    "profile_image_url" TEXT,
    "clicks_ig" INTEGER DEFAULT 0,
    "clicks_wtp" INTEGER DEFAULT 0,
    "instagram_url" TEXT,
    "long_description" TEXT,
    "phone" TEXT,
    "short_description" TEXT,
    "specialties" TEXT[],
    "visible_in_app" BOOLEAN DEFAULT false,
    CONSTRAINT "nutritionists_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nutritionists_institution_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "public"."nutrition_guidelines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "nutritionist_id" UUID,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "allergies" TEXT[],
    "pathologies" TEXT[],
    "food_aversions" TEXT[],
    "cooking_time" TEXT,
    "supplementation" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "source" TEXT DEFAULT 'ia',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "nutrition_guidelines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nutrition_guidelines_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "nutrition_guidelines_nutritionist_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "public"."nutritionists"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "public"."guideline_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guideline_id" UUID NOT NULL,
    "day_name" TEXT NOT NULL,
    "day_order" INTEGER NOT NULL,
    "context" TEXT,
    "total_calories" DOUBLE PRECISION,
    "total_protein" DOUBLE PRECISION,
    "total_carbs" DOUBLE PRECISION,
    "total_fat" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "guideline_days_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guideline_days_guideline_fkey" FOREIGN KEY ("guideline_id") REFERENCES "public"."nutrition_guidelines"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."guideline_meals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guideline_day_id" UUID NOT NULL,
    "meal_order" INTEGER NOT NULL,
    "meal_type" TEXT NOT NULL,
    "meal_name" TEXT NOT NULL,
    "scheduled_time" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "guideline_meals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guideline_meals_day_fkey" FOREIGN KEY ("guideline_day_id") REFERENCES "public"."guideline_days"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."guideline_meal_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guideline_meal_id" UUID NOT NULL,
    "item_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "servings" DOUBLE PRECISION DEFAULT 1,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "guideline_meal_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guideline_meal_items_meal_fkey" FOREIGN KEY ("guideline_meal_id") REFERENCES "public"."guideline_meals"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."profile_nutritionists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "nutritionist_id" UUID NOT NULL,
    "nutrition_guidelines_id" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "profile_nutritionists_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profile_nutritionists_profile_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "profile_nutritionists_nutritionist_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "public"."nutritionists"("id") ON DELETE CASCADE
);

-- 4. Feedback
CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "message" TEXT NOT NULL,
    "note" TEXT,
    "user_type" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- Enable RLS for all
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recommendation_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recipe_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."institutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."nutritionists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."nutrition_guidelines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."guideline_days" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."guideline_meals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."guideline_meal_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profile_nutritionists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Owner access)
DO $$ 
BEGIN
    -- Subscriptions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own subscriptions') THEN
        CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (auth.uid() = user_id);
    END IF;
    -- Payments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own payments') THEN
        CREATE POLICY "Users can view their own payments" ON "public"."payments" FOR SELECT USING (auth.uid() = user_id);
    END IF;
    -- Recipes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own recipes') THEN
        CREATE POLICY "Users can manage their own recipes" ON "public"."recipes" FOR ALL USING (auth.uid() = user_id);
    END IF;
    -- Recommendation Sessions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own sessions') THEN
        CREATE POLICY "Users can manage their own sessions" ON "public"."recommendation_sessions" FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
