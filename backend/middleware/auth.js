
// JSON WEB TOKEN CHECKS IF YOU ARE LOGGED IN
// (Meyer, S., 2020)

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

// (Arias, D., 2023)   PROTECTED ROUTES

// Middleware restricts access to specific user roles after the JWT has been verified.
// This prevents authenticated users from accessing resources outside their permitted role.
// (bsmith-auth0, 2026)
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

// (auth0Developers, 2022) RBAC Role Based Access Control

/* References

Meyer,S. 2020. Navigating RS256 and JWKS [code]. 
Available at:<https://auth0.com/blog/navigating-rs256-and-jwks/>
[Accessed 17 August 2026].

bsmith-auth0, 2026. JSON Web Token (JWT) implementation using jsonwebtoken [code]. 
Available at:https://www.npmjs.com/package/jsonwebtoken 
[Accessed 1 October 2026].

auth0Developers, 2022. Express.js Code Sample: API Role-Based Access Control [code].
Available at:<https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control>
[Accessed 17 August 2026].

Arias, D. 2023. Node.js API Authorization By Example [code].
Available at:<https://developer.auth0.com/resources/guides/api/express/basic-authorization>
[Accessed 18 August 2026].

dcode, 2025. bcryptjs [code]. 
Available at:<https://www.npmjs.com/package/bcryptjs>
[Accessed 18 August 2026].

ExorTek, 2026. @exortek/express-mongo-sanitize [code]. 
Available at:https://www.npmjs.com/package/@exortek/express-mongo-sanitize
[Accessed 1 October 2026].

Friedly, N. and Vedant, K., 2023. express-rate-limit documentation [code]. 
Available at:https://github.com/express-rate-limit/express-rate-limit 
[Accessed 1 October 2026].

Express.js, 2026. Express routing [code]. 
Available at:<https://expressjs.com/en/guide/routing.html>
[Accessed 3 September 2026].

express-validator, 2026. express-validator documentation [code].
Available at:<https://express-validator.github.io/docs/>
[Accessed 18 August 2026].

Helmet, 2026. Helmet documentation: security headers and Content Security Policy [code]. 
Available at:https://helmet.js.org/ [Accessed 1 October 2026].

Mongoose, 2026. Mongoose validation documentation [code]. 
Available at: https://mongoosejs.com/docs/validation.html 
[Accessed 1 October 2026].

Node.js, 2026. HTTPS documentation [code]. 
Available at: https://nodejs.org/api/https.html [Accessed 1 October 2026].

Postman Docs, 2026. Install and run Newman [code]. 
Available at:https://learning.postman.com/docs/reference/newman-cli/installing-running-newman/
[Accessed 1 October 2026].

Borenkraout, M. 2024. React Testing Library documentation [code]. 
Available at:https://testing-library.com/docs/react-testing-library/intro/
[Accessed 1 October 2026].

The Independent Institute of Education (IIE), 2026.INFORMATION SYSTEMS 3D INSY7314 [APPLICATION DEVELOPMENT SECURITY MODULE MANUAL].
The Independent Institute of Education. Unpublished.

*/