# HustleHub

HustleHub is a secure gig marketplace built with a React frontend and an Express/Node.js/MongoDB backend.

Clients can browse available gigs, book freelancers and make simulated payments. Freelancers can publish and manage gigs, manage bookings and track income. Administrators can review eligible disputes and inspect security audit records.

## Requirements

- Node.js and npm
- MongoDB Atlas account or another reachable MongoDB instance
- Docker Desktop (for the containerised deployment)
- OpenSSL or another method of generating HTTPS certificates for local development
- Git/GitHub for source-code management

## Installation and setup

### 1. Install dependencies

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

Create a `.env` file in the project root. Do not commit this file or share its secrets.

At minimum, configure the values used by the application:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

The backend also uses HTTPS certificate path configuration. Ensure the configured paths match the certificate files available to the backend. Use a strong, unique JWT secret and keep credentials out of source control.

### 3. Generate HTTPS certificates for local development

The backend uses HTTPS for local development. For example, using OpenSSL:

```powershell
New-Item -ItemType Directory -Force backend/certs

openssl req -x509 -newkey rsa:2048 -nodes `
  -keyout backend/certs/key.pem `
  -out backend/certs/cert.pem `
  -days 365
```

The certificate and private key paths must match the configuration used by `backend/server.js`. A browser or API client may warn that a self-signed certificate is not trusted. This is expected for local development.

## Running the application locally

### Start the backend

From the project root:

```bash
npm run dev
```

The backend runs at:

```text
https://localhost:3000
```

### Start the frontend

Open a second terminal:

```bash
cd frontend
npm start
```

The React development server uses port `3001` and proxies API requests to `https://localhost:3000`. The frontend and backend HTTPS configuration must agree.

## Running with Docker Compose

Docker Compose runs the backend and frontend as separate containers. Configure the root `.env` file before starting the services. The backend container uses the configured MongoDB connection string and mounts the local certificate directory and log directory.

Build and start the application from the project root:

```bash
docker compose up --build -d
```

Check container status:

```bash
docker compose ps
```

The containerised frontend is available at:

```text
http://localhost:3001
```

The backend API is available at:

```text
https://localhost:3000
```

View backend logs:

```bash
docker compose logs --tail=100 backend
```

Stop the containers:

```bash
docker compose down
```

The local development certificate is self-signed. The frontend Nginx proxy is configured to communicate with the backend container using that development certificate. This configuration is intended for the supplied local Docker setup; production deployments should use trusted certificates and certificate verification.

## Administrator account

Administrator credentials are configured through the `.env` file. If administrator provisioning is required, run:

```bash
node backend/scripts/createAdmin.js
```

Administrator accounts cannot be created through public registration.

## Application workflow

The main HustleHub workflow is:

1. Users register as clients or freelancers.
2. Users log in and receive a JWT authentication token.
3. Freelancers create and publish gigs.
4. Clients browse available gigs.
5. Clients submit bookings for available gigs.
6. Freelancers accept or reject pending bookings.
7. Accepted bookings can proceed to simulated payment.
8. Transactions are associated with the relevant booking, client and freelancer.
9. Freelancers can view their associated income information and tax estimate.
10. Eligible disputes can be escalated for administrator review.

Payments are simulated. HustleHub does not process real card payments through an external payment provider.

## Part 3: Freelancer income and tax dashboard

The freelancer tax dashboard uses paid HustleHub transactions to display platform income for the current South African tax year. The backend income endpoint returns the freelancer's lifetime paid-income totals and the paid-income totals for the current tax year. Tax-year aggregation uses each transaction's `paidAt` date and the South African tax-year period (1 March to the end of February).

The dashboard estimates individual income tax using the SARS 2026/2027 individual tax brackets and the primary rebate. The calculation applies the relevant marginal rate to the portion of income within each bracket, adds the bracket's base amount where applicable, and subtracts the primary rebate. The resulting estimate is not a tax assessment.

The estimate has important limitations:

- It uses paid income recorded on HustleHub only; it does not include income earned elsewhere.
- It does not account for deductible expenses, other deductions, medical tax credits, additional rebates or other personal tax circumstances.
- It assumes the primary rebate applies and does not calculate age-related rebates.
- It estimates tax on the income recorded for the tax year to date; it does not forecast or annualise the user's full-year income.
- The dashboard is an informational estimate and is not a substitute for advice from SARS or a registered tax practitioner.

The SARS tax rates used by the implementation are published at:  
https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/

The dashboard's calculation logic is implemented in `frontend/src/components/TaxDashboard.jsx`. The backend tax-year income aggregation is implemented in `backend/routes/transactions.js`. Unit tests for the tax calculation are in `frontend/src/tests/TaxDashboard.test.jsx`.

## Security configuration

| Security feature | Implementation |
|---|---|
| JWT authentication | Bearer tokens are verified by authentication middleware. JWTs expire after one hour. |
| Role-based access control | Protected routes use role checks for client, freelancer and administrator functionality. |
| Resource ownership | Users can only modify or access resources they are authorised to access. |
| Password security | Passwords are hashed using bcrypt. |
| Input validation | `express-validator` validates request data and identifiers on relevant routes. |
| Input sanitisation | MongoDB query sanitisation middleware is applied to incoming requests. |
| Rate limiting | General API and stricter authentication rate limits are configured. |
| Security headers | Helmet is used to configure security-related HTTP headers. |
| Content Security Policy | Helmet is configured with a Content Security Policy. |
| Request size limits | JSON request bodies are limited to 10 KB. |
| Transport security | The backend uses HTTPS for local development. |
| Login attempt protection | Repeated failed login attempts trigger a temporary account lockout. |
| Session inactivity handling | The frontend logs out an inactive user after the configured inactivity period. |
| Security audit trail | Authentication events and relevant application/security events are recorded in audit logs. |

### Authentication and authorisation

Protected API endpoints require a valid JWT Bearer token. Role-based access control prevents users from performing actions outside their authorised role. Ownership checks are also applied to protected resources. For example, a freelancer cannot modify another freelancer's gig.

The login protection locks an account after five consecutive failed login attempts for a 15-minute period. A successful login resets the failed-attempt counter. The frontend inactivity control logs the user out after 10 minutes without detected activity.

### Validation and sanitisation

The backend validates incoming data before processing it. Examples include:

- Email validation
- Password requirements
- User role validation
- Gig title and description length
- Gig category validation
- Gig price validation
- Delivery-day validation
- Booking and transaction identifier validation

MongoDB query sanitisation is applied to help prevent malicious query operators from being injected into requests.

### Rate limiting, Helmet and Content Security Policy

The API uses rate limiting to reduce abuse. Authentication endpoints receive the general API limiter as well as a stricter authentication-specific limiter.

Helmet is used to configure security headers. A Content Security Policy is also configured for the application. The policy should be reviewed and updated if the application is deployed to a different environment or if additional external resources are required.

### Audit logging

The backend uses structured application logging and a MongoDB audit-log model. Application logs record server events and errors; audit records capture relevant security and user actions, including successful and unsuccessful authentication activity. Administrators can access the protected audit-log endpoint, with filtering and pagination supported by the API.

Log files are written to the local `logs` directory. The directory is mounted into the backend container when using Docker Compose and should be handled as operational data rather than committed application source. Do not log passwords, JWT secrets or authentication tokens.

## Testing

HustleHub includes automated backend API testing using Postman/Newman and frontend testing using the React testing configuration.

### Frontend tests

Run the frontend tests from the project root:

```bash
npm test --prefix frontend -- --watchAll=false
```

The frontend test suite includes component tests and unit tests for the tax calculation. The tax calculation tests cover the primary-rebate threshold, calculations in the first and second tax brackets, a highest-bracket calculation and zero income.

### Postman and Newman tests

HustleHub uses Postman collections and Newman to automate backend API testing. The collections test authentication, authorisation, input validation, gig management, booking workflows, transaction processing and income retrieval.

The Part 2 security collection has been extended with a Part 3 tax-dashboard request and assertions for the returned tax year, tax-year income fields and paid-transaction data. The collection is stored in:

```text
tests/Postman/HustleHub - Part 2 Security.postman_collection.json
```

Run the collection from the project root:

```bash
npx newman run "tests/Postman/HustleHub - Part 2 Security.postman_collection.json" --insecure
```

The `--insecure` option is used for local development because the backend uses a self-signed HTTPS certificate. This option is intended for local testing and is not recommended for production use. Record the latest Newman summary after running the collection; request and assertion totals can change as tests are added.

The collection covers the wider marketplace workflow, including:

1. Freelancer registration and login.
2. JWT authentication and token generation.
3. Freelancer gig creation.
4. Client registration and login.
5. Client booking creation.
6. Freelancer acceptance of a booking.
7. Transaction creation and payment/status updates.
8. Freelancer income retrieval.
9. Tax-year income response fields.
10. Rejection of invalid input and unauthorised requests.

### Static analysis

ESLint is used for backend and frontend static analysis. The backend configuration includes security-focused ESLint rules through `eslint-plugin-security`.

Run the backend analysis from the project root:

```bash
npm run lint:backend
```

Run the frontend analysis:

```bash
npm run lint --prefix frontend
```

Static analysis is also executed by the GitHub Actions workflow. Any lint errors cause the relevant workflow job to fail.

### Continuous integration

The GitHub Actions workflow is stored in:

```text
.github/workflows/ci.yml
```

The workflow runs backend and frontend validation jobs. The backend job installs dependencies, runs backend static analysis, starts the API with a MongoDB service, and executes the Newman API collection. The frontend job installs frontend dependencies, runs frontend static analysis and tests, and creates a production build.

The workflow provides automated checks for changes pushed to the repository and pull requests. Review the Actions tab in GitHub for the latest run and its test/build results.

## Evidence

Supporting screenshots and evidence are organised under the project documentation and testing folders. Relevant evidence includes:

- GitHub Actions workflow results.
- Backend and frontend static-analysis results.
- Docker Compose/container status.
- The running containerised frontend.
- Backend application logs.
- Postman/Newman test results.
- Tax dashboard output.

Ensure that screenshots included in the final submission show the current implementation and the latest successful test results.

## Important security notes

- Never commit `.env` files.
- Never commit real passwords, JWT secrets or other credentials.
- Never share JWT tokens publicly.
- Do not commit private production certificates or private keys.
- Use self-signed certificates only for local development.
- Treat application and audit logs as potentially sensitive operational data.
- Use trusted TLS certificates and enable certificate verification in production.

## Conclusion

HustleHub demonstrates a full-stack MERN gig marketplace with authentication, role-based authorisation, resource ownership controls, validation, sanitisation, rate limiting, security headers, HTTPS, account lockout, inactivity logout, audit logging, freelancer income reporting, a SARS-based tax estimate, automated testing, static analysis, CI and Docker-based deployment.

## References

Meyer, S. 2020. *Navigating RS256 and JWKS* [online]. Available at: https://auth0.com/blog/navigating-rs256-and-jwks/ [Accessed 17 August 2026].

bsmith-auth0. 2026. *JSON Web Token (JWT) implementation using jsonwebtoken* [online]. Available at: https://www.npmjs.com/package/jsonwebtoken [Accessed 1 October 2026].

auth0Developers. 2022. *Express.js Code Sample: API Role-Based Access Control* [online]. Available at: https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control [Accessed 17 August 2026].

Arias, D. 2023. *Node.js API Authorization By Example* [online]. Available at: https://developer.auth0.com/resources/guides/api/express/basic-authorization [Accessed 18 August 2026].

dcode. 2025. *bcryptjs* [online]. Available at: https://www.npmjs.com/package/bcryptjs [Accessed 18 August 2026].

ExorTek. 2026. *@exortek/express-mongo-sanitize* [online]. Available at: https://www.npmjs.com/package/@exortek/express-mongo-sanitize [Accessed 1 October 2026].

Friedly, N. and Vedant, K. 2023. *express-rate-limit documentation* [online]. Available at: https://github.com/express-rate-limit/express-rate-limit [Accessed 1 October 2026].

Express.js. 2026. *Express routing* [online]. Available at: https://expressjs.com/en/guide/routing.html [Accessed 3 September 2026].

express-validator. 2026. *express-validator documentation* [online]. Available at: https://express-validator.github.io/docs/ [Accessed 18 August 2026].

Helmet. 2026. *Helmet documentation: security headers and Content Security Policy* [online]. Available at: https://helmet.js.org/ [Accessed 1 October 2026].

Mongoose. 2026. *Mongoose validation documentation* [online]. Available at: https://mongoosejs.com/docs/validation.html [Accessed 1 October 2026].

Node.js. 2026. *HTTPS documentation* [online]. Available at: https://nodejs.org/api/https.html [Accessed 1 October 2026].

Postman Docs. 2026. *Install and run Newman* [online]. Available at: https://learning.postman.com/docs/reference/newman-cli/installing-running-newman/ [Accessed 1 October 2026].

Borenkraout, M. 2024. *React Testing Library documentation* [online]. Available at: https://testing-library.com/docs/react-testing-library/intro/ [Accessed 1 October 2026].

South African Revenue Service (SARS). 2026. *Rates of Tax for Individuals: 2027 Tax Year* [online]. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ [Accessed 30 October 2026].

The Independent Institute of Education (IIE). 2026. *Information Systems 3D INSY7314: Application Development Security Module Manual*. The Independent Institute of Education. Unpublished.
