import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get cart items
router.get('/', async (req, res) => {
    try {
        const { userId = null } = req.query;
        const [rows] = await pool.query(
            `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.description, p.stock
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id IS NULL OR c.user_id = ?`,
            [userId]
        );
        const processedRows = rows.map(row => ({
            ...row,
            price: Number(row.price),
            quantity: Number(row.quantity),
            stock: Number(row.stock)
        }));
        console.log('Cart items fetched:', processedRows); // Debug log
        res.json(processedRows);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add product to cart
router.post('/add', async (req, res) => {
    try {
        const { productId, quantity = 1, userId = null } = req.body;
        if (!productId || quantity < 1) {
            return res.status(400).json({ message: 'Invalid product ID or quantity' });
        }

        // Verify product exists and has stock
        const [[product]] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        // Check if product is already in cart for this user (or guest)
        const [existing] = await pool.query(
            'SELECT id, quantity FROM cart WHERE product_id = ? AND (user_id = ? OR user_id IS NULL)',
            [productId, userId]
        );
        
        if (existing.length > 0) {
            // Update quantity if item exists
            const newQuantity = existing[0].quantity + quantity;
            await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQuantity, existing[0].id]);
        } else {
            // Insert new cart item
            await pool.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [
                userId,
                productId,
                quantity
            ]);
        }

        res.json({ message: 'Product added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update cart item quantity
router.put('/update', async (req, res) => {
    try {
        const { cartId, quantity, userId = null } = req.body;
        if (!cartId || quantity < 1) {
            return res.status(400).json({ message: 'Invalid cart ID or quantity' });
        }

        // Verify cart item exists and belongs to user (or guest)
        const [[cartItem]] = await pool.query(
            'SELECT product_id FROM cart WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
            [cartId, userId]
        );
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Verify product stock
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
        res.status(500).json({ message: error.message });
    }
});

// Remove cart item
router.delete('/remove', async (req, res) => {
    try {
        const { cartId, userId = null } = req.body;
        if (!cartId) {
            return res.status(400).json({ message: 'Invalid cart ID' });
        }

        // Verify cart item exists and belongs to user (or guest)
        const [[cartItem]] = await pool.query(
            'SELECT id FROM cart WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
            [cartId, userId]
        );
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        await pool.query('DELETE FROM cart WHERE id = ?', [cartId]);
        res.json({ message: 'Cart item removed' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;