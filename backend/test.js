import { pool } from "./db.js";

async function main() {
  try {
    const res = await pool.query("SELECT NOW() as now;");
    console.log("DB connected. Time:", res.rows[0].now);
    const info = await pool.query("SELECT current_database() AS db, current_schema() AS schema;");
    console.log(info.rows[0]);

    const tables = await pool.query(`
      SELECT name
      FROM users
      WHERE LOWER(name) = LOWER('Rahima');
    `);
   // console.log("Tables:", tables.rows.map(r => r.table_name));
      console.log(tables.rows)
  
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();


