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
const logger = require('./config/logger');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const { rateLimit } = require('express-rate-limit');
const fs = require('fs');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const app = express();
// Trust only local loopback proxies when determining the client IP.
// This allows express-rate-limit to process forwarded headers in development.
app.set('trust proxy', 'loopback');

// (Helmet, 2026)  security header CSP Content Security Policy
// ()

// Security middleware adds HTTP security headers and restricts which resources
// the application is allowed to load, reducing the risk of common browser-based attacks.

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://localhost:3000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// Limits the size of incoming JSON requests to reduce unnecessary resource
// consumption and help protect the API against oversized request attacks.
app.use(express.json({ limit: '10kb' }));

// (ExorTek, 2026)
// (Friedly and Vedant, 2023)  MongoDB query sanitisation

// Sanitise incoming request data to prevent MongoDB operator injection.
app.use(mongoSanitize());

// (Nodejs, 2026)  General API  and Authentication Rate Limits

// Apply a general rate limit to API requests.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Maximum requests per IP in the window
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.'
  }
});

// Apply a stricter limit to authentication endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again later.'
  }
});

// Apply limits before the routes they protect.
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

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
  logger.warn('ROUTE_NOT_FOUND', {
    event: 'ROUTE_NOT_FOUND',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(404).json({
    error: 'Route not found'
  });
});

// Handle unexpected errors after all routes and other middleware.
// Internal details are logged on the server, not returned to clients.
app.use((err, req, res, _next) => {
  logger.error('SYSTEM_ERROR', {
    event: 'SYSTEM_ERROR',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: err.message,
    stack: err.stack
  });

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
    // The paths are controlled by server configuration, not by incoming requests.
    const sslOptions = {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      key: fs.readFileSync(
        path.resolve(__dirname, process.env.SSL_KEY_PATH || '../certs/key.pem')
      ),
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      cert: fs.readFileSync(
        path.resolve(__dirname, process.env.SSL_CERT_PATH || '../certs/cert.pem')
      )
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      logger.info('SERVER_STARTED', {
        event: 'SERVER_STARTED',
        port: PORT,
        protocol: 'HTTPS'
      });
    });
  } catch (error) {
    logger.error('SERVER_STARTUP_FAILED', {
      event: 'SERVER_STARTUP_FAILED',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Handle any unexpected rejection from the server startup process.
startServer().catch((error) => {
  logger.error('UNHANDLED_SERVER_STARTUP_ERROR', {
    event: 'UNHANDLED_SERVER_STARTUP_ERROR',
    error: error.message,
    stack: error.stack
  });

  process.exitCode = 1;
});