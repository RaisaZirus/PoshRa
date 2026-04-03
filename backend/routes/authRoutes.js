import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";

const router = express.Router();

const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.user_id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { userId: user.user_id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_DAYS}d` }
  );
}

// helper: create role table row
async function ensureRoleRow(client, userId, role) {
  if (role === "user") {
    await client.query(`INSERT INTO customers (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
  } else if (role === "seller") {
    await client.query(`INSERT INTO sellers (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
  } else if (role === "admin") {
    await client.query(`INSERT INTO admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
  }
}

// POST /api/auth/register
// role allowed: user (customer) or seller
router.post("/register", async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Name: 2–50 characters
  if (!name?.trim() || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
  }
  if (name.trim().length > 50) {
    return res.status(400).json({ success: false, message: "Name must be 50 characters or less" });
  }

  // Email: valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email?.trim() || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }

  // Phone: valid Bangladeshi number (optional but validated if provided)
  // Formats: 01XXXXXXXXX (11 digits) or +8801XXXXXXXXX (14 chars)
  if (phone?.trim()) {
    const bdPhone = /^(?:\+8801|8801|01)[3-9]\d{8}$/;
    if (!bdPhone.test(phone.trim().replace(/\s|-/g, ""))) {
      return res.status(400).json({ success: false, message: "Enter a valid Bangladeshi phone number (e.g. 01XXXXXXXXX)" });
    }
  }

  // Password: minimum 6 characters
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  const finalRole = role || "user";
  if (!["user", "seller"].includes(finalRole)) {
    return res.status(400).json({ success: false, message: "Invalid role (use user or seller)" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const password_hash = await bcrypt.hash(password, 10);

    const insert = await client.query(
      `
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, name, email, phone, role, created_at;
      `,
      [name, email.toLowerCase(), phone || null, password_hash, finalRole]
    );

    const user = insert.rows[0];

    await ensureRoleRow(client, user.user_id, user.role);

    // issue tokens
    const accessToken = signAccessToken({ user_id: user.user_id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken({ user_id: user.user_id, role: user.role });

    const refreshHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

    await client.query(
      `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [user.user_id, refreshHash, expiresAt, req.headers["user-agent"] || null, req.ip || null]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Email/phone already exists" });
    }
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "email and password required" });

  try {
    const result = await pool.query(
      `
      SELECT user_id, name, email, phone, password_hash, role, is_active
      FROM users
      WHERE email = $1
      LIMIT 1;
      `,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const user = result.rows[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: "Account disabled" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // ensure role row exists (if legacy data)
    await ensureRoleRow(pool, user.user_id, user.role);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const refreshHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [user.user_id, refreshHash, expiresAt, req.headers["user-agent"] || null, req.ip || null]
    );

    delete user.password_hash;

    res.json({ success: true, accessToken, refreshToken, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/auth/refresh  (refresh token rotation)
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: "refreshToken required" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // check token exists & not revoked & not expired
    const tokenHash = hashToken(refreshToken);
    const dbTok = await pool.query(
      `
      SELECT token_id, user_id, expires_at, revoked_at
      FROM refresh_tokens
      WHERE token_hash = $1
      LIMIT 1;
      `,
      [tokenHash]
    );

    if (dbTok.rows.length === 0) return res.status(401).json({ success: false, message: "Invalid refresh token" });
    const row = dbTok.rows[0];
    if (row.revoked_at) return res.status(401).json({ success: false, message: "Refresh token revoked" });
    if (new Date(row.expires_at) < new Date()) return res.status(401).json({ success: false, message: "Refresh token expired" });

    // revoke old refresh token
    await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_id = $1`, [row.token_id]);

    // load user
    const userRes = await pool.query(
      `SELECT user_id, name, email, phone, role, is_active FROM users WHERE user_id = $1 LIMIT 1`,
      [row.user_id]
    );
    if (userRes.rows.length === 0) return res.status(401).json({ success: false, message: "User not found" });

    const user = userRes.rows[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: "Account disabled" });

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [user.user_id, newHash, expiresAt, req.headers["user-agent"] || null, req.ip || null]
    );

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken, user });
  } catch (err) {
    console.error("Refresh error:", err.message);
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
});

// POST /api/auth/logout (revoke refresh token)
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: "refreshToken required" });

  try {
    const tokenHash = hashToken(refreshToken);
    await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`, [tokenHash]);
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// GET /api/auth/me — get current user profile
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: "Unauthorized" });
  let userId;
  try { userId = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET).userId; }
  catch { return res.status(401).json({ success: false, message: "Invalid token" }); }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, name, email, phone, role, is_active, email_verified, created_at
       FROM users WHERE user_id = $1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("me error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PATCH /api/auth/me — update name and phone
router.patch("/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: "Unauthorized" });
  let userId;
  try { userId = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET).userId; }
  catch { return res.status(401).json({ success: false, message: "Invalid token" }); }

  const { name, phone } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: "Name is required" });

  try {
    const { rows } = await pool.query(
      `UPDATE users SET name = $1, phone = $2, updated_at = NOW()
       WHERE user_id = $3
       RETURNING user_id, name, email, phone, role, created_at`,
      [name.trim(), phone?.trim() || null, userId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ success: false, message: "Phone number already in use" });
    console.error("update me error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PATCH /api/auth/change-password
router.patch("/change-password", async (req, res) => {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: "Unauthorized" });
  let userId;
  try { userId = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET).userId; }
  catch { return res.status(401).json({ success: false, message: "Invalid token" }); }

  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: "current_password and new_password required" });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE user_id = $1", [userId]
    );
    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ success: false, message: "Current password is incorrect" });

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2",
      [newHash, userId]
    );
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("change password error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

