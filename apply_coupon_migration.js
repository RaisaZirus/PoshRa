import fs from "fs/promises";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "poshra",
});

async function main() {
  const sqlPath = "E:\\2-1\\Poshradh\\PoshRa\\backend\\apply_coupon_fix.sql";
  console.log("Reading SQL from:", sqlPath);
  const sql = await fs.readFile(sqlPath, "utf8");

  console.log("Applying coupon discount fix to database...");

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("✅ Coupon discount fix applied successfully!");
    console.log("The place_order procedure now distributes coupon discounts proportionally before calculating commissions.");
  } catch (err) {
    console.error("❌ Failed to apply coupon discount fix:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});