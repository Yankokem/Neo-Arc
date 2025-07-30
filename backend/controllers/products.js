import pool from '../db.js';

export const getProducts = async (req, res) => {
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
};