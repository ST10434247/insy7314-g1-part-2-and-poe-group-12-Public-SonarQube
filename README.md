# HustleHub

HustleHub is a gig marketplace built with a React frontend and an Express, Node.js and MongoDB backend. Clients can browse gigs, book freelancers and make simulated payments. Freelancers can publish gigs and manage bookings. Administrators can review and resolve escalated disputes.

## Requirements

* Node.js and npm
* MongoDB Atlas account or a reachable MongoDB instance
* OpenSSL or another method of generating HTTPS certificates

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

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

Add the HTTPS certificate path variables expected by `backend/server.js`. The variable names and paths must match the actual server configuration.

Use a strong, unique JWT secret. Keep all credentials out of source control.

### 3. Generate HTTPS certificates

The backend uses HTTPS. For local development, a self-signed certificate can be generated with OpenSSL.

For example, from the project root:

```bash
mkdir backend/certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout backend/certs/server.key \
  -out backend/certs/server.crt \
  -days 365
```

Use the generated key and certificate paths in the backend configuration or environment variables. A browser may warn that a self-signed certificate is not trusted. This is expected for local development.

### 4. Start the application

Start the backend:

```bash
npm run dev
```

In a separate terminal, start the frontend:

```bash
cd frontend
npm start
```

The current configuration uses:

* Frontend: `https://localhost:3001` or the local URL displayed by the development server.
* Backend: `https://localhost:3000`
* Frontend API proxy: `https://localhost:3000`

The frontend proxy and HTTPS settings must agree with the backend configuration.

### 5. Create an administrator

Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run the administrator provisioning script if required:

```bash
node backend/scripts/createAdmin.js
```

Do not use public registration to create administrator accounts.

## Application workflow

1. Users register as clients or freelancers and log in.
2. Freelancers publish gigs.
3. Clients browse available gigs and submit bookings.
4. Freelancers accept or reject pending bookings.
5. Accepted bookings can proceed to simulated payment and completion.
6. Disputes can be escalated for administrator review.
7. Administrators can review and resolve eligible disputes.

Payments are simulated. The application does not process real card payments through a payment provider.

## Security configuration

| Security feature          | Configuration                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| JWT authentication        | Bearer tokens verified by authentication middleware. Tokens expire after one hour.                                         |
| Role-based access control | Role middleware restricts protected routes. Route-level ownership and participant checks limit access to relevant records. |
| Password security         | Passwords are hashed using bcrypt with 12 salt rounds.                                                                     |
| Input validation          | `express-validator` validates request data and identifiers on relevant routes.                                             |
| Input sanitisation        | MongoDB query sanitisation middleware is applied to incoming requests.                                                     |
| Rate limiting             | General API limit: 100 requests per 15 minutes. Authentication limit: 10 requests per 15 minutes.                          |
| Security headers          | Helmet is configured with a custom Content Security Policy.                                                                |
| Request size              | JSON request bodies are limited to 10 KB.                                                                                  |
| Transport security        | The backend is configured to use HTTPS.                                                                                    |

The authentication endpoints receive both the general API limiter and the stricter authentication limiter.

The Content Security Policy currently allows same-origin resources, inline scripts and styles, data images, and connections to the local backend. Review the policy if deployment URLs or frontend requirements change.

## Testing

Backend API tests are run using Postman and Newman. Frontend tests use the configured React test setup.

See the team testing notes for the section-specific testing checklist.

## Important

* Never commit `.env`, private keys, certificates containing secrets, or real credentials.
* Use local development certificates only for local development.
* Confirm the environment variable names and certificate paths against `backend/server.js` before setting up a new machine.
