import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "poshra",
});

async function checkCoupons() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT code, discount_type, discount_value FROM coupons LIMIT 5');
    console.log('Available coupons:', result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCoupons();