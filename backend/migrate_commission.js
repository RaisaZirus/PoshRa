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

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Checking commission system schema...');

    // Check if commission_total column exists
    const columnResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'seller_orders' AND column_name = 'commission_total'
    `);

    if (columnResult.rows.length === 0) {
      await client.query('ALTER TABLE seller_orders ADD COLUMN commission_total NUMERIC(12,2) NOT NULL DEFAULT 0;');
      console.log('✅ Added commission_total to seller_orders');
    } else {
      console.log('ℹ️ commission_total column already exists');
    }

    // Check if admin_earnings table exists
    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'admin_earnings'
    `);

    if (tableResult.rows.length === 0) {
      await client.query(`
        CREATE TABLE admin_earnings (
          earning_id        BIGSERIAL PRIMARY KEY,
          order_id          BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
          seller_order_id   BIGINT NOT NULL REFERENCES seller_orders(seller_order_id) ON DELETE CASCADE,
          commission_amount NUMERIC(12,2) NOT NULL CHECK (commission_amount >= 0),
          earned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      console.log('✅ Created admin_earnings table');

      // Create indexes
      await client.query('CREATE INDEX idx_admin_earnings_order_id ON admin_earnings(order_id);');
      await client.query('CREATE INDEX idx_admin_earnings_seller_order_id ON admin_earnings(seller_order_id);');
      console.log('✅ Created indexes for admin_earnings');
    } else {
      console.log('ℹ️ admin_earnings table already exists');
    }

    console.log('🎉 Commission system schema is ready!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();