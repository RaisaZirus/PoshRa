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

async function fixAdminDashboard() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing admin dashboard function...');

    // Create the missing function
    await client.query(`
      CREATE OR REPLACE FUNCTION fn_admin_earnings_summary()
      RETURNS TABLE (
        total_earnings     NUMERIC,
        today_earnings     NUMERIC,
        monthly_earnings   NUMERIC,
        yearly_earnings    NUMERIC
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          COALESCE(SUM(ae.commission_amount), 0) AS total_earnings,
          COALESCE(SUM(CASE WHEN DATE(ae.earned_at) = CURRENT_DATE THEN ae.commission_amount END), 0) AS today_earnings,
          COALESCE(SUM(CASE WHEN DATE_TRUNC('month', ae.earned_at) = DATE_TRUNC('month', CURRENT_DATE) THEN ae.commission_amount END), 0) AS monthly_earnings,
          COALESCE(SUM(CASE WHEN DATE_TRUNC('year', ae.earned_at) = DATE_TRUNC('year', CURRENT_DATE) THEN ae.commission_amount END), 0) AS yearly_earnings
        FROM admin_earnings ae;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Function created successfully');

    // Test the function
    const test = await client.query('SELECT * FROM fn_admin_earnings_summary()');
    console.log('Function test result:', test.rows[0]);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminDashboard();