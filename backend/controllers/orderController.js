import { pool } from "../db.js";

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Converts the customer's cart into an order.
// Everything runs in one DB transaction — if anything fails, nothing is saved.
export const createOrder = async (req, res) => {
  // JWT payload uses "userId" (camelCase) — matches how authMiddleware sets req.user
  const userId = req.user.userId;
  const { address_id, coupon_code } = req.body;

  if (!address_id) {
    return res.status(400).json({ success: false, message: "Delivery address is required" });
  }

  try {
    // Step 1: get customer_id from user_id
    const { rows: custRows } = await pool.query(
      "SELECT customer_id FROM customers WHERE user_id = $1",
      [userId]
    );
    if (!custRows.length) {
      return res
        .status(403)
        .json({ success: false, message: "Not a customer account" });
    }
    const customerId = custRows[0].customer_id;

    // Step 2: load full cart with variant + stock + seller info
    const { rows: cartRows } = await pool.query(
      `SELECT c.cart_id, ci.cart_item_id, ci.variant_id, ci.quantity,
              pv.price, pv.discount_price, pv.stock,
              p.store_id, s.seller_id
       FROM carts c
       JOIN cart_items ci  ON ci.cart_id    = c.cart_id
       JOIN product_variants pv ON pv.variant_id = ci.variant_id
       JOIN products p         ON p.product_id  = pv.product_id
       JOIN stores s           ON s.store_id    = p.store_id
       WHERE c.customer_id = $1`,
      [customerId]
    );

    if (!cartRows.length) {
      return res
        .status(400)
        .json({ success: false, message: "Cart is empty" });
    }

    // Step 3: stock check — fail fast before any DB writes
    for (const item of cartRows) {
      if (item.quantity > item.stock) {
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for variant ${item.variant_id}`,
        });
      }
    }

    // Step 4: calculate total (discount_price wins if set)
    const effectivePrice = (item) =>
      parseFloat(item.discount_price ?? item.price);

    let totalAmount = cartRows.reduce(
      (sum, item) => sum + effectivePrice(item) * item.quantity,
      0
    );

    // Step 5: validate coupon if provided
    let couponId = null;
    let appliedDiscount = 0;

    if (coupon_code) {
      const { rows: couponRows } = await pool.query(
        `SELECT coupon_id, discount_type, discount_value
         FROM coupons
         WHERE code = $1
           AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)`,
        [coupon_code]
      );
      if (!couponRows.length) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired coupon" });
      }
      const coupon = couponRows[0];
      couponId = coupon.coupon_id;
      appliedDiscount =
        coupon.discount_type === "percentage"
          ? (totalAmount * parseFloat(coupon.discount_value)) / 100
          : parseFloat(coupon.discount_value);
      totalAmount = Math.max(0, totalAmount - appliedDiscount);
    }

    // Step 6: run everything inside a single transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 6a: master order row
      const { rows: orderRows } = await client.query(
        `INSERT INTO orders (customer_id, address_id, total_amount, order_status, payment_status)
         VALUES ($1, $2, $3, 'pending', 'pending')
         RETURNING order_id`,
        [customerId, address_id || null, totalAmount.toFixed(2)]
      );
      const orderId = orderRows[0].order_id;

      // 6b: group items by seller
      const bySeller = {};
      for (const item of cartRows) {
        if (!bySeller[item.seller_id]) bySeller[item.seller_id] = [];
        bySeller[item.seller_id].push(item);
      }

      // 6c: one seller_order per seller + order_items + stock decrement
      for (const [sellerId, items] of Object.entries(bySeller)) {
        const subtotal = items.reduce(
          (sum, item) => sum + effectivePrice(item) * item.quantity,
          0
        );

        const { rows: soRows } = await client.query(
          `INSERT INTO seller_orders (order_id, seller_id, subtotal, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING seller_order_id`,
          [orderId, sellerId, subtotal.toFixed(2)]
        );
        const sellerOrderId = soRows[0].seller_order_id;

        for (const item of items) {
          await client.query(
            `INSERT INTO order_items (seller_order_id, variant_id, quantity, price)
             VALUES ($1, $2, $3, $4)`,
            [
              sellerOrderId,
              item.variant_id,
              item.quantity,
              effectivePrice(item).toFixed(2),
            ]
          );

          await client.query(
            `UPDATE product_variants SET stock = stock - $1 WHERE variant_id = $2`,
            [item.quantity, item.variant_id]
          );
        }
      }

      // 6d: record coupon usage
      if (couponId) {
        await client.query(
          `INSERT INTO order_coupons (order_id, coupon_id, applied_amount)
           VALUES ($1, $2, $3)`,
          [orderId, couponId, appliedDiscount.toFixed(2)]
        );
      }

      // 6e: empty the cart
      await client.query(
        `DELETE FROM cart_items WHERE cart_id = $1`,
        [cartRows[0].cart_id]
      );

      // Notify customer
      await client.query(
        `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'order', $2)`,
        [userId, `Your order #${orderId} has been placed successfully! Total: ₹${totalAmount.toFixed(2)}`]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: {
          order_id: orderId,
          total_amount: totalAmount.toFixed(2),
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("createOrder transaction failed:", err);
      return res
        .status(500)
        .json({ success: false, message: "Order creation failed" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("createOrder error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Returns all orders for the logged-in customer (summary list).
export const getMyOrders = async (req, res) => {
  const userId = req.user.userId;

  try {
    const { rows } = await pool.query(
      `SELECT o.order_id, o.total_amount, o.order_status,
              o.payment_status, o.created_at,
              COUNT(oi.order_item_id) AS item_count
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
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch orders" });
  }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
// Returns full detail: order + seller sub-orders + items + shipments.
export const getOrderById = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    // Verify ownership
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
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Seller sub-orders with aggregated items including product info
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

    // Shipment info if dispatched
    const { rows: shipments } = await pool.query(
      `SELECT sh.shipment_id, sh.tracking_number, sh.status,
              sh.shipped_at, sh.delivered_at, co.name AS courier_name
       FROM shipments sh
       JOIN seller_orders so  ON so.seller_order_id = sh.seller_order_id
       LEFT JOIN couriers co  ON co.courier_id      = sh.courier_id
       WHERE so.order_id = $1`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        order: orderRows[0],
        seller_orders: sellerOrders,
        shipments,
      },
    });
  } catch (err) {
    console.error("getOrderById error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch order" });
  }
};

// ─── PATCH /api/orders/:id/cancel ────────────────────────────────────────────
// Cancels an order only if still 'pending'. Restores stock atomically.
export const cancelOrder = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify ownership + status
    const { rows } = await client.query(
      `SELECT o.order_id, o.order_status
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE o.order_id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (rows[0].order_status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: `Cannot cancel order with status '${rows[0].order_status}'`,
      });
    }

    // Cancel master order + all seller sub-orders
    await client.query(
      `UPDATE orders SET order_status = 'cancelled' WHERE order_id = $1`,
      [id]
    );
    await client.query(
      `UPDATE seller_orders SET status = 'cancelled' WHERE order_id = $1`,
      [id]
    );

    // Restore stock in one query
    await client.query(
      `UPDATE product_variants pv
       SET stock = stock + oi.quantity
       FROM order_items oi
       JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
       WHERE pv.variant_id = oi.variant_id AND so.order_id = $1`,
      [id]
    );

    // Notify customer
    await client.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'order', $2)`,
      [userId, `Your order #${id} has been cancelled and stock restored.`]
    );

    await client.query("COMMIT");
    return res.json({
      success: true,
      message: "Order cancelled and stock restored",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("cancelOrder error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Cancellation failed" });
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
       JOIN order_items oi ON oi.order_item_id = rr.order_item_id
       JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
       JOIN orders o ON o.order_id = so.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN product_variants pv ON pv.variant_id = oi.variant_id
       JOIN products p ON p.product_id = pv.product_id
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
export const createReturn = async (req, res) => {
  const userId = req.user.userId;
  const { order_item_id } = req.params;
  const { reason } = req.body;

  if (!reason?.trim()) {
    return res.status(400).json({ success: false, message: "Return reason is required" });
  }

  try {
    const { rows: itemRows } = await pool.query(
      `SELECT oi.order_item_id, oi.quantity, oi.price,
              so.status AS seller_status, o.order_id,
              pv.sku, p.name AS product_name
       FROM order_items oi
       JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
       JOIN orders o ON o.order_id = so.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN product_variants pv ON pv.variant_id = oi.variant_id
       JOIN products p ON p.product_id = pv.product_id
       WHERE oi.order_item_id = $1 AND c.user_id = $2`,
      [order_item_id, userId]
    );

    if (!itemRows.length) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    const item = itemRows[0];

    if (item.seller_status !== "delivered") {
      return res.status(409).json({ success: false, message: "Returns can only be requested for delivered items" });
    }

    const { rows: existing } = await pool.query(
      "SELECT return_id, status FROM return_requests WHERE order_item_id = $1",
      [order_item_id]
    );
    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: `A return request already exists for this item (status: ${existing[0].status})`,
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO return_requests (order_item_id, reason, status)
       VALUES ($1, $2, 'requested')
       RETURNING return_id, status, created_at`,
      [order_item_id, reason.trim()]
    );

    res.status(201).json({ success: true, message: "Return request submitted", data: { ...rows[0], ...item } });
  } catch (err) {
    console.error("createReturn error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};