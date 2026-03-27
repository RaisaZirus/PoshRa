import express from "express";
import jwt from "jsonwebtoken";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrderReturns,
  createReturn,
} from "../controllers/orderController.js";

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

function requireCustomer(req, res, next) {
  if (req.user.role !== "user") {
    return res.status(403).json({ success: false, message: "Customer account required" });
  }
  next();
}

router.post("/", authMiddleware, requireCustomer, createOrder);
router.get("/", authMiddleware, requireCustomer, getMyOrders);
router.get("/:id", authMiddleware, requireCustomer, getOrderById);
router.patch("/:id/cancel", authMiddleware, requireCustomer, cancelOrder);
router.get("/:id/returns", authMiddleware, requireCustomer, getOrderReturns);
router.post("/items/:order_item_id/returns", authMiddleware, requireCustomer, createReturn);

export default router;