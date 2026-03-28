import { pool } from "../db.js";

async function getCustomerId(userId) {
  const { rows } = await pool.query(
    "SELECT customer_id FROM customers WHERE user_id = $1",
    [userId]
  );
  if (!rows.length) throw new Error("Customer account not found");
  return rows[0].customer_id;
}

// Get or create cart — wrapped in explicit transaction
async function getOrCreateCart(client, customer_id) {
  const { rows } = await client.query(
    "SELECT cart_id FROM carts WHERE customer_id = $1",
    [customer_id]
  );
  if (rows.length) return rows[0].cart_id;

  const { rows: created } = await client.query(
    "INSERT INTO carts (customer_id, updated_at) VALUES ($1, NOW()) RETURNING cart_id",
    [customer_id]
  );
  return created[0].cart_id;
}

// ─── GET /api/cart ────────────────────────────────────────────────────────────
// Read-only: no transaction needed
export async function getCart(req, res) {
  try {
    const customer_id = await getCustomerId(req.user.userId);

    const result = await pool.query(
      `SELECT
        ci.cart_item_id,
        ci.cart_id,
        ci.variant_id,
        ci.quantity,
        pv.sku,
        pv.price,
        pv.discount_price,
        pv.stock,
        p.product_id,
        p.name AS product_name,
        p.brand,
        pi.image_url,
        s.store_id,
        s.store_name
      FROM cart_items ci
      JOIN carts c              ON ci.cart_id    = c.cart_id
      JOIN product_variants pv  ON ci.variant_id = pv.variant_id
      JOIN products p           ON pv.product_id = p.product_id
      JOIN stores s             ON p.store_id    = s.store_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
      WHERE c.customer_id = $1
      ORDER BY ci.cart_item_id DESC`,
      [customer_id]
    );

    const items = result.rows;
    const total = items.reduce((sum, item) => {
      return sum + (Number(item.discount_price || item.price)) * item.quantity;
    }, 0);

    res.json({
      success: true,
      data: { items, total: Math.round(total), itemCount: items.length },
    });
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
}

// ─── POST /api/cart/items ─────────────────────────────────────────────────────
// Explicit transaction: get/create cart → upsert cart_item
export async function addItemToCart(req, res) {
  const { variant_id, quantity } = req.body;
  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, message: "variant_id and quantity required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const customer_id = await getCustomerId(req.user.userId);
    const cart_id = await getOrCreateCart(client, customer_id);

    // Update cart timestamp
    await client.query(
      "UPDATE carts SET updated_at = NOW() WHERE cart_id = $1",
      [cart_id]
    );

    // Upsert: increment quantity if already in cart, else insert
    const existing = await client.query(
      "SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = $1 AND variant_id = $2",
      [cart_id, variant_id]
    );

    let cartItemId;
    if (existing.rows.length) {
      const newQty = existing.rows[0].quantity + Number(quantity);
      const upd = await client.query(
        "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 RETURNING cart_item_id",
        [newQty, existing.rows[0].cart_item_id]
      );
      cartItemId = upd.rows[0].cart_item_id;
    } else {
      const ins = await client.query(
        "INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES ($1, $2, $3) RETURNING cart_item_id",
        [cart_id, variant_id, quantity]
      );
      cartItemId = ins.rows[0].cart_item_id;
    }

    await client.query("COMMIT");

    // Return the updated item with full product info
    const { rows } = await pool.query(
      `SELECT ci.cart_item_id, ci.variant_id, ci.quantity,
              pv.sku, pv.price, pv.discount_price,
              p.product_id, p.name, p.brand
       FROM cart_items ci
       JOIN product_variants pv ON ci.variant_id = pv.variant_id
       JOIN products p          ON pv.product_id  = p.product_id
       WHERE ci.cart_item_id = $1`,
      [cartItemId]
    );

    res.json({ success: true, message: "Item added to cart", data: rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error adding to cart:", error.message);
    res.status(500).json({ success: false, message: "Failed to add item to cart" });
  } finally {
    client.release();
  }
}

// ─── PUT /api/cart/items/:cart_item_id ────────────────────────────────────────
// Explicit transaction: update quantity
export async function updateCartItem(req, res) {
  const { cart_item_id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: "quantity must be >= 1" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 RETURNING *",
      [quantity, cart_item_id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Update cart timestamp
    await client.query(
      "UPDATE carts SET updated_at = NOW() WHERE cart_id = $1",
      [result.rows[0].cart_id]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Cart item updated", data: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating cart item:", error.message);
    res.status(500).json({ success: false, message: "Failed to update cart item" });
  } finally {
    client.release();
  }
}

// ─── DELETE /api/cart/items/:cart_item_id ─────────────────────────────────────
// Explicit transaction: delete cart item
export async function removeCartItem(req, res) {
  const { cart_item_id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      "DELETE FROM cart_items WHERE cart_item_id = $1 RETURNING *",
      [cart_item_id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Update cart timestamp
    await client.query(
      "UPDATE carts SET updated_at = NOW() WHERE cart_id = $1",
      [result.rows[0].cart_id]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Item removed from cart", data: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error removing from cart:", error.message);
    res.status(500).json({ success: false, message: "Failed to remove item from cart" });
  } finally {
    client.release();
  }
}

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
// Explicit transaction: clear all items from the cart
export async function clearCart(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const customer_id = await getCustomerId(req.user.userId);

    const result = await client.query(
      `DELETE FROM cart_items
       WHERE cart_id = (SELECT cart_id FROM carts WHERE customer_id = $1)
       RETURNING *`,
      [customer_id]
    );

    await client.query(
      "UPDATE carts SET updated_at = NOW() WHERE customer_id = $1",
      [customer_id]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Cart cleared", deletedItems: result.rows.length });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error clearing cart:", error.message);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  } finally {
    client.release();
  }
}
