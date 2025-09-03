import { Pool } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAndUpdateSchema() {
  const client = await pool.connect();
  try {
    // Check if user_id column exists and is of type TEXT
    const result = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notion_connections' 
      AND column_name = 'user_id';
    `);

    if (result.rows.length === 0) {
      console.log('user_id column does not exist. Creating it...');
      await client.query('ALTER TABLE notion_connections ADD COLUMN user_id TEXT;');
      console.log('Added user_id column as TEXT type');
    } else if (result.rows[0].data_type !== 'text') {
      console.log('Changing user_id column type to TEXT...');
      await client.query('ALTER TABLE notion_connections ALTER COLUMN user_id TYPE TEXT;');
      console.log('Changed user_id column type to TEXT');
    } else {
      console.log('user_id column is already of type TEXT');
    }

    // Add any other necessary columns
    const columnsToAdd = [
      { name: 'workspace_id', type: 'TEXT' },
      { name: 'workspace_name', type: 'TEXT' },
      { name: 'bot_id', type: 'TEXT' }
    ];

    for (const column of columnsToAdd) {
      const colCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notion_connections' 
        AND column_name = $1;
      `, [column.name]);

      if (colCheck.rows.length === 0) {
        console.log(`Adding ${column.name} column...`);
        await client.query(`ALTER TABLE notion_connections ADD COLUMN ${column.name} ${column.type};`);
        console.log(`Added ${column.name} column`);
      } else {
        console.log(`${column.name} column already exists`);
      }
    }

    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Error updating schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndUpdateSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to update schema:', error);
    process.exit(1);
  });
