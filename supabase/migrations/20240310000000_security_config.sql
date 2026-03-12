-- Security Configuration for NotFat Application
-- This migration sets up CORS, Rate Limiting, and RLS policies

-- ============================================================================
-- CORS Configuration
-- ============================================================================

-- Enable CORS for specific origins
ALTER DATABASE postgres SET "app.current_setting_request_check" = on;

-- Create CORS configuration function
CREATE OR REPLACE FUNCTION set_cors_headers()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow specific origins
    IF (request_header('origin') = 'https://notfat.app' OR
        request_header('origin') = 'https://www.notfat.app' OR
        request_header('origin') = 'https://staging.notfat.app' OR
        request_header('origin') = 'http://localhost:3000' OR
        request_header('origin') = 'exp://192.168.1.100:8081') THEN
        
        PERFORM set_config('response.headers', 
            json_build_object(
                'Access-Control-Allow-Origin', request_header('origin'),
                'Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Headers', 'authorization,content-type,x-requested-with,x-api-key',
                'Access-Control-Allow-Credentials', 'true',
                'Access-Control-Max-Age', '86400'
            )
        );
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for CORS
CREATE TRIGGER set_cors_headers_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION set_cors_headers();

-- ============================================================================
-- Rate Limiting Setup
-- ============================================================================

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP address or user ID
    action VARCHAR(100) NOT NULL, -- API endpoint or action
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 minute'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);

-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier VARCHAR(255),
    p_action VARCHAR(100),
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 1
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
    window_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate window
    window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    window_end := NOW();
    
    -- Get current count in window
    SELECT COALESCE(SUM(count), 0) INTO current_count
    FROM rate_limits
    WHERE identifier = p_identifier
      AND action = p_action
      AND window_start <= window_end
      AND window_end >= window_start;
    
    -- Clean old records
    DELETE FROM rate_limits
    WHERE window_end < NOW() - INTERVAL '1 hour';
    
    -- Return results
    RETURN QUERY
    SELECT 
        current_count < p_max_requests as allowed,
        GREATEST(p_max_requests - current_count, 0) as remaining,
        window_end as reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rate limiting trigger function
CREATE OR REPLACE FUNCTION enforce_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    client_ip VARCHAR(255);
    user_id VARCHAR(255);
    identifier VARCHAR(255);
    rate_limit_result RECORD;
    max_requests INTEGER;
    window_minutes INTEGER;
BEGIN
    -- Get client IP
    client_ip := COALESCE(
        request_header('x-forwarded-for'),
        request_header('x-real-ip'),
        inet_client_addr()
    );
    
    -- Get user ID if authenticated
    user_id := COALESCE(
        current_setting('app.current_user_id')::TEXT,
        'anonymous'
    );
    
    -- Use user ID for authenticated requests, IP for anonymous
    identifier := CASE 
        WHEN TG_OP = 'INSERT' AND TG_TABLE_NAME = 'profiles' THEN user_id
        ELSE client_ip
    END;
    
    -- Set rate limits based on action
    CASE TG_TABLE_NAME
        WHEN 'profiles' THEN
            max_requests := 10; -- Registration/login attempts
            window_minutes := 15;
        WHEN 'meals' THEN
            max_requests := 100; -- Meal creation
            window_minutes := 1;
        WHEN 'payments' THEN
            max_requests := 5; -- Payment attempts
            window_minutes := 5;
        ELSE
            max_requests := 1000; -- Default
            window_minutes := 1;
    END CASE;
    
    -- Check rate limit
    SELECT * INTO rate_limit_result
    FROM check_rate_limit(identifier, TG_TABLE_NAME, max_requests, window_minutes);
    
    -- If rate limit exceeded, raise exception
    IF NOT rate_limit_result.allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for %', identifier
        USING ERRCODE = '22003', -- insufficient_privilege
              DETAIL = format('Maximum %s requests per %s minutes exceeded', max_requests, window_minutes),
              HINT = format('Try again in %s seconds', 
                          EXTRACT(EPOCH FROM (rate_limit_result.reset_time - NOW()))::INTEGER);
    END IF;
    
    -- Record this request
    INSERT INTO rate_limits (identifier, action, count, window_start, window_end)
    VALUES (
        identifier,
        TG_TABLE_NAME,
        1,
        NOW() - (window_minutes || ' minutes')::INTERVAL,
        NOW()
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply rate limiting triggers to critical tables
CREATE TRIGGER rate_limit_profiles_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION enforce_rate_limit();

CREATE TRIGGER rate_limit_meals_trigger
    BEFORE INSERT ON public.meals
    FOR EACH ROW EXECUTE FUNCTION enforce_rate_limit();

CREATE TRIGGER rate_limit_payments_trigger
    BEFORE INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION enforce_rate_limit();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_daily_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policies for profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.role IN ('admin', 'superadmin')
        )
    );

-- Meals RLS policies
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own meals" ON public.meals
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (user_id = auth.uid());

-- Food Items RLS policies
CREATE POLICY "Users can view own food items" ON public.food_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meals m 
            WHERE m.id = meal_id 
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own food items" ON public.food_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meals m 
            WHERE m.id = meal_id 
            AND m.user_id = auth.uid()
        )
    );

-- Water Logs RLS policies
CREATE POLICY "Users can manage own water logs" ON public.water_logs
    FOR ALL USING (user_id = auth.uid());

-- Body Metrics RLS policies
CREATE POLICY "Users can manage own body metrics" ON public.body_metrics
    FOR ALL USING (user_id = auth.uid());

-- Subscriptions RLS policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'superadmin')
        )
    );

-- Payments RLS policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'superadmin')
        )
    );

-- ============================================================================
-- Security Functions and Views
-- ============================================================================

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    role VARCHAR,
    is_admin BOOLEAN,
    is_creator BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        p.role,
        p.role IN ('admin', 'superadmin') as is_admin,
        p.role = 'creator' as is_creator
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(p_role VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN user_role = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to audit sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_operation(
    operation_type VARCHAR,
    table_name VARCHAR,
    record_id UUID,
    old_data JSONB,
    new_data JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        operation_type,
        table_name,
        record_id,
        user_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        operation_type,
        table_name,
        record_id,
        auth.uid(),
        old_data,
        new_data,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    user_id UUID REFERENCES public.profiles(id),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- Performance Optimizations
-- ============================================================================

-- Create partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meals_user_status ON public.meals(user_id, status) 
    WHERE status IN ('complete', 'analyzing');

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, meal_at DESC);

CREATE INDEX IF NOT EXISTS idx_food_items_meal_protein ON public.food_items(meal_id, protein) 
    WHERE protein > 0;

-- Create statistics for better query planning
ANALYZE public.profiles;
ANALYZE public.meals;
ANALYZE public.food_items;
ANALYZE public.water_logs;
ANALYZE public.body_metrics;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant specific permissions to anon users (for registration)
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT ON public.profiles TO anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_context() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role(VARCHAR) TO authenticated;
