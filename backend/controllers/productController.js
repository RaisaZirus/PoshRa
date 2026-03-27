import { pool } from "../db.js";

// CRUD

export const getAllProducts = async (req, res) => {
  try {
    const search = req.query.q ? req.query.q.trim() : "";
    const values = [];
    let whereClause = "WHERE p.status = 'active'";

    if (search) {
      values.push(`%${search}%`);
      whereClause += ` AND (p.name ILIKE $${values.length} OR p.brand ILIKE $${values.length})`;
    }

    const query = `
      SELECT 
        p.product_id,
        p.store_id,
        p.category_id,
        p.name,
        p.description,
        p.brand,
        p.status,
        p.created_at,
        COALESCE(MIN(pv.price), 0) as min_price,
        COALESCE(MAX(pi.image_url) FILTER (WHERE pi.is_primary), MIN(pi.image_url)) as image_url,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'variant_id', pv.variant_id,
          'sku', pv.sku,
          'price', pv.price,
          'discount_price', pv.discount_price,
          'stock', pv.stock
        )) FILTER (WHERE pv.variant_id IS NOT NULL), '[]'::json) as variants,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'image_id', pi.image_id,
          'image_url', pi.image_url,
          'is_primary', pi.is_primary
        )) FILTER (WHERE pi.image_id IS NOT NULL), '[]'::json) as images,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'attribute_id', pa.attribute_id,
          'name', pa.name,
          'value', pa.value
        )) FILTER (WHERE pa.attribute_id IS NOT NULL), '[]'::json) as attributes
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      LEFT JOIN product_attributes pa ON p.product_id = pa.product_id
      ${whereClause}
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, values);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.log("Error in getAllProducts func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createProduct = async (req, res) => {
  const { store_id, category_id, name, description, brand, variants, images, attributes } = req.body;

  if (!name || !store_id || !variants || variants.length === 0 || !images || images.length === 0) {
    return res.status(400).json({ success: false, message: "Required fields: name, store_id, variants[], images[]" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert product
    const productResult = await client.query(
      `INSERT INTO products (store_id, category_id, name, description, brand, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [store_id, category_id || null, name, description || null, brand || null, "active"]
    );
    const product = productResult.rows[0];

    // Insert variants
    for (const variant of variants) {
      await client.query(
        `INSERT INTO product_variants (product_id, sku, price, discount_price, stock)
         VALUES ($1, $2, $3, $4, $5)`,
        [product.product_id, variant.sku, variant.price, variant.discount_price || null, variant.stock || 0]
      );
    }

    // Insert images
    for (let i = 0; i < images.length; i++) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, is_primary)
         VALUES ($1, $2, $3)`,
        [product.product_id, images[i].image_url, images[i].is_primary || i === 0]
      );
    }

    // Insert attributes if provided
    if (attributes && attributes.length > 0) {
      for (const attr of attributes) {
        await client.query(
          `INSERT INTO product_attributes (product_id, name, value)
           VALUES ($1, $2, $3)`,
          [product.product_id, attr.name, attr.value]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: product, message: "Product created successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in createProduct func:", error.message);
    console.error("Error details:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  } finally {
    client.release();
  }
};

export const getProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  try {
    const result = await pool.query(
      `SELECT 
        p.product_id,
        p.store_id,
        p.category_id,
        p.name,
        p.description,
        p.brand,
        p.status,
        p.created_at,
        COALESCE(MIN(pv.price), 0) as min_price,
        COALESCE(MAX(pi.image_url) FILTER (WHERE pi.is_primary), MIN(pi.image_url)) as image_url,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'variant_id', pv.variant_id,
          'sku', pv.sku,
          'price', pv.price,
          'discount_price', pv.discount_price,
          'stock', pv.stock
        )) FILTER (WHERE pv.variant_id IS NOT NULL), '[]'::json) as variants,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'image_id', pi.image_id,
          'image_url', pi.image_url,
          'is_primary', pi.is_primary
        )) FILTER (WHERE pi.image_id IS NOT NULL), '[]'::json) as images,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'attribute_id', pa.attribute_id,
          'name', pa.name,
          'value', pa.value
        )) FILTER (WHERE pa.attribute_id IS NOT NULL), '[]'::json) as attributes
       FROM products p
       LEFT JOIN product_variants pv ON p.product_id = pv.product_id
       LEFT JOIN product_images pi ON p.product_id = pi.product_id
       LEFT JOIN product_attributes pa ON p.product_id = pa.product_id
       WHERE p.product_id = $1
       GROUP BY p.product_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error in getProduct func:", error.message);
    console.error("Error details:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  const { name, description, brand, category_id, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           brand = COALESCE($3, brand),
           category_id = COALESCE($4, category_id),
           status = COALESCE($5, status)
       WHERE product_id = $6
       RETURNING *`,
      [name, description, brand, category_id, status, id]
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
    const result = await pool.query(
      `DELETE FROM products WHERE product_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.log("Error in deleteProduct func", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const storeId = req.query.storeId ? Number(req.query.storeId) : null;
    const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : null;
    const inStock = req.query.inStock === "true" ? true : req.query.inStock === "false" ? false : null;
    const sort = req.query.sort || null;
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 20;
    const offset = (page - 1) * limit;

    const params = [];
    const where = [];

    where.push("p.status = 'active'");
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

    let orderSQL = "ORDER BY p.created_at DESC";
    if (sort === "price_asc") orderSQL = "ORDER BY price ASC NULLS LAST";
    else if (sort === "price_desc") orderSQL = "ORDER BY price DESC NULLS LAST";
    else if (sort === "newest") orderSQL = "ORDER BY p.created_at DESC";

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
    } catch (_) {
      // ignore logging errors
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
