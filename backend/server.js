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

// Authentication routes handle user registration, login and access to protected resources.
app.use('/api/auth', authRoutes);

// Mount all gig-related endpoints under /api/gigs.
app.use('/api/gigs', gigRoutes);

// Returns a controlled response when a client requests a route that does not exist.
// This prevents unnecessary framework or server information from being returned to the client.
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Centralised error handling ensures unexpected errors are logged on the server
// but only a generic message is returned to the client, preventing internal
// details such as stack traces or file paths from being exposed.
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