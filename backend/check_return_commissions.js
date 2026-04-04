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

async function checkReturnCommissions() {
  try {
    console.log('Checking admin earnings for orders with returns...');
    const result = await pool.query(`
      SELECT ae.*, rr.return_id, rr.status as return_status, oi.price, oi.quantity
      FROM admin_earnings ae
      JOIN seller_orders so ON so.seller_order_id = ae.seller_order_id
      JOIN orders o ON o.order_id = ae.order_id
      LEFT JOIN return_requests rr ON rr.order_item_id IN (
        SELECT order_item_id FROM order_items WHERE seller_order_id = so.seller_order_id
      )
      LEFT JOIN order_items oi ON oi.order_item_id = rr.order_item_id
      WHERE rr.status = 'completed'
      ORDER BY ae.earned_at DESC
    `);
    console.log('Admin earnings for returned items:', result.rows);

    console.log('\nChecking total admin earnings...');
    const totalResult = await pool.query('SELECT SUM(commission_amount) as total FROM admin_earnings');
    console.log('Total admin earnings:', totalResult.rows[0].total);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkReturnCommissions();