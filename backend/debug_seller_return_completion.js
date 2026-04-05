import { pool } from './db.js';

const returnId = 32;

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sellerId = 5; // Use actual seller id from debug

    const retRows = await client.query(
      `SELECT rr.return_id, rr.order_item_id, oi.variant_id, oi.quantity, oi.price,
              so.seller_order_id, so.order_id, so.seller_id,
              o.customer_id, c.user_id, p.name AS product_name
       FROM return_requests rr
       JOIN order_items oi      ON oi.order_item_id   = rr.order_item_id
       JOIN seller_orders so    ON so.seller_order_id = oi.seller_order_id
       JOIN orders o            ON o.order_id         = so.order_id
       JOIN customers c         ON c.customer_id      = o.customer_id
       JOIN product_variants pv ON pv.variant_id      = oi.variant_id
       JOIN products p          ON p.product_id       = pv.product_id
       WHERE rr.return_id = $1 AND so.seller_id = $2`,
      [returnId, sellerId]
    );
    console.log('retRows', retRows.rows);
    if (!retRows.rows.length) throw new Error('Return request not found');
    const ret = retRows.rows[0];

    console.log('update return_requests');
    await client.query(`UPDATE return_requests SET status = $1 WHERE return_id = $2`, ['completed', returnId]);

    console.log('restore stock');
    await client.query(`UPDATE product_variants SET stock = stock + $1 WHERE variant_id = $2`, [ret.quantity, ret.variant_id]);

    let refundAmount = 0;

    // Get order details including shipping
    const { rows: orderRows } = await client.query(
      `SELECT o.total_amount, o.shipping_fee,
              COALESCE(oc.applied_amount, 0) as coupon_discount
       FROM orders o
       LEFT JOIN order_coupons oc ON oc.order_id = o.order_id
       WHERE o.order_id = $1`,
      [ret.order_id]
    );

    if (orderRows.length > 0) {
      const orderTotal = Number(orderRows[0].total_amount);
      const shippingFee = Number(orderRows[0].shipping_fee);

      // Amount customer paid for items only (excluding shipping)
      const itemsPaid = orderTotal - shippingFee;

      // Get total value of all items in the order
      const { rows: allItemsRows } = await client.query(
        `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_item_value
         FROM order_items oi
         JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
         WHERE so.order_id = $1`,
        [ret.order_id]
      );

      const totalItemValue = Number(allItemsRows[0]?.total_item_value || 0);

      if (totalItemValue > 0) {
        // Calculate what percentage this returned item represents
        const itemValue = Number(ret.price) * ret.quantity;
        const itemPercentage = itemValue / totalItemValue;

        // Refund that percentage of what customer paid for items
        refundAmount = itemsPaid * itemPercentage;
      }
    }

    console.log('refundAmount final', refundAmount);

    const paymentRows = await client.query(`SELECT payment_id FROM payments WHERE order_id = $1 LIMIT 1`, [ret.order_id]);
    console.log('paymentRows', paymentRows.rows);
    if (paymentRows.rows.length) {
      const paymentId = paymentRows.rows[0].payment_id;
      console.log('insert refund', paymentId, refundAmount);
      await client.query(`INSERT INTO refunds (payment_id, amount, status) VALUES ($1, $2, 'processed')`, [paymentId, refundAmount]);
    }

    console.log('insert notification');
    await client.query(`INSERT INTO notifications (user_id, type, message) VALUES ($1, 'refund', $2)`, [ret.user_id, `Your refund of ৳${refundAmount.toFixed(2)} for "${ret.product_name}" has been processed. Note: Shipping fees are not refunded.`]);

    const returnedPrice = Number(ret.price);
    const returnedQuantity = Number(ret.quantity);
    const commissionRows = await client.query(`SELECT CASE WHEN cr.percentage IS NOT NULL THEN ROUND(($1::numeric * $2::numeric * cr.percentage / 100), 2) ELSE ROUND(($1::numeric * $2::numeric * 8.50 / 100), 2) END as item_commission FROM product_variants pv JOIN products p ON p.product_id = pv.product_id LEFT JOIN commissions cr ON cr.category_id = p.category_id WHERE pv.variant_id = $3`, [returnedPrice, returnedQuantity, ret.variant_id]);
    console.log('commissionRows', commissionRows.rows);
    const itemCommission = Number(commissionRows.rows[0]?.item_commission || 0);
    console.log('itemCommission', itemCommission);

    console.log('delete order_items');
    await client.query(`DELETE FROM order_items WHERE order_item_id = $1`, [ret.order_item_id]);

    console.log('delete admin_earnings');
    await client.query(`DELETE FROM admin_earnings WHERE order_id = $1 AND seller_order_id = $2 AND commission_amount = $3`, [ret.order_id, ret.seller_order_id, itemCommission]);

    console.log('update finance_kpis_daily');
    await client.query(`UPDATE finance_kpis_daily SET commission_total = GREATEST(0, commission_total - $1) WHERE kpi_date = CURRENT_DATE`, [itemCommission]);

    const remaining = await client.query(`SELECT COUNT(*)::int AS cnt FROM order_items WHERE seller_order_id = $1`, [ret.seller_order_id]);
    console.log('remaining', remaining.rows[0]);

    if (remaining.rows[0].cnt === 0) {
      console.log('making seller_order cancelled');
      await client.query(`UPDATE seller_orders SET status = 'cancelled', commission_total = 0 WHERE seller_order_id = $1`, [ret.seller_order_id]);
      console.log('update orders status');
      await client.query(`UPDATE orders SET order_status = 'returned' WHERE order_id = $1 AND NOT EXISTS (SELECT 1 FROM seller_orders WHERE order_id = $1 AND status NOT IN ('returned', 'cancelled'))`, [ret.order_id]);
    } else {
      console.log('recalculate commission');
      const newCommissionRows = await client.query(`SELECT fn_calculate_commission($1) as new_commission`, [ret.seller_order_id]);
      console.log('newCommissionRows', newCommissionRows.rows);
      const newCommission = Number(newCommissionRows.rows[0]?.new_commission || 0);
      console.log('newCommission', newCommission);
      await client.query(`UPDATE seller_orders SET subtotal = (SELECT COALESCE(SUM(price * quantity), 0) FROM order_items WHERE seller_order_id = $1), commission_total = $2 WHERE seller_order_id = $1`, [ret.seller_order_id, newCommission]);
    }

    await client.query('COMMIT');
    console.log('COMMIT successful');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('debug error:', err);
  } finally {
    client.release();
  }
}

run();