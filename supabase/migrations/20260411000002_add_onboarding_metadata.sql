-- ==========================================================
-- 🧠 NotFat — EXTENSIÓN DE PERFILES PARA IA Y PSICOLOGÍA
-- ==========================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS target_weight_kg DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS traffic_source TEXT,
ADD COLUMN IF NOT EXISTS nutritional_plan JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS work_schedule TEXT,
ADD COLUMN IF NOT EXISTS hunger_trigger TEXT,
ADD COLUMN IF NOT EXISTS weekend_struggle TEXT;

-- Índice para búsquedas en metadata si fuera necesario
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_meta ON public.profiles USING GIN (onboarding_metadata);

COMMENT ON COLUMN public.profiles.onboarding_metadata IS 'Almacena datos psicográficos y conductuales recopilados en onboarding';
COMMENT ON COLUMN public.profiles.nutritional_plan IS 'Almacena el plan generado por la IA (calorías, macros, estrategia)';

-- ==========================================================
-- 🔒 POLÍTICAS DE SEGURIDAD (RLS) PARA METADATA
-- ==========================================================

-- Habilitar RLS es redundante si ya está habilitado en profiles, pero aseguramos las políticas.
-- Nota: En profiles ya suele haber una política: "Users can update their own profile" 
-- que cubre todas las columnas. 

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END $$;

-- Comentario de auditoría técnica
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario con soporte para IA, psicología conductual y seguridad clínica.';
