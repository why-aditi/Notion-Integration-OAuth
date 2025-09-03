import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function runMigration() {
  try {
    const migrationFile = join(__dirname, '../migrations/001_create_notion_connections.sql');
    const command = `psql ${process.env.DATABASE_URL} -f ${migrationFile}`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('Migration warnings:', stderr);
    }
    
    console.log('Migration completed successfully');
    console.log(stdout);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
