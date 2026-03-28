import { pool } from "../db.js";

// ─── GET /api/products ────────────────────────────────────────────────────────
// Complex query: joins products → variants → images + aggregates
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
      SELECT 
        p.product_id,
        p.store_id,
        p.category_id,
        p.name,
        p.description,
        p.brand,
        p.status,
        p.created_at,
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
      WHERE p.status = 'active'
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
    `);

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── POST /api/products ───────────────────────────────────────────────────────
// Explicit transaction: insert product → variants → images → attributes
// If any step fails the entire operation is rolled back.
export const createProduct = async (req, res) => {
  const { store_id, category_id, name, description, brand, variants, images, attributes } = req.body;

  if (!name || !store_id || !variants?.length || !images?.length) {
    return res.status(400).json({
      success: false,
      message: "Required fields: name, store_id, variants[], images[]",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert product
    const productResult = await client.query(
      `INSERT INTO products (store_id, category_id, name, description, brand, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [store_id, category_id || null, name, description || null, brand || null]
    );
    const product = productResult.rows[0];

    // Insert variants
    for (const variant of variants) {
      await client.query(
        `INSERT INTO product_variants (product_id, sku, price, discount_price, stock)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          product.product_id,
          variant.sku,
          variant.price,
          variant.discount_price || null,
          variant.stock || 0,
        ]
      );
    }

    // Insert images
    for (let i = 0; i < images.length; i++) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, is_primary)
         VALUES ($1, $2, $3)`,
        [product.product_id, images[i].image_url, images[i].is_primary ?? i === 0]
      );
    }

    // Insert attributes (optional)
    if (attributes?.length) {
      for (const attr of attributes) {
        await client.query(
          `INSERT INTO product_attributes (product_id, name, value) VALUES ($1, $2, $3)`,
          [product.product_id, attr.name, attr.value]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in createProduct:", error.message);
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "SKU already exists" });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// ─── GET /api/products/:id ────────────────────────────────────────────────────
// Complex query: product + store + reviews avg + variants + images + attributes
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
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'variant_id',     pv.variant_id,
          'sku',            pv.sku,
          'price',          pv.price,
          'discount_price', pv.discount_price,
          'stock',          pv.stock
        )) FILTER (WHERE pv.variant_id IS NOT NULL), '[]'::json) AS variants,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'image_id',  pi.image_id,
          'image_url', pi.image_url,
          'is_primary',pi.is_primary
        )) FILTER (WHERE pi.image_id IS NOT NULL), '[]'::json) AS images,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'attribute_id', pa.attribute_id,
          'name',         pa.name,
          'value',        pa.value
        )) FILTER (WHERE pa.attribute_id IS NOT NULL), '[]'::json) AS attributes
       FROM products p
       JOIN stores s           ON s.store_id    = p.store_id
       LEFT JOIN reviews r     ON r.product_id  = p.product_id
       LEFT JOIN product_variants pv ON pv.product_id = p.product_id
       LEFT JOIN product_images pi   ON pi.product_id = p.product_id
       LEFT JOIN product_attributes pa ON pa.product_id = p.product_id
       WHERE p.product_id = $1
       GROUP BY p.product_id, s.store_name, s.store_slug`,
      [id]
    );

    const product = prodRes.rows[0];
    const variantsRes = await pool.query(`SELECT * FROM product_variants WHERE product_id = $1`, [id]);
    const imagesRes = await pool.query(`SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, image_id ASC`, [id]);

    // build frontend-friendly shape
    const price = variantsRes.rows.length ? Math.min(...variantsRes.rows.map(v => Number(v.price))) : null;
    const image = imagesRes.rows.length ? imagesRes.rows[0].image_url : null;

    res.status(200).json({ success: true, data: { id: product.product_id, ...product, price, image, variants: variantsRes.rows, images: imagesRes.rows } });
  } catch (error) {
    console.error("Error in getProduct:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── PATCH /api/products/:id ──────────────────────────────────────────────────
// Explicit transaction: update product fields + optionally update variant price/stock
// + optionally update primary image — all or nothing.
export const updateProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  const { name, description, brand, category_id, status, price, stock, image } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update the product row
    const updateRes = await client.query(
      `UPDATE products
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           brand       = COALESCE($3, brand),
           category_id = COALESCE($4, category_id),
           status      = COALESCE($5, status)
       WHERE product_id = $6
       RETURNING *`,
      [name, description, brand, category_id, status, id]
    );

    if (!updateRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Optionally update the first variant's price/stock
    if (price !== undefined || stock !== undefined) {
      const varRes = await client.query(
        `SELECT variant_id FROM product_variants WHERE product_id = $1 ORDER BY variant_id LIMIT 1`,
        [id]
      );
      if (varRes.rows.length) {
        await client.query(
          `UPDATE product_variants
           SET price = COALESCE($1, price),
               stock = COALESCE($2, stock)
           WHERE variant_id = $3`,
          [price ?? null, stock ?? null, varRes.rows[0].variant_id]
        );
      } else if (price !== undefined) {
        // No variant yet — create one
        await client.query(
          `INSERT INTO product_variants (product_id, sku, price, stock)
           VALUES ($1, $2, $3, $4)`,
          [id, `sku-${id}-${Date.now()}`, price, stock || 0]
        );
      }
    }

    // Optionally update the primary image
    if (image) {
      const imgRes = await client.query(
        `SELECT image_id FROM product_images WHERE product_id = $1 AND is_primary = TRUE LIMIT 1`,
        [id]
      );
      if (imgRes.rows.length) {
        await client.query(
          `UPDATE product_images SET image_url = $1 WHERE image_id = $2`,
          [image, imgRes.rows[0].image_id]
        );
      } else {
        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, TRUE)`,
          [id, image]
        );
      }
    }

    await client.query("COMMIT");

    // Return updated product summary
    const resp = await pool.query(
      `SELECT p.product_id AS id, p.*,
              MIN(v.price) AS price,
              MAX(pi.image_url) AS image
       FROM products p
       LEFT JOIN product_variants v  ON v.product_id  = p.product_id
       LEFT JOIN product_images pi   ON pi.product_id = p.product_id
       WHERE p.product_id = $1
       GROUP BY p.product_id`,
      [id]
    );
    res.status(200).json({ success: true, data: resp.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateProduct:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
// Explicit transaction: deleting a product cascades to variants/images/attributes
// via FK ON DELETE CASCADE, but we wrap in a transaction to ensure atomicity
// and allow a clean rollback if anything goes wrong.
export const deleteProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `DELETE FROM products WHERE product_id = $1 RETURNING *`,
      [id]
    );

    // only active products by default
    where.push(`p.status = 'active'`);

    if (q) {
      params.push(`%${q}%`);
      where.push(
        `(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.brand ILIKE $${params.length})`
      );
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
    }

    const whereSQL = `WHERE ${where.join(" AND ")}`;
    const offset = (Number(page) - 1) * Number(limit);

    let orderSQL = "ORDER BY p.created_at DESC";
if (sort === "price_asc") orderSQL = "ORDER BY price ASC NULLS LAST";
else if (sort === "price_desc") orderSQL = "ORDER BY price DESC NULLS LAST";
else if (sort === "newest") orderSQL = "ORDER BY p.created_at DESC";

    const dataQuery = `
      SELECT p.product_id AS id, p.*,
             MIN(v.price) AS price, MAX(v.price) AS max_price,
             SUM(v.stock) AS total_stock,
             MAX(pi.image_url) AS image
      FROM products p
      LEFT JOIN product_variants v  ON v.product_id  = p.product_id
      LEFT JOIN product_images pi   ON pi.product_id = p.product_id
      ${whereSQL}
      GROUP BY p.product_id
      ${orderSQL}
      LIMIT ${Number(limit)} OFFSET ${offset}
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
    console.error("Error in searchProducts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET /api/products/suggestions ───────────────────────────────────────────
export const searchSuggestions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT query, COUNT(*) AS count
      FROM search_logs
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `);
    res.status(200).json({
      success: true,
      data: result.rows.map((r) => ({ query: r.query, count: Number(r.count) })),
    });
  } catch (error) {
    console.error("Error in searchSuggestions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET /api/products/autocomplete ──────────────────────────────────────────
export const autocomplete = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(200).json({ success: true, data: [] });

    const result = await pool.query(
      `SELECT DISTINCT name FROM products WHERE name ILIKE $1 ORDER BY name LIMIT 10`,
      [`%${q}%`]
    );
    res.status(200).json({
      success: true,
      data: result.rows.map((r) => ({ name: r.name })),
    });
  } catch (error) {
    console.error("Error in autocomplete:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
