-- Secure Storage Policies
-- Resolves security vulnerability: "Anyone can list all files in this bucket"
-- These policies restrict metadata visibility while maintaining public access to files via direct URL

-- 1. MEAL IMAGES
DROP POLICY IF EXISTS "Public Access for meal-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own meal images metadata" ON storage.objects;
CREATE POLICY "Authenticated users can view own meal images metadata"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'meal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. CONTRIBUTIONS
DROP POLICY IF EXISTS "Public Access for contributions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own contributions metadata" ON storage.objects;
CREATE POLICY "Authenticated users can view own contributions metadata"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contributions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. AUDIO UPLOADS
DROP POLICY IF EXISTS "Public Access for audio-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own audio metadata" ON storage.objects;
CREATE POLICY "Authenticated users can view own audio metadata"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. AVATARS
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatar metadata" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own avatar metadata" ON storage.objects;
CREATE POLICY "Authenticated users can view own avatar metadata"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- NOTE: Since the buckets themselves are marked as 'public: true', 
-- anyone can still DOWNLOAD the images if they have the direct URL.
-- These policies only prevent LISTING the bucket contents or checking metadata for files they don't own.
