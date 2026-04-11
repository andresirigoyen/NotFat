-- Migración para añadir soporte de personalidad del Coach y mejorar objetivos científicos

-- 1. Añadir coach_style a profiles para sincronizar con la IA
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_style TEXT DEFAULT 'reto';

-- 2. Asegurar que nutrition_goals tenga las columnas para el cálculo científico
ALTER TABLE public.nutrition_goals ADD COLUMN IF NOT EXISTS fiber INTEGER DEFAULT 25;
ALTER TABLE public.nutrition_goals ADD COLUMN IF NOT EXISTS water INTEGER DEFAULT 2000;
ALTER TABLE public.nutrition_goals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Actualizar planes existentes para que sean 'activos'
UPDATE public.nutrition_goals SET is_active = true WHERE is_active IS NULL;

-- 4. Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
