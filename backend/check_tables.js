import { pool } from './db.js';

(async () => {
  try {
    const res = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    console.log('Tables in database:', res.rows.map(r => r.tablename));
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();

