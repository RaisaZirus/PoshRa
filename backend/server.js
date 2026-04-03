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
