-- Enable RLS on all main tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS manual_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coach_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_activity_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scan_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Meals policies
DROP POLICY IF EXISTS "Users can view own meals" ON meals;
CREATE POLICY "Users can view own meals" ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON meals FOR DELETE USING (auth.uid() = user_id);

-- Food items policies
CREATE POLICY "Users can view own food items" ON food_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food items" ON food_items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Water logs policies
CREATE POLICY "Users can view own water logs" ON water_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own water logs" ON water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own water logs" ON water_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own water logs" ON water_logs FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User sports policies
CREATE POLICY "Users can view own sports" ON user_sports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sports" ON user_sports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sports" ON user_sports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sports" ON user_sports FOR DELETE USING (auth.uid() = user_id);

-- Health settings policies
CREATE POLICY "Users can view own health settings" ON health_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health settings" ON health_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health settings" ON health_settings FOR UPDATE USING (auth.uid() = user_id);

-- Health daily snapshots policies
CREATE POLICY "Users can view own health snapshots" ON health_daily_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health snapshots" ON health_daily_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health snapshots" ON health_daily_snapshots FOR UPDATE USING (auth.uid() = user_id);

-- Manual workouts policies
CREATE POLICY "Users can view own workouts" ON manual_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON manual_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON manual_workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON manual_workouts FOR DELETE USING (auth.uid() = user_id);

-- Body metrics policies
CREATE POLICY "Users can view own body metrics" ON body_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body metrics" ON body_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body metrics" ON body_metrics FOR UPDATE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view own notification prefs" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification prefs" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification prefs" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Nutrition goals policies
CREATE POLICY "Users can view own nutrition goals" ON nutrition_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition goals" ON nutrition_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition goals" ON nutrition_goals FOR UPDATE USING (auth.uid() = user_id);

-- Coach messages policies
CREATE POLICY "Users can view own coach messages" ON coach_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coach messages" ON coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own coach messages" ON coach_messages FOR DELETE USING (auth.uid() = user_id);

-- Coach insights policies
CREATE POLICY "Users can view own coach insights" ON coach_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coach insights" ON coach_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily tips (read-only for all)
CREATE POLICY "Anyone can view daily tips" ON daily_tips FOR SELECT USING (true);

-- User activity profile policies
CREATE POLICY "Users can view own activity profile" ON user_activity_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity profile" ON user_activity_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity profile" ON user_activity_profile FOR UPDATE USING (auth.uid() = user_id);