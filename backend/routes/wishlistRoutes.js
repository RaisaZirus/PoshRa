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

router.use(authMiddleware);

// helper — get or create wishlist for customer
async function getOrCreateWishlist(userId) {
  const { rows: custRows } = await pool.query(
    "SELECT customer_id FROM customers WHERE user_id = $1",
    [userId]
  );
  if (!custRows.length) throw new Error("Customer account not found");
  const customerId = custRows[0].customer_id;

  const { rows } = await pool.query(
    "SELECT wishlist_id FROM wishlists WHERE customer_id = $1",
    [customerId]
  );
  if (rows.length) return { wishlistId: rows[0].wishlist_id, customerId };

  const { rows: newRows } = await pool.query(
    "INSERT INTO wishlists (customer_id) VALUES ($1) RETURNING wishlist_id",
    [customerId]
  );
  return { wishlistId: newRows[0].wishlist_id, customerId };
}

// GET /api/wishlist — get wishlist with product info
router.get("/", async (req, res) => {
  try {
    const { wishlistId } = await getOrCreateWishlist(req.user.userId);

    const { rows } = await pool.query(
      `SELECT
         wi.wishlist_item_id,
         wi.variant_id,
         pv.sku, pv.price, pv.discount_price, pv.stock,
         p.product_id, p.name AS product_name, p.brand,
         MAX(CASE WHEN pi.is_primary THEN pi.image_url END) AS image_url,
         s.store_name
       FROM wishlist_items wi
       JOIN product_variants pv ON pv.variant_id = wi.variant_id
       JOIN products p          ON p.product_id  = pv.product_id
       JOIN stores s            ON s.store_id     = p.store_id
       LEFT JOIN product_images pi ON pi.product_id = p.product_id
       WHERE wi.wishlist_id = $1
       GROUP BY wi.wishlist_item_id, wi.variant_id, pv.sku, pv.price,
                pv.discount_price, pv.stock, p.product_id, p.name,
                p.brand, s.store_name
       ORDER BY wi.wishlist_item_id DESC`,
      [wishlistId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("get wishlist error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/wishlist/items — add variant to wishlist
router.post("/items", async (req, res) => {
  const { variant_id } = req.body;
  if (!variant_id) return res.status(400).json({ success: false, message: "variant_id required" });

  try {
    const { wishlistId } = await getOrCreateWishlist(req.user.userId);

    await pool.query(
      `INSERT INTO wishlist_items (wishlist_id, variant_id)
       VALUES ($1, $2) ON CONFLICT (wishlist_id, variant_id) DO NOTHING`,
      [wishlistId, variant_id]
    );
    return res.status(201).json({ success: true, message: "Added to wishlist" });
  } catch (err) {
    console.error("add wishlist error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// DELETE /api/wishlist/items/:variant_id — remove from wishlist
router.delete("/items/:variant_id", async (req, res) => {
  try {
    const { wishlistId } = await getOrCreateWishlist(req.user.userId);

    await pool.query(
      `DELETE FROM wishlist_items WHERE wishlist_id = $1 AND variant_id = $2`,
      [wishlistId, req.params.variant_id]
    );
    return res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) {
    console.error("remove wishlist error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;