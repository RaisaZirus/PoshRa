import { pool } from './db.js';

async function run() {
  const { rows } = await pool.query(
    `SELECT rr.*, oi.seller_order_id, so.seller_id, s.user_id AS seller_user_id
     FROM return_requests rr
     JOIN order_items oi ON oi.order_item_id = rr.order_item_id
     JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
     JOIN sellers s ON s.seller_id = so.seller_id
     WHERE rr.return_id = $1`,
    [32]
  );
  console.log(rows);
  await pool.end();
}

run().catch(console.error);