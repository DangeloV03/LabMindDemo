-- Create agent_sessions table
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_step INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'executing', 'completed', 'error', 'paused')),
    conversation_history JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_agent_sessions_project_id ON agent_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);

-- Create trigger for updated_at
CREATE TRIGGER update_agent_sessions_updated_at BEFORE UPDATE ON agent_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view agent sessions for their own projects
CREATE POLICY "Users can view own project agent sessions"
    ON agent_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = agent_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Create policy: Users can insert agent sessions for their own projects
CREATE POLICY "Users can insert own project agent sessions"
    ON agent_sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = agent_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Create policy: Users can update agent sessions for their own projects
CREATE POLICY "Users can update own project agent sessions"
    ON agent_sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = agent_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Create policy: Users can delete agent sessions for their own projects
CREATE POLICY "Users can delete own project agent sessions"
    ON agent_sessions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = agent_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );
