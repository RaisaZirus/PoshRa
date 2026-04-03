import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';

const router = express.Router();

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    req.user = jwt.verify(m[1], process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

router.use(authMiddleware);

router.get('/', getCart);
router.post('/items', addItemToCart);
router.put('/items/:cart_item_id', updateCartItem);
router.delete('/items/:cart_item_id', removeCartItem);
router.delete('/', clearCart);

export default router;

