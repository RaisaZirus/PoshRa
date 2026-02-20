import { pool } from "../db.js";

// CRUD

export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.product_id AS id, p.*, MIN(v.price) AS price, MAX(pi.image_url) AS image, SUM(v.stock) AS total_stock
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.product_id
      LEFT JOIN product_images pi ON pi.product_id = p.product_id
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
      LIMIT 200
    `);

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.log("Error in getAllProducts func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createProduct = async (req, res) => {
  const { store_id, category_id, name, description, brand, status, price, image, stock } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: "Missing product name" });
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO products (store_id, category_id, name, description, brand, status)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'active'))
       RETURNING *`,
      [store_id || null, category_id || null, name, description || null, brand || null, status || null]
    );

    const product = insertRes.rows[0];

    // If a price was provided, create a default variant to keep compatibility with simple forms
    if (price !== undefined && price !== null) {
      const sku = `sku-${product.product_id}-${Date.now()}`;
      await pool.query(
        `INSERT INTO product_variants (product_id, sku, price, stock) VALUES ($1, $2, $3, $4)`,
        [product.product_id, sku, price, stock || 0]
      );
    }

    // If an image was provided, add it as the primary image
    if (image) {
      await pool.query(
        `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, TRUE)`,
        [product.product_id, image]
      );
    }

    // Return a frontend-friendly shape
    const resp = await pool.query(
      `SELECT p.product_id AS id, p.*, MIN(v.price) AS price, MAX(pi.image_url) AS image
       FROM products p
       LEFT JOIN product_variants v ON v.product_id = p.product_id
       LEFT JOIN product_images pi ON pi.product_id = p.product_id
       WHERE p.product_id = $1
       GROUP BY p.product_id`,
      [product.product_id]
    );

    res.status(201).json({ success: true, data: resp.rows[0] });
  } catch (error) {
    console.log("Error in createProduct func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  try {
    const prodRes = await pool.query(`SELECT * FROM products WHERE product_id = $1`, [id]);
    if (prodRes.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });

    const product = prodRes.rows[0];
    const variantsRes = await pool.query(`SELECT * FROM product_variants WHERE product_id = $1`, [id]);
    const imagesRes = await pool.query(`SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, image_id ASC`, [id]);

    // build frontend-friendly shape
    const price = variantsRes.rows.length ? Math.min(...variantsRes.rows.map(v => Number(v.price))) : null;
    const image = imagesRes.rows.length ? imagesRes.rows[0].image_url : null;

    res.status(200).json({ success: true, data: { id: product.product_id, ...product, price, image, variants: variantsRes.rows, images: imagesRes.rows } });
  } catch (error) {
    console.log("Error in getProduct func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  const { store_id, category_id, name, description, brand, status, price, image, stock } = req.body;

  try {
    const updateRes = await pool.query(
      `UPDATE products SET store_id = $1, category_id = $2, name = $3, description = $4, brand = $5, status = COALESCE($6, status), updated_at = NOW()
       WHERE product_id = $7 RETURNING *`,
      [store_id || null, category_id || null, name || null, description || null, brand || null, status || null, id]
    );

    if (updateRes.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });

    // If price provided, update first variant or create one
    if (price !== undefined && price !== null) {
      const varRes = await pool.query(`SELECT * FROM product_variants WHERE product_id = $1 ORDER BY variant_id LIMIT 1`, [id]);
      if (varRes.rows.length > 0) {
        await pool.query(`UPDATE product_variants SET price = $1, stock = COALESCE($2, stock) WHERE variant_id = $3`, [price, stock || null, varRes.rows[0].variant_id]);
      } else {
        const sku = `sku-${id}-${Date.now()}`;
        await pool.query(`INSERT INTO product_variants (product_id, sku, price, stock) VALUES ($1, $2, $3, $4)`, [id, sku, price, stock || 0]);
      }
    }

    // If image provided, update primary image or insert
    if (image) {
      const imgRes = await pool.query(`SELECT * FROM product_images WHERE product_id = $1 AND is_primary = TRUE LIMIT 1`, [id]);
      if (imgRes.rows.length > 0) {
        await pool.query(`UPDATE product_images SET image_url = $1 WHERE image_id = $2`, [image, imgRes.rows[0].image_id]);
      } else {
        await pool.query(`INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, TRUE)`, [id, image]);
      }
    }

    const resp = await pool.query(
      `SELECT p.product_id AS id, p.*, MIN(v.price) AS price, MAX(pi.image_url) AS image
       FROM products p
       LEFT JOIN product_variants v ON v.product_id = p.product_id
       LEFT JOIN product_images pi ON pi.product_id = p.product_id
       WHERE p.product_id = $1
       GROUP BY p.product_id`,
      [id]
    );

    res.status(200).json({ success: true, data: resp.rows[0] });
  } catch (error) {
    console.log("Error in updateProduct func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  try {
    const result = await pool.query(`DELETE FROM products WHERE product_id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.log("Error in deleteProduct func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const offset = (page - 1) * limit;

    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const storeId = req.query.storeId ? Number(req.query.storeId) : null;
    const inStock = req.query.inStock === "true" ? true : req.query.inStock === "false" ? false : null;
    const sort = (req.query.sort || "").toLowerCase(); // e.g. price_asc, price_desc, newest

    const where = [];
    const params = [];

    // only active products by default
    where.push(`p.status = 'active'`);

    if (q) {
      params.push(`%${q}%`);
      where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.brand ILIKE $${params.length})`);
    }

    if (categoryId && Number.isInteger(categoryId)) {
      params.push(categoryId);
      where.push(`p.category_id = $${params.length}`);
    }

    if (storeId && Number.isInteger(storeId)) {
      params.push(storeId);
      where.push(`p.store_id = $${params.length}`);
    }

    if (minPrice !== null) {
      params.push(minPrice);
      where.push(`v.price >= $${params.length}`);
    }

    if (maxPrice !== null) {
      params.push(maxPrice);
      where.push(`v.price <= $${params.length}`);
    }

    if (inStock === true) {
      where.push(`EXISTS (SELECT 1 FROM product_variants vv WHERE vv.product_id = p.product_id AND vv.stock > 0)`);
    } else if (inStock === false) {
      where.push(`NOT EXISTS (SELECT 1 FROM product_variants vv WHERE vv.product_id = p.product_id AND vv.stock > 0)`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Build ordering
    let orderSQL = "ORDER BY p.created_at DESC";
if (sort === "price_asc") orderSQL = "ORDER BY price ASC NULLS LAST";
else if (sort === "price_desc") orderSQL = "ORDER BY price DESC NULLS LAST";
else if (sort === "newest") orderSQL = "ORDER BY p.created_at DESC";

    // Main query: aggregate variant info per product and include a primary image
    const dataQuery = `
      SELECT p.product_id AS id, p.*, MIN(v.price) AS price, MAX(v.price) AS max_price, SUM(v.stock) AS total_stock, MAX(pi.image_url) AS image
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.product_id
      LEFT JOIN product_images pi ON pi.product_id = p.product_id
      ${whereSQL}
      GROUP BY p.product_id
      ${orderSQL}
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count total matching products for pagination
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM (
        SELECT p.product_id
        FROM products p
        LEFT JOIN product_variants v ON v.product_id = p.product_id
        ${whereSQL}
        GROUP BY p.product_id
      ) t
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, params),
      pool.query(countQuery, params),
    ]);

    // Log the search with filters (optional)
    try {
      const filtersForLog = {};
      if (minPrice !== null) filtersForLog.minPrice = minPrice;
      if (maxPrice !== null) filtersForLog.maxPrice = maxPrice;
      if (categoryId) filtersForLog.categoryId = categoryId;
      if (storeId) filtersForLog.storeId = storeId;
      if (inStock !== null) filtersForLog.inStock = inStock;
      if (Object.keys(filtersForLog).length > 0) {
        await pool.query(`INSERT INTO search_logs (query, filters, created_at) VALUES ($1, $2, NOW())`, [q || null, filtersForLog]);
      } else {
        await pool.query(`INSERT INTO search_logs (query, created_at) VALUES ($1, NOW())`, [q || null]);
      }
    } catch (e) {
      // ignore logging failures
    }

    const total = countResult.rows[0]?.total || 0;
    const meta = { total, page, limit };

    res.status(200).json({ success: true, data: dataResult.rows, meta });
  } catch (error) {
    console.log("Error in searchProducts func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const searchSuggestions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT query, COUNT(*) AS count
      FROM search_logs
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `);

    const suggestions = result.rows.map(row => ({ query: row.query, count: Number(row.count) }));
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    console.log("Error in searchSuggestions func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const autocomplete = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 1) {
      return res.status(200).json({ success: true, data: [] });
    }

    const like = `%${q}%`;
    const result = await pool.query(
      `
      SELECT DISTINCT name
      FROM products
      WHERE name ILIKE $1
      ORDER BY name
      LIMIT 10
      `,
      [like]
    );

    res.status(200).json({ success: true, data: result.rows.map(row => ({ name: row.name })) });
  } catch (error) {
    console.log("Error in autocomplete func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
