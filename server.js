require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// SSL Configuration
const sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// In-memory user storage
const users = [];


// Registration Endpoint 
app.post(
  '/api/register',
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('role')
      .optional()
      .isIn(['user', 'admin']).withMessage('Role must be either "user" or "admin".')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, role } = req.body;

      // Duplicate user check
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save user
      const newUser = {
        id: users.length + 1,
        email,
        password: hashedPassword,
        role: role || 'user'
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
      next(err); // Pass error to global handler
    }
  }
);

app.post('/api/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check if user exists
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
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


app.get('/api/protected', authenticateToken, (req, res) => {
  res.status(200).json({
    message: 'Access granted to protected route!',
    user: req.user
  });
});


app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err); // Log internally for debugging
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server.'
  });
});

//Start server
const PORT = process.env.PORT || 3000;

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
});