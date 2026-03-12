-- Initialize NotFat database with extensions and basic setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_meal_at ON meals(meal_at);
CREATE INDEX IF NOT EXISTS idx_meals_status ON meals(status);

CREATE INDEX IF NOT EXISTS idx_food_items_meal_id ON food_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_food_items_barcode_number ON food_items(barcode_number);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_logged_at ON water_logs(logged_at);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_id ON body_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_measured_at ON body_metrics(measured_at);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    COUNT(DISTINCT m.id) as total_meals,
    COUNT(DISTINCT DATE(m.meal_at)) as active_days,
    COUNT(DISTINCT wl.id) as water_logs_count,
    COUNT(DISTINCT bm.id) as body_metrics_count,
    COALESCE(SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END), 0) as active_subscriptions,
    MAX(m.meal_at) as last_meal_at,
    MAX(wl.logged_at) as last_water_log_at,
    MAX(bm.measured_at) as last_body_metric_at
FROM profiles p
LEFT JOIN meals m ON p.id = m.user_id
LEFT JOIN water_logs wl ON p.id = wl.user_id
LEFT JOIN body_metrics bm ON p.id = bm.user_id
LEFT JOIN subscriptions s ON p.id = s.user_id AND s.status = 'active'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.role;

-- Create function for calculating nutrition goals
CREATE OR REPLACE FUNCTION calculate_daily_nutrition_goals(
    user_uuid UUID,
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    calories_target INTEGER,
    protein_target INTEGER,
    carbs_target INTEGER,
    fat_target INTEGER,
    calories_consumed INTEGER,
    protein_consumed INTEGER,
    carbs_consumed INTEGER,
    fat_consumed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_goals AS (
        SELECT 
            COALESCE(ng.calories, 2000) as calories_target,
            COALESCE(ng.protein, 100) as protein_target,
            COALESCE(ng.carbs, 250) as carbs_target,
            COALESCE(ng.fat, 65) as fat_target
        FROM nutrition_goals ng
        WHERE ng.user_id = user_uuid
        AND (ng.end_date IS NULL OR ng.end_date >= target_date)
        ORDER BY ng.created_at DESC
        LIMIT 1
    ),
    daily_consumption AS (
        SELECT 
            COALESCE(SUM(fi.calories), 0) as calories_consumed,
            COALESCE(SUM(fi.protein), 0) as protein_consumed,
            COALESCE(SUM(fi.carbs), 0) as carbs_consumed,
            COALESCE(SUM(fi.fat), 0) as fat_consumed
        FROM meals m
        JOIN food_items fi ON m.id = fi.meal_id
        WHERE m.user_id = user_uuid
        AND DATE(m.meal_at) = target_date
        AND m.status = 'complete'
    )
    SELECT 
        dg.calories_target,
        dg.protein_target,
        dg.carbs_target,
        dg.fat_target,
        dc.calories_consumed,
        dc.protein_consumed,
        dc.carbs_consumed,
        dc.fat_consumed
    FROM daily_goals dg
    CROSS JOIN daily_consumption dc;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO notfat;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO notfat;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO notfat;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO notfat;
