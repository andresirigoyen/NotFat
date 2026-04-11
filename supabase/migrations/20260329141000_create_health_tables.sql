-- Create user_sports table
CREATE TABLE IF NOT EXISTS "public"."user_sports" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sport_type" TEXT NOT NULL,
    "hours_per_week" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "user_sports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_sports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create health_settings table
CREATE TABLE IF NOT EXISTS "public"."health_settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "health_platform" TEXT,
    "connected_at" TIMESTAMP(3),
    "disconnected_at" TIMESTAMP(3),
    "eat_back_exercise_calories" BOOLEAN NOT NULL DEFAULT true,
    "eat_back_neat_calories" BOOLEAN NOT NULL DEFAULT true,
    "sync_weight" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "health_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "health_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create health_daily_snapshots table
CREATE TABLE IF NOT EXISTS "public"."health_daily_snapshots" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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

    CONSTRAINT "health_daily_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "health_daily_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create user_activity_profile table
CREATE TABLE IF NOT EXISTS "public"."user_activity_profile" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "does_sport" BOOLEAN,
    "daily_activity_level" TEXT,
    "activity_system_version" TEXT NOT NULL DEFAULT 'v2',
    "upgraded_to_v2_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "user_activity_profile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_activity_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Enable RLS
ALTER TABLE "public"."user_sports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."health_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."health_daily_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_activity_profile" ENABLE ROW LEVEL SECURITY;

-- Create Policies for user_sports
CREATE POLICY "Users can manage their own user_sports" ON "public"."user_sports" FOR ALL USING (auth.uid() = user_id);

-- Create Policies for health_settings
CREATE POLICY "Users can manage their own health_settings" ON "public"."health_settings" FOR ALL USING (auth.uid() = user_id);

-- Create Policies for health_daily_snapshots
CREATE POLICY "Users can manage their own health_daily_snapshots" ON "public"."health_daily_snapshots" FOR ALL USING (auth.uid() = user_id);

-- Create Policies for user_activity_profile
CREATE POLICY "Users can manage their own user_activity_profile" ON "public"."user_activity_profile" FOR ALL USING (auth.uid() = user_id);

-- Force schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
