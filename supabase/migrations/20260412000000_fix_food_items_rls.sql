-- Fix food_items RLS policy to use relationship with meals
DROP POLICY IF EXISTS "Users can view own food items" ON food_items;
CREATE POLICY "Users can view own food items" ON food_items 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM meals 
    WHERE meals.id = food_items.meal_id 
    AND meals.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own food items" ON food_items;
CREATE POLICY "Users can insert own food items" ON food_items 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM meals 
    WHERE meals.id = food_items.meal_id 
    AND meals.user_id = auth.uid()
  )
);

-- If coach_messages is missing, create it
CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coach messages" ON coach_messages;
CREATE POLICY "Users can view own coach messages" ON coach_messages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own coach messages" ON coach_messages;
CREATE POLICY "Users can insert own coach messages" ON coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
