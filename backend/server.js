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
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'public', 'users');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const username = req.body.username;
    const userDir = path.join(uploadDir, username, 'pfp');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.userId || 'temp'; // Temp for registration
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}_profile${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and GIF images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// Parse JSON and form-data bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add for form-data parsing

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/users', express.static(path.join(__dirname, 'public', 'users')));

// CSRF protection
app.use(csurf({ cookie: { httpOnly: true, sameSite: 'strict' } }));

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

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

// Error handling for multer and CSRF
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  } else if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});