# BrushIQ — Production Deployment Guide

This guide details the production deployment process for the BrushIQ platform across Vercel (Frontend), Render (Backend API), Supabase (PostgreSQL), and GitHub Actions (CI/CD).

---

## 1. Database Setup (Supabase / Managed PostgreSQL)

1. Create a project at [Supabase.com](https://supabase.com).
2. Navigate to **Project Settings -> Database** and copy the Connection String (`postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`).
3. Execute table creation scripts found in `backend/src/db/init.js` in Supabase SQL Editor.

---

## 2. Backend Deployment (Render.com)

1. Connect your GitHub repository (`gunal132006/BrushIQ`) to **Render.com**.
2. Create a new **Web Service**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Configure Environment Variables in Render Service Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `JWT_SECRET`: Generate a 64-character random string (`openssl rand -hex 32`)
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `ALLOWED_ORIGINS`: `https://brush-iq.vercel.app`
   - `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Web Client ID
4. Deploy the service. Once built, the backend live API URL will be:  
   `https://brushiq-backend.onrender.com`

---

## 3. Frontend Deployment (Vercel)

1. Import repository into **Vercel**.
2. Set Root Directory to `frontend`.
3. Framework Preset: **Vite**.
4. Configure Environment Variables:
   - `VITE_API_BASE_URL`: `https://brushiq-backend.onrender.com/api`
5. Click **Deploy**. Vercel will build the frontend and issue an SSL HTTPS domain:  
   `https://brush-iq.vercel.app`

---

## 4. Continuous Integration & Deployment (GitHub Actions)

The repository includes pre-configured GitHub Actions workflows in `.github/workflows/`:
- `master-ci.yml`: Runs on every push to `main` branch.
- `security-review.yml`: Executes SAST, Semgrep, Trivy, and CodeQL.
- `performance.yml`: Executes k6 baseline performance tests.
- `selenium.yml`: Runs end-to-end browser automation tests.
- `appium.yml`: Runs mobile automation tests.

All workflow execution artifacts (reports, spreadsheets, screenshots) are automatically archived in GitHub Actions run outputs.
