# HustleHub

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

Administrator accounts should not be created through public registration.

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
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
```

### Postman and Newman Tests

The Part 2 API collection is located at:

```text
tests/Postman/HustleHUB Part 2 Secure Stack.postman_collection.json
```

Run the collection from the project root:

```bash
npx newman run "tests\Postman\HustleHUB Part 2 Secure Stack.postman_collection.json" --insecure
```

The `--insecure` option is used because the local development server uses a self-signed HTTPS certificate.

The automated collection covers:

1. Freelancer registration
2. Freelancer login and JWT generation
3. Freelancer gig creation
4. Client registration
5. Client login and JWT generation
6. Client booking creation
7. Freelancer booking acceptance
8. Transaction creation
9. Transaction payment/status update
10. Freelancer income retrieval
11. Invalid gig-data rejection
12. Unauthenticated gig-creation rejection

This provides automated evidence for authentication, authorisation, validation, gig management, booking functionality and transaction functionality.

## Security Testing Evidence

The project also contains Postman security-testing evidence under:

```text
tests/Postman/
```

and supporting screenshots under:

```text
tests/screenshots/
```

The security tests cover areas such as:

* Valid registration
* Duplicate email rejection
* Invalid email rejection
* Password validation
* Invalid role rejection
* Valid login
* Invalid credentials
* Protected endpoint access with a valid token
* Protected endpoint access without a token
* Protected endpoint access with an invalid token
* Missing required registration fields

## Important Security Notes

* Never commit `.env` files.
* Never commit real passwords, JWT secrets or other credentials.
* Never share JWT tokens publicly.
* Do not commit private production certificates or private keys.
* Use self-signed certificates only for local development.

## Conclusion

HustleHub demonstrates a full-stack MERN gig marketplace with authentication, role-based authorisation, resource ownership controls, validation, sanitisation, rate limiting, security headers, HTTPS, React frontend functionality and automated API/frontend testing.

## References
