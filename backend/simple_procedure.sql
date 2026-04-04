-- Simple procedure to record admin earnings for a paid order
CREATE OR REPLACE PROCEDURE record_admin_earnings_simple(p_order_id BIGINT)
LANGUAGE plpgsql AS $$
DECLARE
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
  WHERE order_id = p_order_id;

  -- Insert earnings record if there are commissions
  IF v_commission_sum > 0 THEN
    INSERT INTO admin_earnings (order_id, seller_order_id, commission_amount)
    SELECT order_id, seller_order_id, commission_total
    FROM seller_orders
    WHERE order_id = p_order_id AND commission_total > 0;
  END IF;
END;
$$ LANGUAGE plpgsql;