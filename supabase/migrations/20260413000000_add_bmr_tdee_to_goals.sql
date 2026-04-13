-- Add BMR and TDEE columns to nutrition_goals for methodology snapshot
ALTER TABLE "public"."nutrition_goals" 
ADD COLUMN IF NOT EXISTS "bmr" INTEGER,
ADD COLUMN IF NOT EXISTS "tdee" INTEGER;
