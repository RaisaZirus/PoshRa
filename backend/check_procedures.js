import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  try {
    const q = `SELECT proname, prokind, pg_get_functiondef(oid) AS def FROM pg_proc WHERE proname IN ('place_order','fn_place_order') ORDER BY proname;`;
    const res = await pool.query(q);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERR', err.message);
  } finally {
    await pool.end();
  }
}

main();


