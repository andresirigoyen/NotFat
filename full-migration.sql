-- CreateEnum
CREATE TYPE "gender_enum" AS ENUM ('male', 'female', 'non_binary', 'other');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('user', 'creator', 'admin', 'superadmin');

-- CreateEnum
CREATE TYPE "height_unit_enum" AS ENUM ('cm', 'm', 'in');

-- CreateEnum
CREATE TYPE "weight_unit_enum" AS ENUM ('kg', 'lb');

-- CreateEnum
CREATE TYPE "water_unit_enum" AS ENUM ('ml', 'oz');

-- CreateEnum
CREATE TYPE "unit_enum" AS ENUM ('g', 'ml', 'oz', 'cup', 'slice', 'unit', 'tbsp', 'tsp', 'scoop', 'clove');

-- CreateEnum
CREATE TYPE "meal_type_enum" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- CreateEnum
CREATE TYPE "meal_status" AS ENUM ('analyzing', 'complete', 'error', 'no_nutritional_info', 'not_found', 'contributed', 'pending_lookup', 'queued');

-- CreateEnum
CREATE TYPE "meal_source_type_enum" AS ENUM ('camera', 'gallery', 'text', 'scanner', 'unknown', 'voice');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('simple_reminder');

-- CreateEnum
CREATE TYPE "contribution_status" AS ENUM ('pending', 'processing', 'completed', 'error');

-- CreateEnum
CREATE TYPE "llm_model_enum" AS ENUM ('gemini-2.0-flash', 'gpt-4.1-mini', 'open-food-facts', 'gemini-2.5-flash', 'gpt-4.1', 'gemini-2.5-pro');

-- CreateEnum
CREATE TYPE "task_type" AS ENUM ('image', 'text', 'voice', 'barcode');

-- CreateEnum
CREATE TYPE "body_fat_unit_enum" AS ENUM ('pct');

-- CreateEnum
CREATE TYPE "nutrition_goal_source" AS ENUM ('algorithm', 'ia', 'manual');

-- Try to create profiles table with UUID id (for Supabase compatibility)
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "first_name" TEXT,
    "avatar_url" TEXT,
    "diet_type" TEXT DEFAULT 'Balanced',
    "last_name" TEXT,
    "birth_date" TIMESTAMP(3),
    "gender" "gender_enum" NOT NULL DEFAULT 'other',
    "email" TEXT NOT NULL,
    "onboarding_completed" BOOLEAN,
    "workout_frequency" TEXT,
    "height_value" DOUBLE PRECISION,
    "weight_value" DOUBLE PRECISION,
    "height_unit" "height_unit_enum" NOT NULL DEFAULT 'cm',
    "weight_unit" "weight_unit_enum" NOT NULL DEFAULT 'kg',
    "timezone" TEXT DEFAULT '',
    "nutrition_goal" VARCHAR(255),
    "achievement_goal" VARCHAR(255),
    "subscription_status" TEXT DEFAULT 'free',
    "subscription_ends_at" TIMESTAMP(3),
    "expo_push_token" TEXT,
    "platform" TEXT DEFAULT 'ios',
    "preferred_bottle_size" INTEGER NOT NULL DEFAULT 1000,
    "preferred_bottle_unit" "water_unit_enum" NOT NULL DEFAULT 'ml',
    "show_calories" BOOLEAN NOT NULL DEFAULT true,
    "show_hydration" BOOLEAN NOT NULL DEFAULT true,
    "onboarding_step" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'user',
    "steps_goal" INTEGER NOT NULL DEFAULT 10000,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "image_url" TEXT,
    "meal_type" "meal_type_enum",
    "meal_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "meal_status" NOT NULL DEFAULT 'analyzing',
    "source_type" "meal_source_type_enum" NOT NULL DEFAULT 'unknown',
    "recorded_timezone" TEXT,
    "llm_used" "llm_model_enum",
    "modified" BOOLEAN NOT NULL DEFAULT false,
    "is_from_favorite" BOOLEAN NOT NULL DEFAULT false,
    "image_url_aux" TEXT,
    "feedback" TEXT,
    "recommendation" TEXT,
    "api_time_ms" INTEGER,
    "processing_time_ms" INTEGER,
    "prompt_version" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION DEFAULT 1,
    "unit" "unit_enum",
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "barcode_number" TEXT,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "servings" DOUBLE PRECISION,
    "contributed" BOOLEAN NOT NULL DEFAULT false,
    "nutriscore_grade" TEXT,
    "nova_group" INTEGER,
    "nutria_score" INTEGER,
    "labels_tags" JSONB,
    "additives_tags" JSONB,
    "nutria_score_breakdown" JSONB,
    "additives_details" JSONB,
    "is_alcoholic" BOOLEAN NOT NULL DEFAULT false,
    "has_ingredients_data" BOOLEAN,
    "meal_id" TEXT NOT NULL,
    "profilesId" UUID,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "recorded_timezone" TEXT,
    "volume" DOUBLE PRECISION NOT NULL,
    "unit" "water_unit_enum" NOT NULL DEFAULT 'ml',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_metrics" (
    "id" TEXT NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight_value" DOUBLE PRECISION,
    "body_fat_value" DOUBLE PRECISION,
    "height_value" DOUBLE PRECISION,
    "weight_unit" "weight_unit_enum" NOT NULL DEFAULT 'kg',
    "height_unit" "height_unit_enum" NOT NULL DEFAULT 'cm',
    "body_fat_unit" "body_fat_unit_enum" NOT NULL DEFAULT 'pct',
    "user_id" UUID NOT NULL,

    CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "mercadopago_id" TEXT,
    "plan_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "start_date" TIMESTAMP(3),
    "trial_end_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "payment_provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "provider_subscription_id" TEXT,
    "revenuecat_id" TEXT,
    "environment" TEXT,
    "offer_code" TEXT,
    "applied_offer_code" VARCHAR(50),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "subscription_id" TEXT,
    "mercadopago_payment_id" TEXT,
    "status" TEXT NOT NULL,
    "status_detail" TEXT,
    "payment_type" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "last_modified" TIMESTAMP(3) NOT NULL,
    "payment_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "operation_type" TEXT,
    "revenuecat_payment_id" TEXT,
    "environment" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notification_type" "notification_type" NOT NULL,
    "reminder_id" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,
    "meal_type" "meal_type_enum",
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "message" TEXT,
    "icon" TEXT,
    "predefined_type" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_meals" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "image_url" TEXT,
    "meal_type" "meal_type_enum",
    "source_type" "meal_source_type_enum" NOT NULL DEFAULT 'unknown',
    "original_meal_id" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "favorite_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_meal_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION DEFAULT 1,
    "unit" "unit_enum",
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "servings" DOUBLE PRECISION,
    "barcode_number" TEXT,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "contributed" BOOLEAN NOT NULL DEFAULT false,
    "favorite_meal_id" TEXT NOT NULL,

    CONSTRAINT "favorite_meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_goals" (
    "id" TEXT NOT NULL,
    "calories" INTEGER,
    "protein" INTEGER,
    "carbs" INTEGER,
    "fat" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "source" "nutrition_goal_source",
    "user_id" UUID NOT NULL,

    CONSTRAINT "nutrition_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hydration_goals" (
    "id" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "target_unit" "water_unit_enum" NOT NULL DEFAULT 'ml',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "hydration_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sports" (
    "id" TEXT NOT NULL,
    "sport_type" TEXT NOT NULL,
    "hours_per_week" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "user_sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_settings" (
    "id" TEXT NOT NULL,
    "health_platform" TEXT,
    "connected_at" TIMESTAMP(3),
    "disconnected_at" TIMESTAMP(3),
    "eat_back_exercise_calories" BOOLEAN NOT NULL DEFAULT true,
    "eat_back_neat_calories" BOOLEAN NOT NULL DEFAULT true,
    "sync_weight" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "health_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_daily_snapshots" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "steps" INTEGER,
    "active_calories_burned" DOUBLE PRECISION,
    "workout_calories_burned" DOUBLE PRECISION,
    "workout_count" INTEGER,
    "workout_minutes" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "sleep_hours" DOUBLE PRECISION,
    "sleep_quality" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT DEFAULT 'apple_health',
    "user_id" UUID NOT NULL,

    CONSTRAINT "health_daily_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_profile" (
    "id" TEXT NOT NULL,
    "does_sport" BOOLEAN,
    "daily_activity_level" TEXT,
    "activity_system_version" TEXT NOT NULL DEFAULT 'v2',
    "upgraded_to_v2_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "user_activity_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_guidelines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "nutritionist_id" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "allergies" TEXT[],
    "pathologies" TEXT[],
    "food_aversions" TEXT[],
    "cooking_time" TEXT,
    "supplementation" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_guidelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_nutritionists" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "nutrition_guidelinesId" TEXT,

    CONSTRAINT "profile_nutritionists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_workouts" (
    "id" TEXT NOT NULL,
    "workout_date" DATE NOT NULL,
    "sport_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "estimated_calories" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "manual_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_events" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "result" TEXT,
    "product_name" TEXT,
    "processing_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "user_id" UUID NOT NULL,
    "meal_id" TEXT,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_queue" (
    "id" TEXT NOT NULL,
    "image_url" TEXT,
    "text_description" TEXT,
    "audio_url" TEXT,
    "barcode" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "error_message" TEXT,
    "last_error_at" TIMESTAMP(3),
    "processing_started_at" TIMESTAMP(3),
    "processing_completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "photo_comment" TEXT,
    "task_type" "task_type" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "meal_id" TEXT NOT NULL,
    "profilesId" UUID,

    CONSTRAINT "task_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "barcode" TEXT,
    "front_image_url" TEXT,
    "nutrition_image_url" TEXT,
    "extra_image_url" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "processing_started_at" TIMESTAMP(3),
    "processing_completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "last_error_at" TIMESTAMP(3),
    "result_data" JSONB,
    "metadata" JSONB,
    "updated_at" TIMESTAMP(3),
    "status" "contribution_status" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meal_id" TEXT,
    "food_item_id" TEXT,
    "profilesId" UUID,

    CONSTRAINT "contribution_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "meal_type" "meal_type_enum" NOT NULL,
    "source" TEXT DEFAULT 'ai_recommendation',
    "description" TEXT,
    "estimated_time" TEXT,
    "difficulty" TEXT,
    "recipe_type" TEXT,
    "steps" TEXT[],
    "llm_used" "llm_model_enum",
    "api_time_ms" INTEGER,
    "processing_time_ms" INTEGER,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "recommendation_session_id" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION DEFAULT 1,
    "unit" "unit_enum",
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "barcode_number" TEXT,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "servings" DOUBLE PRECISION,
    "contributed" BOOLEAN NOT NULL DEFAULT false,
    "recipe_id" TEXT NOT NULL,
    "profilesId" UUID,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_sessions" (
    "id" TEXT NOT NULL,
    "meal_type" "meal_type_enum" NOT NULL,
    "available_ingredients" TEXT,
    "remaining_calories" DOUBLE PRECISION,
    "remaining_protein" DOUBLE PRECISION,
    "remaining_carbs" DOUBLE PRECISION,
    "remaining_fat" DOUBLE PRECISION,
    "llm_used" "llm_model_enum",
    "api_time_ms" INTEGER,
    "total_time_ms" INTEGER,
    "fridge_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "recommendation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_messages" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audio_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "coach_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_insights" (
    "id" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT (now() + '04:00:00'::interval),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "coach_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_tips" (
    "id" SERIAL NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '💡',
    "category" TEXT NOT NULL DEFAULT 'nutrición',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "used_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profilesId" UUID,

    CONSTRAINT "daily_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_tips_used" (
    "id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "tip_id" INTEGER NOT NULL,

    CONSTRAINT "daily_tips_used_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_ab_tests" (
    "id" SERIAL NOT NULL,
    "test_group" TEXT NOT NULL,
    "price_shown" INTEGER NOT NULL,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "pricing_ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_code_attempts" (
    "id" TEXT NOT NULL,
    "offer_code" VARCHAR(50) NOT NULL,
    "used_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "subscription_id" TEXT,

    CONSTRAINT "offer_code_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "creator_name" TEXT,
    "active" BOOLEAN,
    "type" TEXT,
    "commission_rate" DOUBLE PRECISION DEFAULT 0.0,
    "payment_type" TEXT DEFAULT 'commission',
    "absolute_amount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creator_id" TEXT,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_code_payments" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "payment_method" TEXT,
    "payment_account" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "promo_code_id" INTEGER NOT NULL,
    "subscriptionsId" TEXT,

    CONSTRAINT "promo_code_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments_analytics" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "is_chilean" BOOLEAN,
    "ab_test_group" VARCHAR(1),
    "plan_type" VARCHAR(20),
    "payment_method" VARCHAR(20),
    "transaction_id" VARCHAR(100),
    "amount" DOUBLE PRECISION,
    "currency" VARCHAR(3),
    "is_successful" BOOLEAN,
    "error_message" TEXT,
    "error_code" VARCHAR(50),
    "platform" VARCHAR(20),
    "app_version" VARCHAR(20),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "payments_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_recovery_attempts" (
    "id" TEXT NOT NULL,
    "cancellation_reason" VARCHAR(50),
    "detailed_feedback" TEXT,
    "experiment_group" VARCHAR(20),
    "recovery_offer_shown" BOOLEAN NOT NULL DEFAULT false,
    "offer_type" VARCHAR(30),
    "from_product" VARCHAR(100),
    "to_product" VARCHAR(100),
    "original_price" DOUBLE PRECISION,
    "new_price" DOUBLE PRECISION,
    "user_action" VARCHAR(30),
    "revenuecat_transaction_id" VARCHAR(200),
    "subscription_age_days" INTEGER,
    "ltv_before_attempt" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "cancelled" BOOLEAN,
    "user_id" UUID NOT NULL,
    "original_subscription_id" TEXT,

    CONSTRAINT "cancellation_recovery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "note" TEXT,
    "user_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,
    "profilesId" UUID,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencers" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "affiliate_code" TEXT NOT NULL,
    "banking_data" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "influencers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creator_id" TEXT,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutritionists" (
    "id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "gender" "gender_enum",
    "institution_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auth_id" TEXT,
    "profile_image_url" TEXT,
    "clicks_ig" DOUBLE PRECISION,
    "clicks_wtp" DOUBLE PRECISION,
    "instagram_url" TEXT,
    "long_description" TEXT,
    "phone" TEXT,
    "short_description" TEXT,
    "specialties" TEXT[],
    "visible_in_app" BOOLEAN NOT NULL DEFAULT false,
    "profilesId" UUID,

    CONSTRAINT "nutritionists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additives" (
    "id" TEXT NOT NULL,
    "e_number" TEXT NOT NULL,
    "name_en" TEXT,
    "name_es" TEXT,
    "risk_level" TEXT NOT NULL DEFAULT 'unknown',
    "penalty_points" INTEGER NOT NULL DEFAULT 0,
    "justification" TEXT,
    "bibliography" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" TEXT,

    CONSTRAINT "additives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_job_logs" (
    "id" SERIAL NOT NULL,
    "job_name" TEXT NOT NULL,
    "result" JSONB,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creator_id" TEXT,

    CONSTRAINT "cron_job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign_history" (
    "id" SERIAL NOT NULL,
    "send_type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "segment_summary" TEXT NOT NULL,
    "target_count" INTEGER NOT NULL DEFAULT 0,
    "filters_applied" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creator_id" TEXT,

    CONSTRAINT "marketing_campaign_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guideline_days" (
    "id" TEXT NOT NULL,
    "day_name" TEXT NOT NULL,
    "day_order" INTEGER NOT NULL,
    "context" TEXT,
    "total_calories" INTEGER,
    "total_protein" DOUBLE PRECISION,
    "total_carbs" DOUBLE PRECISION,
    "total_fat" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guideline_id" TEXT NOT NULL,

    CONSTRAINT "guideline_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guideline_day_trainings" (
    "id" TEXT NOT NULL,
    "training_order" INTEGER NOT NULL,
    "sport_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "intensity" TEXT,
    "scheduled_time" TEXT,
    "guideline_day_id" TEXT NOT NULL,

    CONSTRAINT "guideline_day_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guideline_meals" (
    "id" TEXT NOT NULL,
    "meal_order" INTEGER NOT NULL,
    "meal_type" TEXT NOT NULL,
    "meal_name" TEXT NOT NULL,
    "scheduled_time" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guideline_day_id" TEXT NOT NULL,

    CONSTRAINT "guideline_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guideline_meal_items" (
    "id" TEXT NOT NULL,
    "item_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" "unit_enum",
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "servings" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "guideline_meal_id" TEXT NOT NULL,

    CONSTRAINT "guideline_meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_funnel_conversion" (
    "id" SERIAL NOT NULL,
    "is_chilean" BOOLEAN,
    "ab_test_group" VARCHAR(1),
    "payment_method" VARCHAR(20),
    "total_users" BIGINT,
    "paywall_views" BIGINT,
    "plan_selections" BIGINT,
    "card_submissions" BIGINT,
    "subscriptions" BIGINT,
    "plan_selection_rate" DOUBLE PRECISION,
    "card_submission_rate" DOUBLE PRECISION,
    "mp_conversion_rate" DOUBLE PRECISION,
    "rc_conversion_rate" DOUBLE PRECISION,
    "overall_conversion_rate" DOUBLE PRECISION,
    "avg_conversion_time_minutes" DOUBLE PRECISION,

    CONSTRAINT "payment_funnel_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_payment_metrics" (
    "id" SERIAL NOT NULL,
    "day" TIMESTAMP(3),
    "is_chilean" BOOLEAN,
    "payment_method" VARCHAR(20),
    "event_type" VARCHAR(50),
    "event_count" BIGINT,
    "unique_users" BIGINT,
    "avg_amount" DOUBLE PRECISION,

    CONSTRAINT "daily_payment_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_comparison" (
    "id" SERIAL NOT NULL,
    "ab_test_group" VARCHAR(1),
    "payment_method" VARCHAR(20),
    "paywall_views" BIGINT,
    "plan_selections" BIGINT,
    "card_submissions" BIGINT,
    "subscriptions" BIGINT,
    "total_revenue" DOUBLE PRECISION,
    "plan_selection_rate" DOUBLE PRECISION,
    "card_submission_rate" DOUBLE PRECISION,
    "subscription_rate" DOUBLE PRECISION,
    "overall_conversion_rate" DOUBLE PRECISION,
    "revenue_per_subscription" DOUBLE PRECISION,

    CONSTRAINT "ab_test_comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_events_daily_stats" (
    "id" SERIAL NOT NULL,
    "scan_date" DATE,
    "origin" TEXT,
    "result" TEXT,
    "event_count" BIGINT,
    "unique_users" BIGINT,
    "unique_barcodes" BIGINT,
    "avg_processing_ms" DOUBLE PRECISION,
    "p95_processing_ms" DOUBLE PRECISION,

    CONSTRAINT "scan_events_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scanner_daily_stats" (
    "id" SERIAL NOT NULL,
    "scan_date" DATE,
    "source_type" "meal_source_type_enum",
    "status" "meal_status",
    "scan_count" BIGINT,
    "unique_users" BIGINT,
    "unique_products" BIGINT,
    "avg_processing_seconds" DOUBLE PRECISION,
    "missing_nutria_score" BIGINT,
    "missing_nutriscore" BIGINT,
    "missing_nova" BIGINT,
    "missing_additives_data" BIGINT,
    "contributed_count" BIGINT,
    "alcoholic_products" BIGINT,

    CONSTRAINT "scanner_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geography_payment_comparison" (
    "id" SERIAL NOT NULL,
    "geography" TEXT,
    "payment_method" VARCHAR(20),
    "paywall_views" BIGINT,
    "plan_selections" BIGINT,
    "subscriptions" BIGINT,
    "plan_selection_rate" DOUBLE PRECISION,
    "conversion_rate" DOUBLE PRECISION,
    "total_revenue" DOUBLE PRECISION,

    CONSTRAINT "geography_payment_comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_with_plan" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "original_subscription_id" TEXT,
    "cancellation_reason" VARCHAR(50),
    "detailed_feedback" TEXT,
    "experiment_group" VARCHAR(20),
    "recovery_offer_shown" BOOLEAN,
    "offer_type" VARCHAR(30),
    "from_product" VARCHAR(100),
    "to_product" VARCHAR(100),
    "original_price" DOUBLE PRECISION,
    "new_price" DOUBLE PRECISION,
    "user_action" VARCHAR(30),
    "revenuecat_transaction_id" VARCHAR(200),
    "subscription_age_days" INTEGER,
    "ltv_before_attempt" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled" BOOLEAN,
    "plan_type" TEXT,
    "resolved_offer_code" VARCHAR(50),
    "subscription_status" TEXT,
    "ever_paid" BOOLEAN,

    CONSTRAINT "cancellation_with_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_with_plan_and_payment" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "original_subscription_id" TEXT,
    "cancellation_reason" VARCHAR(50),
    "detailed_feedback" TEXT,
    "experiment_group" VARCHAR(20),
    "recovery_offer_shown" BOOLEAN,
    "offer_type" VARCHAR(30),
    "from_product" VARCHAR(100),
    "to_product" VARCHAR(100),
    "original_price" DOUBLE PRECISION,
    "new_price" DOUBLE PRECISION,
    "user_action" VARCHAR(30),
    "revenuecat_transaction_id" VARCHAR(200),
    "subscription_age_days" INTEGER,
    "ltv_before_attempt" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled" BOOLEAN,
    "plan_type" TEXT,
    "resolved_offer_code" VARCHAR(50),
    "subscription_status" TEXT,
    "ever_paid" BOOLEAN,

    CONSTRAINT "cancellation_with_plan_and_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_tips_used_user_id_tip_id_key" ON "daily_tips_used"("user_id", "tip_id");

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_profilesId_fkey" FOREIGN KEY ("profilesId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "notification_preferences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_meals" ADD CONSTRAINT "favorite_meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_meals" ADD CONSTRAINT "favorite_meals_original_meal_id_fkey" FOREIGN KEY ("original_meal_id") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_meal_items" ADD CONSTRAINT "favorite_meal_items_favorite_meal_id_fkey" FOREIGN KEY ("favorite_meal_id") REFERENCES "favorite_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hydration_goals" ADD CONSTRAINT "hydration_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sports" ADD CONSTRAINT "user_sports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_settings" ADD CONSTRAINT "health_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_daily_snapshots" ADD CONSTRAINT "health_daily_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_profile" ADD CONSTRAINT "user_activity_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_guidelines" ADD CONSTRAINT "nutrition_guidelines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_guidelines" ADD CONSTRAINT "nutrition_guidelines_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_nutritionists" ADD CONSTRAINT "profile_nutritionists_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_nutritionists" ADD CONSTRAINT "profile_nutritionists_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_nutritionists" ADD CONSTRAINT "profile_nutritionists_nutrition_guidelinesId_fkey" FOREIGN KEY ("nutrition_guidelinesId") REFERENCES "nutrition_guidelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_workouts" ADD CONSTRAINT "manual_workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_queue" ADD CONSTRAINT "task_queue_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_queue" ADD CONSTRAINT "task_queue_profilesId_fkey" FOREIGN KEY ("profilesId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_queue" ADD CONSTRAINT "contribution_queue_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_queue" ADD CONSTRAINT "contribution_queue_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "food_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_queue" ADD CONSTRAINT "contribution_queue_profilesId_fkey" FOREIGN KEY ("profilesId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKeyh
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_recommendation_session_id_fkey" FOREIGN KEY ("recommendation_session_id") REFERENCES "recommendation_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_profilesId_fkey" FOREIGN KEY ("profilesId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_sessions" ADD CONSTRAINT "recommendation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_insights" ADD CONSTRAINT "coach_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_tips" ADD CONSTRAINT "daily_tips_profilesId_fkey" FOREIGN KEY ("profilesId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_tips_used" ADD CONSTRAINT "daily_tips_used_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_tips_used" ADD CONSTRAINT "daily_tips_used_tip_id_fkey" FOREIGN KEY ("tip_id") REFERENCES "daily_tips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_ab_tests" ADD CONSTRAINT "pricing_ab_tests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_code_attempts" ADD CONSTRAINT "offer_code_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_code_attempts" ADD CONSTRAINT "offer_code_attempts_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code_payments" ADD CONSTRAINT "promo_code_payments_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code_payments" ADD CONSTRAINT "promo_code_payments_subscriptionsId_fkey" FOREIGN KEY ("subscriptionsId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments_analytics" ADD CONSTRAINT "payments_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_recovery_attempts" ADD CONSTRAINT "cancellation_recovery_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_recovery_attempts" ADD CONSTRAINT "cancellation_recovery_attempts_original_subscription_id_fkey" FOREIGN KEY ("original_subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "nutritionists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_profilesId_fkey" FOREIGN KEY ("profilesId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutritionists" ADD CONSTRAINT "nutritionists_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutritionists" ADD CONSTRAINT "nutritionists_profilesId_fkey" FOREIGN KEY ("profilesId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additives" ADD CONSTRAINT "additives_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cron_job_logs" ADD CONSTRAINT "cron_job_logs_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign_history" ADD CONSTRAINT "marketing_campaign_history_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guideline_days" ADD CONSTRAINT "guideline_days_guideline_id_fkey" FOREIGN KEY ("guideline_id") REFERENCES "nutrition_guidelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guideline_day_trainings" ADD CONSTRAINT "guideline_day_trainings_guideline_day_id_fkey" FOREIGN KEY ("guideline_day_id") REFERENCES "guideline_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guideline_meals" ADD CONSTRAINT "guideline_meals_guideline_day_id_fkey" FOREIGN KEY ("guideline_day_id") REFERENCES "guideline_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guideline_meal_items" ADD CONSTRAINT "guideline_meal_items_guideline_meal_id_fkey" FOREIGN KEY ("guideline_meal_id") REFERENCES "guideline_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_with_plan" ADD CONSTRAINT "cancellation_with_plan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_with_plan" ADD CONSTRAINT "cancellation_with_plan_original_subscription_id_fkey" FOREIGN KEY ("original_subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_with_plan_and_payment" ADD CONSTRAINT "cancellation_with_plan_and_payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_with_plan_and_payment" ADD CONSTRAINT "cancellation_with_plan_and_payment_original_subscription_i_fkey" FOREIGN KEY ("original_subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

