import { pool } from './backend/db.js';

async function createFunction() {
  try {
    await pool.query(`
CREATE OR REPLACE FUNCTION revert_campaign_prices()
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET discount_price = cp.original_discount_price
  FROM campaign_products cp
  JOIN campaigns c ON c.campaign_id = cp.campaign_id
  WHERE product_variants.variant_id = cp.variant_id
    AND NOW() > c.end_time;

  DELETE FROM campaign_products
  WHERE campaign_id IN (
    SELECT campaign_id FROM campaigns WHERE NOW() > end_time
  );
END;
$$ LANGUAGE plpgsql;
    `);
    console.log('✅ Function created successfully');
  } catch (error) {
    console.error('❌ Error creating function:', error);
  } finally {
    process.exit(0);
  }
}

createFunction();