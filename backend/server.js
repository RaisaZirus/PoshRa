import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { pool } from "./db.js";
import { aj } from "./lib/arcjet.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { requested: 1 });
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ error: "Too Many Requests" });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({ error: "Bot access denied" });
      }
      return res.status(403).json({ error: "Forbidden" });
    }
    if (decision.results.some((r) => r.reason.isBot() && r.reason.isSpoofed())) {
      return res.status(403).json({ error: "Spoofed bot detected" });
    }
    next();
  } catch (error) {
    console.log("Arcjet error", error);
    next(error);
  }
});

app.use("/api/products",           productRoutes);
app.use("/api/account/addresses",  addressRoutes);
app.use("/api/auth",               authRoutes);
app.use("/api/cart",               cartRoutes);
app.use("/api/orders",             orderRoutes);
app.use("/api/payments",           paymentRoutes);
app.use("/api/notifications",      notificationRoutes);
app.use("/api/categories",         categoryRoutes);
app.use("/api/seller",             sellerRoutes);
app.use("/api/stores",             storeRoutes);
app.use("/api/wishlist",           wishlistRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin",              adminRoutes);

// Public active campaign list used by HomePage
app.get("/api/campaigns/active", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.campaign_id, c.name, c.start_time, c.end_time,
              COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
                'variant_id', cp.variant_id,
                'product_id', p.product_id,
                'name', p.name,
                'store_name', s.store_name,
                'image_url', COALESCE(pi.image_url, ''),
                'price', pv.price,
                'discount_price', cp.discount_price
              ) ORDER BY cp.variant_id) FILTER (WHERE cp.variant_id IS NOT NULL), '[]') AS highlights
       FROM campaigns c
       LEFT JOIN campaign_products cp ON cp.campaign_id = c.campaign_id
       LEFT JOIN product_variants pv ON pv.variant_id = cp.variant_id
       LEFT JOIN products p ON p.product_id = pv.product_id
       LEFT JOIN stores s ON s.store_id = p.store_id
       LEFT JOIN product_images pi ON pi.product_id = p.product_id AND pi.is_primary
       WHERE NOW() BETWEEN c.start_time AND c.end_time
       GROUP BY c.campaign_id
       ORDER BY c.start_time`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("active campaigns error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

async function checkDBConnection() {
  const res = await pool.query("SELECT NOW() as now;");
  console.log("DB connected. Time:", res.rows[0].now);
  const info = await pool.query(
    "SELECT current_database() AS db, current_schema() AS schema;"
  );
  console.log("Connected DB:", info.rows[0]);
}

async function startServer() {
  try {
    await checkDBConnection();
    app.listen(PORT, () => {
      console.log("Server is running on port " + PORT);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
}

startServer();

process.on("SIGINT",  async () => { try { await pool.end(); } finally { process.exit(0); } });
process.on("SIGTERM", async () => { try { await pool.end(); } finally { process.exit(0); } });


