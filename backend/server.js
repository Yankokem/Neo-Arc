import express from 'express';
import cors from 'cors';
import session from 'express-session';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import filterDataRoutes from './routes/filterAll.js';
import allProductsRoutes from './routes/allProducts.js';
import filterGadgetsRoutes from './routes/filterGadgets.js';
import filterComHardwareRoutes from './routes/filterComHardware.js';
import navMenuRoutes from './routes/navMenu.js';
import cartRoutes from './routes/cart.js';
import authRoutes from './routes/auth.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Session middleware
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// CORS configuration
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());

// CSRF protection
app.use(csurf({ cookie: true }));

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/filter-data', filterDataRoutes);
app.use('/api/all-products', allProductsRoutes);
app.use('/api/filter-gadgets', filterGadgetsRoutes);
app.use('/api/filter-com-hardware', filterComHardwareRoutes);
app.use('/api/nav-menu', navMenuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/auth', authRoutes);

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});