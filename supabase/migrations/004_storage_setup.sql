-- This migration file provides instructions for setting up Supabase Storage
-- Run these commands in the Supabase SQL Editor or use the Supabase Dashboard

-- Note: Storage buckets are created via the Supabase Dashboard, not SQL
-- Go to Storage > Create Bucket

-- The bucket should be named: project-files
-- Settings:
--   - Public: false (private bucket, accessed via RLS)
--   - File size limit: Set according to your needs (default is fine)
--   - Allowed MIME types: Leave empty to allow all types

-- Create storage policies for the project-files bucket
-- These policies allow users to manage files for their own projects

-- Policy: Users can upload files to their project folders
CREATE POLICY "Users can upload to own project folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view files in their project folders
CREATE POLICY "Users can view own project files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete files from their project folders
CREATE POLICY "Users can delete own project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: The file path structure is: {project_id}/{timestamp}_{filename}
-- The first folder name is the project_id, and we check if it belongs to the user
-- by verifying the project exists and the user owns it

-- Alternative approach: Use a function to check project ownership
-- This is more secure but requires a function

CREATE OR REPLACE FUNCTION user_owns_project(project_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id_param
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated policies using the function (more secure)
DROP POLICY IF EXISTS "Users can upload to own project folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project files" ON storage.objects;

CREATE POLICY "Users can upload to own project folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  user_owns_project((storage.foldername(name))[1]::UUID)
);

CREATE POLICY "Users can view own project files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  user_owns_project((storage.foldername(name))[1]::UUID)
);

CREATE POLICY "Users can delete own project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' AND
  user_owns_project((storage.foldername(name))[1]::UUID)
);
