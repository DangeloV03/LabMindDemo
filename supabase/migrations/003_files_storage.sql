-- Create files table for tracking uploaded files
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view files for their own projects
CREATE POLICY "Users can view own project files"
    ON files FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert files for their own projects
CREATE POLICY "Users can insert own project files"
    ON files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete files for their own projects
CREATE POLICY "Users can delete own project files"
    ON files FOR DELETE
    USING (auth.uid() = user_id);
