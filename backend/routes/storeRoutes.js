import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/stores/:slug — public store page
router.get("/:slug", async (req, res) => {
  try {
    const { rows: storeRows } = await pool.query(
      `SELECT s.store_id, s.store_name, s.store_slug, s.store_rating,
              s.store_status, s.created_at,
              sl.business_name, sl.kyc_status,
              u.name AS seller_name,
              COUNT(DISTINCT p.product_id)::int AS product_count
       FROM stores s
       JOIN sellers sl ON sl.seller_id = s.seller_id
       JOIN users u ON u.user_id = sl.user_id
       LEFT JOIN products p ON p.store_id = s.store_id AND p.status = 'active'
       WHERE s.store_slug = $1 AND s.store_status = 'active'
       GROUP BY s.store_id, sl.business_name, sl.kyc_status, u.name`,
      [req.params.slug]
    );

    if (!storeRows.length) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    const store = storeRows[0];

    // Get store products with variants and images
    const { rows: products } = await pool.query(
      `SELECT
         p.product_id, p.name, p.brand, p.status, p.created_at,
         MIN(pv.price)                                        AS min_price,
         MIN(pv.discount_price) AS discount_price,
         COALESCE((SELECT SUM(stock) FROM product_variants WHERE product_id = p.product_id), 0)::int AS stock,
         MAX(CASE WHEN pi.is_primary THEN pi.image_url END)   AS image_url,
         COALESCE(AVG(r.rating), 0)::numeric(3,1)             AS avg_rating,
         COUNT(DISTINCT r.review_id)::int                     AS reviews_count,
         COALESCE((SELECT SUM(oi.quantity) FROM order_items oi
                   JOIN product_variants pv2 ON pv2.variant_id = oi.variant_id
                   WHERE pv2.product_id = p.product_id), 0)::int AS total_sold
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.product_id
       LEFT JOIN product_images pi   ON pi.product_id = p.product_id
       LEFT JOIN reviews r           ON r.product_id  = p.product_id
       WHERE p.store_id = $1 AND p.status = 'active'
       GROUP BY p.product_id
       ORDER BY p.created_at DESC`,
      [store.store_id]
    );

    res.json({ success: true, data: { store, products } });
  } catch (err) {
    console.error("store page error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/stores/top — for homepage
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.store_id, s.store_name, s.store_slug, s.store_rating, s.store_status,
              COUNT(DISTINCT p.product_id)::int AS product_count
       FROM stores s
       LEFT JOIN products p ON p.store_id = s.store_id AND p.status = 'active'
       WHERE s.store_status = 'active'
       GROUP BY s.store_id
       ORDER BY s.store_rating DESC, product_count DESC
       LIMIT 6`
    );
    res.json(rows);
  } catch (err) {
    console.error("top stores error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

