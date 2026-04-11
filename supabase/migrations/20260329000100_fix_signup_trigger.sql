-- Fix for 'Database error saving new user'
-- This updates the profile creation trigger to populate all required NOT NULL fields
-- and ensures 'non_binary' is a valid gender option.

-- 1. Correct the gender constraint to include 'non_binary'
DO $$ BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_check CHECK (gender IN ('male', 'female', 'non_binary', 'other'));
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table public.profiles does not exist yet. This migration might be running out of order.';
END $$;

-- 2. Update the profile creation trigger to populate all required fields from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_full_name TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_gender TEXT;
    v_role TEXT;
BEGIN
    -- Extract values from metadata with defaults
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(v_full_name, ' ', 1));
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', CASE WHEN position(' ' in v_full_name) > 0 THEN substring(v_full_name from position(' ' in v_full_name) + 1) ELSE '' END);
    v_gender := COALESCE(NEW.raw_user_meta_data->>'gender', 'other');
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');

    INSERT INTO public.profiles (
        id, 
        email, 
        full_name,
        first_name, 
        last_name, 
        gender, 
        onboarding_completed, 
        onboarding_step, 
        role, 
        steps_goal, 
        show_calories, 
        show_hydration, 
        preferred_bottle_size,
        preferred_bottle_unit,
        height_unit,
        weight_unit,
        language,
        notifications_enabled,
        dark_mode,
        updated_at,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        v_first_name,
        v_last_name,
        v_gender,
        COALESCE((NEW.raw_user_meta_data->>'onboarding_completed')::boolean, false),
        COALESCE(NEW.raw_user_meta_data->>'onboarding_step', 'welcome'),
        v_role,
        COALESCE((NEW.raw_user_meta_data->>'steps_goal')::integer, 10000),
        COALESCE((NEW.raw_user_meta_data->>'show_calories')::boolean, true),
        COALESCE((NEW.raw_user_meta_data->>'show_hydration')::boolean, true),
        COALESCE((NEW.raw_user_meta_data->>'preferred_bottle_size')::integer, 500),
        COALESCE(NEW.raw_user_meta_data->>'preferred_bottle_unit', 'ml'),
        'cm',
        'kg',
        'es',
        true,
        false,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log errors without crashing the main transaction
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
