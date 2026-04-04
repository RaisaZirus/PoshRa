import { pool } from './db.js';

async function run() {
  const { rows } = await pool.query(
    `SELECT oi.order_item_id, oi.seller_order_id, so.seller_id, s.user_id AS seller_user_id
     FROM order_items oi
     JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
     JOIN sellers s ON s.seller_id = so.seller_id
     WHERE oi.order_item_id = $1`,
    [18]
  );
  console.log(rows);
  await pool.end();
}
run().catch((err) => { console.error(err); process.exit(1); });