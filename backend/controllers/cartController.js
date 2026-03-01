import { pool } from "../db.js";

// Get or create cart for customer
async function getOrCreateCart(customer_id) {
  const client = await pool.connect();
  try {
    // Check if cart exists
    let cartResult = await client.query(
      "SELECT cart_id FROM carts WHERE customer_id = $1",
      [customer_id]
    );

    if (cartResult.rows.length === 0) {
      // Create new cart
      const createResult = await client.query(
        "INSERT INTO carts (customer_id, updated_at) VALUES ($1, NOW()) RETURNING cart_id",
        [customer_id]
      );
      return createResult.rows[0].cart_id;
    }

    return cartResult.rows[0].cart_id;
  } finally {
    client.release();
  }
}

// GET /api/cart - Get all items in cart
export async function getCart(req, res) {
  try {
    const customer_id = req.user?.customer_id || 1; // Default for testing

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
        p.name as product_name,
        p.brand,
        pi.image_url,
        s.store_id,
        s.store_name
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN product_variants pv ON ci.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      JOIN stores s ON p.store_id = s.store_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
      WHERE c.customer_id = $1
      ORDER BY ci.cart_item_id DESC`,
      [customer_id]
    );

    const cartItems = result.rows;
    const total = cartItems.reduce((sum, item) => {
      const price = item.discount_price || item.price;
      return sum + price * item.quantity;
    }, 0);

    res.json({
      success: true,
      data: {
        items: cartItems,
        total: Math.round(total),
        itemCount: cartItems.length,
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
}

// POST /api/cart/items - Add item to cart
export async function addItemToCart(req, res) {
  try {
    const { variant_id, quantity } = req.body;
    const customer_id = req.user?.customer_id || 1; // Default for testing

    if (!variant_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "variant_id and quantity required" });
    }

    const cart_id = await getOrCreateCart(customer_id);

    // Check if item already in cart
    const existingResult = await pool.query(
      "SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = $1 AND variant_id = $2",
      [cart_id, variant_id]
    );

    let cartItemId;
    if (existingResult.rows.length > 0) {
      // Update quantity
      const newQuantity = existingResult.rows[0].quantity + quantity;
      const updateResult = await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 RETURNING cart_item_id",
        [newQuantity, existingResult.rows[0].cart_item_id]
      );
      cartItemId = updateResult.rows[0].cart_item_id;
    } else {
      // Insert new item
      const insertResult = await pool.query(
        "INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES ($1, $2, $3) RETURNING cart_item_id",
        [cart_id, variant_id, quantity]
      );
      cartItemId = insertResult.rows[0].cart_item_id;
    }

    // Return updated cart
    const cartResult = await pool.query(
      `SELECT 
        ci.cart_item_id,
        ci.variant_id,
        ci.quantity,
        pv.sku,
        pv.price,
        pv.discount_price,
        p.product_id,
        p.name,
        p.brand
      FROM cart_items ci
      JOIN product_variants pv ON ci.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE ci.cart_item_id = $1`,
      [cartItemId]
    );

    res.json({
      success: true,
      message: "Item added to cart",
      data: cartResult.rows[0],
    });
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
}

// PUT /api/cart/items/:cart_item_id - Update quantity
export async function updateCartItem(req, res) {
  try {
    const { cart_item_id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "quantity must be >= 1",
      });
    }

    const result = await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 RETURNING *",
      [quantity, cart_item_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({
      success: true,
      message: "Cart item updated",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating cart item:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
    });
  }
}

// DELETE /api/cart/items/:cart_item_id - Remove item from cart
export async function removeCartItem(req, res) {
  try {
    const { cart_item_id } = req.params;

    const result = await pool.query(
      "DELETE FROM cart_items WHERE cart_item_id = $1 RETURNING *",
      [cart_item_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({
      success: true,
      message: "Item removed from cart",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error removing from cart:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
    });
  }
}

// DELETE /api/cart - Clear entire cart
export async function clearCart(req, res) {
  try {
    const customer_id = req.user?.customer_id || 1;

    const deleteResult = await pool.query(
      "DELETE FROM cart_items WHERE cart_id = (SELECT cart_id FROM carts WHERE customer_id = $1) RETURNING *",
      [customer_id]
    );

    res.json({
      success: true,
      message: "Cart cleared",
      deletedItems: deleteResult.rows.length,
    });
  } catch (error) {
    console.error("Error clearing cart:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
}
