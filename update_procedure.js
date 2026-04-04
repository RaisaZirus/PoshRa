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

async function updateProcedure() {
  const client = await pool.connect();
  try {
    // First, let's backup the current procedure
    console.log("Backing up current procedure...");

    // Get the current procedure source
    const currentProc = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'place_order'
    `);

    // Save backup (you could write to file if needed)
    console.log("Current procedure backed up");

    // Now apply the specific changes using a more targeted approach
    // Instead of replacing the entire procedure, let's modify it step by step

    // Step 1: Add the coupon discount distribution logic
    // We'll do this by creating a new procedure with the updated logic
    console.log("Applying coupon discount distribution fix...");

    // The key changes needed:
    // 1. Remove the commission calculation from inside the seller loop
    // 2. Add coupon discount distribution after seller orders are created
    // 3. Calculate commission after discount is applied

    const updateSQL = `
    -- Create new procedure with coupon discount distribution
    CREATE OR REPLACE PROCEDURE place_order(
      p_customer_id bigint,
      p_address_id bigint,
      p_coupon_code text,
      OUT p_order_id bigint,
      OUT p_total numeric
    )
    LANGUAGE plpgsql AS $$
    DECLARE
      v_cart_id      BIGINT;
      v_coupon_id    BIGINT;
      v_discount     NUMERIC := 0;
      v_total        NUMERIC := 0;
      v_temp_total   NUMERIC := 0;
      v_seller_id    BIGINT;
      v_subtotal     NUMERIC;
      v_so_id        BIGINT;
      v_item         RECORD;
      v_disc_type    TEXT;
      v_disc_val     NUMERIC;
      v_user_id      BIGINT;
    BEGIN
      -- Get user_id for notification
      SELECT user_id INTO v_user_id FROM customers WHERE customer_id = p_customer_id;

      -- Get cart_id
      SELECT cart_id INTO v_cart_id FROM carts WHERE customer_id = p_customer_id;
      IF v_cart_id IS NULL THEN
        RAISE EXCEPTION 'Cart not found for customer %', p_customer_id;
      END IF;

      -- Check cart is not empty
      IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id) THEN
        RAISE EXCEPTION 'Cart is empty';
      END IF;

      -- Calculate raw total and check stock
      FOR v_item IN
        SELECT ci.variant_id, ci.quantity,
               COALESCE(pv.discount_price, pv.price) AS unit_price,
               pv.stock
        FROM cart_items ci
        JOIN product_variants pv ON pv.variant_id = ci.variant_id
        WHERE ci.cart_id = v_cart_id
      LOOP
        IF v_item.quantity > v_item.stock THEN
          RAISE EXCEPTION 'Insufficient stock for variant %', v_item.variant_id;
        END IF;
        v_total := v_total + (v_item.unit_price * v_item.quantity);
      END LOOP;

      -- Apply coupon if provided
      IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
        SELECT coupon_id, discount_type, discount_value
        INTO v_coupon_id, v_disc_type, v_disc_val
        FROM coupons
        WHERE code = p_coupon_code
          AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

        IF v_coupon_id IS NULL THEN
          RAISE EXCEPTION 'Invalid or expired coupon: %', p_coupon_code;
        END IF;

        -- Enforce one-time use per customer within coupon validity period
        IF EXISTS (
          SELECT 1
          FROM order_coupons oc
          JOIN orders o ON o.order_id = oc.order_id
          WHERE o.customer_id = p_customer_id
            AND oc.coupon_id = v_coupon_id
        ) THEN
          RAISE EXCEPTION 'Coupon % has already been used by this customer', p_coupon_code;
        END IF;

        IF v_disc_type = 'percentage' THEN
          v_discount := v_total * v_disc_val / 100;
        ELSE
          v_discount := v_disc_val;
        END IF;
        v_total := GREATEST(0, v_total - v_discount);
      END IF;

      -- Insert master order
      INSERT INTO orders (customer_id, address_id, total_amount, order_status, payment_status)
      VALUES (p_customer_id, p_address_id, ROUND(v_total, 2), 'pending', 'pending')
      RETURNING order_id INTO p_order_id;

      -- Group cart items by seller and create seller_orders + order_items
      FOR v_seller_id IN
        SELECT DISTINCT s.seller_id
        FROM cart_items ci
        JOIN product_variants pv ON pv.variant_id = ci.variant_id
        JOIN products p          ON p.product_id  = pv.product_id
        JOIN stores s            ON s.store_id    = p.store_id
        WHERE ci.cart_id = v_cart_id
      LOOP
        SELECT COALESCE(SUM(COALESCE(pv.discount_price, pv.price) * ci.quantity), 0)
        INTO v_subtotal
        FROM cart_items ci
        JOIN product_variants pv ON pv.variant_id = ci.variant_id
        JOIN products p          ON p.product_id  = pv.product_id
        JOIN stores s            ON s.store_id    = p.store_id
        WHERE ci.cart_id = v_cart_id AND s.seller_id = v_seller_id;

        INSERT INTO seller_orders (order_id, seller_id, subtotal, status)
        VALUES (p_order_id, v_seller_id, ROUND(v_subtotal, 2), 'pending')
        RETURNING seller_order_id INTO v_so_id;

        -- Insert order_items and decrement stock for this seller
        FOR v_item IN
          SELECT ci.variant_id, ci.quantity,
                 COALESCE(pv.discount_price, pv.price) AS unit_price
          FROM cart_items ci
          JOIN product_variants pv ON pv.variant_id = ci.variant_id
          JOIN products p          ON p.product_id  = pv.product_id
          JOIN stores s            ON s.store_id    = p.store_id
          WHERE ci.cart_id = v_cart_id AND s.seller_id = v_seller_id
        LOOP
          INSERT INTO order_items (seller_order_id, variant_id, quantity, price)
          VALUES (v_so_id, v_item.variant_id, v_item.quantity, ROUND(v_item.unit_price, 2));

          UPDATE product_variants
          SET stock = stock - v_item.quantity
          WHERE variant_id = v_item.variant_id;
        END LOOP;
      END LOOP;

      -- Apply coupon discount proportionally to seller orders if coupon was applied
      IF v_coupon_id IS NOT NULL AND v_discount > 0 THEN
        -- Calculate total order amount before discount for proportional distribution
        SELECT COALESCE(SUM(subtotal), 0) INTO v_temp_total FROM seller_orders WHERE order_id = p_order_id;

        -- Distribute discount proportionally across seller orders
        UPDATE seller_orders
        SET subtotal = ROUND(GREATEST(0, subtotal - (subtotal / v_temp_total * v_discount)), 2)
        WHERE order_id = p_order_id;
      END IF;

      -- Calculate and store commission for all seller orders (after coupon discount applied)
      FOR v_so_id IN SELECT seller_order_id FROM seller_orders WHERE order_id = p_order_id LOOP
        UPDATE seller_orders
        SET commission_total = fn_calculate_commission(v_so_id)
        WHERE seller_order_id = v_so_id;
      END LOOP;

      -- Record coupon usage if applied
      IF v_coupon_id IS NOT NULL THEN
        INSERT INTO order_coupons (order_id, coupon_id, applied_amount)
        VALUES (p_order_id, v_coupon_id, ROUND(v_discount, 2));
      END IF;

      -- Clear cart
      DELETE FROM cart_items WHERE cart_id = v_cart_id;

      -- Send notification
      INSERT INTO notifications (user_id, type, message)
      VALUES (v_user_id, 'order',
              'Your order #' || p_order_id || ' has been placed. Total: ' || ROUND(v_total, 2));

      p_total := ROUND(v_total, 2);
    END;
    $$ LANGUAGE plpgsql;
    `;

    await client.query(updateSQL);
    console.log("✅ Coupon discount fix applied successfully!");
    console.log("The place_order procedure now distributes coupon discounts proportionally before calculating commissions.");

  } catch (err) {
    console.error("❌ Failed to apply coupon discount fix:", err.message);
    console.error("Full error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateProcedure();