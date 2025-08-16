import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Multer configuration for profile picture uploads
const uploadDir = path.join(__dirname, '..', 'public', 'users');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const username = req.body.username || req.user?.username;
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

export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Register endpoint
router.post(
  '/register',
  upload.single('profile_picture'),
  [
    body('username').notEmpty().trim().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').optional().trim(),
    body('last_name').optional().trim(),
    body('address').optional().trim(),
    body('phone').optional().trim(),
    body('date_of_birth').optional().isDate(),
    body('_csrf').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, first_name, last_name, address, phone, date_of_birth } = req.body;
    const profilePicture = req.file;

    try {
      // Check for existing user
      const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
      if (existingUser.length > 0) {
        if (profilePicture) {
          fs.unlinkSync(profilePicture.path);
        }
        return res.status(400).json({ message: 'Username or email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Insert into users table
        const [userResult] = await connection.query(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          [username, email, hashedPassword]
        );

        const userId = userResult.insertId;

        // Rename profile picture with userId
        let profilePictureUrl = null;
        if (profilePicture) {
          const tempPath = profilePicture.path;
          const ext = path.extname(profilePicture.originalname).toLowerCase();
          const newPath = path.join(__dirname, '..', 'public', 'users', username, 'pfp', `${userId}_profile${ext}`);
          fs.renameSync(tempPath, newPath);
          profilePictureUrl = `/users/${username}/pfp/${userId}_profile${ext}`;
        }

        // Insert into user_info table
        await connection.query(
          'INSERT INTO user_info (user_id, first_name, last_name, address, phone, date_of_birth, profile_picture_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            userId,
            first_name || null,
            last_name || null,
            address || null,
            phone || null,
            date_of_birth || null,
            profilePictureUrl
          ]
        );

        // Generate JWT
        const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000
        });

        await connection.commit();
        res.json({ user: { id: userId, username } });
      } catch (err) {
        await connection.rollback();
        if (profilePicture) {
          fs.unlinkSync(profilePicture.path);
        }
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Login endpoint
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('_csrf').notEmpty() // Add CSRF validation for login
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({ user: { id: user.id, username: user.username } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username FROM users WHERE id = ?', [req.user.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [userRows] = await pool.query(
      'SELECT u.id, u.username, u.email, ui.first_name, ui.last_name, ui.address, ui.phone, ui.date_of_birth, ui.profile_picture_url ' +
      'FROM users u LEFT JOIN user_info ui ON u.id = ui.user_id WHERE u.id = ?',
      [req.user.userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: userRows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put(
  '/profile',
  authenticateToken,
  upload.single('profile_picture'),
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('username').optional().trim().isLength({ min: 3 }),
    body('first_name').optional().trim(),
    body('last_name').optional().trim(),
    body('address').optional().trim(),
    body('phone').optional().trim(),
    body('date_of_birth').optional().isDate(),
    body('_csrf').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, first_name, last_name, address, phone, date_of_birth } = req.body;
    const profilePicture = req.file;
    const userId = req.user.userId;

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Update users table if email or username is provided
        if (email || username) {
          const updates = {};
          if (email) updates.email = email;
          if (username) updates.username = username;
          
          // Check for existing username or email
          if (username || email) {
            const [existingUser] = await connection.query(
              'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
              [username || '', email || '', userId]
            );
            if (existingUser.length > 0) {
              if (profilePicture) {
                fs.unlinkSync(profilePicture.path);
              }
              await connection.rollback();
              return res.status(400).json({ message: 'Username or email already exists' });
            }
          }

          // Update users table
          const updateFields = Object.keys(updates);
          if (updateFields.length > 0) {
            const setClause = updateFields.map(field => `${field} = ?`).join(', ');
            await connection.query(
              `UPDATE users SET ${setClause} WHERE id = ?`,
              [...Object.values(updates), userId]
            );
          }
        }

        // Handle profile picture update
        let profilePictureUrl = null;
        if (profilePicture) {
          const ext = path.extname(profilePicture.originalname).toLowerCase();
          profilePictureUrl = `/users/${req.user.username}/pfp/${userId}_profile${ext}`;
        }

        // Update user_info table
        const userInfoUpdates = {
          first_name: first_name || null,
          last_name: last_name || null,
          address: address || null,
          phone: phone || null,
          date_of_birth: date_of_birth || null,
          profile_picture_url: profilePictureUrl
        };
        const updateInfoFields = Object.keys(userInfoUpdates).filter(key => userInfoUpdates[key] !== undefined);
        if (updateInfoFields.length > 0) {
          const setClause = updateInfoFields.map(field => `${field} = ?`).join(', ');
          await connection.query(
            `INSERT INTO user_info (user_id, ${updateInfoFields.join(', ')}) VALUES (?, ${updateInfoFields.map(() => '?').join(', ')}) ` +
            `ON DUPLICATE KEY UPDATE ${setClause}`,
            [userId, ...updateInfoFields.map(key => userInfoUpdates[key]), ...updateInfoFields.map(key => userInfoUpdates[key])]
          );
        }

        await connection.commit();

        // Fetch updated user data
        const [updatedUser] = await pool.query(
          'SELECT u.id, u.username, u.email, ui.first_name, ui.last_name, ui.address, ui.phone, ui.date_of_birth, ui.profile_picture_url ' +
          'FROM users u LEFT JOIN user_info ui ON u.id = ui.user_id WHERE u.id = ?',
          [userId]
        );

        res.json({ user: updatedUser[0], message: 'Profile updated successfully' });
      } catch (err) {
        await connection.rollback();
        if (profilePicture) {
          fs.unlinkSync(profilePicture.path);
        }
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;