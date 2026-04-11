-- Ensure hydration_goals exists with correct column names
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hydration_goals') THEN
        CREATE TABLE "public"."hydration_goals" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
            "daily_goal" DOUBLE PRECISION NOT NULL DEFAULT 2000,
            "unit" TEXT NOT NULL DEFAULT 'ml',
            "preferred_bottle_size" INTEGER NOT NULL DEFAULT 500,
            "preferred_bottle_unit" TEXT NOT NULL DEFAULT 'ml',
            "reminder_frequency" TEXT NOT NULL DEFAULT '2hours',
            "reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "user_id" UUID NOT NULL,

            CONSTRAINT "hydration_goals_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "hydration_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
    ELSE
        -- Rename 'target' to 'daily_goal' if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='target') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='daily_goal') THEN
            ALTER TABLE "public"."hydration_goals" RENAME COLUMN "target" TO "daily_goal";
        END IF;

        -- Rename 'target_unit' to 'unit' if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='target_unit') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='unit') THEN
            ALTER TABLE "public"."hydration_goals" RENAME COLUMN "target_unit" TO "unit";
        END IF;

        -- Add other missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='daily_goal') THEN
            ALTER TABLE "public"."hydration_goals" ADD COLUMN "daily_goal" DOUBLE PRECISION NOT NULL DEFAULT 2000;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='unit') THEN
            ALTER TABLE "public"."hydration_goals" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'ml';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='preferred_bottle_size') THEN
            ALTER TABLE "public"."hydration_goals" ADD COLUMN "preferred_bottle_size" INTEGER NOT NULL DEFAULT 500;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='preferred_bottle_unit') THEN
            ALTER TABLE "public"."hydration_goals" ADD COLUMN "preferred_bottle_unit" TEXT NOT NULL DEFAULT 'ml';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='reminder_frequency') THEN
            ALTER TABLE "public"."hydration_goals" ADD COLUMN "reminder_frequency" TEXT NOT NULL DEFAULT '2hours';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='reminder_enabled') THEN
            ALTER TABLE "public"."hydration_goals" ADD COLUMN "reminder_enabled" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        -- Ensure any residual 'target' column is either NULLable or removed
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hydration_goals' AND column_name='target') THEN
            ALTER TABLE "public"."hydration_goals" ALTER COLUMN "target" DROP NOT NULL;
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE "public"."hydration_goals" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'hydration_goals' AND policyname = 'Users can manage their own hydration goals'
    ) THEN
        CREATE POLICY "Users can manage their own hydration goals" ON "public"."hydration_goals"
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
