import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next(); // Allow guest access
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    console.error('Token verification error:', error);
  }
  next();
};

// Get cart items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { guestId } = req.query;
    const userId = req.user ? req.user.userId : null;
    if (!userId && !guestId) {
      return res.status(400).json({ message: 'No user or guest ID provided' });
    }
    let query = `
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.description, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    if (userId) {
      query += ' AND c.user_id = ?';
      params.push(userId);
    } else if (guestId) {
      query += ' AND c.guest_id = ?';
      params.push(guestId);
    }
    const [rows] = await pool.query(query, params);
    const processedRows = rows.map(row => ({
      ...row,
      price: Number(row.price),
      quantity: Number(row.quantity),
      stock: Number(row.stock)
    }));
    res.json(processedRows);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cart for checkout (authenticated users only)
router.get('/checkout', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const [cartItems] = await pool.query(
      'SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.description, p.stock ' +
      'FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?',
      [req.user.userId]
    );
    const processedItems = cartItems.map(item => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity),
      stock: Number(item.stock)
    }));
    res.json(processedItems);
  } catch (error) {
    console.error('Error fetching checkout cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add product to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1, guestId, _csrf } = req.body;
    if (!_csrf) {
      return res.status(403).json({ message: 'CSRF token missing' });
    }
    const userId = req.user ? req.user.userId : null;
    if (!productId || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product ID or quantity' });
    }
    if (!userId && !guestId) {
      return res.status(400).json({ message: 'No user or guest ID provided' });
    }
    const [[product]] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart WHERE product_id = ? AND ' + (userId ? 'user_id = ?' : 'guest_id = ?'),
      [productId, userId || guestId]
    );
    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + quantity;
      await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQuantity, existing[0].id]);
    } else {
      await pool.query(
        'INSERT INTO cart (user_id, guest_id, product_id, quantity) VALUES (?, ?, ?, ?)',
        [userId, guestId, productId, quantity]
      );
    }
    res.json({ message: 'Product added to cart' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update cart item quantity
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { cartId, quantity, guestId, _csrf } = req.body;
    if (!_csrf) {
      return res.status(403).json({ message: 'CSRF token missing' });
    }
    const userId = req.user ? req.user.userId : null;
    if (!cartId || quantity < 1) {
      return res.status(400).json({ message: 'Invalid cart ID or quantity' });
    }
    if (!userId && !guestId) {
      return res.status(400).json({ message: 'No user or guest ID provided' });
    }
    const [[cartItem]] = await pool.query(
      'SELECT product_id FROM cart WHERE id = ? AND ' + (userId ? 'user_id = ?' : 'guest_id = ?'),
      [cartId, userId || guestId]
    );
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    const [[product]] = await pool.query('SELECT stock FROM products WHERE id = ?', [cartItem.product_id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, cartId]);
    res.json({ message: 'Cart item updated' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove cart item
router.delete('/remove', authenticateToken, async (req, res) => {
  try {
    const { cartId, guestId, _csrf } = req.body;
    if (!_csrf) {
      return res.status(403).json({ message: 'CSRF token missing' });
    }
    const userId = req.user ? req.user.userId : null;
    if (!cartId) {
      return res.status(400).json({ message: 'Invalid cart ID' });
    }
    if (!userId && !guestId) {
      return res.status(400).json({ message: 'No user or guest ID provided' });
    }
    const [[cartItem]] = await pool.query(
      'SELECT id FROM cart WHERE id = ? AND ' + (userId ? 'user_id = ?' : 'guest_id = ?'),
      [cartId, userId || guestId]
    );
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    await pool.query('DELETE FROM cart WHERE id = ?', [cartId]);
    res.json({ message: 'Cart item removed' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear guest cart on login (no merging)
router.post('/clear-guest', authenticateToken, async (req, res) => {
  const { guestId, _csrf } = req.body;
  if (!_csrf) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!guestId) {
    return res.status(400).json({ message: 'No guestId provided' });
  }
  try {
    await pool.query('DELETE FROM cart WHERE guest_id = ?', [guestId]);
    res.json({ message: 'Guest cart cleared' });
  } catch (error) {
    console.error('Error clearing guest cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;