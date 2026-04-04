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

async function runProcedures() {
  const client = await pool.connect();

  try {
    console.log('🔄 Creating commission procedures and functions...');

    // Create record_admin_earnings procedure
    await client.query(`
      CREATE OR REPLACE PROCEDURE record_admin_earnings(p_order_id BIGINT)
      LANGUAGE plpgsql AS $$
      DECLARE
        v_so_record RECORD;
        v_commission_sum NUMERIC := 0;
      BEGIN
        -- Only record earnings if order payment is completed
        IF NOT EXISTS (
          SELECT 1 FROM orders
          WHERE order_id = p_order_id AND payment_status = 'paid'
        ) THEN
          RAISE EXCEPTION 'Order % payment is not completed', p_order_id;
        END IF;

        -- Calculate total commission for this order
        SELECT COALESCE(SUM(commission_total), 0) INTO v_commission_sum
        FROM seller_orders
        WHERE order_id = p_order_id AND commission_total > 0;

        -- Insert commission earnings for each seller order
        FOR v_so_record IN
          SELECT seller_order_id, commission_total
          FROM seller_orders
          WHERE order_id = p_order_id AND commission_total > 0
        LOOP
          INSERT INTO admin_earnings (order_id, seller_order_id, commission_amount)
          VALUES (p_order_id, v_so_record.seller_order_id, v_so_record.commission_total);
        END LOOP;

        -- Update daily finance KPIs (insert or update)
        IF v_commission_sum > 0 THEN
          -- Try to update existing record
          UPDATE finance_kpis_daily
          SET commission_total = commission_total + v_commission_sum
          WHERE kpi_date = CURRENT_DATE;

          -- If no record exists, insert new one
          IF NOT FOUND THEN
            INSERT INTO finance_kpis_daily (kpi_date, commission_total)
            VALUES (CURRENT_DATE, v_commission_sum);
          END IF;
        END IF;

      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created record_admin_earnings procedure');

    // Create fn_admin_earnings_summary function
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
    console.log('✅ Created fn_admin_earnings_summary function');

    console.log('🎉 Commission procedures and functions are ready!');

  } catch (err) {
    console.error('❌ Failed to create procedures:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runProcedures();