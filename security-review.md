# BrushIQ Backend — Comprehensive Secure Code Review

> **Review Type:** Static Application Security Testing (SAST) — Defensive Security Review  
> **Date:** 2026-08-08  
> **Reviewer:** Antigravity AI Code Security Reviewer  
> **Scope:** `backend/` — all source files, configurations, and dependencies  
> **Framework:** Node.js + Express.js  
> **Overall Security Score: 52 / 100 — MODERATE RISK**

---

## Executive Summary

BrushIQ is an AI-powered oral healthcare platform with a Node.js/Express REST API backend that connects to PostgreSQL (Supabase) and falls back to a local embedded JSON store. The application demonstrates **several strong security controls** including consistent use of parameterized queries (no SQL injection risk), correct bcrypt password hashing, and robust resource-ownership enforcement across all CRUD operations via SQL JOIN checks.

However, **3 CRITICAL findings** were identified that must be resolved before any production deployment:

1. **JWT secret and database credentials are committed to the repository** in plain text (`.env` file).  
2. **Google OAuth Client ID is committed** to both `.env` and `render.yaml`.  
3. **Database credentials are hardcoded** in both `.env` and `docker-compose.yml`.

These issues alone make the current codebase **not safe for production** in its current state.

### Score Breakdown

| Domain | Score | Rating |
|--------|-------|--------|
| Authentication | 55/100 | Moderate |
| Authorization | 80/100 | Good |
| Input Validation | 50/100 | Moderate |
| Injection Prevention | 90/100 | Excellent |
| Cryptography & Secrets | 10/100 | Critical |
| Sensitive Data Handling | 40/100 | Poor |
| Configuration & Headers | 50/100 | Moderate |
| Dependency Management | 65/100 | Moderate |
| Business Logic | 55/100 | Moderate |

---

## Phase 1 — Backend Inventory

| Component | Details |
|-----------|---------|
| **Framework** | Node.js + Express.js v4.19.2 |
| **Language** | JavaScript (ES2020, CommonJS modules) |
| **API Architecture** | RESTful JSON API |
| **Authentication** | JWT (`jsonwebtoken ^9.0.2`) + Google OAuth2 (`google-auth-library ^11.0.0`) |
| **Authorization Model** | User-scoped resource ownership enforced via SQL JOIN checks on every mutation |
| **Database** | PostgreSQL 15 (primary) + Embedded JSON fallback (`embedded_store.json`) |
| **ORM / Query Builder** | Raw parameterized SQL via `pg ^8.11.5` — no ORM |
| **API Documentation** | **None** — no Swagger/OpenAPI or GraphQL schema detected |
| **Middleware** | CORS, JSON body parser, custom JWT auth middleware, express.static |
| **File Upload** | `multer ^1.4.5-lts.1` — image uploads to `/uploads/`, 5 MB limit, MIME filter |
| **Session Handling** | Stateless JWT (7-day expiry, stored client-side — no server-side revocation) |
| **Image Processing** | `jimp ^1.6.1` — AI bristle-wear analysis via pixel processing |
| **Third-Party Integrations** | Google OAuth2, Supabase/PostgreSQL, Render.com (deployment) |
| **Deployment** | Render.com (Node web service), Docker Compose (local dev) |

---

## Phase 2 — API Endpoint Inventory

| Endpoint | Method | Auth Required | Roles | Controller |
|----------|--------|:---:|-------|------------|
| `/api/auth/register` | POST | No | Public | `authController.register` |
| `/api/auth/login` | POST | No | Public | `authController.login` |
| `/api/auth/google` | POST | No | Public | `authController.googleLogin` |
| `/api/auth/forgot-password` | POST | No | Public | `authController.forgotPassword` |
| `/api/auth/change-password` | POST | **Yes** | Authenticated | `authController.changePassword` |
| `/api/auth/me` | GET | **Yes** | Authenticated | `authController.getMe` |
| `/api/family` | GET | **Yes** | Authenticated | `familyController.getFamilyMembers` |
| `/api/family` | POST | **Yes** | Authenticated | `familyController.addFamilyMember` |
| `/api/family/:id` | PUT | **Yes** | Authenticated | `familyController.updateFamilyMember` |
| `/api/family/:id` | DELETE | **Yes** | Authenticated | `familyController.deleteFamilyMember` |
| `/api/toothbrushes` | GET | **Yes** | Authenticated | `toothbrushController.getToothbrushes` |
| `/api/toothbrushes` | POST | **Yes** | Authenticated | `toothbrushController.addToothbrush` |
| `/api/toothbrushes/:id` | PUT | **Yes** | Authenticated | `toothbrushController.updateToothbrush` |
| `/api/toothbrushes/:id` | DELETE | **Yes** | Authenticated | `toothbrushController.deleteToothbrush` |
| `/api/scans/analyze` | POST | **Yes** | Authenticated | `scanController.analyzeScan` (multipart) |
| `/api/scans` | POST | **Yes** | Authenticated | `scanController.saveScan` |
| `/api/scans` | GET | **Yes** | Authenticated | `scanController.getScansHistory` |
| `/api/scans/:id` | GET | **Yes** | Authenticated | `scanController.getScanById` |
| `/api/reminders` | GET | **Yes** | Authenticated | `reminderController.getReminders` |
| `/api/reminders` | POST | **Yes** | Authenticated | `reminderController.createReminder` |
| `/api/reminders/:id/complete` | PATCH | **Yes** | Authenticated | `reminderController.completeReminder` |
| `/api/tips` | GET | **Yes** | Authenticated | `tipController.getTips` |
| `/api/tips/personalized` | GET | **Yes** | Authenticated | `tipController.getPersonalizedTips` |
| `/api/dashboard` | GET | **Yes** | Authenticated | `dashboardController.getDashboardData` |
| `/api/system/database-status` | GET | No | **Public** ⚠️ | `routes/system.js` inline |
| `/health` | GET | No | Public | `app.js` inline |
| `/api/health` | GET | No | Public | `app.js` inline |
| `/` | GET | No | Public | `app.js` inline |
| `/uploads/*` | GET | No | **Public** ⚠️ | `express.static` — uploads dir |
| `/illustrations/*` | GET | No | Public | `express.static` — frontend/public |

---

## Phase 3 — Security Findings (SAST)

### CRITICAL Findings

---

#### SEC-001 — Hardcoded JWT Secret in Repository
- **Severity:** CRITICAL  
- **File:** `backend/.env` (L7) · `backend/src/middlewares/auth.js` (L5) · `backend/src/controllers/authController.js` (L6)  
- **Description:** `JWT_SECRET` is set to `supersecretbrushiqjwttoken` in the committed `.env` file. Both `auth.js` and `authController.js` also fall back to this same hardcoded value if the env var is missing.  
- **Why it's a concern:** Any attacker who reads the `.env` file (via repo leak, compromised CI, or path traversal) can sign arbitrary JWTs and impersonate any user indefinitely. The in-code fallback means even a misconfigured deployment is fully exploitable.  
- **Fix:** Rotate the secret. Generate: `openssl rand -base64 32`. Remove `.env` from git history (`git filter-repo`). Add `.env` to `.gitignore`. Never provide code-level fallbacks — throw a fatal error at startup if `JWT_SECRET` is absent.

---

#### SEC-002 — Google OAuth Client ID Committed to Repository
- **Severity:** CRITICAL  
- **File:** `backend/.env` (L8) · `backend/render.yaml` (L28)  
- **Description:** The real Google OAuth2 Client ID (`534843148727-ernb5gqgo6pf1cobmmvjbsl7d4f5026s.apps.googleusercontent.com`) is embedded in both files which are tracked by git.  
- **Why it's a concern:** The Client ID is now public. It enables attackers to craft convincing phishing OAuth flows targeting BrushIQ users, and combined with the JWT secret exposure, enables full account takeover.  
- **Fix:** Remove from all committed files. Use Render's secret environment variable injection. Revoke and rotate the OAuth credential in Google Cloud Console immediately. Add to `.gitignore`.

---

#### SEC-003 — Database Credentials Committed to Repository
- **Severity:** CRITICAL  
- **File:** `backend/.env` (L4–L6) · `docker-compose.yml` (L10)  
- **Description:** `DB_USER=postgres`, `DB_PASSWORD=postgrespassword`, `DB_DATABASE=brushiq` in `.env`. `docker-compose.yml` hardcodes `POSTGRES_PASSWORD=postgrespassword`.  
- **Why it's a concern:** Exposed database credentials enable direct database access if the port is reachable. All user PII and health data would be exposed.  
- **Fix:** Rotate DB credentials immediately. Use Render secret env vars (already `sync: false` for `DB_PASSWORD` — good). Use Docker secrets instead of env vars in compose files for production.

---

### HIGH Findings

---

#### SEC-004 — Weak Fallback JWT Secret in Code
- **Severity:** HIGH  
- **File:** `backend/src/middlewares/auth.js` (L5)  
- **Description:** `const JWT_SECRET = process.env.JWT_SECRET || 'supersecretbrushiqjwttoken';` — if the env var is missing, the app runs with a known weak secret.  
- **Fix:** `if (!process.env.JWT_SECRET) { console.error('FATAL: JWT_SECRET not set'); process.exit(1); }`

---

#### SEC-005 — Weak Minimum Password Length (6 Characters)
- **Severity:** HIGH  
- **File:** `backend/src/controllers/authController.js` (L165, L309)  
- **Description:** Both registration and change-password enforce minimum 6 characters. NIST SP 800-63B recommends minimum 8 characters.  
- **Fix:** Increase to 8–12 characters. Add `zxcvbn`-based password strength check. Implement account lockout after N failed attempts.

---

#### SEC-006 — User Enumeration via Forgot-Password Endpoint
- **Severity:** HIGH  
- **File:** `backend/src/controllers/authController.js` (L289)  
- **Description:** Returns `'User not found'` (HTTP 400) when email/phone does not exist, revealing which accounts are registered.  
- **Fix:** Return a uniform response: `{ message: 'If this account exists, a reset link has been sent.' }` with HTTP 200 regardless.

---

#### SEC-007 — IDOR Risk in Toothbrush Delete Query
- **Severity:** HIGH  
- **File:** `backend/src/controllers/toothbrushController.js` (L125)  
- **Description:** The DELETE query `DELETE FROM toothbrushes WHERE id = $1` does not re-enforce user ownership in the query itself — only a prior check does.  
- **Fix:** `DELETE FROM toothbrushes WHERE id = $1 AND family_member_id IN (SELECT id FROM family_members WHERE user_id = $2)` with `[id, req.user.id]`.

---

#### SEC-008 — CORS Wildcard When `ALLOWED_ORIGINS` Not Set
- **Severity:** HIGH  
- **File:** `backend/src/app.js` (L13)  
- **Description:** `origin: process.env.ALLOWED_ORIGINS ? ... : '*'` — falls back to wildcard, allowing any origin.  
- **Fix:** Remove wildcard fallback. Enforce strict allowlist. Fail startup if `ALLOWED_ORIGINS` is not set in production.

---

#### SEC-009 — Uploaded Files Served Without Authentication
- **Severity:** HIGH  
- **File:** `backend/src/app.js` (L38)  
- **Description:** `/uploads` is served via `express.static` without any auth middleware. Scan images (health data) are publicly accessible by URL.  
- **Fix:** Serve uploads through an authenticated controller. Or move to a private S3/Supabase Storage bucket with signed URLs.

---

#### SEC-010 — Frontend Illustrations Served Without Access Control
- **Severity:** HIGH  
- **File:** `backend/src/app.js` (L41–L44)  
- **Fix:** Ensure the path is non-exploitable. Validate `express.static` uses resolved absolute paths to prevent traversal.

---

#### SEC-011 — SSL Certificate Verification Disabled
- **Severity:** HIGH  
- **File:** `backend/src/config/db.js` (L39, L47–L49)  
- **Description:** `rejectUnauthorized: false` on all SSL database connections — disables certificate validation.  
- **Fix:** `ssl: { rejectUnauthorized: true, ca: fs.readFileSync('supabase-ca.crt') }`. Download the Supabase root CA and reference it properly.

---

### MEDIUM Findings

| ID | Title | File |
|----|-------|------|
| SEC-012 | Client-Controlled Scan Metrics Without Server-Side Range Validation | `scanController.js` |
| SEC-013 | File Upload MIME Type Check Only — No Magic-Byte Validation | `routes/scan.js` |
| SEC-014 | No Length/Type Validation on Family Member Fields | `familyController.js` |
| SEC-015 | Full Error Object Logged (Stack Traces) | `authController.js` |
| SEC-016 | No Rate Limiting on Auth Endpoints | `authController.js` |
| SEC-017 | No Rate Limiting on AI Scan Upload Endpoint | `scanController.js` |
| SEC-018 | No JSON Body Size Limit | `app.js` |
| SEC-019 | Missing Content-Security-Policy (CSP) Header | `app.js` |
| SEC-020 | Missing Strict-Transport-Security (HSTS) Header | `app.js` |
| SEC-021 | Unauthenticated `/api/system/database-status` Endpoint | `routes/system.js` |
| SEC-022 | Embedded SQL Engine Has Loose Ownership Filter (OR Logic Bug) | `config/db.js` (L314–L319) |
| SEC-023 | multer ^1.4.5-lts.1 — Historical DoS Vulnerabilities | `package.json` |
| SEC-024 | express ^4.19.2 — Path Traversal Fix Available in 4.21.x | `package.json` |
| SEC-025 | Embedded JSON Store Contains PII in Plaintext on Disk | `config/db.js` |

### LOW Findings

| ID | Title | File |
|----|-------|------|
| SEC-026 | JWT Expiry 7 Days, No Refresh/Revocation Mechanism | `authController.js` |
| SEC-027 | X-XSS-Protection Header is Deprecated | `app.js` |
| SEC-028 | Server Listens on `0.0.0.0` | `server.js` |
| SEC-029 | PII Logged to Console in Google Login Flow | `authController.js` |
| SEC-030 | No Security npm Scripts (audit, snyk) in package.json | `package.json` |

---

## Phase 4 — Dependency Review

| Package | Version | Risk | Notes |
|---------|---------|------|-------|
| `express` | ^4.19.2 | MEDIUM | Path traversal fix in 4.21.x — upgrade |
| `jsonwebtoken` | ^9.0.2 | LOW | Current stable |
| `bcryptjs` | ^2.4.3 | LOW | Current stable; consider native `bcrypt` |
| `cors` | ^2.8.5 | LOW | Current stable |
| `dotenv` | ^16.4.5 | LOW | Current stable |
| `google-auth-library` | ^11.0.0 | LOW | Keep updated for OAuth patches |
| `jimp` | ^1.6.1 | MEDIUM | Decompression bomb risk — validate image dimensions |
| `multer` | ^1.4.5-lts.1 | MEDIUM | Historical DoS CVEs — audit carefully |
| `pg` | ^8.11.5 | LOW | Minor patch 8.13.x available |
| `uuid` | ^9.0.1 | LOW | Current stable |

---

## Phase 5 — Risk Summary

| Severity | Count | Action |
|----------|-------|--------|
| CRITICAL | 3 | Resolve **before** any production deployment |
| HIGH | 8 | Fix within current sprint |
| MEDIUM | 14 | Schedule and plan for next release |
| LOW | 5 | Best-practice improvements |
| **Total** | **30** | |

### Positive Controls Confirmed
- Parameterized SQL queries throughout — **SQL injection risk is LOW**
- bcrypt with salt factor 10 — correct password hashing
- `x-powered-by` header disabled — no Express fingerprinting
- JWT format validated (Bearer scheme enforced)
- All CRUD operations verify resource ownership via SQL JOINs
- Multer 5 MB file size cap
- Google ID token verified server-side with `verifyIdToken()` and audience check

---

## Phase 6 — GitHub Actions Workflow

See [`.github/workflows/security.yml`](.github/workflows/security.yml) for the generated workflow.

**Tools integrated:**
- **Gitleaks** — secret/credential detection across all commits
- **Semgrep** — SAST with OWASP Top 10, Node.js, JWT, secrets rulesets
- **npm audit** — dependency vulnerability check (fails on moderate+)
- **Trivy** — filesystem CVE scanning (fails on CRITICAL/HIGH)
- Results uploaded to **GitHub Security tab** (SARIF format)
- **GitHub Actions Summary** published on every run

---

## Recommended Remediation Steps

### P0 — Immediate (< 24 hours)
1. Add `backend/.env` and `backend/render.yaml` to `.gitignore`
2. Run `git rm --cached backend/.env` and purge from history with `git filter-repo`
3. Rotate `JWT_SECRET` to a 256-bit random value: `openssl rand -base64 32`
4. Revoke and rotate Google OAuth Client ID in Google Cloud Console
5. Rotate PostgreSQL password in Supabase dashboard
6. Set all secrets as Render environment variables (never in committed files)

### P1 — Short-term (< 1 week)
1. Remove JWT fallback default from `auth.js` and `authController.js`
2. Set strict CORS `ALLOWED_ORIGINS` — remove wildcard fallback
3. Enable `rejectUnauthorized: true` for database SSL with proper CA cert
4. Move `/uploads` behind authentication middleware or signed URLs
5. Add request body size limits: `express.json({ limit: '10kb' })`

### P2 — Medium-term (< 1 month)
1. Increase password minimum length to 8+ characters
2. Fix user enumeration in forgot-password (uniform response)
3. Add `express-rate-limit` to all auth and scan endpoints
4. Add Content-Security-Policy and HSTS headers
5. Add magic-byte file validation with the `file-type` package
6. Add Joi/Zod schema validation for all controller inputs
7. Protect `/api/system/database-status` with auth middleware

### P3 — Ongoing
1. Upgrade `express` to 4.21.x and `multer` to latest
2. Fix embedded SQL engine ownership filter logic (OR → AND)
3. Run `npm audit` on every deployment
4. Restrict `embedded_store.json` file permissions to 600
5. Add PII redaction to all console logging

### P4 — Best-practice Improvements
1. Implement JWT refresh tokens and server-side revocation
2. Remove deprecated `X-XSS-Protection` header; add CSP instead
3. Install `helmet` for managed, up-to-date security headers
4. Add `npm audit` and `semgrep` to pre-commit hooks
5. Add OpenAPI/Swagger documentation for all endpoints
