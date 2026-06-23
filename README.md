# BrushIQ - AI-Powered Oral Healthcare Platform

BrushIQ is an advanced web and mobile application that uses computer vision metrics to analyze toothbrush bristle wear, compute a health score, calculate remaining toothbrush lifespan, and recommend timely replacements.

## Repository Structure

* `/backend` - Node.js Express REST API using PostgreSQL. Includes the image wear-analysis heuristic engine.
* `/frontend` - React single-page application built with Vite and styled with Tailwind CSS.
* `/android` - Android Kotlin Jetpack Compose client app implementing MVVM architecture.

## Getting Started

### Database Configuration

To boot the PostgreSQL server:

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (User: `postgres`, Password: `postgrespassword`, DB: `brushiq`)
- **Adminer** (DB Client viewer) on `http://localhost:8080`

### Tech Stack Details

* **Backend**: Node.js, Express, `pg` client, JWT auth, Multer for upload.
* **Frontend**: React 18, Vite, React Router, Tailwind CSS, Axios.
* **Android**: Kotlin 1.9, Jetpack Compose, Retrofit, Room DB, Hilt, CameraX.
