
// JSON WEB TOKEN CHECKS IF YOU ARE LOGGED IN
// (Auth0, 2026b)

const jwt = require('jsonwebtoken');

// Middleware protects routes by extracting the JWT from the Authorization header,
// verifying its signature and expiry, and attaching the verified user information
// to the request for use by downstream route handlers.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Only accept tokens supplied using the Bearer authentication scheme.
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  // A missing token means the user has not supplied credentials.
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. No token provided.'
    });
  }

  // Missing JWT configuration is a server-side error, not an invalid-token error.
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: 'Authentication service is not configured.'
    });
  }

  try {
    // Verify the token's signature and expiry using the configured secret.
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Store verified claims for use by route handlers and authorization middleware.
    req.user = verified;

    next();
  } catch (err) {
    // Invalid, expired, or malformed tokens are authentication failures.
    return res.status(401).json({
      error: 'Invalid or expired token.'
    });
  }
};

// Middleware restricts access to specific user roles after the JWT has been verified.
// This prevents authenticated users from accessing resources outside their permitted role.
// (Auth0, 2026a)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // This middleware must run after authenticateToken.
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    // A valid token does not automatically grant access to every route.
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient privileges.'
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };

/* References

Auth0, 2020. Navigating RS256 and JWKS [code]. Available at:
<https://auth0.com/blog/navigating-rs256-and-jwks/>
[Accessed 17 August 2026].

Auth0, 2026a. Express.js Code Sample: API Role-Based Access Control [code].
Available at:
<https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control>
[Accessed 17 August 2026].

Auth0, 2026b. Node.js API Authorization By Example [code].
Available at:
<https://developer.auth0.com/resources/guides/api/express/basic-authorization>
[Accessed 18 August 2026].

bcryptjs, 2026. bcryptjs [code]. Available at:
<https://www.npmjs.com/package/bcryptjs>
[Accessed 18 August 2026].

Express.js, 2026. Express routing [code]. Available at:
<https://expressjs.com/en/guide/routing.html>
[Accessed 3 September 2026].

express-validator, 2026. express-validator documentation [code].
Available at:
<https://express-validator.github.io/docs/>
[Accessed 18 August 2026].

The Independent Institute of Education (IIE), 2026.
INFORMATION SYSTEMS 3D INSY7314 [APPLICATION DEVELOPMENT SECURITY MODULE MANUAL].
The Independent Institute of Education. Unpublished.

*/