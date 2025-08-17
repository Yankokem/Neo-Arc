import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import path from 'path';
import { promises as fs } from 'fs';
import multer from 'multer';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Middleware to ensure userId is set
const ensureUserId = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userDir = path.join(import.meta.dirname, '../public/users', req.session.userId.toString(), 'pfp');
    await fs.mkdir(userDir, { recursive: true });
    // Clear existing files to ensure overwrite
    const files = await fs.readdir(userDir);
    for (const oldFile of files) {
      await fs.unlink(path.join(userDir, oldFile));
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, PNG, or GIF images are allowed'));
  }
});

// Validation middleware for registration
const validateRegisterInput = [
  body('username').notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').optional().isString(),
  body('last_name').optional().isString(),
  body('address').optional().isString(),
  body('phone').optional().isString().matches(/^\+?\d{10,15}$/).withMessage('Phone must be 10-15 digits'),
  body('date_of_birth').optional().isDate().withMessage('Valid date of birth required (YYYY-MM-DD)'),
  body('role').optional().isIn(['customer', 'admin']).withMessage('Invalid role')
];

// Validation middleware for login
const validateLoginInput = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation middleware for profile update
const validateProfileInput = [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('first_name').optional().isString(),
  body('last_name').optional().isString(),
  body('address').optional().isString(),
  body('phone').optional().isString().matches(/^\+?\d{10,15}$/).withMessage('Phone must be 10-15 digits'),
  body('date_of_birth').optional().isDate().withMessage('Valid date of birth required (YYYY-MM-DD)')
];

router.post('/register', validateRegisterInput, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { username, email, password, first_name, last_name, address, phone, date_of_birth, role } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce'
    });

    const [existingUser] = await connection.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser.length > 0) {
      await connection.end();
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'customer']
    );

    await connection.execute(
      'INSERT INTO user_info (user_id, first_name, last_name, address, phone, date_of_birth) VALUES (?, ?, ?, ?, ?, ?)',
      [result.insertId, first_name || null, last_name || null, address || null, phone || null, date_of_birth || null]
    );

    if (address || phone) {
      await connection.execute(
        'INSERT INTO user_addresses (user_id, title, address, phone, is_primary) VALUES (?, ?, ?, ?, ?)',
        [result.insertId, 'Default', address || null, phone || null, 1]
      );
    }

    await connection.end();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', validateLoginInput, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce'
    });

    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      await connection.end();
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await connection.end();
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    req.session.userId = user.id;

    await connection.end();
    res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce'
    });

    const [users] = await connection.execute('SELECT id, username, email, role FROM users WHERE id = ?', [req.session.userId]);
    if (users.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'User not found' });
    }

    await connection.end();
    res.json({ user: users[0] });
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce'
    });

    const [users] = await connection.execute(
      'SELECT u.id, u.username, u.email, u.role, ui.first_name, ui.last_name, ui.date_of_birth, ui.profile_picture_url ' +
      'FROM users u LEFT JOIN user_info ui ON u.id = ui.user_id WHERE u.id = ?',
      [req.session.userId]
    );

    const [addresses] = await connection.execute(
      'SELECT id, title, address, phone, is_primary FROM user_addresses WHERE user_id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'User not found' });
    }

    const primaryAddress = addresses.find(addr => addr.is_primary) || addresses[0] || {};
    await connection.end();
    res.json({
      user: {
        ...users[0],
        address: primaryAddress.address || null,
        phone: primaryAddress.phone || null,
        addresses
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', ensureUserId, upload.single('profile_picture'), validateProfileInput, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { username, email, first_name, last_name, address, phone, date_of_birth } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce'
    });

    // Only check for username/email conflicts if they are provided
    if (username || email) {
      const [userCheck] = await connection.execute(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [username || '', email || '', req.session.userId]
      );
      if (userCheck.length > 0) {
        await connection.end();
        return res.status(400).json({ message: 'Username or email already exists' });
      }
    }

    // Update users table only if username or email is provided
    if (username || email) {
      await connection.execute(
        'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE id = ?',
        [username || null, email || null, req.session.userId]
      );
    }

    let profilePictureUrl = null;
    if (req.file) {
      profilePictureUrl = `/users/${req.session.userId}/pfp/${req.file.filename}`;
    }

    const [existingInfo] = await connection.execute('SELECT * FROM user_info WHERE user_id = ?', [req.session.userId]);
    if (existingInfo.length > 0) {
      await connection.execute(
        'UPDATE user_info SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), date_of_birth = COALESCE(?, date_of_birth), profile_picture_url = COALESCE(?, profile_picture_url) WHERE user_id = ?',
        [first_name || null, last_name || null, date_of_birth || null, profilePictureUrl, req.session.userId]
      );
    } else {
      await connection.execute(
        'INSERT INTO user_info (user_id, first_name, last_name, date_of_birth, profile_picture_url) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, first_name || null, last_name || null, date_of_birth || null, profilePictureUrl]
      );
    }

    // Update primary address if address or phone is provided
    if (address || phone) {
      const [primaryAddress] = await connection.execute(
        'SELECT id FROM user_addresses WHERE user_id = ? AND is_primary = 1',
        [req.session.userId]
      );
      if (primaryAddress.length > 0) {
        await connection.execute(
          'UPDATE user_addresses SET address = COALESCE(?, address), phone = COALESCE(?, phone) WHERE id = ?',
          [address || null, phone || null, primaryAddress[0].id]
        );
      } else {
        await connection.execute(
          'INSERT INTO user_addresses (user_id, title, address, phone, is_primary) VALUES (?, ?, ?, ?, ?)',
          [req.session.userId, 'Default', address || null, phone || null, 1]
        );
      }
    }

    const [addresses] = await connection.execute(
      'SELECT id, title, address, phone, is_primary FROM user_addresses WHERE user_id = ?',
      [req.session.userId]
    );

    const [updatedUser] = await connection.execute(
      'SELECT u.id, u.username, u.email, u.role, ui.first_name, ui.last_name, ui.date_of_birth, ui.profile_picture_url ' +
      'FROM users u LEFT JOIN user_info ui ON u.id = ui.user_id WHERE u.id = ?',
      [req.session.userId]
    );

    await connection.end();
    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser[0],
        address: addresses.find(addr => addr.is_primary)?.address || addresses[0]?.address || null,
        phone: addresses.find(addr => addr.is_primary)?.phone || addresses[0]?.phone || null,
        addresses
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/address', ensureUserId, async (req, res) => {
  const { title, address, phone } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Address title is required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce'
    });

    // Check address limit
    const [existingAddresses] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?',
      [req.session.userId]
    );
    if (existingAddresses[0].count >= 5) {
      await connection.end();
      return res.status(400).json({ message: 'Maximum 5 addresses allowed' });
    }

    await connection.execute(
      'INSERT INTO user_addresses (user_id, title, address, phone, is_primary) VALUES (?, ?, ?, ?, ?)',
      [req.session.userId, title, address || null, phone || null, 0]
    );

    await connection.end();
    res.json({ message: 'Address added successfully' });
  } catch (err) {
    console.error('Address add error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/address/primary', ensureUserId, async (req, res) => {
  const { address_id } = req.body;
  if (!address_id) {
    return res.status(400).json({ message: 'Address ID is required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce'
    });

    await connection.execute(
      'UPDATE user_addresses SET is_primary = 0 WHERE user_id = ?',
      [req.session.userId]
    );

    await connection.execute(
      'UPDATE user_addresses SET is_primary = 1 WHERE id = ? AND user_id = ?',
      [address_id, req.session.userId]
    );

    await connection.end();
    res.json({ message: 'Primary address updated successfully' });
  } catch (err) {
    console.error('Primary address update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;