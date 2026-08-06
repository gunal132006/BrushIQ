# BrushIQ — REST API Reference Documentation

**Base URL (Production):** `https://brushiq-backend.onrender.com/api`  
**Base URL (Local):** `http://localhost:5000/api`  
**Authentication Scheme:** Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)  

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Access:** Public (Rate Limited: 10 req/15 min)
- **Request Body:**
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-v4-string",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "createdAt": "2026-08-06T08:00:00.000Z"
    }
  }
  ```

### 1.2 Login User
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Access:** Public (Rate Limited: 10 req/15 min)
- **Request Body:**
  ```json
  {
    "username": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```

### 1.3 Google Sign-In
- **Method:** `POST`
- **Path:** `/api/auth/google`
- **Access:** Public (Rate Limited: 10 req/15 min)
- **Request Body:**
  ```json
  {
    "idToken": "google-oauth2-id-token-string"
  }
  ```

---

## 2. Family Profile Endpoints (`/api/family`)

### 2.1 Get Family Members
- **Method:** `GET`
- **Path:** `/api/family`
- **Access:** Private (`Bearer Token`)

### 2.2 Add Family Member
- **Method:** `POST`
- **Path:** `/api/family`
- **Access:** Private
- **Request Body:**
  ```json
  {
    "name": "Tommy Doe",
    "age": 8,
    "gender": "Male",
    "relationship": "Child"
  }
  ```

---

## 3. AI Toothbrush Scan Endpoints (`/api/scans`)

### 3.1 Analyze Toothbrush Image
- **Method:** `POST`
- **Path:** `/api/scans/analyze`
- **Access:** Private (`Bearer Token`)
- **Content-Type:** `multipart/form-data`
- **Form Data:** `image`: (File buffer: `.jpg`, `.png`, `.webp`, max 5MB)
- **Response (200 OK):**
  ```json
  {
    "imageUrl": "/uploads/scan-1723456789-12345.jpg",
    "healthScore": 92.5,
    "wearPercentage": 7.5,
    "condition": "Good",
    "remainingLifeDays": 78,
    "confidenceScore": 94.2,
    "bristleSpreading": 5.2,
    "bristleBending": 4.1,
    "bristleDamage": 3.0,
    "aiRecommendation": "Your bristle condition is in good shape. Continue brushing 2x daily."
  }
  ```

---

## 4. Toothbrush & Reminder Endpoints

- `GET /api/toothbrushes` — Fetch registered toothbrushes.
- `POST /api/toothbrushes` — Register a new toothbrush.
- `GET /api/reminders` — Get active toothbrush replacement reminders.
- `GET /api/tips` — Fetch dental hygiene educational tips.
- `GET /api/dashboard` — Get aggregated health score & fleet metrics.
- `GET /api/system/database-status` — Diagnostic database connection state (Protected).
