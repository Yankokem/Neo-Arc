import express from 'express';
import cors from 'cors';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import filterDataRoutes from './routes/filterAll.js';
import allProductsRoutes from './routes/allProducts.js';
import filterGadgetsRoutes from './routes/filterGadgets.js';
import filterComHardwareRoutes from './routes/filterComHardware.js';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/filter-data', filterDataRoutes);
app.use('/api/all-products', allProductsRoutes);
app.use('/api/filter-gadgets', filterGadgetsRoutes);
app.use('/api/filter-com-hardware', filterComHardwareRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});