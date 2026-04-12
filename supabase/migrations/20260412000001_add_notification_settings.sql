-- Añadir campos de notificaciones a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notify_meals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_water BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_motivation BOOLEAN DEFAULT false;
