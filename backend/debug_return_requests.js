import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT rr.return_id, rr.order_item_id, rr.status, so.seller_order_id, so.seller_id,
             o.order_id, c.user_id AS customer_user_id, u.user_id AS seller_user_id
      FROM return_requests rr
      JOIN order_items oi ON oi.order_item_id = rr.order_item_id
      JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
      JOIN orders o ON o.order_id = so.order_id
      JOIN customers c ON c.customer_id = o.customer_id
      JOIN sellers s ON s.seller_id = so.seller_id
      LEFT JOIN users u ON u.user_id = s.user_id
      WHERE rr.status IN ('requested', 'completed')
      ORDER BY rr.return_id
      LIMIT 20
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();