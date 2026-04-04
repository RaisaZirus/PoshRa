import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkOrderItems() {
  try {
    console.log('Connecting to database...');
    const testResult = await pool.query('SELECT 1 as test');
    console.log('Database connection test:', testResult.rows);

    console.log('Checking seller_orders table for id 99...');
    const sellerOrderResult = await pool.query(`
      SELECT * FROM seller_orders WHERE seller_order_id = 99
    `);
    console.log('Seller order:', JSON.stringify(sellerOrderResult.rows, null, 2));

    console.log('\nChecking order_items for seller_order_id 99...');
    const orderItemsResult = await pool.query(`
      SELECT * FROM order_items WHERE seller_order_id = 99
    `);
    console.log('Order items:', JSON.stringify(orderItemsResult.rows, null, 2));

    if (orderItemsResult.rows.length > 0) {
      console.log('\nChecking product variants and products...');
      const result = await pool.query(`
        SELECT oi.*, pv.product_id, p.category_id, p.name as product_name, c.name as category_name
        FROM order_items oi
        JOIN product_variants pv ON pv.variant_id = oi.variant_id
        JOIN products p ON p.product_id = pv.product_id
        LEFT JOIN categories c ON c.category_id = p.category_id
        WHERE oi.seller_order_id = 99
      `);
      console.log('Full order items data:', JSON.stringify(result.rows, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkOrderItems();