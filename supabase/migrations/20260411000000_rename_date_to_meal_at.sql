-- Rename date column to meal_at for consistency with the app code
ALTER TABLE meals RENAME COLUMN date TO meal_at;