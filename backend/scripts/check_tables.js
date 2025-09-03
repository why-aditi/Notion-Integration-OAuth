import { pool } from '../src/config/database.js';

async function checkTables() {
  const client = await pool.connect();
  try {
    // Check if the table exists
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notion_connections'
      )`
    );

    if (!tableExists.rows[0].exists) {
      console.log('Table notion_connections does not exist');
      return;
    }

    // Get table structure
    const columns = await client.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'notion_connections'`
    );

    console.log('Table structure:');
    console.table(columns.rows);

  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
