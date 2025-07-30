import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all filter options including price range
router.get('/', async (req, res) => {
    try {
        // Get categories
        const [categories] = await pool.query('SELECT id, name FROM categories');
        
        // Get unique brands
        const [brandRows] = await pool.query('SELECT DISTINCT SUBSTRING_INDEX(name, " ", 1) as brand FROM products');
        const brands = brandRows.map(row => row.brand).filter(b => b);
        
        // Get price range
        const [[priceRange]] = await pool.query('SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM products');
        
        res.json({ 
            categories, 
            brands,
            priceRange: {
                min: Number(priceRange.minPrice),
                max: Number(priceRange.maxPrice)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Apply filters and fetch filtered products
router.get('/products', async (req, res) => {
    try {
        const { categories, brands, minPrice, maxPrice, inStock, outOfStock, sort } = req.query;

        let query = `
            SELECT p.*, c.name as category_name, sc.name as sub_category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
            WHERE 1=1
        `;
        const queryParams = [];

        // Filter by categories
        if (categories) {
            const categoryIds = categories.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (categoryIds.length > 0) {
                query += ` AND p.category_id IN (${categoryIds.map(() => '?').join(',')})`;
                queryParams.push(...categoryIds);
            }
        }

        // Filter by brands
        if (brands) {
            const brandList = brands.split(',').map(brand => brand.trim());
            if (brandList.length > 0) {
                query += ` AND (${brandList.map(() => `p.name LIKE ?`).join(' OR ')})`;
                queryParams.push(...brandList.map(brand => `${brand}%`));
            }
        }

        // Filter by price range
        if (minPrice && maxPrice) {
            const min = parseFloat(minPrice);
            const max = parseFloat(maxPrice);
            if (!isNaN(min) && !isNaN(max) && min <= max) {
                query += ` AND p.price BETWEEN ? AND ?`;
                queryParams.push(min, max);
            }
        }

        // Filter by availability
        const availabilityConditions = [];
        if (inStock === 'true') {
            availabilityConditions.push('p.stock > 0');
        }
        if (outOfStock === 'true') {
            availabilityConditions.push('p.stock = 0');
        }
        if (availabilityConditions.length > 0) {
            query += ` AND (${availabilityConditions.join(' OR ')})`;
        }

        // Apply sorting
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
        query += ` ${orderBy}`;

        const [rows] = await pool.query(query, queryParams);

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