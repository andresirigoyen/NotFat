-- Trigger para mantener auth.users metadata sincronizado con public.profiles
-- Esto garantiza que useAuthStore siempre tenga el tier correcto sin depender de webhooks externos

CREATE OR REPLACE FUNCTION sync_auth_metadata_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar la metadata del usuario en auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'subscription_tier', NEW.subscription_tier,
      'is_pro', (NEW.subscription_tier = 'pro'),
      'subscription_status', NEW.subscription_status
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe para evitar duplicados
DROP TRIGGER IF EXISTS trigger_sync_auth_metadata ON public.profiles;

-- Crear el trigger
CREATE TRIGGER trigger_sync_auth_metadata
AFTER UPDATE OF subscription_tier, subscription_status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_auth_metadata_from_profile();

-- Ejecutar sincronización inicial para usuarios existentes (Opcional pero recomendado)
-- UPDATE public.profiles SET subscription_tier = subscription_tier;
