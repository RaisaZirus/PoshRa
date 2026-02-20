import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { pool } from "./db.js"; // ✅ use your pg Pool (from test.js)
import { aj } from "./lib/arcjet.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Apply arcjet to all routes
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

    if (
      decision.results.some(
        (result) => result.reason.isBot() && result.reason.isSpoofed()
      )
    ) {
      return res.status(403).json({ error: "Spoofed bot detected" });
    }

    next();
  } catch (error) {
    console.log("Arcjet error", error);
    next(error);
  }
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);

// ✅ (from test.js) confirm DB is reachable + print server time
async function checkDBConnection() {
  const res = await pool.query("SELECT NOW() as now;");
  console.log("DB connected. Time:", res.rows[0].now);

  // Optional: show which DB you're connected to (helps debug)
  const info = await pool.query(
    "SELECT current_database() AS db, current_schema() AS schema;"
  );
  console.log("Connected DB:", info.rows[0]);

  const tables = await pool.query(`
      SELECT name
      FROM users
      WHERE LOWER(name) = LOWER('Rahima');
    `);
   // console.log("Tables:", tables.rows.map(r => r.table_name));
    //check if table loaded successfully
    console.log(tables.rows);
    const tableCheck = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users';
    `);

    console.log("Users table exists?:", tableCheck.rows.length > 0);
    

}

// ✅ start server only after DB is confirmed + initialized
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

// ✅ graceful shutdown so pool closes properly
process.on("SIGINT", async () => {
  try {
    await pool.end();
  } finally {
    process.exit(0);
  }
});
process.on("SIGTERM", async () => {
  try {
    await pool.end();
  } finally {
    process.exit(0);
  }
});
