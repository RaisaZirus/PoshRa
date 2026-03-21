import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    req.user = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// ── POST /api/payments/initiate ───────────────────────────────────────────────
// Creates a payment record for an order and returns a payment_id.
// In a real app you'd call Stripe/SSLCommerz here and return a payment URL.
// For now it creates the record in 'pending' state ready for the webhook.
router.post("/initiate", authMiddleware, async (req, res) => {
  const { order_id, method } = req.body;

  if (!order_id || !method) {
    return res.status(400).json({ success: false, message: "order_id and method required" });
  }

  try {
    // Verify order belongs to this user and is in correct state
    const { rows: orderRows } = await pool.query(
      `SELECT o.order_id, o.total_amount, o.payment_status
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE o.order_id = $1 AND c.user_id = $2`,
      [order_id, req.user.userId]
    );

    if (!orderRows.length) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orderRows[0];

    if (order.payment_status === "paid") {
      return res.status(409).json({ success: false, message: "Order already paid" });
    }

    // Check if a pending payment already exists
    const { rows: existing } = await pool.query(
      `SELECT payment_id FROM payments WHERE order_id = $1 AND status = 'pending'`,
      [order_id]
    );
    if (existing.length) {
      return res.json({
        success: true,
        message: "Pending payment already exists",
        data: { payment_id: existing[0].payment_id, amount: order.total_amount },
      });
    }

    // Create payment record
    const { rows } = await pool.query(
      `INSERT INTO payments (order_id, method, amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING payment_id, amount, status`,
      [order_id, method, order.total_amount]
    );

    return res.status(201).json({
      success: true,
      message: "Payment initiated",
      data: { payment_id: rows[0].payment_id, amount: rows[0].amount },
    });
  } catch (err) {
    console.error("initiate payment error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /api/payments/confirm ────────────────────────────────────────────────
// Simulates a payment gateway webhook / manual confirmation.
// Marks the payment as completed and the order as paid + processing.
// In production this would be your webhook endpoint from Stripe/SSLCommerz.
router.post("/confirm", authMiddleware, async (req, res) => {
  const { payment_id, transaction_id } = req.body;

  if (!payment_id) {
    return res.status(400).json({ success: false, message: "payment_id required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get payment + verify it belongs to this user's order
    const { rows: payRows } = await client.query(
      `SELECT p.payment_id, p.order_id, p.status, p.amount
       FROM payments p
       JOIN orders o ON o.order_id = p.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE p.payment_id = $1 AND c.user_id = $2`,
      [payment_id, req.user.userId]
    );

    if (!payRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const payment = payRows[0];

    if (payment.status === "completed") {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, message: "Payment already completed" });
    }

    // Mark payment as completed
    await client.query(
      `UPDATE payments
       SET status = 'completed', transaction_id = $1
       WHERE payment_id = $2`,
      [transaction_id || `TXN-${Date.now()}`, payment_id]
    );

    // Mark order as paid + move to processing
    await client.query(
      `UPDATE orders
       SET payment_status = 'paid', order_status = 'processing'
       WHERE order_id = $1`,
      [payment.order_id]
    );

    // Move all seller_orders to processing
    await client.query(
      `UPDATE seller_orders SET status = 'processing' WHERE order_id = $1`,
      [payment.order_id]
    );

    // Notify customer
    await client.query(
      `INSERT INTO notifications (user_id, type, message)
       SELECT u.user_id, 'payment', $2
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN users u ON u.user_id = c.user_id
       WHERE o.order_id = $1`,
      [payment.order_id, `Payment of ₹${Number(payment.amount).toFixed(2)} confirmed for order #${payment.order_id}.`]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Payment confirmed",
      data: {
        payment_id,
        order_id: payment.order_id,
        amount: payment.amount,
        transaction_id: transaction_id || `TXN-${Date.now()}`,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("confirm payment error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ── GET /api/payments/:order_id ───────────────────────────────────────────────
// Returns payment info for an order.
router.get("/:order_id", authMiddleware, async (req, res) => {
  const { order_id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT p.payment_id, p.method, p.transaction_id, p.amount, p.status, p.created_at
       FROM payments p
       JOIN orders o ON o.order_id = p.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE p.order_id = $1 AND c.user_id = $2
       ORDER BY p.created_at DESC`,
      [order_id, req.user.userId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("get payment error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;