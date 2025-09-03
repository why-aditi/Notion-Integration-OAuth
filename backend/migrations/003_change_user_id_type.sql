-- Change user_id column type from UUID to TEXT
ALTER TABLE notion_connections 
ALTER COLUMN user_id TYPE TEXT;
