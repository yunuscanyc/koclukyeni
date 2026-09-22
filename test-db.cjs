const pg = require('pg');
require('dotenv').config();

const { Pool } = pg;

async function test() {
  const isConfigured = Boolean(
    process.env.DATABASE_URL ||
    (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD)
  );

  console.log('Is Configured:', isConfigured);
  console.log('DATABASE_URL present:', Boolean(process.env.DATABASE_URL));

  if (!isConfigured) {
    console.log('No database configured.');
    return;
  }

  const sslOption = process.env.DATABASE_URL?.includes('sslmode=disable')
    ? false
    : (process.env.PGSSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require'))
      ? { rejectUnauthorized: false }
      : false;

  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: sslOption }
    : {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: sslOption,
      };

  const pool = new Pool(config);

  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Successfully connected to DB:', res.rows[0]);

    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'archives'
    `);
    console.log('Archives Table Columns:');
    tableCheck.rows.forEach(r => console.log(`- ${r.column_name}: ${r.data_type}`));

    const archivesCount = await pool.query('SELECT COUNT(*) FROM archives');
    console.log('Total Archives:', archivesCount.rows[0].count);

    const newCount = await pool.query("SELECT COUNT(*) FROM archives WHERE is_new = true");
    console.log('New Archives:', newCount.rows[0].count);

    const samples = await pool.query("SELECT id, is_new, durum FROM archives LIMIT 5");
    console.log('Samples:', samples.rows);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await pool.end();
  }
}

test();
