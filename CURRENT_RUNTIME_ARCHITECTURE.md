# Current Runtime Architecture Audit & Failure Analysis

## Architectural Blueprint

```
                      ┌────────────────────────┐
                      │   SUPABASE POSTGRESQL  │
                      └───────────▲────────────┘
                                  │
                                  │ (pg connection pool)
                                  │
                      ┌───────────┴────────────┐
                      │     Node.js Backend    │
                      │   (Express + REST API) │
                      └───────▲────────▲───────┘
                              │        │
             Authorization:   │        │ Authorization:
             Bearer <JWT>     │        │ Bearer <JWT>
                              │        │
                     ┌────────┴─┐    ┌─┴────────────┐
                     │   WEB    │    │   ANDROID    │
                     │ (Vercel) │    │(Pixel 7 APK) │
                     └──────────┘    └──────────────┘
```

---

## Current Platform Implementations

### 1. Web Application (`frontend/`)
- **Framework**: React 19 + Vite, Tailwind CSS v4, Lucide React, Axios.
- **Base URL**: `VITE_API_URL` environment variable (defaults to `https://brushiq-backend.onrender.com/api` or `http://localhost:5000/api` locally).
- **Authentication**: JWT token saved in `localStorage['brushiq_token']`, injected via `api.interceptors.request`.
- **Dashboard**: `Dashboard.jsx` fetches `dashboardService.getStats()` and `reminderService.getReminders()` via `Promise.all`.

### 2. Android Application (`android/`)
- **Framework**: Jetpack Compose, Kotlin, Hilt DI, Retrofit 2, OkHttp 4, Google Credential Manager (Google ID Token).
- **Base URL**: Defined in `build.gradle.kts` as `BuildConfig.DEV_BASE_URL` / `PROD_BASE_URL` (`https://brushiq-backend.onrender.com/api/`).
- **Auth Flow**: Credential Manager retrieves Google ID token -> `POST /api/auth/google` -> Backend validates via `google-auth-library` (`verifyIdToken`).

### 3. Backend Service (`backend/`)
- **Framework**: Express.js, `pg` (node-postgres), `jsonwebtoken`, `bcryptjs`, `google-auth-library`.
- **Database Module**: `backend/src/config/db.js`.
- **Auth Middleware**: `backend/src/middlewares/auth.js` verifies JWT secret (`JWT_SECRET`).

---

## Failure Root Causes & Architectural Discrepancies

### Failure 1: Web Dashboard Failure ("Could not retrieve dashboard metrics")
- **Observed Behavior**: Web login succeeds as `mahesh`, but Dashboard displays "Could not retrieve dashboard metrics". Profiles=0, Brushes=0, Avg Health=100%, Alerts=0, Recent Activity=No scans recorded yet.
- **Root Cause**:
  1. `backend/src/config/db.js` attempts initial connection (`SELECT 1`). If the connection string or PostgreSQL pool fails to initialize, `pgConnected` becomes `false`.
  2. When `pgConnected` is `false`, `db.js` diverts queries to `executeEmbeddedQuery()` backed by `embedded_store.json`.
  3. `executeEmbeddedQuery()` returns mock/default values (e.g. `avg_health = 100.0`, empty arrays for new users).
  4. If query parameters or DTO fields fail during fallback or database execution, `dashboardController.js` throws a 500 error, causing `Dashboard.jsx` `Promise.all` to fail into the `setError('Could not retrieve dashboard metrics')` state.

### Failure 2: Android Google Login Network Error (503)
- **Observed Behavior**: Android email/password UI loads, but clicking "Continue with Google" returns "Network error (503)".
- **Root Cause**:
  1. In `backend/src/controllers/authController.js` (`googleLogin`), Step 2 explicitly checks:
     ```javascript
     if (!db.isPgConnected()) {
       return res.status(503).json({ message: 'PostgreSQL database service unavailable' });
     }
     ```
  2. Because `db.isPgConnected()` was returning `false` (due to PostgreSQL connection issues at startup), every Google authentication attempt returned HTTP 503!

### Failure 3: Fallback & Embedded Database Violation
- **Current Defect**: `backend/src/config/db.js` contains a 700+ line embedded JSON SQL simulator (`executeEmbeddedQuery` + `embedded_store.json`).
- **Violation**: Violates single-source-of-truth requirement. Production Web and Android must use PostgreSQL strictly. Fallbacks to local files create split-brain data state.

### Failure 4: Desktop Landscape Responsive Optimization Needed
- **Current Defect**: Web UI layout in `Dashboard.jsx` and main container uses fixed narrow mobile widths (`grid-cols-2`, constrained max-w), wasting desktop screen real estate on 1200px+ landscape monitors.

---

## Action Plan Summary

1. **Mandatory PostgreSQL Strict Mode**: Remove `embedded_store.json` fallback logic. Enforce hard failure on backend startup (`SELECT 1`) if PostgreSQL is unavailable, terminating with `[FATAL DATABASE ERROR]`.
2. **PostgreSQL Supabase Connection**: Ensure backend correctly connects to Supabase PostgreSQL using valid credentials (`DATABASE_URL` / `DB_HOST` / `DB_USER` / `DB_PASSWORD`).
3. **API & DTO Contract Synchronization**: Ensure Web TypeScript/JS and Android Kotlin DTOs match the backend response contracts identically.
4. **Fix Google Login**: Ensure `GOOGLE_CLIENT_ID` is set and valid, verify Google ID tokens via `google-auth-library`, perform account linking/creation in PostgreSQL, return standard JWT tokens, and map HTTP status codes properly (400/401/409/500).
5. **Landscape Desktop Layout**: Refactor Web dashboard and navigation to fill desktop width seamlessly while keeping mobile responsive integrity.
6. **Automated & End-to-End Verification**: Rebuild fresh Android APK (`app-debug.apk`), run backend tests, web build, Android tests, Selenium E2E, Appium, and generate clean verification reports.
