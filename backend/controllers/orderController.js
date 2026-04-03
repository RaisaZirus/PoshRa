import { pool } from "../db.js";

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Calls the place_order stored procedure which handles the full workflow:
// stock validation → order creation → seller_orders → order_items →
// stock decrement → coupon recording → cart clear → notification.
// The procedure runs inside its own explicit BEGIN/COMMIT/ROLLBACK.
export const createOrder = async (req, res) => {
  const userId = req.user.userId;
  const { address_id, coupon_code } = req.body;

  if (!address_id) {
    return res.status(400).json({ success: false, message: "Delivery address is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Resolve customer_id
    const { rows: custRows } = await client.query(
      "SELECT customer_id FROM customers WHERE user_id = $1",
      [userId]
    );
    if (!custRows.length) {
      await client.query("ROLLBACK");
      return res.status(403).json({ success: false, message: "Not a customer account" });
    }
    const customerId = custRows[0].customer_id;

    // Delegate the full workflow to the stored procedure
    // fn_place_order is the Node.js-friendly wrapper around CALL place_order(...)
    const { rows } = await client.query(
    "SELECT order_id, total FROM fn_place_order($1::bigint, $2::bigint, $3::text)",
    [customerId, address_id, coupon_code || null]
    );//changeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order_id: rows[0].order_id,
        total_amount: rows[0].total,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createOrder error:", err.message);
    // Surface procedure exceptions (stock errors, empty cart, bad coupon) to client
    if (err.message?.includes("Insufficient stock") ||
        err.message?.includes("Cart is empty") ||
        err.message?.includes("coupon")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Order creation failed" });
  } finally {
    client.release();
  }
};

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Complex query: joins orders → customers → seller_orders → order_items
export const getMyOrders = async (req, res) => {
  const userId = req.user.userId;
  try {
    const { rows } = await pool.query(
      `SELECT o.order_id, o.total_amount, o.order_status,
              o.payment_status, o.created_at,
              COUNT(oi.order_item_id)::int AS item_count
       FROM orders o
       JOIN customers c         ON c.customer_id          = o.customer_id
       JOIN seller_orders so    ON so.order_id             = o.order_id
       JOIN order_items oi      ON oi.seller_order_id      = so.seller_order_id
       WHERE c.user_id = $1
       GROUP BY o.order_id
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
// Complex query: order + seller sub-orders + items + shipments in one round-trip
export const getOrderById = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const { rows: orderRows } = await pool.query(
      `SELECT o.order_id, o.total_amount, o.order_status, o.payment_status,
              o.created_at, a.city, a.area, a.details AS address_details
       FROM orders o
       JOIN customers c         ON c.customer_id  = o.customer_id
       LEFT JOIN addresses a    ON a.address_id   = o.address_id
       WHERE o.order_id = $1 AND c.user_id = $2`,
      [id, userId]
    );
    if (!orderRows.length) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const { rows: sellerOrders } = await pool.query(
      `SELECT so.seller_order_id, so.seller_id, so.subtotal, so.status,
              s.business_name,
              json_agg(json_build_object(
                'order_item_id', oi.order_item_id,
                'variant_id',   oi.variant_id,
                'quantity',     oi.quantity,
                'price',        oi.price,
                'sku',          pv.sku,
                'product_name', p.name,
                'brand',        p.brand,
                'image_url',    pi.image_url
              )) AS items
       FROM seller_orders so
       JOIN sellers s           ON s.seller_id          = so.seller_id
       JOIN order_items oi      ON oi.seller_order_id   = so.seller_order_id
       JOIN product_variants pv ON pv.variant_id        = oi.variant_id
       JOIN products p          ON p.product_id         = pv.product_id
       LEFT JOIN product_images pi ON pi.product_id     = p.product_id AND pi.is_primary = true
       WHERE so.order_id = $1
       GROUP BY so.seller_order_id, s.business_name`,
      [id]
    );

    const { rows: shipments } = await pool.query(
      `SELECT sh.shipment_id, sh.seller_order_id, sh.tracking_number, sh.status,
              sh.shipped_at, sh.delivered_at, co.name AS courier_name,
              co.contact_info AS courier_contact
       FROM shipments sh
       JOIN seller_orders so  ON so.seller_order_id = sh.seller_order_id
       LEFT JOIN couriers co  ON co.courier_id      = sh.courier_id
       WHERE so.order_id = $1`,
      [id]
    );

    return res.json({
      success: true,
      data: { order: orderRows[0], seller_orders: sellerOrders, shipments },
    });
  } catch (err) {
    console.error("getOrderById error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

// ─── PATCH /api/orders/:id/cancel ────────────────────────────────────────────
// Explicit transaction: cancel order + all seller_orders + restore stock
export const cancelOrder = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT o.order_id, o.order_status
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE o.order_id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (rows[0].order_status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: `Cannot cancel order with status '${rows[0].order_status}'`,
      });
    }

    await client.query(
      `UPDATE orders SET order_status = 'cancelled' WHERE order_id = $1`, [id]
    );
    await client.query(
      `UPDATE seller_orders SET status = 'cancelled' WHERE order_id = $1`, [id]
    );

    // Restore stock atomically
    await client.query(
      `UPDATE product_variants pv
       SET stock = stock + oi.quantity
       FROM order_items oi
       JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
       WHERE pv.variant_id = oi.variant_id AND so.order_id = $1`,
      [id]
    );

    await client.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'order', $2)`,
      [userId, `Your order #${id} has been cancelled and stock restored.`]
    );

    await client.query("COMMIT");
    return res.json({ success: true, message: "Order cancelled and stock restored" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("cancelOrder error:", err);
    return res.status(500).json({ success: false, message: "Cancellation failed" });
  } finally {
    client.release();
  }
};

// ── GET /api/orders/:id/returns ───────────────────────────────────────────────
export const getOrderReturns = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT rr.return_id, rr.order_item_id, rr.reason, rr.status, rr.created_at,
              oi.quantity, oi.price,
              pv.sku, p.name AS product_name
       FROM return_requests rr
       JOIN order_items oi      ON oi.order_item_id    = rr.order_item_id
       JOIN seller_orders so    ON so.seller_order_id  = oi.seller_order_id
       JOIN orders o            ON o.order_id          = so.order_id
       JOIN customers c         ON c.customer_id       = o.customer_id
       JOIN product_variants pv ON pv.variant_id       = oi.variant_id
       JOIN products p          ON p.product_id        = pv.product_id
       WHERE o.order_id = $1 AND c.user_id = $2
       ORDER BY rr.created_at DESC`,
      [id, userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getOrderReturns error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── POST /api/orders/items/:order_item_id/returns ─────────────────────────────
// Explicit transaction: validate → insert return_request → notify
export const createReturn = async (req, res) => {
  const userId = req.user.userId;
  const { order_item_id } = req.params;
  const { reason } = req.body;

  if (!reason?.trim()) {
    return res.status(400).json({ success: false, message: "Return reason is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify ownership and eligibility
    const { rows: itemRows } = await client.query(
      `SELECT oi.order_item_id, oi.quantity, oi.price,
              so.status AS seller_status, o.order_id,
              pv.sku, p.name AS product_name, c.user_id AS owner_user_id
       FROM order_items oi
       JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
       JOIN orders o         ON o.order_id         = so.order_id
       JOIN customers c      ON c.customer_id      = o.customer_id
       JOIN product_variants pv ON pv.variant_id   = oi.variant_id
       JOIN products p       ON p.product_id       = pv.product_id
       WHERE oi.order_item_id = $1 AND c.user_id   = $2`,
      [order_item_id, userId]
    );

    if (!itemRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    const item = itemRows[0];
    if (item.seller_status !== "delivered") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Returns can only be requested for delivered items",
      });
    }

    // Check for duplicate return request
    const { rows: existing } = await client.query(
      "SELECT return_id, status FROM return_requests WHERE order_item_id = $1",
      [order_item_id]
    );
    if (existing.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: `A return request already exists for this item (status: ${existing[0].status})`,
      });
    }

    const { rows } = await client.query(
      `INSERT INTO return_requests (order_item_id, reason, status)
       VALUES ($1, $2, 'requested')
       RETURNING return_id, status, created_at`,
      [order_item_id, reason.trim()]
    );

    // Notify customer
    await client.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'return', $2)`,
      [userId, `Return request submitted for "${item.product_name}" (SKU: ${item.sku}).`]
    );

    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      message: "Return request submitted",
      data: { ...rows[0], ...item },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createReturn error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};
