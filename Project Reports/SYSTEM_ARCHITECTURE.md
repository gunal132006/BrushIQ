# BrushIQ — System Architecture & Design Document

**Application Title:** BrushIQ — AI-Powered Oral Healthcare Platform  
**System Architecture Pattern:** Decoupled Client-Server / RESTful Microservices Architecture  

---

## 1. High-Level System Architecture Diagram

```
                 ┌─────────────────────────────────────────────────┐
                 │                 CLIENT LAYER                    │
                 │  ┌───────────────────────┐ ┌─────────────────┐  │
                 │  │  Vite React Web App   │ │ Android Native  │  │
                 │  │ (https://brush-iq...) │ │   Mobile App    │  │
                 │  └───────────┬───────────┘ └────────┬────────┘  │
                 └──────────────┼──────────────────────┼───────────┘
                                │ HTTPS / REST API     │
                                ▼                      ▼
                 ┌─────────────────────────────────────────────────┐
                 │               SECURITY & REVERSE PROXY          │
                 │       (Helmet, Rate Limiter, CORS Whitelist)    │
                 └──────────────────────┬──────────────────────────┘
                                        │
                                        ▼
                 ┌─────────────────────────────────────────────────┐
                 │                EXPRESS API SERVER               │
                 │  ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
                 │  │ Auth Module  │ │ Scans Module │ │ Family  │ │
                 │  └──────────────┘ └──────┬───────┘ └─────────┘ │
                 └──────────────────────────┼──────────────────────┘
                                            │
                                            ▼
                 ┌─────────────────────────────────────────────────┐
                 │          AI COMPUTER VISION ENGINE              │
                 │    (Bristle Spreading, Fraying & Density)       │
                 └──────────────────────────┬──────────────────────┘
                                            │
                                            ▼
                 ┌─────────────────────────────────────────────────┐
                 │                 PERSISTENCE LAYER               │
                 │   Supabase PostgreSQL <---> HA Embedded Engine    │
                 └─────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Breakdown

- **Frontend Web**: React, JavaScript (ES6+), Vite, Vanilla CSS Design System.
- **Mobile Native**: Android SDK, Java/Kotlin, UIAutomator2.
- **Backend API**: Node.js v20, Express v4, Multer, Helmet, `express-rate-limit`.
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Google OAuth 2.0 (`google-auth-library`).
- **Computer Vision / AI**: Custom Image Analyzer Service (`jimp` pixel processing & feature extraction).
- **Database Layer**: PostgreSQL (`pg`) with Supabase cloud connection & HA Embedded JSON fallback.
- **Testing & CI/CD**: Jest, Supertest, Selenium WebDriver, Appium, k6, GitHub Actions.
