import { pool } from './db.js';

async function testCouponCommissionDeduction() {
  const client = await pool.connect();

  try {
    console.log('🧪 Testing Coupon Commission Deduction\n');

    // Find a recent order with coupon
    const orderWithCoupon = await client.query(`
      SELECT o.order_id, o.total_amount, oc.applied_amount,
             COUNT(so.seller_order_id) as seller_count,
             SUM(so.subtotal) as total_seller_subtotals,
             SUM(so.commission_total) as total_commissions
      FROM orders o
      JOIN order_coupons oc ON oc.order_id = o.order_id
      JOIN seller_orders so ON so.order_id = o.order_id
      WHERE o.payment_status = 'paid'
      GROUP BY o.order_id, o.total_amount, oc.applied_amount
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orderWithCoupon.rows.length === 0) {
      console.log('❌ No orders with coupons found. Please create a test order with a coupon first.');
      return;
    }

    const order = orderWithCoupon.rows[0];
    console.log(`📦 Order ${order.order_id}:`);
    console.log(`   Total: ৳${order.total_amount}`);
    console.log(`   Coupon discount: ৳${order.applied_amount}`);
    console.log(`   Seller subtotals: ৳${order.total_seller_subtotals}`);
    console.log(`   Total commissions: ৳${order.total_commissions}`);
    console.log(`   Sellers: ${order.seller_count}`);

    // Check individual seller orders
    const sellerOrders = await client.query(`
      SELECT so.seller_order_id, so.subtotal, so.commission_total,
             s.business_name
      FROM seller_orders so
      JOIN sellers s ON s.seller_id = so.seller_id
      WHERE so.order_id = $1
    `, [order.order_id]);

    console.log('\n🏪 Seller Orders:');
    sellerOrders.rows.forEach(so => {
      console.log(`   ${so.business_name}: Subtotal ৳${so.subtotal}, Commission ৳${so.commission_total}`);
    });

    // Verify commission calculation
    console.log('\n🔍 Verification:');
    const expectedCommissionRate = 8.5; // Default rate
    const discountedSubtotal = order.total_seller_subtotals;
    const expectedCommission = (discountedSubtotal * expectedCommissionRate / 100).toFixed(2);

    console.log(`   Expected commission (${expectedCommissionRate}% of ৳${discountedSubtotal}): ৳${expectedCommission}`);
    console.log(`   Actual commission: ৳${order.total_commissions}`);

    if (Math.abs(order.total_commissions - expectedCommission) < 0.01) {
      console.log('✅ Commission calculation is correct!');
    } else {
      console.log('❌ Commission calculation mismatch!');
    }

    // Check admin earnings
    const adminEarnings = await client.query(`
      SELECT SUM(commission_amount) as total_earned
      FROM admin_earnings
      WHERE order_id = $1
    `, [order.order_id]);

    console.log(`\n💰 Admin earnings recorded: ৳${adminEarnings.rows[0].total_earned || 0}`);

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testCouponCommissionDeduction();