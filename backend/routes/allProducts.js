import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all products with category and subcategory info
router.get('/', async (req, res) => {
    try {
        const { sort } = req.query;

        let orderBy = '';
        switch (sort) {
            case 'alpha-asc':
                orderBy = 'ORDER BY p.name ASC';
                break;
            case 'alpha-desc':
                orderBy = 'ORDER BY p.name DESC';
                break;
            case 'price-asc':
                orderBy = 'ORDER BY p.price ASC';
                break;
            case 'price-desc':
                orderBy = 'ORDER BY p.price DESC';
                break;
            case 'date-asc':
                orderBy = 'ORDER BY p.created_at ASC';
                break;
            case 'date-desc':
                orderBy = 'ORDER BY p.created_at DESC';
                break;
            default:
                orderBy = 'ORDER BY p.id ASC';
        }

        const query = `
            SELECT p.*, c.name as category_name, sc.name as sub_category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
            ${orderBy}
        `;
        
        const [rows] = await pool.query(query);
        
        const processedRows = rows.map(row => ({
            ...row,
            price: Number(row.price),
            stock: Number(row.stock)
        }));
        
        res.json(processedRows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;