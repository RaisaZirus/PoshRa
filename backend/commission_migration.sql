-- Commission System Migration
-- Add commission_total to seller_orders table
ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS commission_total NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Create admin_earnings table to track admin commission earnings
CREATE TABLE IF NOT EXISTS admin_earnings (
  earning_id        BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  seller_order_id   BIGINT NOT NULL REFERENCES seller_orders(seller_order_id) ON DELETE CASCADE,
  commission_amount NUMERIC(12,2) NOT NULL CHECK (commission_amount >= 0),
  earned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_earnings_order_id ON admin_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_admin_earnings_seller_order_id ON admin_earnings(seller_order_id);

-- Update place_order procedure to calculate commissions
-- (This will be applied when the full db.sql is run)

-- Create procedure to record admin earnings
CREATE OR REPLACE PROCEDURE record_admin_earnings(p_order_id BIGINT)
LANGUAGE plpgsql AS $$
DECLARE
  v_so_record RECORD;
BEGIN
  -- Only record earnings if order payment is completed
  IF NOT EXISTS (
    SELECT 1 FROM orders
    WHERE order_id = p_order_id AND payment_status = 'paid'
  ) THEN
    RAISE EXCEPTION 'Order % payment is not completed', p_order_id;
  END IF;

  -- Insert commission earnings for each seller order
  FOR v_so_record IN
    SELECT seller_order_id, commission_total
    FROM seller_orders
    WHERE order_id = p_order_id AND commission_total > 0
  LOOP
    INSERT INTO admin_earnings (order_id, seller_order_id, commission_amount)
    VALUES (p_order_id, v_so_record.seller_order_id, v_so_record.commission_total);
  END LOOP;

  -- Update daily finance KPIs
  INSERT INTO finance_kpis_daily (kpi_date, commission_total)
  VALUES (
    CURRENT_DATE,
    COALESCE((
      SELECT SUM(commission_total)
      FROM seller_orders
      WHERE order_id = p_order_id
    ), 0)
  )
  ON CONFLICT (kpi_date)
  DO UPDATE SET
    commission_total = finance_kpis_daily.commission_total + EXCLUDED.commission_total;

END;
$$ LANGUAGE plpgsql;

-- Create function to get admin earnings summary
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