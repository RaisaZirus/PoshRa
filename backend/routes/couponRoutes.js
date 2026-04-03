import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

function optionalAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return next();

  try {
    req.user = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET);
    return next();
  } catch (err) {
    // Ignore invalid token for coupon listing; fall back to public listing
    return next();
  }
}

// Public coupon list (active/valid coupons only, excluding used coupons for signed-in customers)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      const { rows } = await pool.query(
        `SELECT c.coupon_id, c.code, c.discount_type, c.discount_value, c.expiry_date
         FROM coupons c
         WHERE (c.expiry_date IS NULL OR c.expiry_date >= CURRENT_DATE)
           AND NOT EXISTS (
             SELECT 1 FROM order_coupons oc
             JOIN orders o ON o.order_id = oc.order_id
             JOIN customers cu ON cu.customer_id = o.customer_id
             WHERE oc.coupon_id = c.coupon_id
               AND cu.user_id = $1
           )
         ORDER BY c.expiry_date NULLS LAST, c.code`,
        [userId]
      );
      return res.json({ success: true, data: rows });
    }

    const { rows } = await pool.query(
      `SELECT coupon_id, code, discount_type, discount_value, expiry_date
       FROM coupons
       WHERE expiry_date IS NULL OR expiry_date >= CURRENT_DATE
       ORDER BY expiry_date NULLS LAST, code`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("get coupons error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch coupons" });
  }
});

export default router;
