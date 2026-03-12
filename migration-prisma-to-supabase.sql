-- Migration SQL for NotFat - Prisma Schema to Supabase
-- Execute this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height_value DECIMAL(5,2),
  height_unit TEXT DEFAULT 'cm',
  weight_value DECIMAL(5,2),
  weight_unit TEXT DEFAULT 'kg',
  activity_level DECIMAL(3,2) DEFAULT 1.5,
  nutrition_goals_id UUID REFERENCES nutrition_goals(id),
  hydration_goals_id UUID REFERENCES hydration_goals(id),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  show_calories BOOLEAN DEFAULT TRUE,
  show_hydration BOOLEAN DEFAULT TRUE,
  preferred_bottle_size INTEGER DEFAULT 500,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'trial')),
  subscription_id UUID REFERENCES subscriptions(id),
  steps_goal INTEGER,
  achievement_goal TEXT,
  user_id TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT,
  language TEXT DEFAULT 'es',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  dark_mode BOOLEAN DEFAULT FALSE,
  privacy_settings JSONB,
  health_settings_id UUID REFERENCES health_settings(id),
  user_activity_profile_id UUID REFERENCES user_activity_profile(id)
);

-- Nutrition Goals table
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  calories DECIMAL(8,2),
  protein DECIMAL(6,2),
  carbs DECIMAL(6,2),
  fat DECIMAL(6,2),
  fiber DECIMAL(6,2),
  sugar DECIMAL(6,2),
  sodium DECIMAL(8,2),
  water DECIMAL(8,2),
  vitamin_a DECIMAL(8,2),
  vitamin_c DECIMAL(8,2),
  vitamin_d DECIMAL(8,2),
  vitamin_b6 DECIMAL(8,2),
  vitamin_b12 DECIMAL(8,2),
  folate DECIMAL(8,2),
  iron DECIMAL(8,2),
  calcium DECIMAL(8,2),
  potassium DECIMAL(8,2),
  magnesium DECIMAL(8,2),
  zinc DECIMAL(8,2),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'algorithm', 'coach')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

-- Hydration Goals table
CREATE TABLE IF NOT EXISTS hydration_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target DECIMAL(8,2) DEFAULT 2000,
  target_unit TEXT DEFAULT 'ml',
  reminders_enabled BOOLEAN DEFAULT TRUE,
  reminder_interval INTEGER DEFAULT 2,
  start_time TIME DEFAULT '09:00:00',
  end_time TIME DEFAULT '21:00:00'
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_date DATE,
  meal_at TIMESTAMPTZ,
  total_calories DECIMAL(8,2) DEFAULT 0,
  total_protein DECIMAL(6,2) DEFAULT 0,
  total_carbs DECIMAL(6,2) DEFAULT 0,
  total_fat DECIMAL(6,2) DEFAULT 0,
  total_fiber DECIMAL(6,2) DEFAULT 0,
  total_sugar DECIMAL(6,2) DEFAULT 0,
  total_sodium DECIMAL(8,2) DEFAULT 0,
  image_url TEXT,
  image_url_aux TEXT,
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'camera', 'voice', 'text', 'barcode')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'complete', 'error')),
  recorded_timezone TEXT,
  llm_used TEXT,
  prompt_version TEXT,
  processing_time_ms INTEGER,
  api_time_ms INTEGER,
  text_description TEXT,
  analysis_result JSONB,
  feedback JSONB,
  recommendation JSONB,
  modified BOOLEAN DEFAULT FALSE,
  is_from_favorite BOOLEAN DEFAULT FALSE,
  barcode_number TEXT,
  scanned BOOLEAN DEFAULT FALSE,
  contributed BOOLEAN DEFAULT FALSE
);

-- Food Items table
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  name TEXT,
  quantity DECIMAL(8,2),
  unit TEXT DEFAULT 'g',
  calories DECIMAL(8,2) DEFAULT 0,
  protein DECIMAL(6,2) DEFAULT 0,
  carbs DECIMAL(6,2) DEFAULT 0,
  fat DECIMAL(6,2) DEFAULT 0,
  fiber DECIMAL(6,2) DEFAULT 0,
  sugar DECIMAL(6,2) DEFAULT 0,
  sodium DECIMAL(8,2) DEFAULT 0,
  vitamin_a DECIMAL(8,2),
  vitamin_c DECIMAL(8,2),
  vitamin_d DECIMAL(8,2),
  vitamin_b6 DECIMAL(8,2),
  vitamin_b12 DECIMAL(8,2),
  folate DECIMAL(8,2),
  iron DECIMAL(8,2),
  calcium DECIMAL(8,2),
  potassium DECIMAL(8,2),
  magnesium DECIMAL(8,2),
  zinc DECIMAL(8,2),
  barcode_number TEXT,
  scanned BOOLEAN DEFAULT FALSE,
  contributed BOOLEAN DEFAULT FALSE,
  nutriscore_grade TEXT CHECK (nutriscore_grade IN ('a', 'b', 'c', 'd', 'e')),
  nova_group INTEGER CHECK (nova_group >= 1 AND nova_group <= 4),
  labels_tags TEXT[],
  additives_tags TEXT[],
  nutria_score DECIMAL(5,2),
  nutria_score_breakdown JSONB,
  additives_details JSONB,
  is_alcoholic BOOLEAN DEFAULT FALSE,
  has_ingredients_data BOOLEAN DEFAULT FALSE,
  servings DECIMAL(4,2) DEFAULT 1
);

-- Water Logs table
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  volume DECIMAL(8,2),
  unit TEXT DEFAULT 'ml',
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'automatic')),
  timezone TEXT
);

-- Scan Events table
CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  origin TEXT DEFAULT 'mobile_app',
  result TEXT CHECK (result IN ('found', 'not_found', 'error')),
  product_name TEXT,
  processing_ms INTEGER,
  completed_at TIMESTAMPTZ
);

-- Task Queue table
CREATE TABLE IF NOT EXISTS task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('voice', 'image', 'barcode', 'analysis')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error', 'cancelled')),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  data JSONB,
  audio_url TEXT,
  text_description TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  last_error_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB
);

-- Coach Insights table
CREATE TABLE IF NOT EXISTS coach_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  insights JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  insight_type TEXT DEFAULT 'daily' CHECK (insight_type IN ('daily', 'weekly', 'monthly', 'custom')),
  is_read BOOLEAN DEFAULT FALSE
);

-- Contribution Queue table
CREATE TABLE IF NOT EXISTS contribution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  front_image_url TEXT,
  back_image_url TEXT,
  ingredients_image_url TEXT,
  nutrition_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  notes TEXT,
  moderator_notes TEXT
);

-- Health Settings table
CREATE TABLE IF NOT EXISTS health_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  apple_health_connected BOOLEAN DEFAULT FALSE,
  google_fit_connected BOOLEAN DEFAULT FALSE,
  sync_steps BOOLEAN DEFAULT TRUE,
  sync_weight BOOLEAN DEFAULT TRUE,
  sync_sleep BOOLEAN DEFAULT FALSE,
  sync_exercise BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_token TEXT,
  health_data_retention_days INTEGER DEFAULT 365
);

-- User Activity Profile table
CREATE TABLE IF NOT EXISTS user_activity_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  does_sport BOOLEAN DEFAULT FALSE,
  sport_types TEXT[],
  daily_activity_level TEXT CHECK (daily_activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
  activity_system_version TEXT DEFAULT 'custom',
  workout_frequency INTEGER CHECK (workout_frequency >= 0 AND workout_frequency <= 7),
  workout_duration_minutes INTEGER CHECK (workout_duration_minutes >= 0),
  steps_per_day_goal INTEGER DEFAULT 10000,
  active_calories_per_day_goal INTEGER DEFAULT 500
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT CHECK (plan_type IN ('free', 'premium_monthly', 'premium_yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'clp',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  auto_renew BOOLEAN DEFAULT TRUE,
  trial_ends_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_meal_date ON meals(meal_date);
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_food_items_meal_id ON food_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_logged_at ON water_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_scan_events_user_id ON scan_events(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_barcode ON scan_events(barcode);
CREATE INDEX IF NOT EXISTS idx_task_queue_user_id ON task_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_created_at ON task_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_coach_insights_user_id ON coach_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_insights_expires_at ON coach_insights(expires_at);
CREATE INDEX IF NOT EXISTS idx_contribution_queue_user_id ON contribution_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_queue_status ON contribution_queue(status);
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user_id ON nutrition_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_is_active ON nutrition_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own nutrition goals" ON nutrition_goals FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own nutrition goals" ON nutrition_goals FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own hydration goals" ON hydration_goals FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own hydration goals" ON hydration_goals FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own meals" ON meals FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own meals" ON meals FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own food items" ON food_items FOR SELECT USING (meal_id IN (SELECT id FROM meals WHERE user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text)));
CREATE POLICY "Users can manage own food items" ON food_items FOR ALL USING (meal_id IN (SELECT id FROM meals WHERE user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text)));

CREATE POLICY "Users can view own water logs" ON water_logs FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own water logs" ON water_logs FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own scan events" ON scan_events FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own scan events" ON scan_events FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own task queue" ON task_queue FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own task queue" ON task_queue FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own coach insights" ON coach_insights FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own coach insights" ON coach_insights FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own contributions" ON contribution_queue FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own contributions" ON contribution_queue FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own health settings" ON health_settings FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own health settings" ON health_settings FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own activity profile" ON user_activity_profile FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own activity profile" ON user_activity_profile FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can manage own subscriptions" ON subscriptions FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nutrition_goals_updated_at BEFORE UPDATE ON nutrition_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hydration_goals_updated_at BEFORE UPDATE ON hydration_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_water_logs_updated_at BEFORE UPDATE ON water_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scan_events_updated_at BEFORE UPDATE ON scan_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_queue_updated_at BEFORE UPDATE ON task_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coach_insights_updated_at BEFORE UPDATE ON coach_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contribution_queue_updated_at BEFORE UPDATE ON contribution_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_settings_updated_at BEFORE UPDATE ON health_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_activity_profile_updated_at BEFORE UPDATE ON user_activity_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email)
  VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
