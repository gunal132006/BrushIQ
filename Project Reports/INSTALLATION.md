# BrushIQ — Local Installation & Environment Setup Guide

This guide provides step-by-step instructions to set up, build, and run the BrushIQ platform locally.

---

## 1. System Requirements

- **Node.js**: v18.x or v20.x (LTS recommended)
- **npm**: v9.x or v10.x
- **Git**: v2.x
- **PostgreSQL** (Optional): v14+ (Local installation or Supabase cloud DB connection string). If unavailable, BrushIQ automatically engages its High-Availability embedded SQL engine.

---

## 2. Repository Cloning & Project Structure

```bash
git clone https://github.com/gunal132006/BrushIQ.git
cd BrushIQ
```

---

## 3. Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure the following fields in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=supersecretbrushiqjwttoken_change_in_production_32bytes
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgrespassword
   DB_DATABASE=brushiq
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```
4. Initialize the database schema:
   ```bash
   npm run db:init
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will be live at `http://localhost:5000`.

---

## 4. Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Create `.env.local` in `frontend/`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the frontend Vite dev server:
   ```bash
   npm run dev
   ```
   The application web interface will be accessible at `http://localhost:5173`.

---

## 5. Running Automated Test Suites

- **Backend Unit & Integration Tests**:
  ```bash
  cd backend && npm test
  ```
- **Performance Load Tests (k6)**:
  ```bash
  cd performance-tests && npm test:baseline
  ```
- **Selenium Web Tests**:
  ```bash
  cd selenium-tests && npm test
  ```
