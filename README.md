# HustleHub Part 1 - Secure Authentication API

## Project Overview

HustleHub is a RESTful web application designed to connect clients with freelancers.

This repository contains the Part 1 security implementation of the project. The focus of this stage is secure user authentication, password protection, JWT-based authentication, HTTPS communication, input validation, and controlled error handling.

The application uses an in-memory user store for Part 1.

---

## System Architecture

The overall HustleHub application follows the MERN architecture. For Part 1, the assessment focuses on the secure Node.js and Express backend.

```text
                         MERN Architecture

┌─────────────────────────────────────────────────────────────┐
│                         React Frontend                      │
│                  Client-facing application                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                            HTTPS
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node.js + Express API                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Part 1 Security Layer                 │  │
│  │                                                       │  │
│  │  Helmet → JSON Limits → Validation → Authentication   │  │
│  │                                                       │  │
│  │        bcryptjs + JWT + Protected Routes              │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                    Part 1: In-Memory Store                  │
└──────────────────────────────┼──────────────────────────────┘
                               │
                     Later Project Stage
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MongoDB       │
                    │   Persistent data   │
                    └─────────────────────┘
```

### Part 1 Scope

The overall HustleHub system follows the MERN architecture, consisting of MongoDB, Express, React, and Node.js. For Part 1, the assessment focuses on the secure Node.js and Express backend.

The React frontend and MongoDB persistence are part of the overall system architecture but are intentionally not included in this Part 1 submission. An in-memory user store is used to satisfy the Part 1 authentication requirements without introducing database functionality at this stage.

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

### HTTPS

The server runs over HTTPS using a locally generated certificate and private key.

The certificate and private key are stored locally and excluded from Git using `.gitignore`.

Certificate paths are provided through environment variables:

```env
SSL_KEY_PATH=../certs/key.pem
SSL_CERT_PATH=../certs/cert.pem
```

This keeps certificate files and private keys out of the source code and prevents them from being committed to the GitHub repository.

### Password Hashing

User passwords are never stored in plaintext.

The application uses `bcryptjs` with a work factor of `12` to generate a one-way password hash before the user is stored.

The original password is therefore never retained by the application.

### JWT Authentication

Successful login generates a JSON Web Token containing the authenticated user's ID and role.

The token is signed using a secret stored in the environment configuration rather than being hardcoded in the source code.

JWTs expire after one hour to limit the useful lifetime of a stolen token.

### Input Validation

`express-validator` is used to validate registration and login requests before the request reaches the route logic.

Validation includes:

- Valid email format
- Email normalization
- Password length between 8 and 72 characters
- Valid user roles

Public registration is restricted to the `client` and `freelancer` roles. Users cannot assign themselves the `admin` role during registration.

### Error Handling

The API uses controlled error responses for invalid routes, invalid input, authentication failures, and unexpected server errors.

Unexpected server errors are logged on the server while the client receives a generic error message. This prevents internal implementation details such as stack traces and file paths from being exposed through API responses.

### Request Size Limiting

JSON request bodies are limited to 10 KB to reduce unnecessary resource consumption and help protect the API against oversized requests.

### Security Headers

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

## Installation

### Requirements
- Node.js
- npm
- Postman or the Postman VS Code extension
- OpenSSL for local HTTPS certificate generation

### Clone the Repository
Clone the project repository and navigate into the root directory:
```bash
git clone <repository-url>
cd <project-directory>
```

### Install Dependencies
Navigate to the backend directory and install the required modules:
```bash
cd backend
npm install
```

### HTTPS Certificates
The application expects the local HTTPS certificate and private key to be stored in a `certs` directory inside the `backend` folder. 

Create the directory and navigate into it:
```bash
mkdir certs
cd certs
```

Your structure should look like this:
```text
backend/certs/
├── cert.pem
└── key.pem
```

To generate the required certificate files inside the `certs` directory, run the following command:
```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 30 -nodes
```

After generating the certificates, navigate back up to the `backend` root:
```bash
cd ..
```

### JWT Secret Generation
To generate a secure, cryptographically strong secret key for your `JWT_SECRET` environment variable, run the following command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output string and paste it as your `JWT_SECRET` value in your `.env` file.

### Environment Configuration
Create a `.env` file in the `backend` directory and provide the required configuration values.

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
*Note: A local or self-signed certificate may cause a certificate warning in Postman or a browser. This is expected during local HTTPS development.*


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
2. Missing password registration
3. Invalid role registration
4. Short password registration
5. Duplicate email registration
6. Invalid email registration
7. Valid login
8. Invalid login credentials
9. Protected route with a valid JWT
10. Protected route without a JWT
11. Protected route with an invalid JWT

### Running the Tests

Start the backend server before sending requests:

```bash
cd backend
npm start
```

The API is available at:

```text
https://localhost:3000
```

Import the Postman collection and execute the requests individually.

For the protected route test using a valid JWT:

1. Run **Login - Valid**.
2. Copy the JWT returned in the response.
3. Open **Protected - Valid Token**.
4. Add the following HTTP header:

```text
Authorization: Bearer <JWT>
```

5. Replace `<JWT>` with the token returned by the login request.
6. Send the request and verify that the protected resource returns a successful response.

The **Protected - Invalid Token** request deliberately uses an invalid token to demonstrate that the API rejects tokens that cannot be successfully verified.

The **Protected - No Token** request does not include an Authorization header and demonstrates that protected resources cannot be accessed without authentication.

Screenshots of the test responses are stored in:

```text
tests/screenshots/
```

These tests demonstrate both successful functionality and rejection of invalid, malformed, and unauthorised requests.

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


---

## References

- Auth0, 2020. Navigating RS256 and JWKS [code]. Available at: <https://auth0.com/blog/navigating-rs256-and-jwks/> [Accessed 17 August 2026].
- Auth0, 2026a. Express.js Code Sample: API Role-Based Access Control [code]. Available at: <https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control> [Accessed 17 August 2026].
- Auth0, 2026b. Node.js API Authorization By Example [code]. Available at: <https://developer.auth0.com/resources/guides/api/express/basic-authorization> [Accessed 18 August 2026].
- bcryptjs, 2026. bcryptjs [code]. Available at: <https://www.npmjs.com/package/bcryptjs> [Accessed 18 August 2026].
- Express.js, 2026. Express routing [code]. Available at: <https://expressjs.com/en/guide/routing.html> [Accessed 3 September 2026].
- express-validator, 2026. express-validator documentation [code]. Available at: <https://express-validator.github.io/docs/> [Accessed 18 August 2026].
- The Independent Institute of Education (IIE), 2026. INFORMATION SYSTEMS 3D INSY7314 [APPLICATION DEVELOPMENT SECURITY MODULE MANUAL]
  The Independent Institute of Education. Unpublished.

