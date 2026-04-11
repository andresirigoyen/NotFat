-- Migración para añadir campos faltantes a la tabla de perfiles
-- Estos campos son necesarios para el funcionamiento del perfil y el onboarding

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diet_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_frequency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nutrition_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_value DECIMAL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_value DECIMAL;

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
