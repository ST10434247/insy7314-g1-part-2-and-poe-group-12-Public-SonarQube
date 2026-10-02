# HustleHub — Secure Freelance Marketplace

## Project Overview

HustleHub is a MERN-based freelance marketplace that connects clients with freelancers. Clients can browse services, submit booking requests and complete simulated payments. Freelancers can publish gigs, manage bookings and view their income information. Administrators can review and resolve disputed bookings.

The project focuses on application functionality and security, including role-based access control, JWT authentication, input validation, sanitisation, security headers and rate limiting.

**Payment processing is simulated.** No real payment gateway is connected, and payment card details are not submitted to the backend.

## Technology Stack

| Layer            | Technology             |
| ---------------- | ---------------------- |
| Frontend         | React 18               |
| Backend          | Node.js, Express 5     |
| Database         | MongoDB with Mongoose  |
| Authentication   | JSON Web Tokens        |
| Password hashing | bcryptjs               |
| Validation       | express-validator      |
| Sanitisation     | express-mongo-sanitize |
| Security headers | Helmet                 |
| Logging          | Winston                |
| Development      | Nodemon, concurrently  |
| Transport        | HTTPS for the backend  |

## Application Roles

| Role       | Main capabilities                                                                            |
| ---------- | -------------------------------------------------------------------------------------------- |
| Client     | Browse gigs, request bookings, manage bookings and use simulated payments                    |
| Freelancer | Publish gigs, accept or reject bookings, manage booking progress and view income information |
| Admin      | View eligible disputed bookings and resolve disputes                                         |

Role-based visibility in the frontend improves the user interface. The backend is responsible for enforcing actual permissions.

## Project Structure

```text
HustleHub/
├── backend/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validate.js
│   ├── models/
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── gigs.js
│   │   └── transactions.js
│   ├── scripts/
│   │   └── createAdmin.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── docs/
│   └── DEVELOPMENT_AND_TESTING.md
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

The structure above represents the main application areas. Individual files may differ depending on the current branch.

## Requirements

* Node.js and npm
* MongoDB Atlas or a compatible MongoDB instance
* OpenSSL for local HTTPS certificates
* Git
* A modern browser
* Postman or an equivalent API client for manual API checks

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install backend dependencies

From the project root:

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Environment Configuration

Create a `.env` file in the location expected by the backend configuration. The current backend loads the root environment file.

Use `.env.example` as the template, and configure the values for your environment.

Typical configuration includes:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
PORT=3000
SSL_KEY_PATH=path_to_private_key
SSL_CERT_PATH=path_to_certificate
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_secure_password
```

The exact certificate paths must match the paths used by `backend/server.js`.

Generate a strong JWT secret using:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Do not commit `.env`, database credentials, JWT secrets, admin credentials, private keys or other secrets.

### Local HTTPS Certificates

The backend uses HTTPS. Generate a local certificate and private key using OpenSSL if they are not already available.

Example:

```bash
mkdir backend/certs
cd backend/certs
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 30 -nodes
cd ../..
```

Ensure the paths in `.env` correspond to the generated files.

Local self-signed certificates may trigger browser or API-client warnings. They are intended for development and should not be treated as production certificates.

## Running the Application

### Start the backend

From the project root:

```bash
npm start
```

The backend is configured to use:

```text
https://localhost:3000
```

For development with automatic backend restarts:

```bash
npm run dev
```

### Start the frontend

Open a second terminal:

```bash
cd frontend
npm start
```

The frontend is configured to use port `3001` and proxies API requests to the backend at `https://localhost:3000`.

### Start both applications

The root package includes:

```bash
npm run dev:full
```

This starts the backend development process and the frontend using the configured scripts.

## Main Features

### Authentication

* Client and freelancer registration
* Login using email and password
* Password hashing using bcrypt
* JWT-based authentication
* Role information included in authenticated sessions
* Restricted public registration roles
* Admin account provisioning through a backend script

### Gig Marketplace

* Public browsing of active gigs
* Freelancer gig publishing
* Gig ownership restrictions for editing and deletion
* Server-side validation of gig information

### Booking Management

* Clients submit booking requests with project requirements
* Freelancers accept or reject pending requests
* Clients can cancel eligible bookings
* Freelancers can mark accepted work as awaiting confirmation
* Clients can confirm completion or dispute work
* Freelancers can request administrative review of disputed bookings

### Simulated Transactions

* Transactions are associated with bookings
* Transaction amounts and participants are derived from booking data
* Simulated payment status updates
* Freelancer income information is based on paid transactions

The payment flow is for demonstration purposes. It does not provide verified settlement or real financial processing.

### Dispute Management

* Administrators can view disputed bookings that have a review request
* Administrators can resolve eligible disputes
* Resolution updates the booking status and clears review-request metadata

## Security Controls

The backend includes security mechanisms such as:

* JWT verification for protected routes
* Role-based authorization
* Password hashing
* Request validation
* MongoDB query sanitisation
* Helmet security headers and Content Security Policy
* JSON request-size limits
* HTTPS transport
* Controlled error responses

Rate limiting is part of the security assessment scope. Confirm its middleware configuration and route coverage in the current backend before describing its exact limits or behavior.

## Testing

The project can be reviewed through:

* Manual frontend workflow checks
* API requests using Postman
* Role and authorization checks
* Input validation checks
* Security-header inspection
* Rate-limit behavior checks
* Frontend production build

See [Development and Testing Guide](docs/DEVELOPMENT_AND_TESTING.md) for the workflow and handover checklist.

## Known Limitations

* Payments are simulated and are not verified by an external payment provider.
* The application uses local development HTTPS certificates.
* JWTs are stored by the frontend in browser local storage.
* A frontend role check is not a replacement for backend authorization.
* Production deployment configuration, certificate management and operational security require separate review.

## Development Notes

The root package manages the backend dependencies. The frontend has its own package configuration and dependencies under `frontend`.

The frontend package is named `gig-app-frontend`, despite the overall application being called HustleHub.