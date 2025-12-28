-- Create notebooks table
CREATE TABLE IF NOT EXISTS notebooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cells JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_notebooks_project_id ON notebooks(project_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON notebooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view notebooks for their own projects
CREATE POLICY "Users can view own project notebooks"
    ON notebooks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = notebooks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Create policy: Users can insert notebooks for their own projects
CREATE POLICY "Users can insert own project notebooks"
    ON notebooks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = notebooks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Create policy: Users can update notebooks for their own projects
CREATE POLICY "Users can update own project notebooks"
    ON notebooks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = notebooks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Create policy: Users can delete notebooks for their own projects
CREATE POLICY "Users can delete own project notebooks"
    ON notebooks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = notebooks.project_id
            AND projects.user_id = auth.uid()
        )
    );
