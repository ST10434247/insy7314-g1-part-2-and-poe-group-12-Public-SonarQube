const mongoose = require('mongoose');
const logger = require('./logger');

// Establishes a connection to MongoDB using the URI stored in the
// environment configuration. The URI is never logged because it may
// contain database credentials.
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  logger.info('MONGODB_CONNECTED', {
    event: 'MONGODB_CONNECTED',
    database: mongoose.connection.name,
    host: mongoose.connection.host
  });
};

module.exports = connectDB;