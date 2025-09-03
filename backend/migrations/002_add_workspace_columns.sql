-- Add workspace_id column if it doesn't exist
ALTER TABLE notion_connections 
ADD COLUMN IF NOT EXISTS workspace_id TEXT,
ADD COLUMN IF NOT EXISTS workspace_name TEXT,
ADD COLUMN IF NOT EXISTS bot_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notion_connections_user_id_workspace_id_key'
    ) THEN
        ALTER TABLE notion_connections 
        ADD CONSTRAINT notion_connections_user_id_workspace_id_key 
        UNIQUE (user_id, workspace_id);
    END IF;
END $$;
