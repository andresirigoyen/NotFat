-- Verificación de la migración UUID vs TEXT
-- Este script verifica que todas las referencias a profiles usen UUID consistentemente

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE MIGRACIÓN UUID ===';
    
    -- Verificar perfiles
    RAISE NOTICE '1. Tabla profiles.id debe ser UUID';
    
    -- Contar referencias user_id (deben ser UUID)
    RAISE NOTICE '2. Referencias user_id: %', (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE column_name = 'user_id' 
        AND table_schema = 'public'
        AND data_type = 'uuid'
    );
    
    -- Contar referencias profilesId (deben ser UUID)  
    RAISE NOTICE '3. Referencias profilesId: %', (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE column_name = 'profilesid' 
        AND table_schema = 'public'
        AND data_type = 'uuid'
    );
    
    -- Verificar que profiles.id sea UUID
    RAISE NOTICE '4. Tipo de profiles.id: %', (
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id' 
        AND table_schema = 'public'
    );
    
    RAISE NOTICE '=== VERIFICACIÓN COMPLETADA ===';
END $$;
