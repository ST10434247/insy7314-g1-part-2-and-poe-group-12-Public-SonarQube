# HustleHub — Part 3 Submission

HustleHub is a secure gig marketplace built with React, Express, Node.js and MongoDB. Clients can browse gigs, book freelancers and make simulated payments. Freelancers can publish gigs, manage bookings and view income information. Administrators can review eligible disputes and inspect security audit records.

## Project repositories and assessment scope

There are **two repositories** for this project. Use the EMGPPT repository as the official Part 3 submission. The ST10434247 repository is the public copy connected to SonarQube Cloud for static analysis.

| Repository | Purpose |
|---|---|
| [Official Part 3 submission — EMGPPT](https://github.com/EMGPPT/insy7314-g1-part-2-and-poe-group-12) | Primary submission repository. This is the repository containing the assessed application and final submission. |
| [SonarQube analysis copy — ST10434247](https://github.com/ST10434247/insy7314-g1-part-2-and-poe-group-12-Public-SonarQube) | Public analysis copy connected to SonarQube Cloud. Use it to inspect static-analysis results; it does not replace the official submission repository. |

The Part 1 Postman collection is retained in this project for regression testing of earlier security functionality. It is **not** a separate project repository.

The marking guide below separates the **required application features** from the **student-defined additional security features**. Required functionality is not presented as original student-defined work. The additional-features section identifies the security enhancements that go beyond the baseline requirements.

## 1. Required application features

These features form the core HustleHub specification and the required application/security baseline.

| Required feature | What the marker should verify | Main implementation | Supporting tests / evidence |
|---|---|---|---|
| User registration and authentication | Clients and freelancers can register and log in. Passwords are hashed and successful login issues a JWT. | `backend/routes/auth.js`, `backend/models/User.js`, `frontend/src/components/Login.jsx`, `frontend/src/context/AuthContext.jsx` | `tests/Postman/HustleHub - Part 1 Security.postman_collection.json`, `tests/Postman/HustleHub - Part 2 Security.postman_collection.json`, `tests/screenshots/` |
| Role-based access control and resource ownership | Client, freelancer and administrator routes/actions are restricted by role. Users cannot access or modify another user's protected resources. | `backend/middleware/auth.js`, `backend/routes/gigs.js`, `backend/routes/bookings.js`, `backend/routes/transactions.js`, `backend/routes/admin.js` | Part 2 Postman collection; test requests for unauthorised access and ownership restrictions |
| Freelancer gig management | Freelancers can create, view, update and manage their gig listings. | `backend/routes/gigs.js`, `backend/models/Gig.js`, `frontend/src/components/PublishGig.jsx`, `frontend/src/components/GigList.jsx` | `tests/Postman/HustleHub API Tests.postman_collection.json`, Part 2 Postman collection |
| Client browsing and booking | Clients can browse available gigs and create bookings. Booking status changes follow the application's workflow. | `backend/routes/bookings.js`, `backend/models/Booking.js`, `frontend/src/components/GigList.jsx`, `frontend/src/components/BookingManagement.jsx`, `frontend/src/components/ClientBookings.jsx` | Part 2 Postman collection; frontend booking workflow |
| Transaction records and simulated payments | Transactions are linked to bookings and users. Payment is simulated; no external payment provider is called. | `backend/routes/transactions.js`, `backend/models/Transaction.js`, `frontend/src/components/PaymentPage.jsx`, `frontend/src/components/CardInput.jsx` | Part 2 Postman collection; frontend payment flow |
| Freelancer income tracking and tax dashboard | Paid transactions feed the freelancer's income totals and the South African tax-year estimate. | `backend/routes/transactions.js`, `frontend/src/components/TaxDashboard.jsx` | `frontend/src/tests/TaxDashboard.test.jsx`; dashboard workflow |
| Baseline security controls | Request validation, MongoDB query sanitisation, access restrictions, rate limiting, Helmet/CSP, request-size limits and HTTPS are applied. | `backend/middleware/validate.js`, `backend/server.js`, `backend/middleware/auth.js`, `backend/routes/` | Part 1 and Part 2 Postman collections; source configuration |
| System logging | Login attempts, booking events, transaction events and errors are recorded as structured application logs. Security-related authentication events are also stored as audit records for administrator review. | `backend/config/logger.js`, `backend/utils/auditLogger.js`, `backend/routes/auth.js`, `backend/routes/bookings.js`, `backend/routes/transactions.js`, `backend/models/AuditLog.js`, `backend/routes/admin.js` | `logs/app.log`, `logs/error.log`; `docs/screenshots/docker/05-backend-logs.png`; Grafana evidence below |
| Backend and frontend containerisation | Separate backend and frontend Dockerfiles and a Docker Compose deployment are provided. | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` | `docs/screenshots/docker/` |
| Automated testing and CI/CD | GitHub Actions runs backend linting and Newman API integration tests against MongoDB, plus frontend linting, tests and a production build. | `.github/workflows/ci.yml`, `package.json`, `frontend/package.json` | GitHub Actions tab; Postman/Newman collections; frontend tests |
| Static code analysis | ESLint checks the backend and frontend. SonarQube Cloud is connected to the separate public analysis copy for code-quality and security analysis. | `backend/.eslintrc.json`, `frontend/` ESLint configuration, SonarQube Cloud analysis repository | `docs/screenshots/SonarQube/` |

**Scope note:** the current GitHub Actions workflow runs backend and frontend checks, API integration tests and the frontend build. Docker Compose is demonstrated and verified separately; the workflow does not currently start the full Docker Compose stack as a pipeline job. SonarQube Cloud is connected through the separate ST10434247 analysis repository rather than being a step in `.github/workflows/ci.yml`.

## 2. Student-defined additional security features

The following are the student-defined additions to the required baseline. They are listed separately for the rubric's **Own Security Features** criterion and are not being counted as substitutes for required authentication, authorisation, validation, sanitisation or logging.

| Student-defined security feature | Behaviour | Main implementation | How the marker can verify it |
|---|---|---|---|
| Temporary account lockout after repeated failed logins | An account is locked for 15 minutes after five consecutive incorrect password attempts. A successful login resets the failed-attempt counter and lock state. | `backend/models/User.js` (`failedLoginAttempts`, `lockUntil`); `backend/routes/auth.js` (failed-login counting, lockout and reset logic) | Use a dedicated test account and submit five incorrect passwords. Check the admin-protected audit endpoint for `USER_ACCOUNT_LOCKED` / `USER_LOGIN_BLOCKED` records: `GET /api/admin/audit-logs?action=USER_ACCOUNT_LOCKED`. |
| Automatic logout after inactivity | The frontend clears the in-memory user and JWT after 10 minutes without detected user interaction. The timer resets when the user moves, clicks, types, scrolls or touches the page. | `frontend/src/context/AuthContext.jsx` (`INACTIVITY_TIMEOUT_MS`, activity listeners and logout timer) | Log in, leave the application idle for 10 minutes, then attempt to use a protected screen. The user should be logged out and need to authenticate again. |

The inactivity control is a frontend session timeout. It clears the token from the running application; it does not revoke a previously copied JWT on the server. The API's JWT expiry remains one hour.

## Marketplace payment note

Payments are simulated. HustleHub does not process real card payments through an external payment provider. Use test values only; never enter real payment-card details.

## Repository layout

```text
.
├── backend/                 Express API, models, middleware and routes
├── frontend/                React application and frontend tests
├── monitoring/              Loki, Alloy and Grafana configuration/dashboard
├── docs/screenshots/         Docker, SonarQube and Grafana evidence
├── tests/Postman/            Postman API test collections
├── tests/screenshots/        API test screenshots
├── logs/                     Local runtime logs (not committed)
├── patches/                  Persisted dependency compatibility patch
├── docker-compose.yml
├── .env.example
└── README.md
```

## Default setup: Docker Compose (recommended)

Docker Compose is the default setup for assessment and demonstration. It builds and runs the frontend and backend together with Loki, Alloy and Grafana. MongoDB remains an external dependency and must be reachable from the backend container.

### Requirements

- Git.
- Docker Desktop with the Linux container engine enabled.
- A reachable MongoDB instance (MongoDB Atlas or a local MongoDB service).
- OpenSSL, for generating the local HTTPS certificate.

### 1. Clone the repository

```powershell
git clone https://github.com/EMGPPT/insy7314-g1-part-2-and-poe-group-12.git
cd insy7314-g1-part-2-and-poe-group-12
```

### 2. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set the following values:

- `MONGODB_URI`: a valid MongoDB connection string.
- `JWT_SECRET`: a unique, long random signing secret.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: credentials for the initial administrator account.
- `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD`: local Grafana login credentials.

Generate a random secret using Node.js (run separately for each secret):

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Do not commit `.env` or share its contents. `.env.example` contains placeholders only.

**MongoDB connection notes:** MongoDB is not included as a Docker Compose service. For MongoDB running on the Windows host, a typical connection string uses `mongodb://host.docker.internal:27017/hustlehub`. For MongoDB Atlas, use the connection string supplied by Atlas and ensure its network access settings permit the connection. Do not use `127.0.0.1` in the container's MongoDB URI to reach a database running on the Windows host.

### 3. Generate the HTTPS certificate

The backend expects the certificate files in `backend/certs/`; Compose mounts this directory read-only into the backend container.

```powershell
New-Item -ItemType Directory -Force .\backend\certs
openssl req -x509 -newkey rsa:2048 -nodes `
  -keyout .\backend\certs\key.pem `
  -out .\backend\certs\cert.pem `
  -days 365 `
  -subj "/CN=localhost"
```

This self-signed certificate is for local development only. Browsers and API clients may show a certificate warning. Do not use it in production.

### 4. Validate and start the complete stack

Make sure Docker Desktop is running, then run: 

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

The first start builds the frontend/backend images and pulls the monitoring images. Wait for the backend to connect to MongoDB before using the application.

### 5. Open the application and monitoring dashboard

| Service | Address | Notes |
|---|---|---|
| React frontend | `http://localhost:3001` | Main application. |
| Backend API | `https://localhost:3000` | HTTPS with the local self-signed certificate. |
| Grafana | `http://localhost:3002` | Local-machine access only. |
| Loki | Internal Docker network | Not published to the host. |
| Alloy | Internal Docker network | Tails the mounted application log files. |

Sign in to Grafana with `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` from `.env`, then open **Dashboards → HustleHub → HustleHub - Application Logs**.

### Useful Docker commands

```powershell
# Follow backend logs
docker compose logs -f backend

# Inspect monitoring services
docker compose logs --tail 100 loki alloy grafana

# Restart only application containers
docker compose up -d backend frontend

# Restart only monitoring containers
docker compose up -d loki alloy grafana

# Stop containers; named monitoring volumes are retained
docker compose down
```

Docker Compose persists Grafana, Loki and Alloy state in named volumes. `docker compose down -v` also deletes these volumes and persisted monitoring data; use it only when you intentionally want to reset monitoring.

The supplied Nginx proxy disables verification of the self-signed backend certificate for this local Docker setup. This must not be copied into a production deployment.

## Alternative setup: local development without Docker

Use this only when you need to work directly on the React or Express source.

Requirements: Node.js 20 or later, npm, a reachable MongoDB instance and OpenSSL. From the repository root, install both dependency sets:

```powershell
npm ci
npm ci --prefix frontend
Copy-Item .env.example .env
```

Configure `.env` as described above and generate the certificate using the same command in the Docker setup section. Then start the backend and frontend in separate terminals:

**Terminal 1 — backend**

```powershell
npm run dev
```

**Terminal 2 — frontend**

```powershell
npm start --prefix frontend
```

The backend listens on `https://localhost:3000`; the frontend development server listens on `http://localhost:3001`.

## Administrator account

Administrator accounts cannot be created through public registration. Create the initial administrator after MongoDB is reachable and the environment file contains `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

With Docker Compose:

```powershell
docker compose exec backend node backend/scripts/createAdmin.js
```

For a locally running backend environment:

```powershell
node backend/scripts/createAdmin.js
```

The script refuses to overwrite an existing account with the configured email.

## Monitoring and Grafana

The Docker Compose monitoring stack collects the backend's structured Winston log files:

1. The backend writes JSON logs to `logs/app.log` and `logs/error.log`.
2. Grafana Alloy tails those files and forwards the entries to Loki.
3. Grafana uses the provisioned Loki data source and dashboard in `monitoring/grafana/`.

Open the dashboard at:

```text
http://localhost:3002
```

Sign in with `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` from `.env`, then open **Dashboards → HustleHub → HustleHub - Application Logs**.

The dashboard includes error and authentication-failure counts, booking and transaction event counts, log volume by severity, and recent application/error logs. Loki retention is configured for seven days. This is a locally hosted Docker monitoring stack, not a managed cloud logging service. CPU, memory, request-latency and other infrastructure/performance metrics are not currently exported.

The Grafana, Loki and Alloy configuration is stored in:

- `monitoring/loki-config.yml`
- `monitoring/alloy-config.alloy`
- `monitoring/grafana/provisioning/datasources/loki.yml`
- `monitoring/grafana/provisioning/dashboards/dashboards.yml`
- `monitoring/grafana/dashboards/hustlehub-overview.json`

## Application workflow

1. Users register as clients or freelancers.
2. Users log in and receive a JWT.
3. Freelancers create and publish gigs.
4. Clients browse available gigs and create bookings.
5. Freelancers accept or reject pending bookings.
6. Work can be confirmed and a transaction can be created.
7. The client completes the simulated payment flow.
8. Paid transactions are associated with the booking, client and freelancer.
9. Freelancers can view their income information and tax estimate.
10. Eligible disputes can be escalated for administrator review.

## Freelancer income and tax dashboard

The freelancer tax dashboard uses paid HustleHub transactions to display lifetime income and income for the current South African tax year. Tax-year aggregation uses each transaction's `paidAt` date and the South African tax-year period (1 March to the end of February).

The dashboard estimates individual income tax using the configured SARS 2026/2027 individual tax brackets and primary rebate. This is an informational estimate, not a tax assessment or substitute for advice from SARS or a registered tax practitioner. It uses HustleHub income only and does not account for outside income, deductible expenses, other deductions, medical tax credits, additional rebates or other personal tax circumstances. It does not annualise tax-year-to-date income.

The calculation is implemented in `frontend/src/components/TaxDashboard.jsx`; the backend aggregation is in `backend/routes/transactions.js`; tests are in `frontend/src/tests/TaxDashboard.test.jsx`.

SARS tax-rate reference: <https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/>

## Security controls

The following table summarises the required baseline security controls. The two student-defined enhancements are listed separately in section 2 above so the marker can distinguish them from the baseline.

| Baseline control | Implementation |
|---|---|
| Authentication | JWT Bearer tokens; one-hour token expiry. |
| Password storage | bcrypt password hashing. |
| Authorisation | Role-based checks for client, freelancer and administrator routes. |
| Resource ownership | Users are restricted to resources they are authorised to access. |
| Validation | `express-validator` checks relevant request fields and identifiers. |
| Sanitisation | MongoDB query sanitisation middleware. |
| Rate limiting | General API and stricter authentication rate limits. |
| HTTP headers | Helmet and Content Security Policy. |
| Request size | JSON request bodies limited to 10 KB. |
| HTTPS | Backend API uses HTTPS with a local self-signed certificate for development. |
| Security audit records | Authentication outcomes and account-security events are stored for administrator review. |
| Application logs | Structured JSON logs are written to `logs/`; passwords, JWT secrets and tokens must not be logged. |

## Testing and static analysis

Run commands from the repository root.

**Backend static analysis:**

```powershell
npm run lint:backend
```

**Frontend static analysis:**

```powershell
npm run lint --prefix frontend
```

**Frontend tests:**

```powershell
npm test --prefix frontend
```

**Frontend production build:**

```powershell
npm run build --prefix frontend
```

**Backend API integration tests (Newman):**

Start the backend and ensure MongoDB is reachable before running this command:

```powershell
npm test
```

The root `npm test` script runs `tests/Postman/HustleHub - Part 2 Security.postman_collection.json` against `https://localhost:3000`. The script uses Newman with `--insecure` for the local self-signed HTTPS certificate; do not use this option for production services.

The other collections in `tests/Postman/` are retained for the Part 1 security checks and the broader API workflow. The Postman UI can import any of these JSON collection files for manual execution.

## Continuous integration and static analysis

The GitHub Actions workflow is `.github/workflows/ci.yml`. It runs backend linting and Newman integration tests against a MongoDB service, followed by frontend linting, tests and a production build. Review the repository's Actions tab for the latest workflow result.

SonarQube Cloud is connected to the separate public analysis copy: [ST10434247 / insy7314-g1-part-2-and-poe-group-12-Public-SonarQube](https://github.com/ST10434247/insy7314-g1-part-2-and-poe-group-12-Public-SonarQube). The official submission remains [EMGPPT / insy7314-g1-part-2-and-poe-group-12](https://github.com/EMGPPT/insy7314-g1-part-2-and-poe-group-12).

## Screenshots and evidence

Evidence is kept alongside the relevant project area:

- `docs/screenshots/docker/` — Docker containers, Compose status, running frontend, login and backend logs.
- `docs/screenshots/monitoring/` — Grafana application-log dashboard.
- `docs/screenshots/SonarQube/` — SonarQube quality-gate summary.
- `tests/screenshots/` — Postman registration and authentication test evidence.

### Docker deployment

![HustleHub Docker containers](docs/screenshots/docker/01-docker-containers.png)

### Grafana application-log monitoring

![HustleHub Grafana application logs](docs/screenshots/monitoring/grafana%20Live%20Monitoring%20Dashboard.PNG)

### SonarQube quality gate

![HustleHub SonarQube report summary](docs/screenshots/SonarQube/SonarQube%20Report%20Summary.PNG)

Capture fresh screenshots after running the latest build and tests before using the evidence in a final assessment submission. The Grafana screenshot included here records the initial monitoring dashboard and log ingestion state; it is not a claim that all application errors have been resolved.

## Source-control and operational notes

- Never commit `.env` files, passwords, JWT secrets, API keys or private certificates.
- Keep `backend/certs/` private and local.
- Runtime logs under `logs/` are ignored by Git and may contain operational details.
- Frontend build output and audit-report output are generated locally and are not committed.
- The local self-signed certificate and Nginx proxy configuration are for development only.
- Do not use real payment-card details; the payment flow is a simulation.

## References

- Auth0. 2020. *Navigating RS256 and JWKS* [online]. Available at: https://auth0.com/blog/navigating-rs256-and-jwks/ [Accessed 17 August 2026].
- Auth0 Developers. 2022. *Express.js Code Sample: API Role-Based Access Control* [online]. Available at: https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control [Accessed 17 August 2026].
- Arias, D. 2023. *Node.js API Authorization By Example* [online]. Available at: https://developer.auth0.com/resources/guides/api/express/basic-authorization [Accessed 18 August 2026].
- bcryptjs. 2026. *bcryptjs* [online]. Available at: https://www.npmjs.com/package/bcryptjs [Accessed 18 August 2026].
- ExorTek. 2026. *@exortek/express-mongo-sanitize* [online]. Available at: https://www.npmjs.com/package/@exortek/express-mongo-sanitize [Accessed 1 October 2026].
- Express.js. 2026. *Express routing* [online]. Available at: https://expressjs.com/en/guide/routing.html [Accessed 3 September 2026].
- express-validator. 2026. *express-validator documentation* [online]. Available at: https://express-validator.github.io/docs/ [Accessed 18 August 2026].
- Friedly, N. and Vedant, K. 2023. *express-rate-limit documentation* [online]. Available at: https://github.com/express-rate-limit/express-rate-limit [Accessed 1 October 2026].
- Helmet. 2026. *Helmet documentation: security headers and Content Security Policy* [online]. Available at: https://helmet.js.org/ [Accessed 1 October 2026].
- Mongoose. 2026. *Mongoose validation documentation* [online]. Available at: https://mongoosejs.com/docs/validation.html [Accessed 1 October 2026].
- Node.js. 2026. *HTTPS documentation* [online]. Available at: https://nodejs.org/api/https.html [Accessed 1 October 2026].
- Postman Docs. 2026. *Install and run Newman* [online]. Available at: https://learning.postman.com/docs/reference/newman-cli/installing-running-newman/ [Accessed 1 October 2026].
- South African Revenue Service (SARS). 2026. *Rates of Tax for Individuals: 2027 Tax Year* [online]. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ [Accessed 30 October 2026].
- The Independent Institute of Education (IIE). 2026. *Information Systems 3D INSY7314: Application Development Security Module Manual*. Unpublished.
