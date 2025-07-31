import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Fetch gadget categories (Smartphones=25, Laptops=26, Wearables=29, Audio Devices=30, Tablets=31)
        const [gadgetCategories] = await pool.query(
            'SELECT id, name FROM categories WHERE id IN (25, 26, 29, 30, 31)'
        );

        // Fetch sub-categories for Computer Hardware (Components and Peripherals)
        const hardwareSubCategoryIds = [1, 2, 3, 5, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        const [subCategories] = await pool.query(
            'SELECT id, name FROM sub_categories WHERE id IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            hardwareSubCategoryIds
        );

        // Group sub-categories into Components and Peripherals
        const components = subCategories.filter(cat => [1, 2, 3, 5, 13, 14, 15].includes(cat.id));
        const peripherals = subCategories.filter(cat => [8, 9, 12, 16, 17, 18, 19, 20].includes(cat.id));

        // Map to navbar-friendly format with hrefs
        const gadgets = gadgetCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            href: `#${cat.name.toLowerCase().replace(/\s+/g, '-')}`
        }));

        const componentsMenu = components.map(cat => ({
            id: cat.id,
            name: cat.name,
            href: `#${cat.name.toLowerCase().replace(/\s+/g, '-')}`
        }));

        const peripheralsMenu = peripherals.map(cat => ({
            id: cat.id,
            name: cat.name,
            href: `#${cat.name.toLowerCase().replace(/\s+/g, '-')}`
        }));

        res.json({
            gadgets,
            computerHardware: {
                components: componentsMenu,
                peripherals: peripheralsMenu
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;