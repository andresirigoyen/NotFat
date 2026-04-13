-- Storage Setup for NotFat Application
-- This migration creates the necessary buckets and sets up RLS policies

-- ============================================================================
-- 1. Create Buckets
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('contributions', 'contributions', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-uploads', 'audio-uploads', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Storage Policies (RLS)
-- ============================================================================

-- Clean up existing policies to allow re-runs
DROP POLICY IF EXISTS "Public Access for meal-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own meal images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own meal images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own meal images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for contributions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own contributions" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload contributions" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for audio-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own audio" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;

-- MEAL IMAGES
-- Allow users to view their own images metadata
CREATE POLICY "Users can view own meal images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'meal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload own meal images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own meal images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- CONTRIBUTIONS
-- Allow users to view their own contributions metadata
CREATE POLICY "Users can view own contributions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contributions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload contributions
CREATE POLICY "Users can upload contributions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'contributions' );


-- AUDIO UPLOADS
-- Allow users to view their own audio metadata
CREATE POLICY "Users can view own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to upload their own audio
CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Note: In voice input, the path is voice-input/${user.id}/${Date.now()}.m4a
-- So storage.foldername(name)[1] is 'voice-input' and [2] is user.id


-- AVATARS
-- Allow users to view their own avatar metadata
CREATE POLICY "Users can view own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
