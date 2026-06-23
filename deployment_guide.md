# BrushIQ Production Deployment Guide

This guide describes how to deploy the BrushIQ backend service and PostgreSQL database to the cloud, configure the Android app for production, and verify the deployment.

---

## 1. Prerequisites
* A [GitHub](https://github.com) account.
* A [Render](https://render.com) account.
* A [Supabase](https://supabase.com) account.
* Android Studio (or command line) to compile the release APK.

---

## 2. Step-by-Step Deployment Flow

### Step 1: Database Migration (Supabase)
See details in [supabase_setup.md](file:///d:/BrushIQ/supabase_setup.md).
1. Create a Supabase project and get the database host, user, port, name, and password.
2. Open the SQL Editor in Supabase.
3. Copy the contents of the database schema from [schema.sql](file:///d:/BrushIQ/backend/src/db/schema.sql) and execute the query to set up the database tables.

### Step 2: Backend Hosting (Render)
See details in [render_setup.md](file:///d:/BrushIQ/render_setup.md).
1. Push the `backend` folder of the project to a private GitHub repository.
2. In Render, select **New +** > **Blueprint** (or **Web Service**).
3. Connect your GitHub repository.
4. If using Blueprint, Render will read the environment variables and structure automatically from [render.yaml](file:///d:/BrushIQ/backend/render.yaml). Fill in your Supabase connection parameters and submit.
5. Wait for the service to build and deploy. Copy the deployed Web Service HTTPS URL (e.g. `https://brushiq-backend.onrender.com`).

### Step 3: Android App Production Configuration
1. Clean the project and open [build.gradle.kts](file:///d:/BrushIQ/android/app/build.gradle.kts).
2. Ensure your `PROD_BASE_URL` inside `buildConfigField` matches your Render URL exactly:
   ```kotlin
   buildConfigField("String", "PROD_BASE_URL", "\"https://your-app-name.onrender.com/api/\"")
   ```
3. Sync Gradle and verify that cleartext HTTP traffic is blocked in production by inspecting [AndroidManifest.xml](file:///d:/BrushIQ/android/app/src/main/AndroidManifest.xml) (which references [network_security_config.xml](file:///d:/BrushIQ/android/app/src/main/res/xml/network_security_config.xml)).

---

## 3. Building the Release APK
To compile the production APK:
1. Open PowerShell in `d:\BrushIQ\android`.
2. Run the Gradle build command:
   ```powershell
   .\gradlew.bat assembleRelease
   ```
3. The compiled APK will be generated at:
   `d:\BrushIQ\android\app\build\outputs\apk\release\app-release-unsigned.apk` (or signed if you configure signing keys).

---

## 4. Verification Check
After cloud deployment, test the following flows on the production APK:
1. **Registration**: Create a new account using Email and Password.
2. **Login**: Authenticate using your new credentials.
3. **Google Sign-In**: Choose a Google account. Verify Firebase handles authentication and syncs the new user to your Supabase `users` database table successfully.
4. **Bristle Scan**: Take a toothbrush photo, upload it, and check if Jimp-based pixel analysis completes successfully and displays the wear percentage and AI advice.
5. **Dashboard & Family**: Add a family member and ensure their toothbrush logs appear correctly on the home dashboard.
