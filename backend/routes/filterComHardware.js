import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get filter options for computer hardware (sub-categories, brands, price range)
router.get('/', async (req, res) => {
    try {
        // Define hardware-related sub-category IDs (Processor=1, Motherboard=2, Graphics Card=3, Storage=5, Keyboard=8, Mouse=9, Power Bank=12)
        const hardwareSubCategoryIds = [1, 2, 3, 5, 8, 9, 12];

        // Get sub-categories (treated as categories in the filter)
        const [categories] = await pool.query(
            'SELECT id, name FROM sub_categories WHERE id IN (?, ?, ?, ?, ?, ?, ?)',
            hardwareSubCategoryIds
        );
        
        // Group sub-categories into Components and Peripherals
        const components = categories.filter(cat => [1, 2, 3, 5].includes(cat.id));
        const peripherals = categories.filter(cat => [8, 9, 12].includes(cat.id));

        // Get unique brands for hardware
        const [brandRows] = await pool.query(
            'SELECT DISTINCT SUBSTRING_INDEX(name, " ", 1) as brand FROM products WHERE category_id = 27 OR sub_category_id IN (?, ?, ?)',
            [8, 9, 12]
        );
        const brands = brandRows.map(row => row.brand).filter(b => b);
        
        // Get price range for hardware
        const [[priceRange]] = await pool.query(
            'SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM products WHERE category_id = 27 OR sub_category_id IN (?, ?, ?)',
            [8, 9, 12]
        );
        
        res.json({ 
            categories: { components, peripherals }, 
            brands,
            priceRange: {
                min: Number(priceRange.minPrice || 0),
                max: Number(priceRange.maxPrice || 100000)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Apply filters and fetch filtered hardware products
router.get('/products', async (req, res) => {
    try {
        const { subCategories, brands, minPrice, maxPrice, inStock, outOfStock, sort } = req.query;

        // Base query for hardware products
        let query = `
            SELECT p.*, c.name as category_name, sc.name as sub_category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
            WHERE 1=1
        `;
        const queryParams = [];

        // Restrict to hardware-related products (category_id=27 or specific sub_category_id)
        // Only include peripherals (8, 9, 12) if explicitly selected in subCategories
        if (subCategories) {
            const subCategoryIds = subCategories.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (subCategoryIds.length > 0) {
                query += ` AND p.sub_category_id IN (${subCategoryIds.map(() => '?').join(',')})`;
                queryParams.push(...subCategoryIds);
            }
        } else {
            // Default to all hardware sub-categories if none specified
            query += ` AND (p.category_id = 27 OR p.sub_category_id IN (8, 9, 12))`;
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