import { pool } from './db.js';

async function run() {
  const { rows } = await pool.query(
    `SELECT rr.return_id, rr.order_item_id, rr.status, rr.created_at,
            oi.seller_order_id, so.seller_id
     FROM return_requests rr
     JOIN order_items oi ON oi.order_item_id = rr.order_item_id
     JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
     ORDER BY rr.return_id DESC LIMIT 20`
  );
  console.log(rows);
  await pool.end();
}

run().catch(console.error);