# HustleHub Part 1 - Secure Authentication API

## Project Overview

HustleHub is a RESTful web application designed to connect clients with freelancers.

This repository contains the Part 1 security implementation of the project. The focus of this stage is secure user authentication, password protection, JWT-based authentication, HTTPS communication, input validation, and controlled error handling.

The application uses an in-memory user store for Part 1. Persistent database storage and additional application functionality are introduced in later stages of the project.

---

## System Architecture

The Part 1 backend uses Node.js and Express to provide a secure REST API.

```text
                  HTTPS
┌───────────────────────────────┐
│        Client / Postman       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Node.js + Express       │
│                               │
│  ┌─────────────────────────┐  │
│  │ Security Middleware     │  │
│  │ Helmet                  │  │
│  │ JSON Body Limit         │  │
│  └────────────┬────────────┘  │
│               ▼               │
│  ┌─────────────────────────┐  │
│  │ Authentication Routes   │  │
│  │ Register / Login        │  │
│  └────────────┬────────────┘  │
│               ▼               │
│  ┌─────────────────────────┐  │
│  │ Input Validation        │  │
│  │ express-validator       │  │
│  └────────────┬────────────┘  │
│               ▼               │
│  ┌─────────────────────────┐  │
│  │ Authentication Logic    │  │
│  │ bcryptjs + JWT          │  │
│  └────────────┬────────────┘  │
│               ▼               │
│  ┌─────────────────────────┐  │
│  │ In-Memory User Store    │  │
│  └─────────────────────────┘  │
└───────────────────────────────┘
```

### Authentication Flow

1. A user submits registration details.
2. The request is validated before reaching the registration logic.
3. The password is hashed using bcrypt before being stored.
4. A user can log in using the registered credentials.
5. The supplied password is compared against the stored bcrypt hash.
6. A successful login generates a JWT that expires after one hour.
7. Protected routes require a valid Bearer token.

---

## Security Implementation

### 1. HTTPS

The server runs over HTTPS using a locally generated certificate and private key.

The certificate and private key are stored locally and excluded from Git using `.gitignore`.

Certificate paths are provided through environment variables:

```env
SSL_KEY_PATH=../certs/key.pem
SSL_CERT_PATH=../certs/cert.pem
```

This keeps certificate files and private keys out of the source code and prevents them from being committed to the GitHub repository.

### 2. Password Hashing

User passwords are never stored in plaintext.

The application uses `bcryptjs` with a work factor of `12` to generate a one-way password hash before the user is stored.

The original password is therefore never retained by the application.

### 3. JWT Authentication

Successful login generates a JSON Web Token containing the authenticated user's ID and role.

The token is signed using a secret stored in the environment configuration rather than being hardcoded in the source code.

JWTs expire after one hour to limit the useful lifetime of a stolen token.

### 4. Input Validation

`express-validator` is used to validate registration and login requests before the request reaches the route logic.

Validation includes:

- Valid email format
- Email normalization
- Password length between 8 and 72 characters
- Valid user roles

Public registration is restricted to the `client` and `freelancer` roles. Users cannot assign themselves the `admin` role during registration.

### 5. Error Handling

The API uses controlled error responses for invalid routes, invalid input, authentication failures, and unexpected server errors.

Unexpected server errors are logged on the server while the client receives a generic error message. This prevents internal implementation details such as stack traces and file paths from being exposed through API responses.

### 6. Request Size Limiting

JSON request bodies are limited to 10 KB to reduce unnecessary resource consumption and help protect the API against oversized requests.

### 7. Security Headers

Helmet is used to configure HTTP security headers, including a Content Security Policy.

---

## Environment Configuration

Create a `.env` file in the project root.

The repository includes `.env.example` as a safe template.

Example:

```env
PORT=3000
JWT_SECRET=your-own-random-secret
SSL_KEY_PATH=../certs/key.pem
SSL_CERT_PATH=../certs/cert.pem
```

### Important Security Notes

The real `.env` file must not be committed to GitHub.

The HTTPS private key and certificate must also remain outside source control.

The `.gitignore` file excludes environment files and common certificate and private-key formats.

---

## Project Structure

```text
HustleHub/
│
├── backend/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validate.js
│   │
│   ├── routes/
│   │   └── auth.js
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── tests/
│   ├── HustleHub-Part1-Security.postman_collection.json
│   └── screenshots/
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Installation

### Requirements

- Node.js
- npm
- Postman or the Postman VS Code extension
- OpenSSL for local HTTPS certificate generation

### Install Dependencies

Navigate to the backend directory:

```bash
cd backend
npm install
```

### HTTPS Certificates

The application expects the local HTTPS certificate and private key to be stored in the `certs` directory.

```text
certs/
├── cert.pem
└── key.pem
```

These files are for local development and must not be committed to GitHub.

### Environment Configuration

Create the `.env` file in the project root and provide the required configuration values.

---

## Running the Application

From the `backend` directory:

```bash
npm start
```

The server runs on:

```text
https://localhost:3000
```

A local or self-signed certificate may cause a certificate warning in Postman or a browser. This is expected during local HTTPS development.

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Registers a new client or freelancer |
| POST | `/api/auth/login` | Public | Authenticates a user and returns a JWT |
| GET | `/api/auth/protected` | Protected | Requires a valid JWT |

### Registration

```http
POST /api/auth/register
```

Example request:

```json
{
  "email": "test@example.com",
  "password": "TestPassword123!",
  "role": "client"
}
```

### Login

```http
POST /api/auth/login
```

Example request:

```json
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

A successful login returns a JWT.

### Protected Route

```http
GET /api/auth/protected
```

The JWT must be supplied using the HTTP Authorization header:

```text
Authorization: Bearer <JWT>
```

---

## Postman Testing

A Postman collection is included in:

```text
tests/HustleHub-Part1-Security.postman_collection.json
```

The collection contains tests for:

1. Valid registration
2. Duplicate email registration
3. Invalid email registration
4. Short password registration
5. Invalid role registration
6. Valid login
7. Invalid login credentials
8. Protected route with a valid JWT
9. Protected route without a JWT
10. Protected route with an invalid JWT

Screenshots of the test responses are stored in:

```text
tests/screenshots/
```

These tests demonstrate both successful functionality and rejection of invalid or unauthorised requests.

For local HTTPS testing, Postman may require SSL certificate verification to be disabled when using the self-signed development certificate.

---

## Part 1 Scope

This repository intentionally contains only the functionality required for the Part 1 security submission.

User accounts are stored in memory and are therefore reset when the server is restarted.

Database persistence and additional HustleHub functionality are implemented in later stages of the project and are not included in this submission.

---

## Security and Source Control

The repository is configured to prevent sensitive configuration and cryptographic material from being committed to source control.

The following types of files are excluded using `.gitignore`:

- Environment files
- Private keys
- HTTPS certificates
- Certificate containers
- Node.js dependencies

The JWT signing secret and HTTPS private key are supplied through local environment configuration and are not included in the repository.
