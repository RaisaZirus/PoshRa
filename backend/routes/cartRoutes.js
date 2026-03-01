import express from 'express';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';

const router = express.Router();

// GET /api/cart - Get all items
router.get('/', getCart);

// POST /api/cart/items - Add item
router.post('/items', addItemToCart);

// PUT /api/cart/items/:cart_item_id - Update quantity
router.put('/items/:cart_item_id', updateCartItem);

// DELETE /api/cart/items/:cart_item_id - Remove item
router.delete('/items/:cart_item_id', removeCartItem);

// DELETE /api/cart - Clear entire cart
router.delete('/', clearCart);

export default router;
