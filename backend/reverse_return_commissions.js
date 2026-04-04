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

async function reverseExistingReturnCommissions() {
  try {
    console.log('Finding completed returns that need commission reversal...');

    // Get completed returns where admin earnings still exist
    const returnsResult = await pool.query(`
      SELECT rr.return_id, rr.order_item_id, oi.variant_id, oi.quantity, oi.price,
             so.seller_order_id, so.order_id, ae.earning_id, ae.commission_amount
      FROM return_requests rr
      JOIN order_items oi ON oi.order_item_id = rr.order_item_id
      JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
      JOIN admin_earnings ae ON ae.seller_order_id = so.seller_order_id
      WHERE rr.status = 'completed'
      AND ae.commission_amount > 0
    `);

    console.log(`Found ${returnsResult.rows.length} completed returns needing commission reversal`);

    for (const ret of returnsResult.rows) {
      console.log(`Processing return ${ret.return_id} for order_item ${ret.order_item_id}...`);

      // Calculate what the commission should be for this item
      const commissionResult = await pool.query(`
        SELECT
          CASE
            WHEN cr.percentage IS NOT NULL THEN ROUND(($1::numeric * $2::numeric * cr.percentage / 100), 2)
            ELSE ROUND(($1::numeric * $2::numeric * 8.50 / 100), 2)
          END as calculated_commission
        FROM product_variants pv
        JOIN products p ON p.product_id = pv.product_id
        LEFT JOIN commissions cr ON cr.category_id = p.category_id
        WHERE pv.variant_id = $3
      `, [ret.price, ret.quantity, ret.variant_id]);

      const calculatedCommission = Number(commissionResult.rows[0]?.calculated_commission || 0);

      console.log(`  Recorded commission: ${ret.commission_amount}, Calculated: ${calculatedCommission}`);

      if (calculatedCommission > 0) {
        // Delete the admin earnings record
        await pool.query(`
          DELETE FROM admin_earnings WHERE earning_id = $1
        `, [ret.earning_id]);

        // Update finance KPIs
        await pool.query(`
          UPDATE finance_kpis_daily
          SET commission_total = GREATEST(0, commission_total - $1)
          WHERE kpi_date = CURRENT_DATE
        `, [calculatedCommission]);

        console.log(`  Reversed commission of ₹${calculatedCommission}`);
      }
    }

    console.log('\nChecking final admin earnings total...');
    const totalResult = await pool.query('SELECT SUM(commission_amount) as total FROM admin_earnings');
    console.log('Total admin earnings after reversal:', totalResult.rows[0].total);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

reverseExistingReturnCommissions();