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

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin account required" });
  }
  next();
}

router.use(authMiddleware, requireAdmin);

async function getAdminId(userId) {
  const { rows } = await pool.query(
    "SELECT admin_id FROM admins WHERE user_id = $1",
    [userId]
  );
  if (!rows.length) throw new Error("Admin account not found");
  return rows[0].admin_id;
}

// Audit log helper — always runs inside the caller's transaction client
async function logAudit(client, adminId, action, entityType = null, entityId = null) {
  await client.query(
    `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
     VALUES ($1, $2, $3, $4)`,
    [adminId, action, entityType, entityId]
  );
}

async function updateFinanceKpis(client, { requested = 0, processed = 0 } = {}) {
  // Use explicit transaction client if provided (for caller transaction) else pool directly
  const q = client || pool;
  await q.query(
    `INSERT INTO finance_kpis_daily (kpi_date, payouts_requested, payouts_processed)
     VALUES (CURRENT_DATE, $1, $2)
     ON CONFLICT (kpi_date)
     DO UPDATE SET
       payouts_requested = finance_kpis_daily.payouts_requested + EXCLUDED.payouts_requested,
       payouts_processed = finance_kpis_daily.payouts_processed + EXCLUDED.payouts_processed`,
    [requested, processed]
  );
}

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
// Uses fn_platform_analytics function + site/traffic/finance KPI tables
router.get("/dashboard", async (req, res) => {
  try {
    const [
      usersRes, sellersRes, ordersRes, gmvRes,
      revenueRes, pendingKycRes, reportsRes,
      kpiRes, trafficRes, financeRes,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM users"),
      pool.query("SELECT COUNT(*)::int AS total FROM sellers"),
      pool.query("SELECT COUNT(*)::int AS total FROM orders"),
      pool.query("SELECT COALESCE(SUM(total_amount),0)::numeric AS gmv FROM orders"),
      pool.query(
        `SELECT COALESCE(SUM(commission_total),0)::numeric AS net_revenue
         FROM finance_kpis_daily WHERE kpi_date >= NOW() - INTERVAL '30 days'`
      ),
      pool.query("SELECT COUNT(*)::int AS total FROM sellers WHERE kyc_status = 'pending'"),
      pool.query("SELECT COUNT(*)::int AS total FROM reports WHERE status = 'pending'"),
      pool.query(
        `SELECT kpi_date, new_users, new_sellers, total_orders, gross_merch_value, net_revenue
         FROM site_kpis_daily ORDER BY kpi_date DESC LIMIT 30`
      ),
      pool.query(
        `SELECT kpi_date, searches, product_clicks, product_views
         FROM traffic_kpis_daily ORDER BY kpi_date DESC LIMIT 30`
      ),
      pool.query(
        `SELECT kpi_date, commission_total, payouts_requested, payouts_processed
         FROM finance_kpis_daily ORDER BY kpi_date DESC LIMIT 30`
      ),
      pool.query(
        `SELECT DATE(o.created_at) AS coupon_date, COUNT(*)::int AS coupon_orders,
                SUM(oc.applied_amount)::numeric AS total_discount
         FROM order_coupons oc
         JOIN orders o ON o.order_id = oc.order_id
         WHERE o.created_at >= NOW() - INTERVAL '14 days'
         GROUP BY DATE(o.created_at)
         ORDER BY coupon_date DESC`
      ),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total_users:     usersRes.rows[0].total,
          total_sellers:   sellersRes.rows[0].total,
          total_orders:    ordersRes.rows[0].total,
          gmv:             gmvRes.rows[0].gmv,
          net_revenue:     revenueRes.rows[0].net_revenue,
          pending_kyc:     pendingKycRes.rows[0].total,
          pending_reports: reportsRes.rows[0].total,
        },
        kpis:    kpiRes.rows.reverse(),
        traffic: trafficRes.rows.reverse(),
        finance: financeRes.rows.reverse(),
        coupons: couponRes.rows.reverse(),
      },
    });
  } catch (err) {
    console.error("admin dashboard error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/coupons ───────────────────────────────────────────────────
router.get("/coupons", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT coupon_id, code, discount_type, discount_value, expiry_date
       FROM coupons
       ORDER BY expiry_date NULLS LAST, code`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("admin coupons list error:", err);
    res.status(500).json({ success: false, message: "Failed to load coupons" });
  }
});

// ── POST /api/admin/coupons ──────────────────────────────────────────────────
router.post("/coupons", async (req, res) => {
  const { code, discount_type, discount_value, expiry_date } = req.body;
  if (!code?.trim()) {
    return res.status(400).json({ success: false, message: "Coupon code is required" });
  }
  if (!["percentage", "fixed"].includes(discount_type)) {
    return res.status(400).json({ success: false, message: "Discount type must be percentage or fixed" });
  }
  if (discount_value == null || Number(discount_value) < 0) {
    return res.status(400).json({ success: false, message: "Discount value must be >= 0" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, expiry_date)
       VALUES ($1, $2, $3, $4)
       RETURNING coupon_id, code, discount_type, discount_value, expiry_date`,
      [code.trim().toUpperCase(), discount_type, Number(discount_value), expiry_date || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("create coupon error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
});

// ── PATCH /api/admin/coupons/:id ───────────────────────────────────────────────
router.patch("/coupons/:id", async (req, res) => {
  const { code, discount_type, discount_value, expiry_date } = req.body;
  if (code != null && !code.trim()) {
    return res.status(400).json({ success: false, message: "Coupon code cannot be empty" });
  }
  if (discount_type != null && !["percentage", "fixed"].includes(discount_type)) {
    return res.status(400).json({ success: false, message: "Invalid discount type" });
  }
  if (discount_value != null && Number(discount_value) < 0) {
    return res.status(400).json({ success: false, message: "Discount value must be >= 0" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE coupons SET
         code          = COALESCE($1, code),
         discount_type = COALESCE($2, discount_type),
         discount_value= COALESCE($3, discount_value),
         expiry_date   = COALESCE($4, expiry_date)
       WHERE coupon_id = $5
       RETURNING coupon_id, code, discount_type, discount_value, expiry_date`,
      [
        code ? code.trim().toUpperCase() : null,
        discount_type || null,
        discount_value != null ? Number(discount_value) : null,
        expiry_date || null,
        req.params.id,
      ]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("update coupon error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to update coupon" });
  }
});

// ── DELETE /api/admin/coupons/:id ────────────────────────────────────────────
router.delete("/coupons/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM coupons WHERE coupon_id = $1`,
      [req.params.id]
    );
    if (!rowCount) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    console.error("delete coupon error:", err);
    res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
});

// ── GET /api/admin/analytics/top-sellers ─────────────────────────────────────
// Complex Query 1 — uses vw_top_sellers view
router.get("/analytics/top-sellers", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const { rows } = await pool.query(
      `SELECT * FROM vw_top_sellers LIMIT $1`, [limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("top sellers error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/analytics/best-products ────────────────────────────────────
// Complex Query 2 — uses vw_best_selling_products view
router.get("/analytics/best-products", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const { rows } = await pool.query(
      `SELECT * FROM vw_best_selling_products LIMIT $1`, [limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("best products error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/analytics/category-performance ─────────────────────────────
// Complex Query 3 — uses vw_category_performance view
router.get("/analytics/category-performance", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM vw_category_performance`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("category performance error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/analytics/customer-ltv ─────────────────────────────────────
// Complex Query 4 — uses vw_customer_ltv view
router.get("/analytics/customer-ltv", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const { rows } = await pool.query(
      `SELECT * FROM vw_customer_ltv LIMIT $1`, [limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("customer LTV error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/analytics/platform ─────────────────────────────────────────
// Uses fn_platform_analytics function with a custom date range
router.get("/analytics/platform", async (req, res) => {
  try {
    const from = req.query.from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to   = req.query.to   || new Date().toISOString().slice(0, 10);
    const { rows } = await pool.query(
      `SELECT * FROM fn_platform_analytics($1::date, $2::date)`, [from, to]
    );
    res.json({ success: true, data: rows[0], range: { from, to } });
  } catch (err) {
    console.error("platform analytics error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/analytics/seller-summary/:seller_id ───────────────────────
// Uses fn_seller_revenue_summary function
router.get("/analytics/seller-summary/:seller_id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM fn_seller_revenue_summary($1)`, [req.params.seller_id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("seller summary error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { role, is_active, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const params = [];

    if (role)      { params.push(role);            conditions.push(`u.role = $${params.length}`); }
    if (is_active !== undefined) {
      params.push(is_active === "true");
      conditions.push(`u.is_active = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users u ${where}`, params
    );

    params.push(Number(limit), offset);
    const { rows } = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.role, u.is_active,
              u.email_verified, u.created_at,
              s.kyc_status, s.seller_id
       FROM users u
       LEFT JOIN sellers s ON s.user_id = u.user_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRes.rows[0].total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error("admin users error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/admin/users/:user_id/status ────────────────────────────────────
// Explicit transaction: update user + audit log in one transaction
router.patch("/users/:user_id/status", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { user_id } = req.params;
    const { is_active } = req.body;

    await client.query(
      "UPDATE users SET is_active = $1, updated_at = NOW() WHERE user_id = $2",
      [is_active, user_id]
    );

    await logAudit(client, adminId, `Set user ${user_id} active=${is_active}`, "user", user_id);
    await client.query("COMMIT");

    res.json({ success: true, message: "User status updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin user status error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── PATCH /api/admin/sellers/:seller_id/kyc ───────────────────────────────────
// Explicit transaction: update kyc_status + audit log
router.patch("/sellers/:seller_id/kyc", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { seller_id } = req.params;
    const { kyc_status } = req.body;

    if (!["pending", "verified", "rejected"].includes(kyc_status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Invalid kyc_status" });
    }

    await client.query(
      "UPDATE sellers SET kyc_status = $1 WHERE seller_id = $2",
      [kyc_status, seller_id]
    );
    await logAudit(client, adminId, `Set seller ${seller_id} KYC to ${kyc_status}`, "seller", seller_id);

    await client.query("COMMIT");
    res.json({ success: true, message: "KYC status updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin kyc error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── GET /api/admin/reports ────────────────────────────────────────────────────
router.get("/reports", async (req, res) => {
  try {
    const { status, entity_type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const params = [];

    if (status)      { params.push(status);      conditions.push(`r.status = $${params.length}`); }
    if (entity_type) { params.push(entity_type); conditions.push(`r.entity_type = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM reports r ${where}`, params
    );

    params.push(Number(limit), offset);
    const { rows } = await pool.query(
      `SELECT r.report_id, r.entity_type, r.entity_id, r.reason, r.status, r.created_at,
              u.name AS reported_by_name, u.email AS reported_by_email
       FROM reports r
       JOIN users u ON u.user_id = r.reported_by_user
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRes.rows[0].total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error("admin reports error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/admin/reports/:report_id ───────────────────────────────────────
// Explicit transaction: update report + audit log
router.patch("/reports/:report_id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { report_id } = req.params;
    const { status } = req.body;

    if (!["pending", "resolved", "rejected"].includes(status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    await client.query(
      "UPDATE reports SET status = $1 WHERE report_id = $2", [status, report_id]
    );
    await logAudit(client, adminId, `Updated report ${report_id} to ${status}`, "report", report_id);

    await client.query("COMMIT");
    res.json({ success: true, message: "Report updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin report update error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── GET /api/admin/campaigns ──────────────────────────────────────────────────
router.get("/campaigns", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.campaign_id, c.name, c.start_time, c.end_time,
              COUNT(cp.variant_id)::int AS product_count
       FROM campaigns c
       LEFT JOIN campaign_products cp ON cp.campaign_id = c.campaign_id
       GROUP BY c.campaign_id
       ORDER BY c.start_time DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("admin campaigns error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/admin/campaigns ─────────────────────────────────────────────────
// Explicit transaction: insert campaign + audit log
router.post("/campaigns", async (req, res) => {
  const { name, start_time, end_time } = req.body;
  if (!name || !start_time || !end_time) {
    return res.status(400).json({ success: false, message: "name, start_time, end_time required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);

    const { rows } = await client.query(
      `INSERT INTO campaigns (name, start_time, end_time) VALUES ($1, $2, $3) RETURNING *`,
      [name, start_time, end_time]
    );
    await logAudit(client, adminId, `Created campaign '${name}'`, "campaign", rows[0].campaign_id);

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin campaign create error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── PATCH /api/admin/campaigns/:campaign_id ───────────────────────────────────
// Explicit transaction: update campaign + audit log
router.patch("/campaigns/:campaign_id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { campaign_id } = req.params;
    const { name, start_time, end_time } = req.body;

    await client.query(
      `UPDATE campaigns
       SET name       = COALESCE($1, name),
           start_time = COALESCE($2, start_time),
           end_time   = COALESCE($3, end_time)
       WHERE campaign_id = $4`,
      [name, start_time, end_time, campaign_id]
    );
    await logAudit(client, adminId, `Updated campaign ${campaign_id}`, "campaign", campaign_id);

    await client.query("COMMIT");
    res.json({ success: true, message: "Campaign updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin campaign update error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── DELETE /api/admin/campaigns/:campaign_id ──────────────────────────────────
// Explicit transaction: delete campaign + audit log
router.delete("/campaigns/:campaign_id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { campaign_id } = req.params;

    await client.query("DELETE FROM campaigns WHERE campaign_id = $1", [campaign_id]);
    await logAudit(client, adminId, `Deleted campaign ${campaign_id}`, "campaign", campaign_id);

    await client.query("COMMIT");
    res.json({ success: true, message: "Campaign deleted" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin campaign delete error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── GET /api/admin/commissions ────────────────────────────────────────────────
router.get("/commissions", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cm.commission_id, cm.percentage,
              cat.category_id, cat.name AS category_name, cat.slug
       FROM commissions cm
       LEFT JOIN categories cat ON cat.category_id = cm.category_id
       ORDER BY cat.name NULLS LAST`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("admin commissions error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/admin/commissions ───────────────────────────────────────────────
router.post("/commissions", async (req, res) => {
  const { category_id, percentage } = req.body;
  if (percentage === undefined) {
    return res.status(400).json({ success: false, message: "percentage required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);

    const { rows } = await client.query(
      `INSERT INTO commissions (category_id, percentage) VALUES ($1, $2) RETURNING *`,
      [category_id || null, percentage]
    );
    await logAudit(client, adminId, `Created commission for category ${category_id ?? "global"}`, "commission", rows[0].commission_id);

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin commission create error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── PATCH /api/admin/commissions/:commission_id ───────────────────────────────
router.patch("/commissions/:commission_id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { commission_id } = req.params;
    const { percentage } = req.body;

    await client.query(
      "UPDATE commissions SET percentage = $1 WHERE commission_id = $2",
      [percentage, commission_id]
    );
    await logAudit(client, adminId, `Updated commission ${commission_id} to ${percentage}%`, "commission", commission_id);

    await client.query("COMMIT");
    res.json({ success: true, message: "Commission updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin commission update error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── DELETE /api/admin/commissions/:commission_id ──────────────────────────────
router.delete("/commissions/:commission_id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { commission_id } = req.params;

    await client.query("DELETE FROM commissions WHERE commission_id = $1", [commission_id]);
    await logAudit(client, adminId, `Deleted commission ${commission_id}`, "commission", commission_id);

    await client.query("COMMIT");
    res.json({ success: true, message: "Commission deleted" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin commission delete error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
router.get("/audit-logs", async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const countRes = await pool.query("SELECT COUNT(*)::int AS total FROM audit_logs");
    const { rows } = await pool.query(
      `SELECT al.audit_id, al.action, al.entity_type, al.entity_id, al.created_at,
              u.name AS admin_name, u.email AS admin_email
       FROM audit_logs al
       JOIN admins a ON a.admin_id = al.admin_id
       JOIN users u  ON u.user_id  = a.user_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRes.rows[0].total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error("admin audit-logs error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/categories ─────────────────────────────────────────────────
router.get("/categories", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.category_id, c.name, c.slug, c.parent_id, p.name AS parent_name
       FROM categories c
       LEFT JOIN categories p ON p.category_id = c.parent_id
       ORDER BY c.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("admin categories error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/payouts ────────────────────────────────────────────────────
router.get("/payouts", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let where = "";

    if (status) { params.push(status); where = `WHERE p.status = $${params.length}`; }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM payouts p ${where}`, params
    );

    params.push(Number(limit), offset);
    const { rows } = await pool.query(
      `SELECT p.payout_id, p.amount, p.status, p.requested_at,
              s.seller_id, u.name AS seller_name, u.email AS seller_email
       FROM payouts p
       JOIN sellers s ON s.seller_id = p.seller_id
       JOIN users u   ON u.user_id   = s.user_id
       ${where}
       ORDER BY p.requested_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRes.rows[0].total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error("admin payouts error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/admin/payouts/:payout_id ──────────────────────────────────────
// Explicit transaction: update payout status + audit log
router.patch("/payouts/:payout_id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { payout_id } = req.params;
    const { status } = req.body;

    if (!["requested", "processed", "failed"].includes(status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const { rows: existing } = await client.query(
      "SELECT status, amount FROM payouts WHERE payout_id = $1",
      [payout_id]
    );

    if (!existing.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    const oldStatus = existing[0].status;
    const payoutAmount = Number(existing[0].amount || 0);

    await client.query(
      "UPDATE payouts SET status = $1 WHERE payout_id = $2",
      [status, payout_id]
    );

    if (oldStatus !== status && status === "processed" && payoutAmount > 0) {
      await updateFinanceKpis(client, { processed: payoutAmount });
    }

    await logAudit(client, adminId, `Updated payout ${payout_id} to ${status}`, "payout", payout_id);

    await client.query("COMMIT");
    res.json({ success: true, message: "Payout updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin payout update error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── GET /api/admin/product-views ─────────────────────────────────────────────
// Returns paginated view_logs with product + user info.
// Supports filtering by product_id, date range.
router.get("/product-views", async (req, res) => {
  try {
    const { product_id, from, to, page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const params = [];

    if (product_id) {
      params.push(Number(product_id));
      conditions.push(`vl.product_id = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`vl.created_at >= $${params.length}::timestamptz`);
    }
    if (to) {
      params.push(to);
      conditions.push(`vl.created_at <= $${params.length}::timestamptz`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM view_logs vl ${where}`, params
    );

    params.push(Number(limit), offset);
    const { rows } = await pool.query(
      `SELECT
         vl.view_id,
         vl.created_at,
         vl.duration_seconds,
         vl.product_id,
         p.name  AS product_name,
         vl.user_id,
         u.name  AS user_name,
         u.email AS user_email
       FROM view_logs vl
       LEFT JOIN products p ON p.product_id = vl.product_id
       LEFT JOIN users    u ON u.user_id    = vl.user_id
       ${where}
       ORDER BY vl.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRes.rows[0].total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error("admin product-views error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/product-views/summary ─────────────────────────────────────
// Returns per-product view counts (most viewed first) for the last N days.
router.get("/product-views/summary", async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const { rows } = await pool.query(
      `SELECT
         p.product_id,
         p.name AS product_name,
         COUNT(vl.view_id)::int                        AS total_views,
         COUNT(DISTINCT vl.user_id)::int               AS unique_viewers,
         ROUND(AVG(vl.duration_seconds))::int          AS avg_duration_seconds,
         MAX(vl.created_at)                            AS last_viewed_at
       FROM view_logs vl
       JOIN products p ON p.product_id = vl.product_id
       WHERE vl.created_at >= NOW() - ($1 || ' days')::interval
       GROUP BY p.product_id, p.name
       ORDER BY total_views DESC
       LIMIT $2`,
      [days, limit]
    );

    res.json({ success: true, data: rows, period_days: days });
  } catch (err) {
    console.error("admin product-views summary error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /api/admin/stores ─────────────────────────────────────────────────────
// List all stores with seller info; filterable by store_status.
router.get("/stores", async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`s.store_status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(s.store_name ILIKE $${params.length} OR s.store_slug ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM stores s ${where}`, params
    );

    params.push(Number(limit), offset);
    const { rows } = await pool.query(
      `SELECT
         s.store_id, s.store_name, s.store_slug,
         s.store_status, s.store_rating,
         s.created_at, s.approved_at,
         u.name  AS seller_name,
         u.email AS seller_email,
         sel.seller_id,
         approver.name AS approved_by_name
       FROM stores s
       JOIN sellers sel ON sel.seller_id = s.seller_id
       JOIN users   u   ON u.user_id     = sel.user_id
       LEFT JOIN admins  adm ON adm.admin_id = s.approved_by
       LEFT JOIN users   approver ON approver.user_id = adm.user_id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRes.rows[0].total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error("admin stores error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/admin/stores/:store_id/status ──────────────────────────────────
// Approve / suspend / reactivate a store.
// Body: { status: "active" | "suspended" | "inactive" | "pending" }
router.patch("/stores/:store_id/status", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const adminId = await getAdminId(req.user.userId);
    const { store_id } = req.params;
    const { status } = req.body;

    if (!["pending", "active", "inactive", "suspended"].includes(status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // When approving, stamp approved_at and approved_by
    const approvalFields = status === "active"
      ? ", approved_at = NOW(), approved_by = $3"
      : "";
    const queryParams = status === "active"
      ? [status, store_id, adminId]
      : [status, store_id];

    await client.query(
      `UPDATE stores
       SET store_status = $1${approvalFields}
       WHERE store_id = $2`,
      queryParams
    );

    await logAudit(
      client, adminId,
      `Set store ${store_id} status to ${status}`,
      "store", store_id
    );

    await client.query("COMMIT");
    res.json({ success: true, message: `Store status updated to ${status}` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("admin store status error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── GET /api/admin/couriers ────────────────────────────────────────────────────
// List all couriers
router.get("/couriers", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT courier_id, name, contact_info FROM couriers ORDER BY name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("admin couriers error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/admin/couriers ───────────────────────────────────────────────────
// Create a new courier
router.post("/couriers", async (req, res) => {
  const { name, contact_info } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Courier name required" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO couriers (name, contact_info) VALUES ($1, $2) RETURNING courier_id, name, contact_info`,
      [name.trim(), contact_info || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Courier name already exists" });
    }
    console.error("create courier error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── PATCH /api/admin/couriers/:courier_id ─────────────────────────────────────
// Update courier details
router.patch("/couriers/:courier_id", async (req, res) => {
  const { courier_id } = req.params;
  const { name, contact_info } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Courier name required" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE couriers SET name = $1, contact_info = $2 WHERE courier_id = $3 RETURNING courier_id, name, contact_info`,
      [name.trim(), contact_info || null, courier_id]
    );
    
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Courier not found" });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("update courier error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── DELETE /api/admin/couriers/:courier_id ────────────────────────────────────
// Delete a courier (if not used in shipments)
router.delete("/couriers/:courier_id", async (req, res) => {
  const { courier_id } = req.params;

  try {
    // Check if courier is used in any shipments
    const { rows: shipmentRows } = await pool.query(
      `SELECT COUNT(*) AS count FROM shipments WHERE courier_id = $1`,
      [courier_id]
    );
    
    if (shipmentRows[0].count > 0) {
      return res.status(409).json({ success: false, message: "Cannot delete courier - it has shipments associated" });
    }

    const { rows } = await pool.query(
      `DELETE FROM couriers WHERE courier_id = $1 RETURNING courier_id`,
      [courier_id]
    );
    
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Courier not found" });
    }
    
    res.json({ success: true, message: "Courier deleted" });
  } catch (err) {
    console.error("delete courier error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

