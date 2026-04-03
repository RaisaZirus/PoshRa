import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/categories — all categories with parent/child structure
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT category_id, parent_id, name, slug
       FROM categories
       ORDER BY parent_id NULLS FIRST, name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("categories error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/categories/:slug/products — products in a category
router.get("/:slug/products", async (req, res) => {
  const { slug } = req.params;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(40, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  try {
    // Get category + all descendant ids
    const { rows: catRows } = await pool.query(
      `WITH RECURSIVE tree AS (
         SELECT category_id, parent_id, name, slug
         FROM categories WHERE slug = $1
         UNION ALL
         SELECT c.category_id, c.parent_id, c.name, c.slug
         FROM categories c JOIN tree t ON c.parent_id = t.category_id
       )
       SELECT category_id, name, slug FROM tree`,
      [slug]
    );

    if (!catRows.length) {
      return res.status(404).json({ error: "Category not found" });
    }

    const categoryIds = catRows.map((c) => c.category_id);
    const root = catRows[0];

    const { rows: products } = await pool.query(
      `SELECT
         p.product_id, p.name, p.brand, p.status,
         MIN(pv.price)                                         AS min_price,
         MIN(pv.discount_price) AS discount_price,
         COALESCE(SUM(pv.stock), 0)                            AS stock,
         MAX(CASE WHEN pi.is_primary THEN pi.image_url END)    AS image_url,
         s.store_name
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.product_id
       LEFT JOIN product_images   pi ON pi.product_id = p.product_id
       JOIN stores s ON s.store_id = p.store_id
       WHERE p.category_id = ANY($1) AND p.status = 'active'
       GROUP BY p.product_id, s.store_name
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [categoryIds, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM products
       WHERE category_id = ANY($1) AND status = 'active'`,
      [categoryIds]
    );

    res.json({
      category: root,
      products,
      meta: { total: countRows[0].total, page, limit },
    });
  } catch (err) {
    console.error("category products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

