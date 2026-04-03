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

// GET /api/notifications — list all notifications for user
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT notification_id, type, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.userId]
    );
    const unread = rows.filter((n) => !n.is_read).length;
    return res.json({ success: true, data: rows, unread });
  } catch (err) {
    console.error("get notifications error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE notification_id = $1 AND user_id = $2
       RETURNING notification_id`,
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("mark read error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch("/read-all", async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [req.user.userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("read-all error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

