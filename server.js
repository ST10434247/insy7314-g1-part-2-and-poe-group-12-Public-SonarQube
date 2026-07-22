require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// 1. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'HTTPS Server is up and running safely!' });
});

// 2. Registration Endpoint (Stage 3.1)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation: Missing fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Validation: Duplicate user
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user object
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      role: role || 'user'
    };

    users.push(newUser);

    // Clean JSON response (No hashed password returned)
    res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Port & HTTPS Server Start (ONLY ONCE!)
const PORT = process.env.PORT || 3000;

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
});