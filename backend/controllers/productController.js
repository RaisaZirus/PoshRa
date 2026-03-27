import { pool } from "../db.js";

// CRUD

export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.product_id AS id,
        p.product_id,
        p.store_id,
        p.category_id,
        p.name,
        p.description,
        p.brand,
        p.status,
        p.created_at,
        MIN(v.price)        AS price,
        MAX(pi.image_url)   AS image,
        SUM(v.stock)        AS total_stock,
        COALESCE((SELECT SUM(oi.quantity) FROM order_items oi
                  JOIN product_variants pv2 ON pv2.variant_id = oi.variant_id
                  WHERE pv2.product_id = p.product_id), 0)::int AS total_sold
      FROM products p
      LEFT JOIN product_variants v  ON v.product_id  = p.product_id
      LEFT JOIN product_images pi   ON pi.product_id = p.product_id
      WHERE p.status = 'active'
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
        s.store_name,
        s.store_slug,
        COALESCE(AVG(r.rating), 0)::numeric(3,1) AS avg_rating,
        COUNT(DISTINCT r.review_id)::int AS reviews_count,
        COALESCE((SELECT SUM(oi.quantity) FROM order_items oi
                  JOIN product_variants pv2 ON pv2.variant_id = oi.variant_id
                  WHERE pv2.product_id = p.product_id), 0)::int AS total_sold,
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
       JOIN stores s ON s.store_id = p.store_id
       LEFT JOIN reviews r ON r.product_id = p.product_id
       LEFT JOIN product_variants pv ON p.product_id = pv.product_id
       LEFT JOIN product_images pi ON p.product_id = pi.product_id
       LEFT JOIN product_attributes pa ON p.product_id = pa.product_id
       WHERE p.product_id = $1
       GROUP BY p.product_id, s.store_name, s.store_slug`,
      [id]
    );

    const product = result.rows[0];

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // build frontend-friendly shape from the already-joined data
    const price = product.variants?.length
      ? Math.min(...product.variants.map((v) => Number(v.price)))
      : null;
    const image = product.images?.length ? product.images[0].image_url : null;

    res.status(200).json({
      success: true,
      data: { id: product.product_id, ...product, price, image },
    });
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

    return res.json({ success: true, message: "Product deleted", data: result.rows[0] });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q, category_id, store_id, min_price, max_price, in_stock, sort, page = 1, limit = 20 } = req.query;

    const params = [];
    const where = [];

    const categoryId = category_id ? Number(category_id) : null;
    const storeId = store_id ? Number(store_id) : null;
    const minPrice = min_price !== undefined ? parseFloat(min_price) : null;
    const maxPrice = max_price !== undefined ? parseFloat(max_price) : null;
    const inStock = in_stock === "true" ? true : in_stock === "false" ? false : null;
    const offset = (Number(page) - 1) * Number(limit);

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