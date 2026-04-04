import fs from "fs/promises";
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

async function applyProcedureFromDbSql() {
  console.log("Current working directory:", process.cwd());
  const client = await pool.connect();
  try {
    // Read the db.sql file
    const sqlContent = await fs.readFile("db.sql", "utf8");

    // Find the place_order procedure
    const procedureStart = sqlContent.indexOf("CREATE OR REPLACE PROCEDURE place_order(");
    const procedureEnd = sqlContent.indexOf("$$ LANGUAGE plpgsql;", procedureStart) + "$$ LANGUAGE plpgsql;".length;

    if (procedureStart === -1) {
      throw new Error("Could not find place_order procedure in db.sql");
    }

    const procedureSQL = sqlContent.slice(procedureStart, procedureEnd);

    console.log("Applying updated place_order procedure from db.sql...");
    console.log("Procedure SQL length:", procedureSQL.length);

    await client.query(procedureSQL);

    console.log("✅ place_order procedure updated successfully!");
    console.log("The procedure now includes coupon discount proportional distribution.");

  } catch (err) {
    console.error("❌ Failed to apply procedure:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

applyProcedureFromDbSql();