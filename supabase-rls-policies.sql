-- Row Level Security (RLS) Policies for NotFat App
-- These policies ensure users can only access their own data

-- 1. Profiles table policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Meals table policies
CREATE POLICY "Users can view own meals" ON public.meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Food items table policies
CREATE POLICY "Users can view own food items" ON public.food_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meals 
      WHERE meals.id = food_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own food items" ON public.food_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meals 
      WHERE meals.id = food_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own food items" ON public.food_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.meals 
      WHERE meals.id = food_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own food items" ON public.food_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.meals 
      WHERE meals.id = food_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

-- 4. Water logs table policies
CREATE POLICY "Users can view own water logs" ON public.water_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs" ON public.water_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs" ON public.water_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Body metrics table policies
CREATE POLICY "Users can view own body metrics" ON public.body_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body metrics" ON public.body_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body metrics" ON public.body_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body metrics" ON public.body_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Nutrition goals table policies
CREATE POLICY "Users can view own nutrition goals" ON public.nutrition_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition goals" ON public.nutrition_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals" ON public.nutrition_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition goals" ON public.nutrition_goals
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Subscriptions table policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. Favorite meals table policies
CREATE POLICY "Users can view own favorite meals" ON public.favorite_meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite meals" ON public.favorite_meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite meals" ON public.favorite_meals
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_goals_updated_at BEFORE UPDATE ON public.nutrition_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
