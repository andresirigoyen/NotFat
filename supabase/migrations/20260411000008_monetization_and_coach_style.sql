-- Migración para añadir campos de monetización y personalización al perfil
-- Estos campos permiten manejar el estado Pro, el estilo del coach y los límites de escaneo

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_style TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_scan_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_scan_reset DATE DEFAULT CURRENT_DATE;

-- Sincronizar is_pro metadata con subscription_tier si existe (opcional)
-- UPDATE public.profiles SET subscription_tier = 'pro' WHERE (raw_user_meta_data->>'is_pro')::boolean = true;

-- Asegurar que coach_style tenga valor basado en coach_mode para usuarios existentes
UPDATE public.profiles SET coach_style = CASE 
    WHEN coach_mode = 'hard' THEN 'reto' 
    ELSE 'apoyo' 
END WHERE coach_style IS NULL;

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
