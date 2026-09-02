const jwt = require('jsonwebtoken');
// Middleware protects routes by extracting the JWT from the Authorization header,
// verifying its signature and expiry, and attaching the verified user information
// to the request for use by downstream route handlers.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. No token provided.'
    });
  }

  try {
    // JWT verification relies on a secret stored outside the source code.
    // The application should not fall back to a hardcoded secret if configuration is missing.
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
// Middleware restricts access to specific user roles after the JWT has been verified.
// This prevents authenticated users from accessing resources outside their permitted role.
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };