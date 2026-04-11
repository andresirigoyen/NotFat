-- ============================================================
-- 🧠 NotFat — SQL MAESTRO DE USUARIOS
-- Versión: 2026-04-11
-- Descripción: Script único e idempotente para configurar todo
--   el sistema de usuarios, suscripciones, límites y seguridad.
--   Seguro para ejecutar en producción sobre una DB ya existente.
-- ============================================================

-- ==========================================================
-- SECCIÓN 1: TABLA PRINCIPAL DE PERFILES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  gender TEXT DEFAULT 'other',
  avatar_url TEXT,
  role TEXT DEFAULT 'user',

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step TEXT DEFAULT 'welcome',

  -- Métricas físicas
  height_value DOUBLE PRECISION,
  weight_value DOUBLE PRECISION,
  height_unit TEXT DEFAULT 'cm',
  weight_unit TEXT DEFAULT 'kg',
  birth_date DATE,
  age INTEGER,

  -- Objetivos y preferencias nutricionales
  nutrition_goal TEXT,
  diet_type TEXT,
  activity_level TEXT,
  workout_frequency TEXT,
  fitness_goal TEXT,
  goal_pace TEXT,

  -- Suscripción y monetización
  subscription_tier TEXT DEFAULT 'free',       -- 'free' | 'pro'
  subscription_status TEXT DEFAULT 'inactive', -- 'active' | 'inactive' | 'cancelled'
  subscription_ends_at TIMESTAMPTZ,
  daily_scan_count INTEGER DEFAULT 0,
  last_scan_reset DATE DEFAULT CURRENT_DATE,

  -- Coach
  coach_style TEXT DEFAULT 'reto',  -- 'apoyo' | 'reto' | 'directo'
  coach_mode TEXT DEFAULT 'normal',

  -- Configuraciones de UI
  dark_mode BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'es',
  notifications_enabled BOOLEAN DEFAULT true,
  show_calories BOOLEAN DEFAULT true,
  show_hydration BOOLEAN DEFAULT true,
  steps_goal INTEGER DEFAULT 10000,
  preferred_bottle_size INTEGER DEFAULT 500,
  preferred_bottle_unit TEXT DEFAULT 'ml',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT profiles_gender_check CHECK (gender IN ('male', 'female', 'non_binary', 'other')),
  CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'pro'))
);

-- ==========================================================
-- SECCIÓN 2: TRIGGER DE CREACIÓN DE PERFIL AUTOMÁTICO
-- Se ejecuta cada vez que se registra un usuario en auth.users
-- ==========================================================

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
  v_full_name  := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(v_full_name, ' ', 1));
  v_last_name  := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    CASE WHEN position(' ' in v_full_name) > 0
      THEN substring(v_full_name from position(' ' in v_full_name) + 1)
      ELSE '' END
  );
  v_gender := COALESCE(NEW.raw_user_meta_data->>'gender', 'other');
  v_role   := COALESCE(NEW.raw_user_meta_data->>'role', 'user');

  INSERT INTO public.profiles (
    id, email, full_name, first_name, last_name, gender,
    onboarding_completed, onboarding_step, role,
    steps_goal, show_calories, show_hydration,
    preferred_bottle_size, preferred_bottle_unit,
    height_unit, weight_unit, language,
    notifications_enabled, dark_mode,
    subscription_tier, coach_style,
    updated_at, created_at
  ) VALUES (
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
    'cm', 'kg', 'es', true, false,
    'free', 'reto',
    NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- SECCIÓN 3: TABLA DE USO DIARIO (Límites Free vs Pro)
-- Persiste los contadores de escaneos y mensajes en el servidor
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  scans_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- Función atómica para incrementar contadores
CREATE OR REPLACE FUNCTION public.increment_user_usage(
  target_user_id UUID,
  column_name TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, usage_date, scans_count, messages_count, last_activity)
  VALUES (
    target_user_id,
    CURRENT_DATE,
    CASE WHEN column_name = 'scans_count' THEN 1 ELSE 0 END,
    CASE WHEN column_name = 'messages_count' THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, usage_date) DO UPDATE SET
    scans_count    = CASE WHEN column_name = 'scans_count'    THEN user_usage.scans_count + 1    ELSE user_usage.scans_count    END,
    messages_count = CASE WHEN column_name = 'messages_count' THEN user_usage.messages_count + 1 ELSE user_usage.messages_count END,
    last_activity  = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- SECCIÓN 4: TRIGGER DE SINCRONIZACIÓN
-- Refleja subscription_tier de profiles → auth.users metadata
-- Garantiza que el frontend lea el estado correcto siempre
-- ==========================================================

CREATE OR REPLACE FUNCTION public.sync_auth_metadata_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'subscription_tier', NEW.subscription_tier,
      'is_pro',            (NEW.subscription_tier = 'pro'),
      'subscription_status', NEW.subscription_status
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_auth_metadata ON public.profiles;
CREATE TRIGGER trigger_sync_auth_metadata
  AFTER UPDATE OF subscription_tier, subscription_status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_metadata_from_profile();

-- ==========================================================
-- SECCIÓN 5: TRIGGER DE SEGURIDAD
-- Bloquea que un usuario se "auto-suba" a Pro vía API directamente
-- Solo procesos autorizados (webhooks con Service Role) pueden hacerlo
-- ==========================================================

CREATE OR REPLACE FUNCTION public.protect_profile_tier_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF (auth.uid() = NEW.id) THEN
    IF (
      NEW.subscription_tier   IS DISTINCT FROM OLD.subscription_tier OR
      NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR
      NEW.role                IS DISTINCT FROM OLD.role
    ) THEN
      IF (
        current_setting('role') = 'authenticated' AND
        (OLD.role IS NULL OR OLD.role NOT IN ('admin', 'superadmin'))
      ) THEN
        -- Revertir silenciosamente los cambios no autorizados
        NEW.subscription_tier   := OLD.subscription_tier;
        NEW.subscription_status := OLD.subscription_status;
        NEW.role                := OLD.role;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_protect_profile_tier ON public.profiles;
CREATE TRIGGER trigger_protect_profile_tier
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_tier_columns();

-- ==========================================================
-- SECCIÓN 6: RLS (Row Level Security)
-- ==========================================================

-- Profiles
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes para crearlas de nuevo de forma limpia
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own usage"     ON public.user_usage;

CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own usage"     ON public.user_usage FOR SELECT USING (auth.uid() = user_id);

-- ==========================================================
-- SECCIÓN 7: ÍNDICES DE PERFORMANCE
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_date        ON public.user_usage(user_id, usage_date);

-- ==========================================================
-- SECCIÓN 8: RECARGA DE CACHÉ DE ESQUEMA
-- ==========================================================

NOTIFY pgrst, 'reload schema';
