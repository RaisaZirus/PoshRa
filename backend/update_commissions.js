import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'poshra',
});

async function updateCommissions() {
  const client = await pool.connect();

  try {
    console.log('🔄 Updating existing seller orders with commissions...');

    // Update existing seller_orders with commission calculations
    const updateResult = await client.query(`
      UPDATE seller_orders
      SET commission_total = fn_calculate_commission(seller_order_id)
      WHERE commission_total = 0
    `);
    console.log('✅ Updated', updateResult.rowCount, 'seller orders with commissions');

    // Check updated orders
    const orders = await client.query(`
      SELECT seller_order_id, order_id, subtotal, commission_total
      FROM seller_orders
      WHERE commission_total > 0
      ORDER BY seller_order_id DESC
      LIMIT 5
    `);
    console.log('📊 Orders with commissions:', orders.rows);

  } catch (err) {
    console.error('❌ Update failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

updateCommissions();