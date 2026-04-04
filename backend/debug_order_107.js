import { pool } from './db.js';

async function debugOrder107() {
  const client = await pool.connect();

  try {
    console.log('🔍 Debugging Order 107\n');

    // Check order details
    const order = await client.query(`
      SELECT o.*, oc.applied_amount, c.code, c.discount_type, c.discount_value
      FROM orders o
      LEFT JOIN order_coupons oc ON oc.order_id = o.order_id
      LEFT JOIN coupons c ON c.coupon_id = oc.coupon_id
      WHERE o.order_id = 107
    `);
    console.log('Order details:', order.rows[0]);

    // Check seller orders
    const sellerOrders = await client.query(`
      SELECT so.*, s.business_name
      FROM seller_orders so
      JOIN sellers s ON s.seller_id = so.seller_id
      WHERE so.order_id = 107
    `);
    console.log('Seller orders:', sellerOrders.rows);

    // Check order items
    const items = await client.query(`
      SELECT oi.*, pv.price as original_price, p.name
      FROM order_items oi
      JOIN product_variants pv ON pv.variant_id = oi.variant_id
      JOIN products p ON p.product_id = pv.product_id
      WHERE oi.seller_order_id IN (SELECT seller_order_id FROM seller_orders WHERE order_id = 107)
    `);
    console.log('Order items:', items.rows);

  } catch (err) {
    console.error('❌ Debug failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

debugOrder107();