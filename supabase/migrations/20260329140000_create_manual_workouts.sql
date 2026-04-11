-- Create manual_workouts table
CREATE TABLE IF NOT EXISTS "public"."manual_workouts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "workout_date" DATE NOT NULL,
    "sport_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "estimated_calories" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "manual_workouts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "manual_workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Enable RLS
ALTER TABLE "public"."manual_workouts" ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage their own manual workouts" ON "public"."manual_workouts"
    FOR ALL USING (auth.uid() = user_id);

-- Force schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
