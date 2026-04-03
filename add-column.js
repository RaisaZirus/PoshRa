import { pool } from './backend/db.js';

async function addColumn() {
  try {
    await pool.query(`
      ALTER TABLE campaign_products
      ADD COLUMN IF NOT EXISTS original_discount_price NUMERIC(12,2);
    `);
    console.log('✅ Column added successfully');
  } catch (error) {
    console.error('❌ Error adding column:', error);
  } finally {
    process.exit(0);
  }
}

addColumn();