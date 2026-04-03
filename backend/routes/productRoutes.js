import express from "express";
import jwt from "jsonwebtoken";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  searchProducts,
  searchSuggestions,
  autocomplete,
} from "../controllers/productController.js";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/search/suggestions", searchSuggestions);
router.get("/search/autocomplete", autocomplete);
router.get("/search", searchProducts);

// Must be ABOVE /:id so "featured" isn't treated as an id
router.get("/featured", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.product_id,
        p.name,
        p.brand,
        MIN(pv.price) AS min_price,
        MIN(pv.discount_price) AS discount_price,
        COALESCE(SUM(pv.stock), 0) AS stock,
        MAX(CASE WHEN pi.is_primary THEN pi.image_url END) AS image_url,
        COALESCE((SELECT SUM(oi.quantity) FROM order_items oi
                  JOIN product_variants pv2 ON pv2.variant_id = oi.variant_id
                  WHERE pv2.product_id = p.product_id), 0)::int AS total_sold
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.product_id
      LEFT JOIN product_images pi ON pi.product_id = p.product_id
      WHERE p.status = 'active'
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
      LIMIT 8
    `);
    res.json(rows);
  } catch (err) {
    console.error("featured products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// ── POST /api/products/:id/view ───────────────────────────────────────────────
// Records a product view. user_id and duration_seconds are optional.
// Called by the frontend when a user visits a product details page.
router.post("/:id/view", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { user_id = null, duration_seconds = null } = req.body;

    // Silently skip if product doesn't exist (avoid 500 on stale IDs)
    const { rows: exists } = await pool.query(
      "SELECT 1 FROM products WHERE product_id = $1", [productId]
    );
    if (!exists.length) return res.status(404).json({ success: false, message: "Product not found" });

    await pool.query(
      `INSERT INTO view_logs (product_id, user_id, duration_seconds)
       VALUES ($1, $2, $3)`,
      [productId, user_id || null, duration_seconds || null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("product view log error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/products/:id/reviews ────────────────────────────────────────────
router.get("/:id/reviews", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at,
              u.name AS customer_name
       FROM reviews r
       JOIN customers c ON c.customer_id = r.customer_id
       JOIN users u ON u.user_id = c.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    // rating breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    rows.forEach((r) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

    res.json({ success: true, data: rows, breakdown });
  } catch (err) {
    console.error("get reviews error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/products/:id/reviews ───────────────────────────────────────────
router.post("/:id/reviews", async (req, res) => {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: "Login required" });
  let userId;
  try { userId = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET).userId; }
  catch { return res.status(401).json({ success: false, message: "Invalid token" }); }

  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be 1-5" });
  }

  try {
    const { rows: custRows } = await pool.query(
      "SELECT customer_id FROM customers WHERE user_id = $1", [userId]
    );
    if (!custRows.length) return res.status(403).json({ success: false, message: "Customer account required" });

    // Check if customer has purchased and received this product
    const { rows: purchaseRows } = await pool.query(
      `SELECT oi.order_item_id
       FROM order_items oi
       JOIN product_variants pv ON pv.variant_id = oi.variant_id
       JOIN seller_orders so    ON so.seller_order_id = oi.seller_order_id
       JOIN orders o            ON o.order_id = so.order_id
       WHERE pv.product_id = $1
         AND o.customer_id = $2
         AND so.status = 'delivered'
       LIMIT 1`,
      [req.params.id, custRows[0].customer_id]
    );
    if (!purchaseRows.length) {
      return res.status(403).json({ success: false, message: "You can only review products you have purchased and received" });
    }

    // Check if already reviewed
    const { rows: existing } = await pool.query(
      "SELECT review_id FROM reviews WHERE product_id = $1 AND customer_id = $2",
      [req.params.id, custRows[0].customer_id]
    );
    if (existing.length) return res.status(409).json({ success: false, message: "You have already reviewed this product" });

    const { rows } = await pool.query(
      `INSERT INTO reviews (product_id, customer_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING review_id, rating, comment, created_at`,
      [req.params.id, custRows[0].customer_id, rating, comment?.trim() || null]
    );

    // Get user name for response
    const { rows: userRows } = await pool.query(
      "SELECT name FROM users WHERE user_id = $1", [userId]
    );

    // Auto-update store rating from all product reviews
    await pool.query(
      `UPDATE stores SET store_rating = (
         SELECT COALESCE(AVG(r.rating), 0)::numeric(3,2)
         FROM reviews r
         JOIN products p ON p.product_id = r.product_id
         WHERE p.store_id = (SELECT store_id FROM products WHERE product_id = $1)
       ) WHERE store_id = (SELECT store_id FROM products WHERE product_id = $1)`,
      [req.params.id]
    );

    res.status(201).json({
      success: true,
      data: { ...rows[0], customer_name: userRows[0].name }
    });
  } catch (err) {
    console.error("post review error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/products/:id/questions ──────────────────────────────────────────
router.get("/:id/questions", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.question_id, q.content AS question, q.created_at,
              u.name AS customer_name,
              a.answer_id, a.content AS answer, a.created_at AS answered_at,
              su.name AS seller_name
       FROM questions q
       JOIN customers c ON c.customer_id = q.customer_id
       JOIN users u ON u.user_id = c.user_id
       LEFT JOIN answers a ON a.question_id = q.question_id
       LEFT JOIN sellers s ON s.seller_id = a.seller_id
       LEFT JOIN users su ON su.user_id = s.user_id
       WHERE q.product_id = $1
       ORDER BY q.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("get questions error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/products/:id/questions ──────────────────────────────────────────
// Requires auth — only customers can ask
router.post("/:id/questions", async (req, res) => {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: "Login required" });
  let userId;
  try { userId = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET).userId; }
  catch { return res.status(401).json({ success: false, message: "Invalid token" }); }

  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: "Question content required" });

  try {
    const { rows: custRows } = await pool.query(
      "SELECT customer_id FROM customers WHERE user_id = $1", [userId]
    );
    if (!custRows.length) return res.status(403).json({ success: false, message: "Customer account required" });

    const { rows } = await pool.query(
      `INSERT INTO questions (product_id, customer_id, content)
       VALUES ($1, $2, $3) RETURNING question_id, content, created_at`,
      [req.params.id, custRows[0].customer_id, content.trim()]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("post question error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

