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
  const sqlPath = path.resolve("backend/db.sql");
  const sql = await fs.readFile(sqlPath, "utf8");
  const marker = "-- db_extensions.sql";
  const markerIndex = sql.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Could not find marker '${marker}' in backend/db.sql`);
  }

  const extensionSql = sql.slice(markerIndex);
  console.log("Applying DB extensions from backend/db.sql...");

  const client = await pool.connect();
  try {
    await client.query(extensionSql);
    console.log("✅ DB extension SQL applied successfully.");
  } catch (err) {
    console.error("❌ Failed to apply DB extension SQL:", err.message);
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
