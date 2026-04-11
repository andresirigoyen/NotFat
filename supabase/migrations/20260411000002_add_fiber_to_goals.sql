-- Add missing columns to nutrition_goals
ALTER TABLE "public"."nutrition_goals" 
ADD COLUMN IF NOT EXISTS "fiber" INTEGER,
ADD COLUMN IF NOT EXISTS "water" INTEGER,
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;

-- Update existing records to be active by default if not specified
UPDATE "public"."nutrition_goals" SET "is_active" = true WHERE "is_active" IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
