# Supabase Storage Setup Guide

## Creating the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `project-files`
   - **Public bucket**: `false` (private, uses RLS)
   - **File size limit**: Leave default or set as needed
   - **Allowed MIME types**: Leave empty to allow all types

## Setting Up Storage Policies

After creating the bucket, you need to run the SQL from `004_storage_setup.sql` in the Supabase SQL Editor.

The policies ensure that:
- Users can only upload files to folders matching their project IDs
- Users can only view/download files from their own projects
- Users can only delete files from their own projects

## Testing Storage

After setup, you should be able to:
1. Upload files from the notebook page
2. See uploaded files in the files list
3. Download files
4. Delete files

If you encounter errors:
- Check that the bucket name is exactly `project-files`
- Verify the storage policies are applied
- Check browser console for detailed error messages
