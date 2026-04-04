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

async function testProcedure() {
  const client = await pool.connect();
  try {
    // First, let's see what the current procedure looks like
    const result = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'place_order'
    `);
    console.log("Current procedure definition:");
    console.log(result.rows[0]?.definition || "Not found");

    // Try a simple procedure creation
    await client.query(`
      CREATE OR REPLACE PROCEDURE test_proc(OUT p_out BIGINT)
      LANGUAGE plpgsql AS $$
      BEGIN
        p_out := 123;
      END;
      $$;
    `);
    console.log("✅ Simple procedure created successfully");

    // Clean up
    await client.query("DROP PROCEDURE IF EXISTS test_proc(BIGINT);");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testProcedure();