import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');

    // Read and execute the migration SQL files
    const migration1 = readFileSync(join(__dirname, '../migrations/002_add_workspace_columns.sql'), 'utf8');
    await client.query(migration1);
    
    // Run the user_id type change migration
    const migration2 = readFileSync(join(__dirname, '../migrations/003_change_user_id_type.sql'), 'utf8');
    await client.query(migration2);

    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
