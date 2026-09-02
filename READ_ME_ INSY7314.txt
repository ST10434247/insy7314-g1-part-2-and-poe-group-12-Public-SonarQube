 

 

# Secure RESTful Authentication API 

 

A secure Node.js and Express authentication backend featuring HTTPS, password hashing with `bcryptjs`, token-based authentication using **JSON Web Tokens (JWT)**, and centralized input validation and error handling. 

 

--- 

 

## Architecture & System Overview 

 

``` 

[ Client / Postman ] --- ( HTTPS / Port 3000 ) ---> [ Express API Server ] 

                                                           | 

      +----------------------------------------------------+---------------------------------------------------+ 

      |                                                    |                                                   | 

      v                                                    v                                                   v 

[ Validation & Sanitization ]                     [ Authentication Logic ]                          [ Custom Auth Middleware ] 

(express-validator)                               (bcryptjs + jsonwebtoken)                         (Bearer Token Extraction) 

                                                           |                                                   | 

                                                           v                                                   v 

                                                [ In-Memory User Store ]                            [ Protected Routes ] 

``` 

 

--- 

 

## Key Features & Security Rationale 

 

### 1. Transport Layer Security (HTTPS) 

* **Implementation:** Standard Node.js `https` module powered by locally generated SSL certificates (`key.pem` and `cert.pem`). 

* **Security Rationale:** Encrypts all transit data to protect sensitive credentials (passwords and Bearer tokens) against packet sniffing and Man-in-the-Middle (MitM) attacks. 

 

### 2. Secure Password Storage 

* **Implementation:** `bcryptjs` with a cost factor of `10`. 

* **Security Rationale:** Passwords are never stored in plain text. Salting and adaptive hashing guard against dictionary and rainbow table attacks. 

 

### 3. Stateless Token Authentication (JWT) 

* **Implementation:** `jsonwebtoken` signed with a secret environment variable (`JWT_SECRET`). 

* **Security Rationale:** Tokens store key identification payload details (`id`, `role`) with an expiration window (`1h`), keeping session verification lightweight and server-stateless. 

 

### 4. Input Validation & Safe Error Handling 

* **Implementation:** `express-validator` sanitizes and validates request bodies before hit logic execution. 

* **Security Rationale:** Prevents malformed inputs and prevents sensitive execution context, stack traces, or server layout details from spilling into production API responses. 

 

--- 

 

## Prerequisites & Installation 

 

### Requirements 

* **Node.js**: v14+ installed 

* **Postman**: For sending API requests 

 

### Installation Steps 

 

1. **Clone repository:** 

   ```bash 

   git clone <your-repository-url> 

   cd <repository-folder> 

   ``` 

 

2. **Install dependencies:** 

   ```bash 

   npm install 

   ``` 

 

3. **Generate local SSL certificates (via Git Bash or OpenSSL):** 

   ```bash 

   openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes 

   ``` 

 

4. **Environment Configuration:** 

   Create a `.env` file in the project root: 

   ```env 

   PORT=3000 

   JWT_SECRET=supersecretkey 

   ``` 

 

--- 

 

## Running the Application 

 

Start the server: 

```bash 

node server.js 

``` 

 

Terminals should output: 

```text 

HTTPS Server running on https://localhost:3000 

``` 

 

--- 

 

## API Endpoints 

 

| Method | Endpoint | Access | Description | 

| :--- | :--- | :--- | :--- | 

| `POST` | `/api/register` | Public | Registers a new user with hashed password. | 

| `POST` | `/api/login` | Public | Validates credentials and returns JWT token. | 

| `GET` | `/api/protected` | Private | Protected route requiring valid Bearer JWT. | 

 

--- 

 

## Postman Testing Instructions 

 

1. Open Postman and import `postman_collection.json`. 

2. Disable SSL Verification in Postman: **Settings ⚙️ → General → SSL certificate verification → OFF**. 

3. Execute requests in order: 

   * **Register User:** Send `POST` request to `https://localhost:3000/api/register`. 

   * **Login User:** Send `POST` to `https://localhost:3000/api/login` to obtain the JWT token string. 

   * **Access Protected Route:** Paste the token into `Authorization` -> `Bearer Token` for `GET https://localhost:3000/api/protected`. 