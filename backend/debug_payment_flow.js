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

async function debugPaymentPayoutFlow() {
  const client = await pool.connect();

  try {
    console.log('🔍 DEBUGGING PAYMENT & PAYOUT FLOW\n');

    // 1. Check recent orders with commissions
    console.log('1️⃣ RECENT ORDERS WITH COMMISSIONS:');
    const orders = await client.query(`
      SELECT o.order_id, o.payment_status, o.total_amount, o.created_at::date as order_date,
             COUNT(so.seller_order_id) as seller_orders,
             SUM(so.subtotal) as gross_revenue,
             SUM(so.commission_total) as total_commissions,
             SUM(so.subtotal - so.commission_total) as net_revenue
      FROM orders o
      JOIN seller_orders so ON so.order_id = o.order_id
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY o.order_id, o.payment_status, o.total_amount, o.created_at::date
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    orders.rows.forEach(order => {
      console.log(`Order ${order.order_id}: ${order.payment_status}, Gross: ₹${order.gross_revenue}, Commissions: ₹${order.total_commissions}, Net: ₹${order.net_revenue}`);
    });

    // 2. Check admin earnings recording
    console.log('\n2️⃣ ADMIN EARNINGS RECORDING:');
    const earnings = await client.query(`
      SELECT ae.order_id, ae.seller_order_id, ae.commission_amount, ae.earned_at::date,
             o.payment_status, o.created_at::date as order_date
      FROM admin_earnings ae
      JOIN orders o ON o.order_id = ae.order_id
      WHERE ae.earned_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY ae.earned_at DESC
      LIMIT 10
    `);

    console.log(`Total admin earnings records: ${earnings.rows.length}`);
    earnings.rows.forEach(earning => {
      console.log(`Order ${earning.order_id}: ₹${earning.commission_amount} (${earning.payment_status})`);
    });

    // 3. Check finance KPIs
    console.log('\n3️⃣ FINANCE KPIs (Commission Tracking):');
    const finance = await client.query(`
      SELECT kpi_date, commission_total, payouts_requested, payouts_processed
      FROM finance_kpis_daily
      WHERE kpi_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY kpi_date DESC
    `);

    finance.rows.forEach(kpi => {
      console.log(`${kpi.kpi_date}: Commissions ₹${kpi.commission_total}, Requested ₹${kpi.payouts_requested}, Processed ₹${kpi.payouts_processed}`);
    });

    // 4. Check seller payout calculations
    console.log('\n4️⃣ SELLER PAYOUT CALCULATIONS:');
    const payouts = await client.query(`
      SELECT s.seller_id, u.name as seller_name,
             COALESCE(SUM(so.subtotal - so.commission_total), 0) as total_earned,
             COALESCE(SUM(CASE WHEN p.status = 'processed' THEN p.amount END), 0) as processed,
             COALESCE(SUM(CASE WHEN p.status = 'requested' THEN p.amount END), 0) as pending,
             GREATEST(0, COALESCE(SUM(so.subtotal - so.commission_total), 0) - COALESCE(SUM(CASE WHEN p.status = 'processed' THEN p.amount END), 0)) as available_balance
      FROM sellers s
      JOIN users u ON u.user_id = s.user_id
      LEFT JOIN seller_orders so ON so.seller_id = s.seller_id AND so.status = 'delivered'
      LEFT JOIN payouts p ON p.seller_id = s.seller_id
      GROUP BY s.seller_id, u.name
      HAVING COALESCE(SUM(so.subtotal - so.commission_total), 0) > 0
      ORDER BY available_balance DESC
      LIMIT 5
    `);

    payouts.rows.forEach(payout => {
      console.log(`${payout.seller_name}: Earned ₹${payout.total_earned}, Processed ₹${payout.processed}, Pending ₹${payout.pending}, Available ₹${payout.available_balance}`);
    });

    // 5. Check payout requests
    console.log('\n5️⃣ PAYOUT REQUESTS:');
    const requests = await client.query(`
      SELECT p.payout_id, u.name as seller_name, p.amount, p.status, p.requested_at::date,
             s.seller_id
      FROM payouts p
      JOIN sellers s ON s.seller_id = p.seller_id
      JOIN users u ON u.user_id = s.user_id
      WHERE p.requested_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY p.requested_at DESC
      LIMIT 10
    `);

    requests.rows.forEach(req => {
      console.log(`Payout ${req.payout_id}: ${req.seller_name} requested ₹${req.amount} (${req.status})`);
    });

    // 6. Check for data inconsistencies
    console.log('\n6️⃣ DATA CONSISTENCY CHECKS:');

    // Check if all paid orders have admin earnings recorded
    const missingEarnings = await client.query(`
      SELECT COUNT(*) as orders_without_earnings
      FROM orders o
      WHERE o.payment_status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM admin_earnings ae WHERE ae.order_id = o.order_id
      )
    `);
    console.log(`Orders paid but no admin earnings recorded: ${missingEarnings.rows[0].orders_without_earnings}`);

    // Check commission totals match between seller_orders and admin_earnings
    const commissionMismatch = await client.query(`
      SELECT
        SUM(so.commission_total) as seller_order_commissions,
        SUM(ae.commission_amount) as admin_earnings_total
      FROM seller_orders so
      LEFT JOIN admin_earnings ae ON ae.seller_order_id = so.seller_order_id
      WHERE so.status = 'delivered'
    `);
    console.log(`Seller order commissions: ₹${commissionMismatch.rows[0].seller_order_commissions || 0}`);
    console.log(`Admin earnings total: ₹${commissionMismatch.rows[0].admin_earnings_total || 0}`);

    // Check finance KPI totals
    const financeTotal = await client.query(`
      SELECT SUM(commission_total) as finance_total
      FROM finance_kpis_daily
    `);
    console.log(`Finance KPI commission total: ₹${financeTotal.rows[0].finance_total || 0}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

debugPaymentPayoutFlow();