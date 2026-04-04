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

async function checkRecentCommissions() {
  const client = await pool.connect();

  try {
    console.log('Checking recent orders commission calculation...');

    // Check recent orders and their items
    const recentOrders = await client.query(`
      SELECT o.order_id, o.created_at, so.seller_order_id, so.subtotal, so.commission_total,
             COUNT(oi.order_item_id) as item_count
      FROM orders o
      JOIN seller_orders so ON so.order_id = o.order_id
      LEFT JOIN order_items oi ON oi.seller_order_id = so.seller_order_id
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '2 days'
      GROUP BY o.order_id, o.created_at, so.seller_order_id, so.subtotal, so.commission_total
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    for (const order of recentOrders.rows) {
      console.log(`Order ${order.order_id} (${order.created_at.toISOString().split('T')[0]}): Seller Order ${order.seller_order_id}, Subtotal ₹${order.subtotal}, Commission ₹${order.commission_total}, Items: ${order.item_count}`);

      // Check commission calculation for this order
      if (order.commission_total == 0) {
        const calc = await client.query('SELECT fn_calculate_commission($1) as calculated', [order.seller_order_id]);
        console.log(`  -> Manual calculation: ₹${calc.rows[0].calculated}`);
      }
    }

    // Check commission rates
    const rates = await client.query('SELECT * FROM commissions');
    console.log('\nCommission rates:', rates.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRecentCommissions();