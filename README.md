# HustleHub

## External Service Repository

Due to repository integration permissions, SonarQube Cloud is connected
to the group's public fork:

[HustleHub – Part 3 Fork]((https://github.com/EMGPPT/insy7314-g1-part-2-and-poe-group-12-fork))

The fork contains the project source code and commits used for
static code analysis.

HustleHub is a secure gig marketplace built with a **React frontend** and an **Express/Node.js/MongoDB backend**.

Clients can browse available gigs, book freelancers and make simulated payments. Freelancers can publish and manage gigs, manage bookings and track income. Administrators can review and resolve eligible disputes.

## Requirements

* Node.js and npm
* MongoDB Atlas account or another reachable MongoDB instance
* OpenSSL or another method of generating HTTPS certificates
* Git/GitHub for source-code management

## Installation and Setup

### 1. Install backend dependencies

From the project root:

```bash
npm install
```

Install the frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

### 2. Configure environment variables

Create a `.env` file in the project root.

**Do not commit this file or share its secrets.**

Example:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

The backend also requires the HTTPS certificate path variables configured by `backend/server.js`.

Use a strong, unique JWT secret and keep all credentials out of source control.

### 3. Generate HTTPS certificates

The backend uses HTTPS for local development.

For example, using OpenSSL:

```bash
mkdir backend/certs

openssl req -x509 -newkey rsa:2048 -nodes ^
  -keyout backend/certs/key.pem ^
  -out backend/certs/cert.pem ^
  -days 365
```

The certificate and private key paths must match the configuration used by `backend/server.js`.

A browser or API client may warn that a self-signed certificate is not trusted. This is expected for local development.

## Running the Application

### Start the backend

From the project root:

```bash
npm run dev
```

The backend runs on:

```text
https://localhost:3000
```

### Start the frontend

Open a second terminal:

```bash
cd frontend
npm start
```

The React development server uses port `3001`.

The frontend is configured to proxy API requests to:

```text
https://localhost:3000
```

The frontend and backend HTTPS configuration must agree.

## Administrator Account

Administrator credentials are configured through the `.env` file.

If administrator provisioning is required, run:

```bash
node backend/scripts/createAdmin.js
```

Administrator accounts can not be created through public registration.

## Application Workflow

The main HustleHub workflow is:

1. Users register as clients or freelancers.
2. Users log in and receive a JWT authentication token.
3. Freelancers create and publish gigs.
4. Clients browse available gigs.
5. Clients submit bookings for available gigs.
6. Freelancers accept or reject pending bookings.
7. Accepted bookings can proceed to simulated payment.
8. Transactions are associated with the relevant booking, client and freelancer.
9. Freelancers can view their associated income information.
10. Eligible disputes can be escalated for administrator review.

Payments are simulated. HustleHub does not process real card payments through an external payment provider.

## Security Configuration

| Security Feature          | Implementation                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| JWT Authentication        | Bearer tokens are verified by authentication middleware. JWTs expire after one hour.     |
| Role-Based Access Control | Protected routes use role checks for client, freelancer and administrator functionality. |
| Resource Ownership        | Users can only modify or access resources they are authorised to access.                 |
| Password Security         | Passwords are hashed using bcrypt.                                                       |
| Input Validation          | `express-validator` validates request data and identifiers on relevant routes.           |
| Input Sanitisation        | MongoDB query sanitisation middleware is applied to incoming requests.                   |
| Rate Limiting             | General API and stricter authentication rate limits are configured.                      |
| Security Headers          | Helmet is used to configure security-related HTTP headers.                               |
| Content Security Policy   | Helmet is configured with a Content Security Policy.                                     |
| Request Size Limits       | JSON request bodies are limited to 10 KB.                                                |
| Transport Security        | The backend uses HTTPS for local development.                                            |

### Authentication and Authorisation

Protected API endpoints require a valid JWT Bearer token.

Role-based access control prevents users from performing actions outside their authorised role.

Ownership checks are also applied to protected resources. For example, a freelancer cannot modify another freelancer's gig.

### Validation and Sanitisation

The backend validates incoming data before processing it.

Examples include:

* Email validation
* Password requirements
* User role validation
* Gig title and description length
* Gig category validation
* Gig price validation
* Delivery-day validation
* Booking and transaction identifier validation

MongoDB query sanitisation is applied to help prevent malicious query operators from being injected into requests.

### Rate Limiting

The API uses rate limiting to reduce abuse.

The authentication endpoints receive the general API limiter as well as a stricter authentication-specific limiter.

### Helmet and Content Security Policy

Helmet is used to configure security headers.

A Content Security Policy is also configured for the application. The policy should be reviewed and updated if the application is deployed to a different environment or if additional external resources are required.

## Testing

HustleHub includes automated backend API testing using **Postman/Newman** and frontend testing using the React testing configuration.

### Frontend Tests

Run the frontend tests from the `frontend` directory:

```bash
npm test -- --watchAll=false
```

The current automated frontend test suite verifies the card-input component, including rendering and valid Visa card-number validation.

Latest test result:

```text
Test Suites: 2 passed, 2 total 
Tests: 5 passed, 5 total 
Snapshots: 0 total
```

### Postman and Newman Tests

HustleHub uses Postman collections and Newman to automate backend API testing. The collections test authentication, authorisation, input validation, gig management, booking workflows, transaction processing and income retrieval.

Newman runs the Postman collections from the project root. The `--insecure` option is used for local development because the backend uses a self-signed HTTPS certificate. This option is intended for local testing and is not recommended for production use.

#### Backend Test Suite 1: HustleHub API Tests

Collection file:

```text
tests/Postman/HustleHub API Tests.postman_collection.json
```

Run the collection:

```bash
npx newman run "tests\Postman\HustleHub API Tests.postman_collection.json" --insecure
```

**Verified test results:**

```text
Requests:    19 executed, 0 failed
Assertions:  26 executed, 0 failed
```

This collection tests:

1. Freelancer registration and login.
2. JWT authentication and token generation.
3. Gig creation, retrieval, updating and deletion.
4. Input validation and rejection of invalid gig data.
5. Role-based access control, including restrictions on client gig creation.
6. Resource ownership, including rejection of updates by a non-owner.
7. Rejection of unauthenticated requests.

These tests help verify that the API processes valid requests and enforces access restrictions.

#### Backend Test Suite 2: HustleHub Part 2 Secure Stack

Collection file:

```text
tests/Postman/HustleHUB Part 2 Secure Stack.postman_collection.json
```

Run the collection:

```bash
npx newman run "tests\Postman\HustleHUB Part 2 Secure Stack.postman_collection.json" --insecure
```

This collection tests the wider marketplace workflow, including:

1. Freelancer registration.
2. Freelancer login and JWT generation.
3. Freelancer gig creation.
4. Client registration.
5. Client login and JWT generation.
6. Client booking creation.
7. Freelancer acceptance of a booking.
8. Transaction creation.
9. Transaction payment or status update.
10. Freelancer income retrieval.
11. Rejection of invalid gig data.
12. Rejection of unauthenticated gig creation.

The collection provides additional testing of booking and transaction workflows alongside authentication, validation and access control.

Record the final Newman summary for this collection after running it, including the number of requests, test scripts and assertions passed or failed. This keeps the README's test evidence accurate and reproducible.

### Security Testing Evidence

Postman collections and supporting evidence are stored in:

```text
tests/Postman/
tests/screenshots/
```
The security tests cover valid registration, duplicate email rejection, invalid email and password validation, invalid role rejection, successful and unsuccessful login, protected endpoint access with valid, missing or invalid tokens, missing required registration fields, role restrictions and resource ownership.

Together, the two backend collections test both individual API operations and the main marketplace workflow. Their results provide evidence of authentication, authorisation, input validation, gig management, booking handling and transaction functionality.


## Important Security Notes

* Never commit `.env` files.
* Never commit real passwords, JWT secrets or other credentials.
* Never share JWT tokens publicly.
* Do not commit private production certificates or private keys.
* Use self-signed certificates only for local development.

## Conclusion

HustleHub demonstrates a full-stack MERN gig marketplace with authentication, role-based authorisation, resource ownership controls, validation, sanitisation, rate limiting, security headers, HTTPS, React frontend functionality and automated API/frontend testing.

## References

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

