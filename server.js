const fs = require('fs');
const https = require('https');
const express = require('express');

const app = express();

// SSL Configuration
const sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};


https.createServer(sslOptions, app).listen(3000, () => {
  console.log('HTTPS Server running on https://localhost:3000');
});