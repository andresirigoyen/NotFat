-- ==========================================
-- 🛡️ DIAGNÓSTICO Y ARREGLO DE STORAGE (AVATARS)
-- Copia y pega este código en tu SQL Editor de Supabase
-- ==========================================

-- 1. Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpiar políticas viejas para evitar conflictos
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatar metadata" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own avatar metadata" ON storage.objects;

-- 3. Crear políticas ultra-robustas
-- SELECT: Cualquiera puede VER los avatares (si son públicos) o al menos el dueño
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- INSERT: Solo el dueño puede subir a SU carpeta
CREATE POLICY "Owner can upload avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Solo el dueño puede sobreescribir
CREATE POLICY "Owner can update avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. CONFIGURAR CORS (Paso Crítico para Web)
-- Esto permite que tu dominio de Vercel pueda subir archivos sin ser bloqueado por el navegador
-- Nota: 'wildcard' * es aceptable para desarrollo/pruebas, pero usa tu dominio real luego.
-- Ejecutar esto requiere permisos de admin (ya incluidos en el SQL Editor).
UPDATE storage.buckets 
SET allowed_mime_types = '{image/jpeg,image/png,image/gif,image/webp}',
    file_size_limit = 5242880  -- 5MB
WHERE id = 'avatars';

-- 5. VERIFICACIÓN DEL PERFIL
-- Asegurar que la columna avatar_url existe (ya debería, pero por si acaso)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;
