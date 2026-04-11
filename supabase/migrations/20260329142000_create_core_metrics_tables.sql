-- Create Enums if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weight_unit_enum') THEN
        CREATE TYPE "weight_unit_enum" AS ENUM ('kg', 'lb');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'height_unit_enum') THEN
        CREATE TYPE "height_unit_enum" AS ENUM ('cm', 'm', 'in');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'body_fat_unit_enum') THEN
        CREATE TYPE "body_fat_unit_enum" AS ENUM ('pct');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE "notification_type" AS ENUM ('simple_reminder');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type_enum') THEN
        CREATE TYPE "meal_type_enum" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nutrition_goal_source') THEN
        CREATE TYPE "nutrition_goal_source" AS ENUM ('algorithm', 'ia', 'manual');
    END IF;
END $$;

-- Create body_metrics table
CREATE TABLE IF NOT EXISTS "public"."body_metrics" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight_value" DOUBLE PRECISION,
    "body_fat_value" DOUBLE PRECISION,
    "height_value" DOUBLE PRECISION,
    "weight_unit" "weight_unit_enum" NOT NULL DEFAULT 'kg',
    "height_unit" "height_unit_enum" NOT NULL DEFAULT 'cm',
    "body_fat_unit" "body_fat_unit_enum" NOT NULL DEFAULT 'pct',
    "user_id" UUID NOT NULL,

    CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "body_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,
    "meal_type" "meal_type_enum",
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "message" TEXT,
    "icon" TEXT,
    "predefined_type" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create nutrition_goals table
CREATE TABLE IF NOT EXISTS "public"."nutrition_goals" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "calories" INTEGER,
    "protein" INTEGER,
    "carbs" INTEGER,
    "fat" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "nutrition_goal_source",
    "user_id" UUID NOT NULL,

    CONSTRAINT "nutrition_goals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nutrition_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Enable RLS
ALTER TABLE "public"."body_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."nutrition_goals" ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage their own body metrics" ON "public"."body_metrics" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notification preferences" ON "public"."notification_preferences" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own nutrition goals" ON "public"."nutrition_goals" FOR ALL USING (auth.uid() = user_id);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
