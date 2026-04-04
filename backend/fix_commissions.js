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

async function fixCommissions() {
  try {
    console.log('Finding seller orders with commission_total = 0 but have items...');

    const result = await pool.query(`
      SELECT so.seller_order_id, so.order_id, so.subtotal, COUNT(oi.order_item_id) as item_count
      FROM seller_orders so
      JOIN order_items oi ON oi.seller_order_id = so.seller_order_id
      WHERE so.commission_total = 0
      GROUP BY so.seller_order_id, so.order_id, so.subtotal
      HAVING COUNT(oi.order_item_id) > 0
      ORDER BY so.seller_order_id
    `);

    console.log(`Found ${result.rows.length} seller orders to fix`);

    for (const row of result.rows) {
      console.log(`Fixing seller_order_id ${row.seller_order_id} (order ${row.order_id})...`);

      // Calculate commission
      const commissionResult = await pool.query('SELECT fn_calculate_commission($1) as commission', [row.seller_order_id]);
      const commission = commissionResult.rows[0].commission;

      // Update commission_total
      await pool.query('UPDATE seller_orders SET commission_total = $1 WHERE seller_order_id = $2', [commission, row.seller_order_id]);

      console.log(`  Set commission_total to ${commission}`);
    }

    console.log('Commission fix completed');

    // Check if any orders need admin earnings recorded
    console.log('\nChecking for paid orders that need admin earnings recorded...');
    const earningsCheck = await pool.query(`
      SELECT DISTINCT o.order_id
      FROM orders o
      JOIN seller_orders so ON so.order_id = o.order_id
      WHERE o.payment_status = 'paid'
      AND so.commission_total > 0
      AND NOT EXISTS (
        SELECT 1 FROM admin_earnings ae WHERE ae.order_id = o.order_id
      )
    `);

    console.log(`Found ${earningsCheck.rows.length} paid orders that need admin earnings recorded`);

    for (const row of earningsCheck.rows) {
      console.log(`Recording admin earnings for order ${row.order_id}...`);
      try {
        await pool.query('CALL record_admin_earnings($1)', [row.order_id]);
        console.log(`  Admin earnings recorded for order ${row.order_id}`);
      } catch (err) {
        console.error(`  Error recording earnings for order ${row.order_id}:`, err.message);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

fixCommissions();