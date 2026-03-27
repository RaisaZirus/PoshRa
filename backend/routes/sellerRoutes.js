import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    req.user = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

function requireSeller(req, res, next) {
  if (req.user.role !== "seller") {
    return res.status(403).json({ success: false, message: "Seller account required" });
  }
  next();
}

router.use(authMiddleware, requireSeller);

// helper — get seller_id from user_id
async function getSellerId(userId) {
  const { rows } = await pool.query(
    "SELECT seller_id FROM sellers WHERE user_id = $1",
    [userId]
  );
  if (!rows.length) throw new Error("Seller account not found");
  return rows[0].seller_id;
}

// ── GET /api/seller/dashboard ─────────────────────────────────────────────────
router.get("/dashboard", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);

    const [ordersRes, revenueRes, productsRes, pendingRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total FROM seller_orders WHERE seller_id = $1`,
        [sellerId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(subtotal), 0)::numeric AS total_revenue
         FROM seller_orders WHERE seller_id = $1 AND status = 'delivered'`,
        [sellerId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM products p JOIN stores s ON s.store_id = p.store_id
         WHERE s.seller_id = $1 AND p.status = 'active'`,
        [sellerId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM seller_orders
         WHERE seller_id = $1 AND status = 'pending'`,
        [sellerId]
      ),
    ]);

    // Recent orders
    const { rows: recentOrders } = await pool.query(
      `SELECT so.seller_order_id, so.order_id, so.subtotal, so.status, so.created_at,
              COUNT(oi.order_item_id)::int AS item_count
       FROM seller_orders so
       JOIN order_items oi ON oi.seller_order_id = so.seller_order_id
       WHERE so.seller_id = $1
       GROUP BY so.seller_order_id
       ORDER BY so.created_at DESC LIMIT 5`,
      [sellerId]
    );

    res.json({
      success: true,
      data: {
        stats: {
          total_orders: ordersRes.rows[0].total,
          total_revenue: revenueRes.rows[0].total_revenue,
          active_products: productsRes.rows[0].total,
          pending_orders: pendingRes.rows[0].total,
        },
        recent_orders: recentOrders,
      },
    });
  } catch (err) {
    console.error("seller dashboard error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/orders ────────────────────────────────────────────────────
router.get("/orders", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { status } = req.query;

    let query = `
      SELECT so.seller_order_id, so.order_id, so.subtotal, so.status, so.created_at,
             o.payment_status,
             COUNT(oi.order_item_id)::int AS item_count,
             sh.tracking_number, sh.status AS shipment_status
      FROM seller_orders so
      JOIN orders o ON o.order_id = so.order_id
      JOIN order_items oi ON oi.seller_order_id = so.seller_order_id
      LEFT JOIN shipments sh ON sh.seller_order_id = so.seller_order_id
      WHERE so.seller_id = $1`;

    const params = [sellerId];
    if (status) { params.push(status); query += ` AND so.status = $${params.length}`; }
    query += ` GROUP BY so.seller_order_id, o.payment_status, sh.tracking_number, sh.status ORDER BY so.created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("seller orders error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/orders/:id ────────────────────────────────────────────────
router.get("/orders/:id", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);

    const { rows: soRows } = await pool.query(
      `SELECT so.*, o.payment_status, o.created_at AS order_created_at,
              a.city, a.area, a.details AS address_details
       FROM seller_orders so
       JOIN orders o ON o.order_id = so.order_id
       LEFT JOIN addresses a ON a.address_id = o.address_id
       WHERE so.seller_order_id = $1 AND so.seller_id = $2`,
      [req.params.id, sellerId]
    );
    if (!soRows.length) return res.status(404).json({ success: false, message: "Order not found" });

    const { rows: items } = await pool.query(
      `SELECT oi.*, pv.sku, p.name AS product_name
       FROM order_items oi
       JOIN product_variants pv ON pv.variant_id = oi.variant_id
       JOIN products p ON p.product_id = pv.product_id
       WHERE oi.seller_order_id = $1`,
      [req.params.id]
    );

    const { rows: shipment } = await pool.query(
      `SELECT sh.*, c.name AS courier_name
       FROM shipments sh
       LEFT JOIN couriers c ON c.courier_id = sh.courier_id
       WHERE sh.seller_order_id = $1`,
      [req.params.id]
    );

    res.json({ success: true, data: { order: soRows[0], items, shipment: shipment[0] || null } });
  } catch (err) {
    console.error("seller order detail error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/seller/orders/:id/status ───────────────────────────────────────
router.patch("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const allowed = ["processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(", ")}` });
  }

  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `UPDATE seller_orders SET status = $1
       WHERE seller_order_id = $2 AND seller_id = $3
       RETURNING seller_order_id`,
      [status, req.params.id, sellerId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, message: `Order marked as ${status}` });
  } catch (err) {
    console.error("update order status error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/seller/shipments ────────────────────────────────────────────────
router.post("/shipments", async (req, res) => {
  const { seller_order_id, tracking_number, courier_name } = req.body;
  if (!seller_order_id) return res.status(400).json({ success: false, message: "seller_order_id required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sellerId = await getSellerId(req.user.userId);

    // Verify order belongs to seller
    const { rows: soRows } = await client.query(
      `SELECT seller_order_id FROM seller_orders
       WHERE seller_order_id = $1 AND seller_id = $2`,
      [seller_order_id, sellerId]
    );
    if (!soRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Get or create courier
    let courierId = null;
    if (courier_name) {
      const { rows: existing } = await client.query(
        `SELECT courier_id FROM couriers WHERE name = $1`, [courier_name]
      );
      if (existing.length) {
        courierId = existing[0].courier_id;
      } else {
        const { rows: newCourier } = await client.query(
          `INSERT INTO couriers (name) VALUES ($1) RETURNING courier_id`, [courier_name]
        );
        courierId = newCourier[0].courier_id;
      }
    }

    // Create shipment
    const { rows } = await client.query(
      `INSERT INTO shipments (seller_order_id, courier_id, tracking_number, status, shipped_at)
       VALUES ($1, $2, $3, 'shipped', NOW())
       RETURNING shipment_id`,
      [seller_order_id, courierId, tracking_number || null]
    );

    // Update seller_order status to shipped
    await client.query(
      `UPDATE seller_orders SET status = 'shipped' WHERE seller_order_id = $1`,
      [seller_order_id]
    );

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: { shipment_id: rows[0].shipment_id } });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("create shipment error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── GET /api/seller/products ──────────────────────────────────────────────────
router.get("/products", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT p.product_id, p.name, p.brand, p.status, p.created_at,
              COUNT(DISTINCT pv.variant_id)::int AS variant_count,
              COALESCE((SELECT SUM(stock) FROM product_variants WHERE product_id = p.product_id), 0)::int AS total_stock,
              MIN(pv.price) AS min_price,
              MAX(CASE WHEN pi.is_primary THEN pi.image_url END) AS image_url
       FROM products p
       JOIN stores s ON s.store_id = p.store_id
       LEFT JOIN product_variants pv ON pv.product_id = p.product_id
       LEFT JOIN product_images pi ON pi.product_id = p.product_id
       WHERE s.seller_id = $1
       GROUP BY p.product_id
       ORDER BY p.created_at DESC`,
      [sellerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("seller products error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/payouts ───────────────────────────────────────────────────
router.get("/payouts", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT payout_id, amount, status, requested_at
       FROM payouts WHERE seller_id = $1
       ORDER BY requested_at DESC`,
      [sellerId]
    );
    // Also get available balance (delivered orders not yet paid out)
    const { rows: balRows } = await pool.query(
      `SELECT COALESCE(SUM(subtotal), 0)::numeric AS available
       FROM seller_orders
       WHERE seller_id = $1 AND status = 'delivered'`,
      [sellerId]
    );
    res.json({ success: true, data: rows, available_balance: balRows[0].available });
  } catch (err) {
    console.error("seller payouts error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/seller/payouts ──────────────────────────────────────────────────
router.post("/payouts", async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Valid amount required" });
  }
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `INSERT INTO payouts (seller_id, amount, status)
       VALUES ($1, $2, 'requested') RETURNING payout_id, amount, status, requested_at`,
      [sellerId, amount]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("request payout error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/seller/stores ──────────────────────────────────────────────────
router.post("/stores", async (req, res) => {
  const { store_name, store_slug } = req.body;
  if (!store_name || !store_slug) {
    return res.status(400).json({ success: false, message: "store_name and store_slug required" });
  }
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `INSERT INTO stores (seller_id, store_name, store_slug, store_status)
       VALUES ($1, $2, $3, 'active')
       RETURNING store_id, store_name, store_slug, store_status`,
      [sellerId, store_name, store_slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Store slug already taken — try a different name" });
    }
    console.error("create store error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/stores ────────────────────────────────────────────────────
router.get("/stores", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT store_id, store_name, store_slug, store_rating, store_status, created_at
       FROM stores WHERE seller_id = $1 ORDER BY created_at DESC`,
      [sellerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("get stores error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/store ─────────────────────────────────────────────────────
router.get("/store", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT s.*, sl.business_name, sl.kyc_status, sl.rating AS seller_rating
       FROM stores s JOIN sellers sl ON sl.seller_id = s.seller_id
       WHERE s.seller_id = $1`,
      [sellerId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Store not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("seller store error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

// ── GET /api/seller/inventory ─────────────────────────────────────────────────
router.get("/inventory", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT pv.variant_id, pv.sku, pv.price, pv.discount_price, pv.stock,
              p.product_id, p.name AS product_name, p.brand, p.status,
              s.store_name,
              MAX(CASE WHEN pi.is_primary THEN pi.image_url END) AS image_url
       FROM product_variants pv
       JOIN products p ON p.product_id = pv.product_id
       JOIN stores s ON s.store_id = p.store_id
       LEFT JOIN product_images pi ON pi.product_id = p.product_id
       WHERE s.seller_id = $1
       GROUP BY pv.variant_id, p.product_id, p.name, p.brand, p.status, s.store_name
       ORDER BY p.name ASC, pv.sku ASC`,
      [sellerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("inventory error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/seller/inventory/:variant_id ───────────────────────────────────
router.patch("/inventory/:variant_id", async (req, res) => {
  const { stock, price, discount_price } = req.body;
  try {
    const sellerId = await getSellerId(req.user.userId);
    const updates = [];
    const params = [req.params.variant_id];
    if (stock !== undefined)          { params.push(stock);          updates.push(`stock = $${params.length}`); }
    if (price !== undefined)          { params.push(price);          updates.push(`price = $${params.length}`); }
    if (discount_price !== undefined) { params.push(discount_price); updates.push(`discount_price = $${params.length}`); }
    if (!updates.length) return res.status(400).json({ success: false, message: "Nothing to update" });

    await pool.query(
      `UPDATE product_variants pv SET ${updates.join(", ")}
       FROM products p JOIN stores s ON s.store_id = p.store_id
       WHERE pv.variant_id = $1 AND pv.product_id = p.product_id AND s.seller_id = ${sellerId}`,
      params
    );
    res.json({ success: true });
  } catch (err) {
    console.error("update inventory error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/qna ───────────────────────────────────────────────────────
router.get("/qna", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT q.question_id, q.content AS question, q.created_at,
              p.product_id, p.name AS product_name,
              u.name AS customer_name,
              a.answer_id, a.content AS answer, a.created_at AS answered_at
       FROM questions q
       JOIN products p ON p.product_id = q.product_id
       JOIN stores s ON s.store_id = p.store_id
       JOIN customers c ON c.customer_id = q.customer_id
       JOIN users u ON u.user_id = c.user_id
       LEFT JOIN answers a ON a.question_id = q.question_id AND a.seller_id = $1
       WHERE s.seller_id = $1
       ORDER BY a.answer_id NULLS FIRST, q.created_at DESC`,
      [sellerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("qna error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/seller/qna/:question_id/answer ──────────────────────────────────
router.post("/qna/:question_id/answer", async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: "Answer content required" });
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `INSERT INTO answers (question_id, seller_id, content)
       VALUES ($1, $2, $3) RETURNING answer_id`,
      [req.params.question_id, sellerId, content.trim()]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("post answer error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/shipments ─────────────────────────────────────────────────
router.get("/shipments", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT sh.shipment_id, sh.tracking_number, sh.status,
              sh.shipped_at, sh.delivered_at,
              so.seller_order_id, so.order_id, so.subtotal,
              c.name AS courier_name
       FROM shipments sh
       JOIN seller_orders so ON so.seller_order_id = sh.seller_order_id
       LEFT JOIN couriers c ON c.courier_id = sh.courier_id
       WHERE so.seller_id = $1
       ORDER BY sh.created_at DESC`,
      [sellerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("shipments error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/products/:id ──────────────────────────────────────────────
router.get("/products/:id", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT p.*, s.store_name
       FROM products p JOIN stores s ON s.store_id = p.store_id
       WHERE p.product_id = $1 AND s.seller_id = $2`,
      [req.params.id, sellerId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Product not found" });

    const { rows: variants } = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1`, [req.params.id]
    );
    const { rows: images } = await pool.query(
      `SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC`, [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], variants, images } });
  } catch (err) {
    console.error("seller product detail error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/seller/products/:id ───────────────────────────────────────────
router.patch("/products/:id", async (req, res) => {
  const { name, description, brand, status, category_id } = req.body;
  try {
    const sellerId = await getSellerId(req.user.userId);
    await pool.query(
      `UPDATE products p SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         brand = COALESCE($3, brand),
         status = COALESCE($4, status),
         category_id = COALESCE($5, category_id)
       FROM stores s WHERE p.store_id = s.store_id
         AND p.product_id = $6 AND s.seller_id = $7`,
      [name, description, brand, status, category_id, req.params.id, sellerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("update product error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/violations ────────────────────────────────────────────────
router.get("/violations", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT violation_id, violation_type, penalty, created_at
       FROM seller_violations WHERE seller_id = $1
       ORDER BY created_at DESC`,
      [sellerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("violations error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/returns ───────────────────────────────────────────────────
// All return requests across all seller orders
router.get("/returns", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT rr.return_id, rr.order_item_id, rr.reason, rr.status, rr.created_at,
              oi.quantity, oi.price,
              pv.sku, p.name AS product_name,
              so.seller_order_id, so.order_id,
              u.name AS customer_name
       FROM return_requests rr
       JOIN order_items oi     ON oi.order_item_id    = rr.order_item_id
       JOIN seller_orders so   ON so.seller_order_id  = oi.seller_order_id
       JOIN orders o           ON o.order_id          = so.order_id
       JOIN customers c        ON c.customer_id       = o.customer_id
       JOIN users u            ON u.user_id           = c.user_id
       JOIN product_variants pv ON pv.variant_id      = oi.variant_id
       JOIN products p         ON p.product_id        = pv.product_id
       WHERE so.seller_id = $1
       ORDER BY rr.created_at DESC`,
      [sellerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("seller returns error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/seller/returns/:return_id ──────────────────────────────────────
// Approve or reject a return request
router.patch("/returns/:return_id", async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "completed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be approved, rejected, or completed" });
  }
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `UPDATE return_requests rr SET status = $1
       FROM order_items oi
       JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
       WHERE rr.return_id = $2
         AND rr.order_item_id = oi.order_item_id
         AND so.seller_id = $3
       RETURNING rr.return_id`,
      [status, req.params.return_id, sellerId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Return request not found" });
    res.json({ success: true, message: `Return ${status}` });
  } catch (err) {
    console.error("update return error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/seller/returns ───────────────────────────────────────────────────
// All return requests across all seller's orders
router.get("/returns", async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user.userId);
    const { rows } = await pool.query(
      `SELECT rr.return_id, rr.order_item_id, rr.reason, rr.status, rr.created_at,
              oi.quantity, oi.price,
              pv.sku, p.name AS product_name,
              so.seller_order_id, so.order_id,
              u.name AS customer_name
       FROM return_requests rr
       JOIN order_items oi      ON oi.order_item_id    = rr.order_item_id
       JOIN seller_orders so    ON so.seller_order_id  = oi.seller_order_id
       JOIN orders o            ON o.order_id          = so.order_id
       JOIN customers c         ON c.customer_id       = o.customer_id
       JOIN users u             ON u.user_id           = c.user_id
       JOIN product_variants pv ON pv.variant_id       = oi.variant_id
       JOIN products p          ON p.product_id        = pv.product_id
       WHERE so.seller_id = $1
       ORDER BY rr.created_at DESC`,
      [sellerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("seller returns error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/seller/returns/:return_id ──────────────────────────────────────
router.patch("/returns/:return_id", async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "completed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be approved, rejected, or completed" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sellerId = await getSellerId(req.user.userId);

    // Get return + item info
    const { rows: retRows } = await client.query(
      `SELECT rr.return_id, rr.order_item_id, oi.variant_id, oi.quantity,
              so.seller_order_id, so.order_id, so.seller_id
       FROM return_requests rr
       JOIN order_items oi      ON oi.order_item_id   = rr.order_item_id
       JOIN seller_orders so    ON so.seller_order_id = oi.seller_order_id
       WHERE rr.return_id = $1 AND so.seller_id = $2`,
      [req.params.return_id, sellerId]
    );
    if (!retRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const ret = retRows[0];

    // Update return status
    await client.query(
      `UPDATE return_requests SET status = $1 WHERE return_id = $2`,
      [status, req.params.return_id]
    );

    // On completed — restore stock and remove the order item
    if (status === "completed") {
      // Restore stock
      await client.query(
        `UPDATE product_variants SET stock = stock + $1 WHERE variant_id = $2`,
        [ret.quantity, ret.variant_id]
      );

      // Remove the returned order item
      await client.query(
        `DELETE FROM order_items WHERE order_item_id = $1`,
        [ret.order_item_id]
      );

      // Check if seller_order has any items left
      const { rows: remaining } = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM order_items WHERE seller_order_id = $1`,
        [ret.seller_order_id]
      );

      // If no items remain — mark seller_order as returned
      if (remaining[0].cnt === 0) {
        await client.query(
          `UPDATE seller_orders SET status = 'returned' WHERE seller_order_id = $1`,
          [ret.seller_order_id]
        );
        // Also update master order status if all seller orders are returned/cancelled
        await client.query(
          `UPDATE orders SET order_status = 'returned'
           WHERE order_id = $1
             AND NOT EXISTS (
               SELECT 1 FROM seller_orders
               WHERE order_id = $1
                 AND status NOT IN ('returned', 'cancelled')
             )`,
          [ret.order_id]
        );
      } else {
        // Recalculate subtotal
        await client.query(
          `UPDATE seller_orders SET subtotal = (
             SELECT COALESCE(SUM(price * quantity), 0) FROM order_items WHERE seller_order_id = $1
           ) WHERE seller_order_id = $1`,
          [ret.seller_order_id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: `Return ${status}` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("update return error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});