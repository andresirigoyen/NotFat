-- Advanced Rate Limiting Functions for NotFat Application

-- ============================================================================
-- Enhanced Rate Limiting with Redis-like functionality
-- ============================================================================

-- Create rate limit buckets table
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_key VARCHAR(255) NOT NULL UNIQUE,
    tokens INTEGER NOT NULL DEFAULT 0,
    max_tokens INTEGER NOT NULL DEFAULT 100,
    refill_rate INTEGER NOT NULL DEFAULT 10, -- tokens per minute
    last_refill TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_key ON rate_limit_buckets(bucket_key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_refill ON rate_limit_buckets(last_refill);

-- Token bucket algorithm implementation
CREATE OR REPLACE FUNCTION consume_token_bucket(
    p_bucket_key VARCHAR(255),
    p_tokens INTEGER DEFAULT 1,
    p_max_tokens INTEGER DEFAULT 100,
    p_refill_rate INTEGER DEFAULT 10
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining_tokens INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    bucket RECORD;
    tokens_to_add INTEGER;
    time_since_refill INTERVAL;
    new_token_count INTEGER;
    allowed_result BOOLEAN;
BEGIN
    -- Get or create bucket
    SELECT * INTO bucket
    FROM rate_limit_buckets
    WHERE bucket_key = p_bucket_key
    FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Create new bucket
        INSERT INTO rate_limit_buckets (bucket_key, tokens, max_tokens, refill_rate)
        VALUES (p_bucket_key, p_max_tokens - p_tokens, p_max_tokens, p_refill_rate)
        RETURNING * INTO bucket;
        
        RETURN QUERY
        SELECT 
            (p_max_tokens - p_tokens) >= 0 as allowed,
            p_max_tokens - p_tokens as remaining_tokens,
            NOW() + INTERVAL '1 minute' as reset_time;
    END IF;
    
    -- Calculate tokens to add based on time elapsed
    time_since_refill := NOW() - bucket.last_refill;
    tokens_to_add := FLOOR(EXTRACT(EPOCH FROM time_since_refill) * bucket.refill_rate / 60);
    
    -- Update token count (don't exceed max)
    new_token_count := LEAST(bucket.max_tokens, bucket.tokens + tokens_to_add);
    
    -- Check if enough tokens
    allowed_result := new_token_count >= p_tokens;
    
    -- Update bucket
    UPDATE rate_limit_buckets
    SET 
        tokens = CASE 
            WHEN allowed_result THEN new_token_count - p_tokens
            ELSE new_token_count
        END,
        last_refill = NOW(),
        max_tokens = p_max_tokens,
        refill_rate = p_refill_rate
    WHERE bucket_key = p_bucket_key;
    
    -- Return results
    RETURN QUERY
    SELECT 
        allowed_result as allowed,
        CASE 
            WHEN allowed_result THEN new_token_count - p_tokens
            ELSE new_token_count
        END as remaining_tokens,
        NOW() + CEIL(p_tokens::FLOAT / bucket.refill_rate) * INTERVAL '1 minute' as reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting wrapper for API endpoints
CREATE OR REPLACE FUNCTION check_api_rate_limit(
    p_endpoint VARCHAR(100),
    p_method VARCHAR(10) DEFAULT 'GET',
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining_requests INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE,
    retry_after INTEGER
) AS $$
DECLARE
    bucket_key VARCHAR(255);
    rate_config RECORD;
    result RECORD;
BEGIN
    -- Get rate limiting config for this endpoint
    SELECT * INTO rate_config
    FROM (
        VALUES 
            ('/api/auth/login', 'POST', 5, 15), -- 5 requests per 15 minutes
            ('/api/auth/register', 'POST', 3, 60), -- 3 requests per hour
            ('/api/meals', 'POST', 100, 60), -- 100 requests per hour
            ('/api/meals', 'GET', 1000, 60), -- 1000 requests per hour
            ('/api/payments', 'POST', 5, 5), -- 5 requests per 5 minutes
            ('/api/scan', 'POST', 50, 60), -- 50 scans per hour
            ('/api/profile', 'PUT', 10, 60), -- 10 profile updates per hour
            ('default', 'GET', 1000, 60), -- Default GET limit
            ('default', 'POST', 100, 60) -- Default POST limit
    ) AS configs(endpoint, method, max_requests, window_minutes)
    WHERE endpoint = p_endpoint OR endpoint = 'default'
      AND method = p_method
    LIMIT 1;
    
    -- If no specific config, use defaults
    IF NOT FOUND THEN
        rate_config.endpoint := 'default';
        rate_config.method := p_method;
        rate_config.max_requests := 1000;
        rate_config.window_minutes := 60;
    END IF;
    
    -- Create bucket key based on user ID or IP
    bucket_key := CASE 
        WHEN p_user_id IS NOT NULL THEN 'user:' || p_user_id::TEXT
        WHEN p_ip_address IS NOT NULL THEN 'ip:' || p_ip_address::TEXT
        ELSE 'anonymous'
    END;
    
    bucket_key := bucket_key || ':' || rate_config.endpoint || ':' || rate_config.method;
    
    -- Check rate limit
    SELECT * INTO result
    FROM consume_token_bucket(
        bucket_key,
        1,
        rate_config.max_requests,
        CEIL(rate_config.max_requests::FLOAT / rate_config.window_minutes)
    );
    
    -- Calculate retry_after seconds
    RETURN QUERY
    SELECT 
        result.allowed,
        result.remaining_tokens as remaining_requests,
        result.reset_time,
        CASE 
            WHEN result.allowed THEN 0
            ELSE EXTRACT(EPOCH FROM (result.reset_time - NOW()))::INTEGER
        END as retry_after;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Advanced sliding window rate limiting
CREATE OR REPLACE FUNCTION check_sliding_window_rate_limit(
    p_identifier VARCHAR(255),
    p_action VARCHAR(100),
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 1
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_requests INTEGER,
    remaining_requests INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    window_start TIMESTAMP WITH TIME ZONE;
    current_count INTEGER;
BEGIN
    -- Calculate sliding window start
    window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Count requests in sliding window
    SELECT COUNT(*) INTO current_count
    FROM rate_limits
    WHERE identifier = p_identifier
      AND action = p_action
      AND window_start <= NOW()
      AND window_end >= window_start;
    
    -- Clean old records outside the window
    DELETE FROM rate_limits
    WHERE window_end < window_start;
    
    -- Return results
    RETURN QUERY
    SELECT 
        current_count < p_max_requests as allowed,
        current_count as current_requests,
        GREATEST(p_max_requests - current_count, 0) as remaining_requests,
        NOW() + p_window_minutes * INTERVAL '1 minute' as reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting for specific user actions
CREATE OR REPLACE FUNCTION check_user_action_rate_limit(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_max_requests INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    result RECORD;
BEGIN
    SELECT * INTO result
    FROM check_sliding_window_rate_limit(
        p_user_id::TEXT,
        p_action,
        p_max_requests,
        p_window_minutes
    );
    
    RETURN result.allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rate limiting triggers for sensitive operations
CREATE OR REPLACE FUNCTION enforce_user_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_id UUID;
    action_name VARCHAR(100);
    max_requests INTEGER;
    window_minutes INTEGER;
    allowed BOOLEAN;
BEGIN
    -- Get user ID from the row being modified
    CASE TG_TABLE_NAME
        WHEN 'profiles' THEN
            user_id := NEW.id;
            action_name := 'profile_update';
            max_requests := 10;
            window_minutes := 60;
        WHEN 'meals' THEN
            user_id := NEW.user_id;
            action_name := 'meal_creation';
            max_requests := 100;
            window_minutes := 60;
        WHEN 'payments' THEN
            user_id := NEW.user_id;
            action_name := 'payment_attempt';
            max_requests := 5;
            window_minutes := 5;
        ELSE
            user_id := COALESCE(NEW.user_id, OLD.user_id);
            action_name := TG_TABLE_NAME;
            max_requests := 1000;
            window_minutes := 60;
    END CASE;
    
    -- Skip rate limiting for admins
    IF EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = user_id 
        AND p.role IN ('admin', 'superadmin')
    ) THEN
        RETURN NULL;
    END IF;
    
    -- Check rate limit
    allowed := check_user_action_rate_limit(user_id, action_name, max_requests, window_minutes);
    
    -- If rate limit exceeded, raise exception
    IF NOT allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for action %', action_name
        USING ERRCODE = '22003', -- insufficient_privilege
              DETAIL = format('Maximum %s requests per %s minutes exceeded', max_requests, window_minutes),
              HINT = 'Please wait before trying again';
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply rate limiting triggers
DROP TRIGGER IF EXISTS rate_limit_profiles_update_trigger ON public.profiles;
CREATE TRIGGER rate_limit_profiles_update_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION enforce_user_rate_limit();

DROP TRIGGER IF EXISTS rate_limit_meals_insert_trigger ON public.meals;
CREATE TRIGGER rate_limit_meals_insert_trigger
    BEFORE INSERT ON public.meals
    FOR EACH ROW EXECUTE FUNCTION enforce_user_rate_limit();

DROP TRIGGER IF EXISTS rate_limit_payments_insert_trigger ON public.payments;
CREATE TRIGGER rate_limit_payments_insert_trigger
    BEFORE INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION enforce_user_rate_limit();

-- ============================================================================
-- Rate Limiting Monitoring and Cleanup
-- ============================================================================

-- Function to get rate limit statistics
CREATE OR REPLACE FUNCTION get_rate_limit_stats()
RETURNS TABLE (
    bucket_key VARCHAR,
    current_tokens INTEGER,
    max_tokens INTEGER,
    utilization_percent NUMERIC,
    last_refill TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bucket_key,
        tokens as current_tokens,
        max_tokens,
        ROUND((tokens::FLOAT / max_tokens::FLOAT) * 100, 2) as utilization_percent,
        last_refill
    FROM rate_limit_buckets
    ORDER BY utilization_percent DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits
    WHERE window_end < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT cleanup_rate_limits();');

-- ============================================================================
-- Rate Limiting API Helper Functions
-- ============================================================================

-- Function to get user's current rate limit status
CREATE OR REPLACE FUNCTION get_user_rate_limit_status(
    p_user_id UUID,
    p_endpoint VARCHAR(100) DEFAULT 'default'
)
RETURNS TABLE (
    endpoint VARCHAR,
    remaining_requests INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE,
    retry_after INTEGER
) AS $$
DECLARE
    bucket_key VARCHAR(255);
    result RECORD;
BEGIN
    bucket_key := 'user:' || p_user_id::TEXT || ':' || p_endpoint;
    
    SELECT * INTO result
    FROM consume_token_bucket(bucket_key, 0); -- Just check, don't consume
    
    RETURN QUERY
    SELECT 
        p_endpoint as endpoint,
        result.tokens as remaining_requests,
        result.reset_time,
        0 as retry_after;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset user's rate limit (admin only)
CREATE OR REPLACE FUNCTION reset_user_rate_limit(
    p_user_id UUID,
    p_endpoint VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    bucket_pattern VARCHAR;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'superadmin')
    ) THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;
    
    -- Delete specific or all buckets for user
    IF p_endpoint IS NOT NULL THEN
        DELETE FROM rate_limit_buckets
        WHERE bucket_key = 'user:' || p_user_id::TEXT || ':' || p_endpoint;
    ELSE
        DELETE FROM rate_limit_buckets
        WHERE bucket_key LIKE 'user:' || p_user_id::TEXT || ':%';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
