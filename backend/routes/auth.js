const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const handleValidationErrors = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

// Stores registered users in memory for Part 1.
// Persistent database storage is introduced in a later stage of the project,
// so keeping users in memory allows the authentication requirements to be
// demonstrated without introducing unnecessary database dependencies.
const users = [];

// Registration validates the supplied credentials, prevents duplicate accounts,
// hashes the password before storage, and returns only non-sensitive user information.
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),

    body('password')
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage('Password must be between 8 and 72 characters long.'),

    body('role')
      .optional()
      .isIn(['freelancer', 'client'])
      .withMessage('Role must be either "client" or "freelancer".')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, role } = req.body;

      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({
          error: 'User with this email already exists.'
        });
      }

      // Passwords are never stored in plaintext. bcrypt creates a one-way password hash
      // using a work factor of 12, making password cracking significantly more expensive
      // if the stored user data were ever exposed.
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = {
        id: users.length + 1,
        email,
        password: hashedPassword,
        role: role || 'client'
      };

      users.push(newUser);

      res.status(201).json({
        message: 'User registered successfully!',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// Login verifies the supplied credentials against the stored password hash
// and issues a short-lived JWT when authentication succeeds.
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),

    body('password')
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage('Password must be between 8 and 72 characters long.')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = users.find(u => u.email === email);

      // Compare the supplied plaintext password against the stored bcrypt hash.
      // bcrypt performs the comparison without requiring the original password to be stored.
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
          error: 'Invalid email or password.'
        });
      }

      // JWT signing depends on a secret stored outside the source code.
      // The application must not fall back to a hardcoded secret if configuration is missing.
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured.');
      }

      // The token contains only the information needed to identify the authenticated user.
      // It expires after one hour so a stolen token has a limited useful lifetime.
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        message: 'Login successful!',
        token
      });
    } catch (err) {
      next(err);
    }
  }
);

// Protected endpoint used to demonstrate that a valid JWT is required
// before authenticated user information can be accessed.
router.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({
    message: 'Access granted to protected route!',
    user: req.user
  });
});

module.exports = router;