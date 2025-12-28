# Supabase Database Migrations

This directory contains SQL migration files for the LabMind database schema.

## Setup Instructions

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migration files in order:
   - `001_initial_schema.sql` - Creates the projects table and RLS policies
   - `002_notebooks_table.sql` - Creates the notebooks table and RLS policies
   - `003_files_storage.sql` - Creates the files table and RLS policies

4. Set up Storage bucket:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named `project-files`
   - Set it to public or configure RLS policies as needed

## Migration Files

### 001_initial_schema.sql

Creates:
- `projects` table with the following fields:
  - `id` (UUID, primary key)
  - `user_id` (UUID, references auth.users)
  - `title` (TEXT)
  - `description` (TEXT, nullable)
  - `quiz_responses` (JSONB, nullable)
  - `status` (TEXT, enum: draft, active, completed, archived)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

Also sets up:
- Row Level Security (RLS) policies
- Indexes for performance
- Automatic updated_at trigger

### 002_notebooks_table.sql

Creates:
- `notebooks` table with the following fields:
  - `id` (UUID, primary key)
  - `project_id` (UUID, references projects, unique)
  - `cells` (JSONB array)
  - `metadata` (JSONB)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

Sets up RLS policies for notebook access.

### 003_files_storage.sql

Creates:
- `files` table for tracking uploaded files:
  - `id` (UUID, primary key)
  - `project_id` (UUID, references projects)
  - `user_id` (UUID, references auth.users)
  - `name` (TEXT)
  - `path` (TEXT) - storage path
  - `size` (BIGINT)
  - `mime_type` (TEXT, nullable)
  - `created_at` (TIMESTAMPTZ)

Sets up RLS policies for file access.

## Storage Setup

Create a storage bucket named `project-files` in Supabase Storage with appropriate RLS policies.

## Notes

- The `auth.users` table is managed by Supabase Auth
- Row Level Security ensures users can only access their own projects, notebooks, and files
- All tables include proper indexes for performance