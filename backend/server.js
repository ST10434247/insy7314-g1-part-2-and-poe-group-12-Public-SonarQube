require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const authRoutes = require('./routes/auth');
const { error } = require('console');

const app = express();

app.use(express.json);

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 3000;
const sslOptions={
  key: fs.readFileSync(process.env.SSL_KEY_PATH || 'key.pem'),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || 'cert.pem')
};

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
});