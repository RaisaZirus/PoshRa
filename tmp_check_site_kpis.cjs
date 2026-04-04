const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'poshra', user: 'postgres' });
(async () => {
  try {
    const res = await pool.query('SELECT * FROM site_kpis_daily ORDER BY kpi_date DESC LIMIT 5');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
})();
