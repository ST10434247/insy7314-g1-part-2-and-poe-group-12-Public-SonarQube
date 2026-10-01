const path = require('path');

// Loads environment variables from the project root so configuration remains
// separate from the backend source code and is available regardless of the
// directory from which the server is started.
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

// Import the gig routes for creating, viewing, updating, and deleting gigs.
const gigRoutes = require('./routes/gigs');
const connectDB = require('./config/db');
const fs = require('fs');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const app = express();


// Security middleware adds HTTP security headers and restricts which resources
// the application is allowed to load, reducing the risk of common browser-based attacks.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://localhost:3000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// Limits the size of incoming JSON requests to reduce unnecessary resource
// consumption and help protect the API against oversized request attacks.
app.use(express.json({ limit: '10kb' }));

// Authentication routes handle registration, login and authentication-related requests.
app.use('/api/auth', authRoutes);

// Mount gig endpoints for creating, browsing, updating and deleting gigs.
app.use('/api/gigs', gigRoutes);

// Mount booking endpoints before the 404 handler so Express can reach them.
app.use('/api/bookings', bookingRoutes);

// Admin endpoints for reviewing and resolving disputed bookings.
app.use('/api/admin', adminRoutes);

// Mount transaction endpoints for simulated payments and income tracking.
app.use('/api/transactions', transactionRoutes);

// Return a controlled response when no route matches the request.
// This must come after all application routes.
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Handle unexpected errors after all routes and other middleware.
// Internal details are logged on the server, not returned to clients.
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: 'An internal server error occurred.'
  });
});

const PORT = process.env.PORT || 3000;

// Connect to the database before accepting incoming requests.
const startServer = async () => {
  try {
    await connectDB();

    // HTTPS configuration loads the certificate and private key from environment-defined
    // paths. These files must exist before the server can start.
    const sslOptions = {
      key: fs.readFileSync(
        path.resolve(__dirname, process.env.SSL_KEY_PATH || '../certs/key.pem')
      ),
      cert: fs.readFileSync(
        path.resolve(__dirname, process.env.SSL_CERT_PATH || '../certs/cert.pem')
      )
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`HTTPS Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();