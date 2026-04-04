import { pool } from './backend/db.js';

async function testNewRefundLogic() {
  const client = await pool.connect();

  try {
    console.log('🧪 Testing New Refund Logic: Exact Amount Paid (No Shipping Refund)\n');

    // Find an order with coupon to test
    const orderWithCoupon = await client.query(`
      SELECT DISTINCT o.order_id, o.total_amount, o.shipping_fee, o.created_at,
             COALESCE(oc.applied_amount, 0) as coupon_discount
      FROM orders o
      LEFT JOIN order_coupons oc ON oc.order_id = o.order_id
      JOIN seller_orders so ON so.order_id = o.order_id
      JOIN order_items oi ON oi.seller_order_id = so.seller_order_id
      JOIN return_requests r ON r.order_item_id = oi.order_item_id
      WHERE o.payment_status = 'paid'
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orderWithCoupon.rows.length === 0) {
      console.log('❌ No suitable orders found for testing');
      return;
    }

    const order = orderWithCoupon.rows[0];
    console.log(`📦 Order ${order.order_id}:`);
    console.log(`   Total paid: ₹${order.total_amount}`);
    console.log(`   Shipping fee: ₹${order.shipping_fee}`);
    console.log(`   Items paid: ₹${order.total_amount - order.shipping_fee}`);
    console.log(`   Coupon discount: ₹${order.coupon_discount}`);

    // Get all items in the order
    const itemsResult = await client.query(`
      SELECT oi.price, oi.quantity, p.name as product_name,
             (oi.price * oi.quantity) as item_total
      FROM order_items oi
      JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
      JOIN product_variants pv ON pv.variant_id = oi.variant_id
      JOIN products p ON p.product_id = pv.product_id
      WHERE so.order_id = $1
    `, [order.order_id]);

    const items = itemsResult.rows;
    const totalItemValue = items.reduce((sum, item) => sum + Number(item.item_total), 0);

    console.log('\n🛒 Order Items:');
    items.forEach((item, i) => {
      const percentage = (Number(item.item_total) / totalItemValue * 100).toFixed(1);
      const refundAmount = (order.total_amount - order.shipping_fee) * (Number(item.item_total) / totalItemValue);
      console.log(`   ${i + 1}. ${item.product_name}: ₹${item.item_total} (${percentage}% of order) → Refund: ₹${refundAmount.toFixed(2)}`);
    });

    console.log('\n✅ New Logic: Customer gets exactly what they paid for the item (proportional to order total)');
    console.log('❌ Shipping fees are NEVER refunded');

  } catch (error) {
    console.error('Error testing refund logic:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testNewRefundLogic();