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

async function checkCommissionSystem() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking commission system status...');

    // Check if commission_total column exists
    const columns = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'seller_orders' AND column_name = 'commission_total'
    `);
    console.log('✅ Commission column exists:', columns.rows.length > 0);

    // Check if admin_earnings table exists
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'admin_earnings'
    `);
    console.log('✅ Admin earnings table exists:', tables.rows.length > 0);

    // Check seller_orders with commission_total
    const orders = await client.query(`
      SELECT seller_order_id, order_id, subtotal, commission_total
      FROM seller_orders
      ORDER BY seller_order_id DESC
      LIMIT 3
    `);
    console.log('📊 Recent seller orders:', orders.rows);

    // Check admin_earnings
    const earnings = await client.query(`
      SELECT COUNT(*) as total_earnings,
             COALESCE(SUM(commission_amount), 0) as total_amount
      FROM admin_earnings
    `);
    console.log('💰 Admin earnings summary:', earnings.rows[0]);

    // Check finance_kpis_daily
    const kpis = await client.query(`
      SELECT kpi_date, commission_total
      FROM finance_kpis_daily
      WHERE commission_total > 0
      ORDER BY kpi_date DESC
      LIMIT 3
    `);
    console.log('📈 Finance KPIs:', kpis.rows);

  } catch (err) {
    console.error('❌ Check failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCommissionSystem();