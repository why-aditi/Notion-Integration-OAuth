import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  const client = await pool.connect();
  try {
    // Check connection
    console.log('Testing database connection...');
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Check if table exists
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notion_connections'
      )`
    );

    if (!tableExists.rows[0].exists) {
      console.log('❌ Table notion_connections does not exist');
      return;
    }

    console.log('\nTable notion_columns exists. Checking columns...');
    
    // Get table columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notion_connections'
      ORDER BY ordinal_position
    `);

    console.log('\nTable structure:');
    console.table(columns.rows);

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
