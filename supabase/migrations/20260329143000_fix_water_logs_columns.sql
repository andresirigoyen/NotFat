-- Check and fix water_logs columns
DO $$ BEGIN
    -- Rename 'amount' to 'volume' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_logs' AND column_name='amount') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_logs' AND column_name='volume') THEN
        ALTER TABLE "public"."water_logs" RENAME COLUMN "amount" TO "volume";
    END IF;

    -- Ensure 'volume' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_logs' AND column_name='volume') THEN
        ALTER TABLE "public"."water_logs" ADD COLUMN "volume" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_logs' AND column_name='logged_at') THEN
        ALTER TABLE "public"."water_logs" ADD COLUMN "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_logs' AND column_name='recorded_timezone') THEN
        ALTER TABLE "public"."water_logs" ADD COLUMN "recorded_timezone" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_logs' AND column_name='updated_at') THEN
        ALTER TABLE "public"."water_logs" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Also ensure RLS is enabled and policies are clean
ALTER TABLE "public"."water_logs" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'water_logs' AND policyname = 'Users can manage their own water logs'
    ) THEN
        CREATE POLICY "Users can manage their own water logs" ON "public"."water_logs"
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
