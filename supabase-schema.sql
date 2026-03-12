-- NotFat Database Schema for Supabase
-- Core tables for the nutrition tracking app

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  gender gender_enum,
  birth_date DATE,
  height DECIMAL(5,2),
  height_unit height_unit_enum DEFAULT 'cm',
  weight DECIMAL(5,2),
  weight_unit weight_unit_enum DEFAULT 'kg',
  activity_level DECIMAL(3,2) DEFAULT 1.5, -- 1.2-2.0 sedentary to very active
  goal_weight DECIMAL(5,2),
  daily_calorie_goal INTEGER,
  daily_protein_goal DECIMAL(6,2),
  daily_carbs_goal DECIMAL(6,2),
  daily_fat_goal DECIMAL(6,2),
  daily_water_goal INTEGER DEFAULT 2000, -- ml
  water_unit water_unit_enum DEFAULT 'ml',
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'free',
  user_role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Meals table
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meal_type meal_type_enum,
  meal_date DATE NOT NULL,
  meal_time TIME,
  status meal_status DEFAULT 'analyzing',
  source_type meal_source_type_enum,
  image_url TEXT,
  total_calories DECIMAL(8,2) DEFAULT 0,
  total_protein DECIMAL(8,2) DEFAULT 0,
  total_carbs DECIMAL(8,2) DEFAULT 0,
  total_fat DECIMAL(8,2) DEFAULT 0,
  total_fiber DECIMAL(8,2) DEFAULT 0,
  total_sugar DECIMAL(8,2) DEFAULT 0,
  total_sodium DECIMAL(8,2) DEFAULT 0,
  analysis_result JSONB, -- Store AI analysis results
  llm_model_used llm_model_enum,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Food items table (ingredients within meals)
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  quantity DECIMAL(8,2) NOT NULL,
  unit unit_enum DEFAULT 'g',
  calories DECIMAL(8,2) DEFAULT 0,
  protein DECIMAL(8,2) DEFAULT 0,
  carbs DECIMAL(8,2) DEFAULT 0,
  fat DECIMAL(8,2) DEFAULT 0,
  fiber DECIMAL(8,2) DEFAULT 0,
  sugar DECIMAL(8,2) DEFAULT 0,
  sodium DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Water logs table
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in ml
  unit water_unit_enum DEFAULT 'ml',
  log_date DATE NOT NULL,
  log_time TIME DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Body metrics table
CREATE TABLE IF NOT EXISTS public.body_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  body_fat_percentage DECIMAL(5,2),
  muscle_mass DECIMAL(5,2),
  waist_circumference DECIMAL(5,2),
  measurement_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Nutrition goals table
CREATE TABLE IF NOT EXISTS public.nutrition_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'weight_loss', 'muscle_gain', 'maintenance'
  target_weight DECIMAL(5,2),
  target_date DATE,
  daily_calorie_goal INTEGER,
  daily_protein_goal DECIMAL(6,2),
  daily_carbs_goal DECIMAL(6,2),
  daily_fat_goal DECIMAL(6,2),
  daily_water_goal INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL, -- 'monthly', 'annual'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired'
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'CLP',
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Favorite meals table
CREATE TABLE IF NOT EXISTS public.favorite_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, meal_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON public.meals(meal_date);
CREATE INDEX IF NOT EXISTS idx_food_items_meal_id ON public.food_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON public.water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON public.water_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_id ON public.body_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_date ON public.body_metrics(measurement_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user_id ON public.nutrition_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;
