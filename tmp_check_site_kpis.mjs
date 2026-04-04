import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
try {
  const res = await pool.query('SELECT * FROM site_kpis_daily ORDER BY kpi_date DESC LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
} catch (err) {
  console.error(err.message);
} finally {
  await pool.end();
}
