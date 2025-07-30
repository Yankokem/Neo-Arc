import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get subcategories for a category
router.get('/:categoryId/subcategories', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM sub_categories WHERE category_id = ?',
            [req.params.categoryId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;