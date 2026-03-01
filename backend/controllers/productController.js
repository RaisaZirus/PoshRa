import { pool } from "../db.js";

// CRUD

export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(`
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

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
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
