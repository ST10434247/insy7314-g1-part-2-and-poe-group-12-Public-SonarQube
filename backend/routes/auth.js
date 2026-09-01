const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const handleValidationErrors = require('../middleware/validate');
const {authenticateToken} = require('../middleware/auth');

// Temporary in-memory storage (Replace with MongoDB model in Step 3)
const users = [];

// Registration Route
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('role').optional().isIn(['freelancer', 'client', 'admin']).withMessage('Role must be either "client" or "freelancer".')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = { id: users.length + 1, email, password: hashedPassword, role: role || 'user' };
      users.push(newUser);

      res.status(201).json({
        message: 'User registered successfully!',
        user: { id: newUser.id, email: newUser.email, role: newUser.role }
      });
    } catch (err) {
      next(err);
    }
  }
);

// Login Route
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful!', token });
  } catch (err) {
    next(err);
  }
});

// Protected Route Example
router.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Access granted to protected route!', user: req.user });
});

module.exports = router;