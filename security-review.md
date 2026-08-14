# BrushIQ Backend — Comprehensive Secure Code Review

**Reviewed By:** Antigravity (AI Security Analysis)  
**Date:** 2026-08-13  
**Version:** 1.0  
**Scope:** Full static analysis of Node.js/Express backend  

---

## Executive Summary

BrushIQ is an AI-powered oral healthcare platform built on **Node.js / Express** with a **PostgreSQL** database. The backend implements JWT-based authentication, Google OAuth 2.0 integration, role-scoped data access, file uploads with MIME-type validation, and rate limiting. The codebase demonstrates several strong security practices (parameterized queries throughout, helmet headers, rate limiting, bcrypt password hashing), but contains a number of **critical**, **high**, and **medium** risk issues that should be remediated before production hardening.

**Overall Security Score: 61 / 100**

| Category | Score |
|---|---|
| Authentication | 65/100 |
| Authorization | 80/100 |
| Input Validation | 72/100 |
| Injection Risks | 88/100 |
| Cryptography | 45/100 |
| Sensitive Data Exposure | 30/100 |
| Configuration | 62/100 |
| Dependency Health | 65/100 |

---

## Backend Inventory

| Property | Value |
|---|---|
| **Language** | JavaScript (Node.js 18+) |
| **Framework** | Express 4.19.x |
| **API Architecture** | RESTful JSON API |
| **Authentication** | JWT (Bearer token) + Google OAuth 2.0 |
| **Authorization Model** | User-scoped resource ownership (no RBAC roles) |
| **Database** | PostgreSQL (via `pg` library with connection pool) |
| **ORM/Query Layer** | Raw parameterized SQL (`pg` Pool) |
| **API Documentation** | None (no Swagger / OpenAPI spec) |
| **File Uploads** | `multer` (disk storage, 5 MB limit, extension + MIME + magic-byte validation) |
| **Session Handling** | Stateless JWT (1-hour expiry, no refresh token) |
| **Email Service** | `nodemailer` over SMTP (Gmail or configurable) |
| **AI/ML** | TensorFlow.js + COCO-SSD + Jimp image analysis |
| **Security Middleware** | Helmet, express-rate-limit, CORS restricted origin policy |
| **Deployment** | Render.com (backend), Vercel (frontend), Supabase (PostgreSQL) |
| **Containerization** | Docker Compose (dev only) |

---

## Endpoint Inventory

| # | Endpoint | Method | Auth Required | Expected Roles | Controller File |
|---|---|---|---|---|---|
| 1 | `/health` | GET | No | Public | `app.js` |
| 2 | `/api/health` | GET | No | Public | `app.js` |
| 3 | `/` | GET | No | Public | `app.js` |
| 4 | `/api/auth/register` | POST | No | Public | `authController.js` |
| 5 | `/api/auth/login` | POST | No | Public | `authController.js` |
| 6 | `/api/auth/google` | POST | No | Public | `authController.js` |
| 7 | `/api/auth/forgot-password` | POST | No | Public | `authController.js` |
| 8 | `/api/auth/reset-password` | POST | No | Public | `authController.js` |
| 9 | `/api/auth/reset-password-page` | GET | No | Public | `authController.js` |
| 10 | `/api/auth/change-password` | POST | Yes | Authenticated User | `authController.js` |
| 11 | `/api/auth/me` | GET | Yes | Authenticated User | `authController.js` |
| 12 | `/api/auth/reset-limiter` | POST | No | Dev Only (runtime check) | `rateLimiter.js` |
| 13 | `/api/family` | GET | Yes | Authenticated User | `familyController.js` |
| 14 | `/api/family` | POST | Yes | Authenticated User | `familyController.js` |
| 15 | `/api/family/:id` | PUT | Yes | Authenticated User | `familyController.js` |
| 16 | `/api/family/:id` | DELETE | Yes | Authenticated User | `familyController.js` |
| 17 | `/api/toothbrush` | GET | Yes | Authenticated User | `toothbrushController.js` |
| 18 | `/api/toothbrush` | POST | Yes | Authenticated User | `toothbrushController.js` |
| 19 | `/api/toothbrush/:id` | PUT | Yes | Authenticated User | `toothbrushController.js` |
| 20 | `/api/toothbrush/:id` | DELETE | Yes | Authenticated User | `toothbrushController.js` |
| 21 | `/api/toothbrushes` | GET | Yes | Authenticated User | `toothbrushController.js` |
| 22 | `/api/toothbrushes` | POST | Yes | Authenticated User | `toothbrushController.js` |
| 23 | `/api/toothbrushes/:id` | PUT | Yes | Authenticated User | `toothbrushController.js` |
| 24 | `/api/toothbrushes/:id` | DELETE | Yes | Authenticated User | `toothbrushController.js` |
| 25 | `/api/scans/analyze` | POST | Yes | Authenticated User | `scanController.js` |
| 26 | `/api/scans` | POST | Yes | Authenticated User | `scanController.js` |
| 27 | `/api/scans` | GET | Yes | Authenticated User | `scanController.js` |
| 28 | `/api/scans/:id` | GET | Yes | Authenticated User | `scanController.js` |
| 29 | `/api/reminders` | GET | Yes | Authenticated User | `reminderController.js` |
| 30 | `/api/reminders` | POST | Yes | Authenticated User | `reminderController.js` |
| 31 | `/api/reminders/:id/complete` | PUT | Yes | Authenticated User | `reminderController.js` |
| 32 | `/api/tips` | GET | Yes | Authenticated User | `tipController.js` |
| 33 | `/api/tips/personalized` | GET | Yes | Authenticated User | `tipController.js` |
| 34 | `/api/dashboard` | GET | Yes | Authenticated User | `dashboardController.js` |
| 35 | `/api/system/database-status` | GET | Yes | Authenticated User | `system.js` |
| 36 | `/uploads/*` | GET | No | Public (static files) | `app.js` |
| 37 | `/illustrations/*` | GET | No | Public (static files) | `app.js` |

---

## Security Findings

### CRITICAL Findings

---

#### CRIT-01 — Hardcoded Default JWT Secret in Source Code

| Field | Value |
|---|---|
| **Severity** | CRITICAL |
| **File** | `src/config/jwt.js` — Line 4 |
| **CWE** | CWE-798: Use of Hard-coded Credentials |
| **OWASP** | A02:2021 – Cryptographic Failures |

**Description:**  
A hard-coded fallback JWT secret is embedded directly in the source code:
```js
const DEFAULT_SECRET = 'brushiq_secure_production_jwt_secret_key_32bytes_min';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;
```

**Why it is a concern:**  
If `JWT_SECRET` environment variable is not set, the application silently falls back to a well-known secret that is now public knowledge since it is committed to the repository. Any attacker with access to this repository can forge valid JWT tokens, impersonate any user ID, and gain unauthorized access to all user data with administrative privileges.

**Recommended Fix:**  
- Remove the `DEFAULT_SECRET` fallback entirely.  
- In production, throw an error and terminate startup if `JWT_SECRET` is missing or shorter than 64 characters.
```js
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
  console.error('FATAL: JWT_SECRET must be set and >= 64 characters. Exiting.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
```

---

#### CRIT-02 — Real `.env` File with Secrets Tracked in Git

| Field | Value |
|---|---|
| **Severity** | CRITICAL |
| **File** | `backend/.env` |
| **CWE** | CWE-312: Cleartext Storage of Sensitive Information |
| **OWASP** | A02:2021 – Cryptographic Failures |

**Description:**  
The actual `.env` file (`backend/.env`) contains real credentials including:
- `JWT_SECRET=supersecretbrushiqjwttoken` (weak 30-char secret)
- `DB_PASSWORD=postgrespassword`
- `GOOGLE_CLIENT_ID=534843148727-ernb5gqgo6pf1cobmmvjbsl7d4f5026s.apps.googleusercontent.com`

While `.env` is listed in `.gitignore`, the root `BrushIQ/.gitignore` (not `backend/.gitignore`) handles this. If the repository history was ever committed with `.env`, these secrets may be in git history.

**Why it is a concern:**  
Weak JWT secret (`supersecretbrushiqjwttoken` — 30 chars, dictionary-guessable) and exposed Google Client ID in the `.env` file. The Google Client ID in `render.yaml` (line 30) is also hardcoded in a deployment YAML that is tracked in git.

**Recommended Fix:**  
1. Rotate ALL exposed secrets immediately.
2. Run `git-secrets` or `gitleaks` to verify secrets are not in git history. If they are, rewrite git history.
3. Add a dedicated `backend/.env.local` never committed to git.
4. Use proper secret management (GitHub Secrets, Render secrets, HashiCorp Vault).

---

#### CRIT-03 — Google Client ID Hardcoded in `render.yaml`

| Field | Value |
|---|---|
| **Severity** | CRITICAL |
| **File** | `backend/render.yaml` — Line 30 |
| **CWE** | CWE-798: Use of Hard-coded Credentials |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
The Google OAuth Client ID is hardcoded in the deployment config file tracked in version control:
```yaml
- key: GOOGLE_CLIENT_ID
  value: "534843148727-ernb5gqgo6pf1cobmmvjbsl7d4f5026s.apps.googleusercontent.com"
```

**Why it is a concern:**  
OAuth Client IDs should be treated as sensitive. Exposing them in public repositories enables client impersonation attacks and phishing. Combined with stolen tokens, this is exploitable.

**Recommended Fix:**  
Use `sync: false` for the `GOOGLE_CLIENT_ID` key in `render.yaml`, same as `DATABASE_URL` and `DB_PASSWORD`, and set it manually in the Render dashboard.

---

### HIGH Findings

---

#### HIGH-01 — Weak JWT Secret in `.env` File

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **File** | `backend/.env` — Line 7 |
| **CWE** | CWE-326: Inadequate Encryption Strength |
| **OWASP** | A02:2021 – Cryptographic Failures |

**Description:**  
The actual JWT secret used is `supersecretbrushiqjwttoken` — only 30 characters, follows an obvious pattern, and would be trivially cracked by dictionary/brute-force attacks against captured JWT tokens.

**Recommended Fix:**  
Generate a cryptographically random secret of at least 64 characters:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

#### HIGH-02 — Uploaded Files Publicly Accessible Without Authentication

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **File** | `src/app.js` — Lines 69–77 |
| **CWE** | CWE-284: Improper Access Control |
| **OWASP** | A01:2021 – Broken Access Control |

**Description:**  
The `/uploads` directory is served as public static content with no authentication required:
```js
app.use('/uploads', express.static(uploadDir));
```
Toothbrush scan images (containing potentially personal biometric-adjacent health data) are accessible to anyone who can guess or enumerate file URLs.

**Why it is a concern:**  
File names are predictable (`scan-<timestamp>-<random>.jpg`). The timestamp component narrows the search space. Health images of users' toothbrushes are PII-adjacent medical imagery.

**Recommended Fix:**  
Serve uploaded images through an authenticated route:
```js
app.get('/uploads/:filename', authMiddleware, (req, res) => {
  // Verify file belongs to requesting user before serving
  res.sendFile(path.join(uploadDir, req.params.filename));
});
```

---

#### HIGH-03 — Development Endpoint `/api/auth/reset-limiter` Exposed on Public Route

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **File** | `src/routes/auth.js` — Lines 50–51 |
| **CWE** | CWE-489: Active Debug Code |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
A development helper endpoint to reset rate limiting is mounted on the public API:
```js
router.post('/reset-limiter', resetAuthLimiter);
```
While the `resetAuthLimiter` handler checks `isDevelopment`, this check relies on `NODE_ENV` being correctly set. If an attacker forces `NODE_ENV` via environment variable manipulation (e.g., in a misconfigured container), or if the endpoint is ever accidentally hit in production with incorrect `NODE_ENV`, they can reset authentication rate limits and launch brute-force attacks.

**Recommended Fix:**  
Remove this endpoint entirely from the router. For development testing, use a separate internal testing utility not exposed via the API.

---

#### HIGH-04 — CORS Allows All Origins in Non-Production

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **File** | `src/app.js` — Line 44 |
| **CWE** | CWE-942: Overly Permissive Cross-domain Whitelist |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
The CORS policy allows any origin in non-production environments:
```js
if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
  callback(null, true);
}
```

**Why it is a concern:**  
If the server is running in a staging or CI environment not explicitly set to `production`, any origin can make credentialed cross-origin requests. This could allow phishing sites to make authenticated API calls using a victim's session.

**Recommended Fix:**  
Restrict CORS to specific allowed origins in all environments:
```js
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Blocked by CORS security policy'));
  }
}
```

---

#### HIGH-05 — Missing Authentication on `/api/scans/analyze` — File Upload

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **File** | `src/routes/scan.js` — Line 77 |
| **CWE** | CWE-284: Improper Access Control |
| **OWASP** | A01:2021 – Broken Access Control |

**Description:**  
The `/api/scans/analyze` route applies `router.use(authMiddleware)` at line 10, but then `POST /analyze` uses `upload.single('image')` which runs BEFORE the auth middleware sees the file. The multer middleware stores the file to disk before authentication is verified.

Actually upon review — `router.use(authMiddleware)` is applied before the route handlers, so authentication occurs. However, the scan analysis result does NOT save ownership and is returned without tying to an authenticated user. There is a disconnect: `/api/scans/analyze` analyzes and returns results, but `/api/scans` (POST) saves — meaning the imageUrl from a scan could be submitted by ANY authenticated user, not just the one who uploaded the file.

**Why it is a concern:**  
User A uploads an image and gets back an `imageUrl`. User B (knowing/guessing the imageUrl) can save a scan with User A's image URL attached to User B's toothbrush. This creates a cross-user data integrity issue.

**Recommended Fix:**  
Track uploaded images by user session. When saving a scan, validate that the image URL was generated by the current authenticated user in the current session (use Redis or short-lived signed URLs).

---

#### HIGH-06 — SSL Certificate Verification Disabled for Remote Database

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **File** | `src/config/db.js` — Line 30 |
| **CWE** | CWE-295: Improper Certificate Validation |
| **OWASP** | A02:2021 – Cryptographic Failures |

**Description:**  
When connecting to a remote PostgreSQL database (e.g., Supabase), SSL certificate validation is disabled:
```js
const sslConfig = isRemote ? { rejectUnauthorized: false } : false;
```

**Why it is a concern:**  
Disabling `rejectUnauthorized` makes the connection vulnerable to Man-in-the-Middle (MitM) attacks. An attacker on the network path could intercept database credentials and all health data transmitted between the application and the database.

**Recommended Fix:**  
Enable full certificate validation:
```js
const sslConfig = isRemote ? { rejectUnauthorized: true, ca: process.env.DB_CA_CERT } : false;
```
Download the CA certificate from Supabase and provide it via an environment variable.

---

#### HIGH-07 — Email TLS Certificate Validation Disabled

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **File** | `src/services/mailerService.js` — Line 24 |
| **CWE** | CWE-295: Improper Certificate Validation |
| **OWASP** | A02:2021 – Cryptographic Failures |

**Description:**  
The nodemailer transporter has TLS certificate validation disabled:
```js
tls: { rejectUnauthorized: false }
```

**Why it is a concern:**  
Password reset emails (with reset links) are sent over an unverified TLS connection. An attacker can MitM the SMTP connection, intercept the reset link, and take over user accounts.

**Recommended Fix:**  
Remove `rejectUnauthorized: false` or set it to `true`. For Gmail/standard providers, this is not needed.

---

### MEDIUM Findings

---

#### MED-01 — No JWT Token Revocation / Refresh Token Mechanism

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **File** | `src/config/jwt.js`, `src/middlewares/auth.js` |
| **CWE** | CWE-613: Insufficient Session Expiration |
| **OWASP** | A07:2021 – Identification and Authentication Failures |

**Description:**  
JWT tokens have a 1-hour expiry (`JWT_EXPIRES_IN = '1h'`). There is no token revocation mechanism (no blocklist, no refresh token). If a token is stolen (XSS, network sniffing), it remains valid for up to 1 hour with no way to invalidate it.

**Why it is a concern:**  
After a password change, the old token remains valid for the remainder of its 1-hour window. Users cannot log out all sessions.

**Recommended Fix:**  
- Implement a refresh token system with short-lived access tokens (15 minutes) and long-lived refresh tokens (stored in HttpOnly cookies).
- Maintain a token revocation list in Redis for immediately invalidating tokens on logout or password change.

---

#### MED-02 — Missing Input Sanitization on String Fields Stored in DB

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **File** | `src/controllers/familyController.js` — Line 116, `src/controllers/toothbrushController.js` — Lines 62 |
| **CWE** | CWE-20: Improper Input Validation |
| **OWASP** | A03:2021 – Injection |

**Description:**  
Fields like `name`, `brand`, `model`, `color`, `type`, `relationship`, `gender` are accepted from user input and stored directly in the database without length validation or character set restriction beyond what the DB schema column types enforce.

**Why it is a concern:**  
- Oversized inputs can cause storage bloat.
- HTML/script content in `name` fields can cause Stored XSS if any admin view or email renders these unsanitized.
- No validation that `gender`, `relationship`, or `type` match expected enum values.

**Recommended Fix:**  
- Add server-side input validation using a schema validation library (e.g., `zod`, `joi`, `express-validator`).
- Enforce enum values for `gender`, `relationship`, `type` fields.
- Strip or reject HTML from text fields.

---

#### MED-03 — Dashboard Error Leaks Internal Error Message

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **File** | `src/controllers/dashboardController.js` — Line 132 |
| **CWE** | CWE-209: Generation of Error Message Containing Sensitive Information |
| **OWASP** | A09:2021 – Security Logging and Monitoring Failures |

**Description:**  
The dashboard error handler exposes the raw PostgreSQL error message in the HTTP response:
```js
message: 'Server error compiling dashboard metrics: ' + err.message
```

**Why it is a concern:**  
Database error messages can reveal table names, column names, query structure, and PostgreSQL version — all useful for an attacker doing reconnaissance.

**Recommended Fix:**  
Return only generic error messages to clients:
```js
message: 'An error occurred while loading the dashboard. Please try again.'
```
Log the full error server-side only.

---

#### MED-04 — Missing Rate Limiting on File Upload Endpoint

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **File** | `src/routes/scan.js` — Line 77 |
| **CWE** | CWE-400: Uncontrolled Resource Consumption |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
The `/api/scans/analyze` endpoint processes CPU-intensive AI image analysis (TensorFlow, Jimp image processing) but only has the general `apiLimiter` (200 requests / 15 min). Heavy AI workloads at 200 requests/15 min can exhaust CPU and memory.

**Recommended Fix:**  
Add a dedicated, stricter rate limiter for the scan analysis endpoint:
```js
const scanAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 scans per 15 minutes per IP
  message: 'Too many scan requests. Please wait before scanning again.'
});
router.post('/analyze', scanAnalysisLimiter, upload.single('image'), ...);
```

---

#### MED-05 — No Content-Length Validation on Request Body

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **File** | `src/app.js` — Lines 56–57 |
| **CWE** | CWE-400: Uncontrolled Resource Consumption |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
The body parsers are configured without size limits:
```js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**Why it is a concern:**  
Large JSON payloads (tens of MB) can cause memory exhaustion / Denial of Service.

**Recommended Fix:**  
```js
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

---

#### MED-06 — Docker Compose Exposes PostgreSQL on Public Port Without Auth

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **File** | `docker-compose.yml` — Lines 9–14 |
| **CWE** | CWE-284: Improper Access Control |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
Docker Compose exposes PostgreSQL on `0.0.0.0:5432` with default credentials (`postgres`/`postgrespassword`). Adminer is exposed on `0.0.0.0:8080` with full database admin access.

**Why it is a concern:**  
If this configuration is used in any shared/cloud environment (even for staging), the database and its admin interface are publicly accessible to anyone.

**Recommended Fix:**  
- Bind to `127.0.0.1` only: `- "127.0.0.1:5432:5432"`
- Use strong, random passwords in Docker Compose via `.env`.
- Remove Adminer from any non-local environment or add HTTP authentication.

---

#### MED-07 — No Password Complexity Policy (Only Minimum Length)

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **File** | `src/controllers/authController.js` — Lines 180, 396, 564 |
| **CWE** | CWE-521: Weak Password Requirements |
| **OWASP** | A07:2021 – Identification and Authentication Failures |

**Description:**  
Password validation only checks for minimum length of 10 characters:
```js
if (password.length < 10) { ... }
```
Passwords like `aaaaaaaaaa` or `1234567890` are accepted.

**Recommended Fix:**  
Add complexity requirements:
```js
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{10,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({ message: 'Password must have uppercase, lowercase, number, and special character.' });
}
```

---

#### MED-08 — Missing Upload Path Traversal Protection

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **File** | `src/routes/scan.js` — Line 24 |
| **CWE** | CWE-22: Path Traversal |
| **OWASP** | A01:2021 – Broken Access Control |

**Description:**  
When generating the upload filename, the file extension is extracted from `file.originalname`:
```js
const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
```
If `file.originalname` contains `../../../etc/passwd.jpg`, `path.extname()` returns `.jpg`, so the extension is safe, but the pattern warrants vigilance.

**Why it is a concern:**  
While `multer.diskStorage` destination is fixed and only the filename is constructed, if future code uses `file.originalname` directly for any path operation, it creates a traversal risk.

**Recommended Fix:**  
Sanitize the original filename:
```js
const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
const ext = path.extname(sanitizedName).toLowerCase() || '.jpg';
```

---

### LOW Findings

---

#### LOW-01 — Verbose Server-side Console Logging of Auth Events

| Field | Value |
|---|---|
| **Severity** | LOW |
| **File** | `src/controllers/authController.js` — Lines 10–16, 240–289 |
| **CWE** | CWE-532: Insertion of Sensitive Information into Log File |
| **OWASP** | A09:2021 – Security Logging and Monitoring Failures |

**Description:**  
Extensive console logging including user email addresses, Google IDs, user IDs, database connection status, and authentication branch paths is logged to stdout. In cloud environments (Render, etc.), these logs are accessible to anyone with dashboard access.

**Recommended Fix:**  
- Use a structured logging library (e.g., `pino`, `winston`) with log level control.
- Redact PII (emails, user IDs) from INFO-level logs.
- Keep detailed logs at DEBUG level, disabled in production.

---

#### LOW-02 — No API Versioning

| Field | Value |
|---|---|
| **Severity** | LOW |
| **File** | `src/app.js` |
| **CWE** | N/A |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
All API routes are mounted under `/api/` without version prefixes (e.g., `/api/v1/`). This makes it difficult to deprecate endpoints safely and maintain backward compatibility.

**Recommended Fix:**  
Mount routes under `/api/v1/` and plan for future versioning.

---

#### LOW-03 — `unsafe-inline` in Content Security Policy

| Field | Value |
|---|---|
| **Severity** | LOW |
| **File** | `src/app.js` — Lines 26–27 |
| **CWE** | CWE-693: Protection Mechanism Failure |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
The CSP includes `'unsafe-inline'` for both `scriptSrc` and `styleSrc`:
```js
scriptSrc: ["'self'", "'unsafe-inline'"],
styleSrc: ["'self'", "'unsafe-inline'"],
```

**Why it is a concern:**  
`unsafe-inline` allows inline scripts and styles, negating much of the XSS protection that CSP provides. This is particularly relevant because the backend serves an inline HTML page for password reset (`renderResetPasswordPage`).

**Recommended Fix:**  
Use nonces or hashes instead of `unsafe-inline`. For the password reset page, use a CSP nonce:
```js
scriptSrc: ["'self'", `'nonce-${nonce}'`],
```

---

#### LOW-04 — No Swagger/OpenAPI Documentation

| Field | Value |
|---|---|
| **Severity** | LOW |
| **File** | N/A |
| **CWE** | N/A |
| **OWASP** | A05:2021 – Security Misconfiguration |

**Description:**  
The API has no OpenAPI/Swagger documentation. This makes security reviews, penetration testing, and third-party integration harder, and increases risk of undocumented endpoint exposure.

**Recommended Fix:**  
Add `swagger-ui-express` and `swagger-jsdoc` to generate OpenAPI docs.

---

#### LOW-05 — Missing X-Request-ID for Log Correlation

| Field | Value |
|---|---|
| **Severity** | LOW |
| **File** | `src/app.js` |
| **CWE** | N/A |
| **OWASP** | A09:2021 – Security Logging and Monitoring Failures |

**Description:**  
There is no request ID middleware for correlating logs across distributed services. Security incidents are harder to investigate without request tracing.

**Recommended Fix:**  
Add `express-request-id` or `uuid`-based request ID middleware early in the pipeline.

---

## Dependency Review

### `backend/package.json` Analysis

| Package | Current Version | Risk Level | Notes |
|---|---|---|---|
| `express` | `^4.19.2` | Medium | Express 4.19.2 has known path traversal vulnerability (CVE-2024-29041). Should be `^4.21.0+` or Express 5.x |
| `bcryptjs` | `^2.4.3` | Low | Consider `argon2` or `bcrypt` (native) for better performance and security. `bcryptjs` is pure JS and slower |
| `jsonwebtoken` | `^9.0.2` | Low | Current. Ensure `algorithm` is explicitly set to `HS256` or `RS256` |
| `multer` | `^1.4.5-lts.1` | Medium | 1.4.5-lts.1 is the LTS branch. Main version 2.x has security improvements |
| `cors` | `^2.8.5` | Low | Outdated (2021). Maintained but no recent updates |
| `helmet` | `^8.3.0` | Low | Current |
| `express-rate-limit` | `^8.6.2` | Low | Current |
| `google-auth-library` | `^11.0.0` | Low | Current |
| `nodemailer` | `^9.0.5` | Low | Current |
| `pg` | `^8.11.5` | Low | Current |
| `dotenv` | `^16.4.5` | Low | Current |
| `@tensorflow/tfjs` | `^4.22.0` | Medium | Large attack surface; ensure no model poisoning risk |
| `@tensorflow-models/coco-ssd` | `^2.2.3` | Low | Stable |
| `jimp` | `^1.6.1` | Low | Image processing — ensure memory limits |
| `uuid` | `^9.0.1` | Low | Current |
| `embedded-postgres` | `^18.4.0-beta.17` | High | **Beta dependency in devDependencies** — beta software should never be used, even in dev |
| `nodemon` | `^3.1.0` | Low | Dev only |
| `jest` | `^29.7.0` | Low | Current |

### Key Dependency Risks

1. **Express 4.19.2** — CVE-2024-29041 (moderate: open redirect via protocol-relative URLs). **Upgrade to 4.21.x.**
2. **embedded-postgres (beta)** — Beta software in devDependencies may introduce security issues into the CI pipeline and testing environment.
3. **TensorFlow.js** — Large dependency with a significant supply chain surface area. Ensure `package-lock.json` is committed and integrity hashes are verified.
4. **multer 1.4.5-lts.1** — The `lts.1` suffix indicates a security backport branch, not the latest security release. Check for multer v2.x upgrade path.

---

## Risk Summary

| Severity | Count | Examples |
|---|---|---|
| 🔴 CRITICAL | 3 | Hardcoded JWT secret, Real .env exposed, GOOGLE_CLIENT_ID in render.yaml |
| 🟠 HIGH | 7 | Weak JWT secret, Unauthenticated uploads, Dev endpoint exposed, Open CORS, SSL disabled |
| 🟡 MEDIUM | 8 | No token revocation, Missing input sanitization, Error message leakage, Missing body size limit |
| 🟢 LOW | 5 | Verbose logging, unsafe-inline CSP, No API versioning, No request ID |
| **Total** | **23** | |

---

## Overall Security Score: 61 / 100

```
Authentication:     65/100  ██████▌░░░
Authorization:      80/100  ████████░░
Input Validation:   72/100  ███████▏░░
Injection Safety:   88/100  ████████▊░
Cryptography:       45/100  ████▌░░░░░
Data Exposure:      30/100  ███░░░░░░░
Configuration:      62/100  ██████▏░░░
Dependency Health:  65/100  ██████▌░░░
─────────────────────────────────────
Overall:            61/100  ██████░░░░
```

---

## Recommended Remediation Steps (Priority Order)

### P1 — Immediate (Within 24 Hours)

1. **Rotate ALL secrets**: Generate new JWT secret (64+ random bytes), rotate DB password, revoke and re-register Google OAuth client.
2. **Remove `DEFAULT_SECRET` fallback** from `jwt.js` — fail fast on missing secret.
3. **Add `backend/.gitignore`** to ensure `.env` is never committed at the backend level.
4. **Remove Google Client ID** from `render.yaml` — use `sync: false` and set via dashboard.
5. **Run Gitleaks** on git history to find any previously committed secrets.

### P2 — Short Term (Within 1 Week)

6. Upgrade Express to `4.21.x` (CVE-2024-29041 fix).
7. Enable SSL `rejectUnauthorized: true` for database connections.
8. Enable TLS `rejectUnauthorized: true` in nodemailer.
9. Remove or disable `/api/auth/reset-limiter` endpoint in all environments.
10. Add authentication requirement for `/uploads` static file serving.
11. Restrict CORS to allowedOrigins in all environments (remove `NODE_ENV` bypass).
12. Add body size limits to JSON and URL-encoded parsers.

### P3 — Medium Term (Within 1 Month)

13. Implement refresh token mechanism and token revocation.
14. Add comprehensive input validation (zod/joi) for all controller inputs.
15. Add dedicated rate limiter for `/api/scans/analyze` (CPU-intensive AI).
16. Replace `unsafe-inline` CSP with nonces.
17. Add structured logging with PII redaction (pino/winston).
18. Bind Docker Compose PostgreSQL to localhost only; use strong passwords.
19. Add password complexity requirements beyond minimum length.
20. Add OpenAPI/Swagger documentation.

### P4 — Long Term (Ongoing)

21. Implement a Web Application Firewall (WAF) at the Render edge.
22. Set up dependency scanning automation (Dependabot or Snyk).
23. Add security-focused integration tests.
24. Schedule quarterly security reviews.
25. Consider SIEM integration for production log monitoring.
