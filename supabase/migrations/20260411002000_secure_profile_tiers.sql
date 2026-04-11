-- Proteger las columnas críticas de suscripción para que solo puedan ser cambiadas
-- por funciones internas o administradores, NO por el usuario directamente vía API.

CREATE OR REPLACE FUNCTION protect_profile_tier_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario intenta cambiar su propio tier o rol directamente
  IF (auth.uid() = NEW.id) THEN
    -- Bloquear cambios en tier, status o role si el usuario actual es un usuario normal (authenticated)
    -- y no es un administrador.
    IF (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier OR 
        NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR
        NEW.role IS DISTINCT FROM OLD.role) THEN
      
      -- Permitir el cambio SOLO si el rol de la sesión NO es 'authenticated' (ej: Service Role)
      -- o si el usuario ya es un admin tratando de cambiarse a sí mismo (arriesgado but common)
      IF (current_setting('role') = 'authenticated' AND (OLD.role IS NULL OR OLD.role NOT IN ('admin', 'superadmin'))) THEN
        -- Restaurar los valores originales para evitar el "auto-upgrade"
        NEW.subscription_tier := OLD.subscription_tier;
        NEW.subscription_status := OLD.subscription_status;
        NEW.role := OLD.role;
        
        -- Opcional: Podríamos lanzar un error, pero restaurar es más silencioso y efectivo
        -- RAISE EXCEPTION 'No tienes permiso para cambiar tu nivel de suscripción directamente.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar el trigger de protección
DROP TRIGGER IF EXISTS trigger_protect_profile_tier ON public.profiles;

CREATE TRIGGER trigger_protect_profile_tier
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION protect_profile_tier_columns();
