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
      SELECT oi.order_item_id, oi.variant_id, oi.quantity, oi.price,
             so.seller_order_id, so.status AS seller_status,
             o.order_id, o.customer_id, u.user_id, u.name, p.name AS product_name
      FROM order_items oi
      JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
      JOIN orders o ON o.order_id = so.order_id
      JOIN customers c ON c.customer_id = o.customer_id
      JOIN users u ON u.user_id = c.user_id
      JOIN product_variants pv ON pv.variant_id = oi.variant_id
      JOIN products p ON p.product_id = pv.product_id
      WHERE so.status = 'delivered'
      ORDER BY oi.order_item_id
      LIMIT 10
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();