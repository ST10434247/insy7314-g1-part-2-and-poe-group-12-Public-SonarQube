// JSON WEBTOKEN CHECKS IF YOU ARE LOGGED IN
// (Auth0, 2026b)

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

// CHECKS THE USERS ROLES
// (Auth0, 2026a)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };

/* References

Auth0, 2020. Navigating RS256 and JWKS [code]. Available at: <https://auth0.com/blog/navigating-rs256-and-jwks/> [Accessed 17 August 2026].
Auth0, 2026a. Express.js Code Sample: API Role-Based Access Control [code]. Available at: <https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control> [Accessed 17 August 2026].
Auth0, 2026b. Node.js API Authorization By Example [code]. Available at: <https://developer.auth0.com/resources/guides/api/express/basic-authorization> [Accessed 18 August 2026].
bcryptjs, 2026. bcryptjs [code]. Available at: <https://www.npmjs.com/package/bcryptjs> [Accessed 18 August 2026].
Express.js, 2026. Express routing [code]. Available at: <https://expressjs.com/en/guide/routing.html> [Accessed 3 September 2026].
express-validator, 2026. express-validator documentation [code]. Available at: <https://express-validator.github.io/docs/> [Accessed 18 August 2026].
The Independent Institute of Education (IIE), 2026. INFORMATION SYSTEMS 3D INSY7314 [APPLICATION DEVELOPMENT SECURITY MODULE MANUAL]
The Independent Institute of Education. Unpublished.

 */