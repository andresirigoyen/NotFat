-- Script to drop all NotFat database tables
-- Run this to completely reset the database

-- Drop foreign key constraints first (if they exist)
DO $$
BEGIN
    -- Drop all foreign key constraints
    BEGIN
        ALTER TABLE "cancellation_with_plan_and_payment" DROP CONSTRAINT IF EXISTS "cancellation_with_plan_and_payment_original_subscription_i_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "cancellation_with_plan_and_payment" DROP CONSTRAINT IF EXISTS "cancellation_with_plan_and_payment_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "cancellation_with_plan" DROP CONSTRAINT IF EXISTS "cancellation_with_plan_original_subscription_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "cancellation_with_plan" DROP CONSTRAINT IF EXISTS "cancellation_with_plan_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "guideline_meal_items" DROP CONSTRAINT IF EXISTS "guideline_meal_items_guideline_meal_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "guideline_meals" DROP CONSTRAINT IF EXISTS "guideline_meals_guideline_day_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "guideline_day_trainings" DROP CONSTRAINT IF EXISTS "guideline_day_trainings_guideline_day_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "guideline_days" DROP CONSTRAINT IF EXISTS "guideline_days_nutrition_guidelines_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "marketing_campaign_history" DROP CONSTRAINT IF EXISTS "marketing_campaign_history_creator_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "cron_job_logs" DROP CONSTRAINT IF EXISTS "cron_job_logs_creator_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "additives" DROP CONSTRAINT IF EXISTS "additives_creator_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "nutritionists" DROP CONSTRAINT IF EXISTS "nutritionists_profilesId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "nutritionists" DROP CONSTRAINT IF EXISTS "nutritionists_institution_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "institutions" DROP CONSTRAINT IF EXISTS "institutions_creator_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "influencers" DROP CONSTRAINT IF EXISTS "influencers_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "feedback" DROP CONSTRAINT IF EXISTS "feedback_profilesId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "feedback" DROP CONSTRAINT IF EXISTS "feedback_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "cancellation_recovery_attempts" DROP CONSTRAINT IF EXISTS "cancellation_recovery_attempts_original_subscription_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "cancellation_recovery_attempts" DROP CONSTRAINT IF EXISTS "cancellation_recovery_attempts_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "payments_analytics" DROP CONSTRAINT IF EXISTS "payments_analytics_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "promo_code_payments" DROP CONSTRAINT IF EXISTS "promo_code_payments_subscriptionsId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "promo_code_payments" DROP CONSTRAINT IF EXISTS "promo_code_payments_promo_code_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "promo_codes" DROP CONSTRAINT IF EXISTS "promo_codes_creator_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "offer_code_attempts" DROP CONSTRAINT IF EXISTS "offer_code_attempts_subscription_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "offer_code_attempts" DROP CONSTRAINT IF EXISTS "offer_code_attempts_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "pricing_ab_tests" DROP CONSTRAINT IF EXISTS "pricing_ab_tests_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "daily_tips_used" DROP CONSTRAINT IF EXISTS "daily_tips_used_tip_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "daily_tips_used" DROP CONSTRAINT IF EXISTS "daily_tips_used_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "daily_tips" DROP CONSTRAINT IF EXISTS "daily_tips_profilesId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "coach_insights" DROP CONSTRAINT IF EXISTS "coach_insights_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "coach_messages" DROP CONSTRAINT IF EXISTS "coach_messages_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "recommendation_sessions" DROP CONSTRAINT IF EXISTS "recommendation_sessions_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "recipe_items" DROP CONSTRAINT IF EXISTS "recipe_items_profilesId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "recipe_items" DROP CONSTRAINT IF EXISTS "recipe_items_recipe_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "recipes" DROP CONSTRAINT IF EXISTS "recipes_recommendation_session_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "recipes" DROP CONSTRAINT IF EXISTS "recipes_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "contribution_queue" DROP CONSTRAINT IF EXISTS "contribution_queue_profilesId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "contribution_queue" DROP CONSTRAINT IF EXISTS "contribution_queue_food_item_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "contribution_queue" DROP CONSTRAINT IF EXISTS "contribution_queue_meal_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "task_queue" DROP CONSTRAINT IF EXISTS "task_queue_profilesId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "task_queue" DROP CONSTRAINT IF EXISTS "task_queue_meal_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "scan_events" DROP CONSTRAINT IF EXISTS "scan_events_meal_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "scan_events" DROP CONSTRAINT IF EXISTS "scan_events_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "manual_workouts" DROP CONSTRAINT IF EXISTS "manual_workouts_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "profile_nutritionists" DROP CONSTRAINT IF EXISTS "profile_nutritionists_nutrition_guidelinesId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "profile_nutritionists" DROP CONSTRAINT IF EXISTS "profile_nutritionists_nutritionist_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "profile_nutritionists" DROP CONSTRAINT IF EXISTS "profile_nutritionists_profile_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "nutrition_guidelines" DROP CONSTRAINT IF EXISTS "nutrition_guidelines_nutritionist_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "nutrition_guidelines" DROP CONSTRAINT IF EXISTS "nutrition_guidelines_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "user_activity_profile" DROP CONSTRAINT IF EXISTS "user_activity_profile_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "health_daily_snapshots" DROP CONSTRAINT IF EXISTS "health_daily_snapshots_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "health_settings" DROP CONSTRAINT IF EXISTS "health_settings_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "user_sports" DROP CONSTRAINT IF EXISTS "user_sports_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "hydration_goals" DROP CONSTRAINT IF EXISTS "hydration_goals_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "nutrition_goals" DROP CONSTRAINT IF EXISTS "nutrition_goals_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "favorite_meal_items" DROP CONSTRAINT IF EXISTS "favorite_meal_items_favorite_meal_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "favorite_meals" DROP CONSTRAINT IF EXISTS "favorite_meals_original_meal_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "favorite_meals" DROP CONSTRAINT IF EXISTS "favorite_meals_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "notification_preferences_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "notification_logs" DROP CONSTRAINT IF EXISTS "notification_logs_reminder_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "notification_logs" DROP CONSTRAINT IF EXISTS "notification_logs_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_subscription_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "body_metrics" DROP CONSTRAINT IF EXISTS "body_metrics_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "water_logs" DROP CONSTRAINT IF EXISTS "water_logs_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "food_items" DROP CONSTRAINT IF EXISTS "food_items_profilesId_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "food_items" DROP CONSTRAINT IF EXISTS "food_items_meal_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
    
    BEGIN
        ALTER TABLE "meals" DROP CONSTRAINT IF EXISTS "meals_user_id_fkey";
    EXCEPTION WHEN others THEN NULL; END;
END $$;

-- Now drop all tables in reverse order of dependencies
DROP TABLE IF EXISTS "cancellation_with_plan_and_payment" CASCADE;
DROP TABLE IF EXISTS "cancellation_with_plan" CASCADE;
DROP TABLE IF EXISTS "guideline_meal_items" CASCADE;
DROP TABLE IF EXISTS "guideline_meals" CASCADE;
DROP TABLE IF EXISTS "guideline_day_trainings" CASCADE;
DROP TABLE IF EXISTS "guideline_days" CASCADE;
DROP TABLE IF EXISTS "marketing_campaign_history" CASCADE;
DROP TABLE IF EXISTS "cron_job_logs" CASCADE;
DROP TABLE IF EXISTS "additives" CASCADE;
DROP TABLE IF EXISTS "nutritionists" CASCADE;
DROP TABLE IF EXISTS "institutions" CASCADE;
DROP TABLE IF EXISTS "influencers" CASCADE;
DROP TABLE IF EXISTS "feedback" CASCADE;
DROP TABLE IF EXISTS "cancellation_recovery_attempts" CASCADE;
DROP TABLE IF EXISTS "payments_analytics" CASCADE;
DROP TABLE IF EXISTS "promo_code_payments" CASCADE;
DROP TABLE IF EXISTS "promo_codes" CASCADE;
DROP TABLE IF EXISTS "offer_code_attempts" CASCADE;
DROP TABLE IF EXISTS "pricing_ab_tests" CASCADE;
DROP TABLE IF EXISTS "daily_tips_used" CASCADE;
DROP TABLE IF EXISTS "daily_tips" CASCADE;
DROP TABLE IF EXISTS "coach_insights" CASCADE;
DROP TABLE IF EXISTS "coach_messages" CASCADE;
DROP TABLE IF EXISTS "recommendation_sessions" CASCADE;
DROP TABLE IF EXISTS "recipe_items" CASCADE;
DROP TABLE IF EXISTS "recipes" CASCADE;
DROP TABLE IF EXISTS "contribution_queue" CASCADE;
DROP TABLE IF EXISTS "task_queue" CASCADE;
DROP TABLE IF EXISTS "scan_events" CASCADE;
DROP TABLE IF EXISTS "manual_workouts" CASCADE;
DROP TABLE IF EXISTS "profile_nutritionists" CASCADE;
DROP TABLE IF EXISTS "nutrition_guidelines" CASCADE;
DROP TABLE IF EXISTS "user_activity_profile" CASCADE;
DROP TABLE IF EXISTS "health_daily_snapshots" CASCADE;
DROP TABLE IF EXISTS "health_settings" CASCADE;
DROP TABLE IF EXISTS "user_sports" CASCADE;
DROP TABLE IF EXISTS "hydration_goals" CASCADE;
DROP TABLE IF EXISTS "nutrition_goals" CASCADE;
DROP TABLE IF EXISTS "favorite_meal_items" CASCADE;
DROP TABLE IF EXISTS "favorite_meals" CASCADE;
DROP TABLE IF EXISTS "notification_preferences" CASCADE;
DROP TABLE IF EXISTS "notification_logs" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "subscriptions" CASCADE;
DROP TABLE IF EXISTS "body_metrics" CASCADE;
DROP TABLE IF EXISTS "water_logs" CASCADE;
DROP TABLE IF EXISTS "food_items" CASCADE;
DROP TABLE IF EXISTS "meals" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "gender_enum" CASCADE;
DROP TYPE IF EXISTS "user_role" CASCADE;
DROP TYPE IF EXISTS "height_unit_enum" CASCADE;
DROP TYPE IF EXISTS "weight_unit_enum" CASCADE;
DROP TYPE IF EXISTS "water_unit_enum" CASCADE;
DROP TYPE IF EXISTS "unit_enum" CASCADE;
DROP TYPE IF EXISTS "meal_type_enum" CASCADE;
DROP TYPE IF EXISTS "meal_status" CASCADE;
DROP TYPE IF EXISTS "meal_source_type_enum" CASCADE;
DROP TYPE IF EXISTS "notification_type" CASCADE;
DROP TYPE IF EXISTS "contribution_status" CASCADE;
DROP TYPE IF EXISTS "llm_model_enum" CASCADE;
DROP TYPE IF EXISTS "task_type" CASCADE;
DROP TYPE IF EXISTS "body_fat_unit_enum" CASCADE;
DROP TYPE IF EXISTS "nutrition_goal_source" CASCADE;
