const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const handleValidationErrors = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const logAudit = require('../utils/auditLogger');
const logger = require('../config/logger');

// USER REGISTRATION AND LOGIN
// VALIDATES USER'S DETAILS, BCRYPT FOR HASH PASSWORD THEN JWT SESSION TOKEN IF LOGIN SUCCESSFUL
// JWT MAKES SURE THAT ONLY AUTHENTICATED USERS CAN USE THIS ROUTE

// Registration validates the supplied credentials, prevents duplicate accounts,
// hashes the password before storage, and returns only non-sensitive user information.
// Register a new user and store the password as a bcrypt hash.

// (bsmith-auth0, 2026)
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .isLength({ max: 254 })
      .withMessage('Email address is too long.')
      .normalizeEmail(),
    body('password')
      .isString()
      .withMessage('Password must be a string.')
      .bail()
      .isLength({ min: 8, max: 72 })
      .withMessage('Password must be between 8 and 72 characters.')
      .custom((value) => !/\s/.test(value))
      .withMessage('Password must not contain whitespace.'),
    body('role')
      .optional()
      .isIn(['client', 'freelancer'])
      .withMessage('Role must be client or freelancer.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, role = 'client' } = req.body;

      // Hash the password before saving it to the database.
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        email,
        password: hashedPassword,
        role,
      });

      await logAudit({
        userId: user._id,
        userEmail: user.email,
        action: 'USER_REGISTERED',
        ipAddress: req.ip,
        details: {
          role: user.role
        },
        status: 'SUCCESS'
      });

      return res.status(201).json({
        message: 'User registered successfully!',
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      // A unique email index prevents duplicate accounts.
      if (error.code === 11000) {
        return res.status(400).json({
          error: 'User with this email already exists.',
        });
      }

      logger.error('REGISTRATION_FAILED', {
        event: 'REGISTRATION_FAILED',
        error: error.message,
        stack: error.stack
      });

      await logAudit({
        userEmail: req.body.email,
        action: 'USER_REGISTRATION_FAILED',
        ipAddress: req.ip,
        details: {
          reason: 'Unexpected registration error'
        },
        status: 'FAILURE'
      });

      return res.status(500).json({
        error: 'Unable to register user.',
      });
    }
  }
);

// Login verifies the supplied credentials against the stored password hash
// and issues a short-lived JWT when authentication succeeds.

// INPUT VALIDATION
// (express-validator, 2026)

// Authenticate against the stored user record and issue a JWT.
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),
    body('password')
      .isString()
      .withMessage('Password must be a string.')
      .bail()
      .isLength({ min: 8, max: 72 })
      .withMessage('Password must be between 8 and 72 characters.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Passwords are excluded from normal queries, so explicitly include it.
      const user = await User.findOne({ email }).select('+password');

      // Use the same response for unknown emails and incorrect passwords.
      if (!user || !(await bcrypt.compare(password, user.password))) {
        await logAudit({
          userId: user?._id || null,
          userEmail: email,
          action: 'USER_LOGIN_FAILED',
          ipAddress: req.ip,
          details: {
            reason: 'Invalid credentials'
          },
          status: 'FAILURE'
        });

        return res.status(401).json({
          error: 'Invalid email or password.',
        });
      }

      if (!process.env.JWT_SECRET) {
        logger.error('JWT_CONFIGURATION_ERROR', {
          event: 'JWT_CONFIGURATION_ERROR',
          reason: 'JWT_SECRET is not configured'
        });

        return res.status(500).json({
          error: 'Authentication is temporarily unavailable.',
        });
      }

      const token = jwt.sign(
        {
          id: user._id.toString(),
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      await logAudit({
        userId: user._id,
        userEmail: user.email,
        action: 'USER_LOGIN_SUCCESS',
        ipAddress: req.ip,
        details: {
          role: user.role
        },
        status: 'SUCCESS'
      });

      return res.status(200).json({
        message: 'Login successful!',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('LOGIN_ERROR', {
        event: 'LOGIN_ERROR',
        ipAddress: req.ip,
        error: error.message,
        stack: error.stack
      });

      await logAudit({
        userEmail: req.body.email,
        action: 'USER_LOGIN_ERROR',
        ipAddress: req.ip,
        details: {
          reason: 'Unexpected authentication error'
        },
        status: 'FAILURE'
      });

      return res.status(500).json({
        error: 'Unable to log in.',
      });
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