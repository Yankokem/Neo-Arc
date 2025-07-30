import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all products with category and subcategory info
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name, sc.name as sub_category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
            LIMIT 8
        `);
        
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

// Get newest products
router.get('/newest', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC 
            LIMIT 3
        `);
        
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

// Get cheapest products
router.get('/cheapest', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ORDER BY p.price ASC 
            LIMIT 3
        `);
        
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

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = ?
        `, [req.params.categoryId]);
        
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