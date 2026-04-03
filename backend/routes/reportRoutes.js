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

// ── POST /api/reports ──────────────────────────────────────────────────────────
// Any authenticated user can submit a report against a product, review, or seller.
// Prevents duplicate pending reports from the same user on the same entity.
router.post("/", authMiddleware, async (req, res) => {
  const { entity_type, entity_id, reason } = req.body;

  const ALLOWED_TYPES = ["product", "review", "seller"];
  if (!entity_type || !ALLOWED_TYPES.includes(entity_type)) {
    return res.status(400).json({
      success: false,
      message: `entity_type must be one of: ${ALLOWED_TYPES.join(", ")}`,
    });
  }
  if (!entity_id || isNaN(Number(entity_id))) {
    return res.status(400).json({ success: false, message: "entity_id must be a valid number" });
  }
  if (!reason?.trim() || reason.trim().length < 5) {
    return res.status(400).json({ success: false, message: "reason must be at least 5 characters" });
  }
  if (reason.trim().length > 500) {
    return res.status(400).json({ success: false, message: "reason must be 500 characters or less" });
  }

  try {
    // Prevent duplicate pending reports from the same user for the same entity
    const { rows: existing } = await pool.query(
      `SELECT report_id FROM reports
       WHERE reported_by_user = $1
         AND entity_type      = $2
         AND entity_id        = $3
         AND status           = 'pending'
       LIMIT 1`,
      [req.user.userId, entity_type, entity_id]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending report for this item",
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO reports (reported_by_user, entity_type, entity_id, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING report_id, entity_type, entity_id, reason, status, created_at`,
      [req.user.userId, entity_type, Number(entity_id), reason.trim()]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("submit report error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/reports/my ────────────────────────────────────────────────────────
// Returns all reports submitted by the currently logged-in user.
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT report_id, entity_type, entity_id, reason, status, created_at
       FROM reports
       WHERE reported_by_user = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("my reports error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;