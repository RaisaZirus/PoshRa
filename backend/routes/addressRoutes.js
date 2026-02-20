import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: "Unauthorized" });
  const token = m[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload; // { userId, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// GET /api/account/addresses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT address_id, city, area, details, is_default, created_at FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [req.user.userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("addresses:get", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/account/addresses
router.post("/", authMiddleware, async (req, res) => {
  const { city, area, details, is_default } = req.body;
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (is_default) {
        await client.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [req.user.userId]);
      }
      const result = await client.query(
        `INSERT INTO addresses (user_id, city, area, details, is_default) VALUES ($1,$2,$3,$4,$5) RETURNING address_id, city, area, details, is_default, created_at`,
        [req.user.userId, city || null, area || null, details || null, !!is_default]
      );
      await client.query("COMMIT");
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("addresses:create", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PUT /api/account/addresses/:id
router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Invalid id" });
  const { city, area, details, is_default } = req.body;
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (is_default) {
        await client.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [req.user.userId]);
      }
      const result = await client.query(
        `UPDATE addresses SET city = $1, area = $2, details = $3, is_default = $4 WHERE address_id = $5 AND user_id = $6 RETURNING address_id, city, area, details, is_default, created_at`,
        [city || null, area || null, details || null, !!is_default, id, req.user.userId]
      );
      await client.query("COMMIT");
      if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Address not found" });
      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("addresses:update", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// DELETE /api/account/addresses/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Invalid id" });
  try {
    const result = await pool.query(`DELETE FROM addresses WHERE address_id = $1 AND user_id = $2 RETURNING *`, [id, req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Address not found" });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("addresses:delete", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
