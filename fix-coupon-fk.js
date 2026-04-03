import { pool } from './backend/db.js';

async function fixCouponForeignKey() {
  try {
    // First, drop the existing foreign key
    await pool.query(`
      ALTER TABLE order_coupons
      DROP CONSTRAINT order_coupons_coupon_id_fkey;
    `);
    console.log('✅ Dropped old foreign key');

    // Add the new foreign key with CASCADE
    await pool.query(`
      ALTER TABLE order_coupons
      ADD CONSTRAINT order_coupons_coupon_id_fkey
      FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE CASCADE;
    `);
    console.log('✅ Added new foreign key with ON DELETE CASCADE');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixCouponForeignKey();