
// One-time script for creating the initial administrator account.
// Credentials are read from environment variables and never hardcoded.

const path = require('path');

// Load the same project-level environment configuration as the server.
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    // Require credentials to be supplied through the environment.
    if (!email || !password) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured.');
    }

    // Apply basic credential checks before creating the account.
    if (
      password.length < 8 ||
      password.length > 72 ||
      /\s/.test(password)
    ) {
      throw new Error(
        'Admin password must be 8–72 characters and contain no whitespace.'
      );
    }

    // Connect using the application's existing database configuration.
    await connectDB();

    // Never overwrite an existing account.
    const existingUser = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    // Hash the password using the same work factor as normal registration.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the administrator account.
    await User.create({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin account created successfully.');
  } catch (error) {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
  }
};

createAdmin();