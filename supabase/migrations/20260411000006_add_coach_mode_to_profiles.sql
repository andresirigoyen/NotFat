-- Migración para añadir el campo coach_mode a los perfiles de usuario
-- Esto permite diferenciar entre el modo 'hard' (Fuego Real) y 'soft' (Modo Aliado)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_mode TEXT DEFAULT 'soft';

-- Asegurar que la columna tenga un valor por defecto para usuarios existentes
UPDATE public.profiles SET coach_mode = 'soft' WHERE coach_mode IS NULL;

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
