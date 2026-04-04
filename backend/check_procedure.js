import { pool } from './db.js';

async function checkProcedure() {
  const client = await pool.connect();

  try {
    // Get the current procedure definition
    const result = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'place_order'
    `);

    if (result.rows.length > 0) {
      const def = result.rows[0].definition;
      console.log('Current place_order procedure:');
      console.log(def);

      // Check if it contains our coupon discount logic
      if (def.includes('Apply coupon discount proportionally')) {
        console.log('✅ Procedure contains coupon discount logic');
      } else {
        console.log('❌ Procedure does NOT contain coupon discount logic');
      }
    } else {
      console.log('❌ place_order procedure not found');
    }

  } catch (err) {
    console.error('❌ Check failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkProcedure();