# Render Cloud Hosting Setup

This document describes how to deploy the BrushIQ backend service on Render using the blueprint dashboard.

---

## 1. Blueprint Deployment (Recommended)
We have included a `render.yaml` configuration in the backend folder. This automates the setup.

1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top right corner and choose **Blueprint**.
3. Connect your GitHub repository.
4. Render will parse the `render.yaml` file. Provide names and values for the variables:
   * **Service Name**: `brushiq-backend`
   * **DEMO_MODE**: `false` (forces server to use the PostgreSQL DB instead of JSON)
   * **DB_HOST**: Your Supabase database host URL
   * **DB_PASSWORD**: Your Supabase database master password
   * **JWT_SECRET**: (Will be auto-generated securely by Render if left empty)
5. Click **Apply**. Render will automatically spin up the web service.

---

## 2. Manual Web Service Configuration
If you prefer setting up the web service manually:

1. Click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   * **Name**: `brushiq-backend`
   * **Language**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. Expand the **Advanced** section and add the following Environment Variables:
   * `PORT` = `5000`
   * `NODE_ENV` = `production`
   * `DEMO_MODE` = `false`
   * `JWT_SECRET` = (Generate a secure cryptographically random string)
   * `DB_HOST` = (Your database host)
   * `DB_PORT` = `5432`
   * `DB_USER` = `postgres`
   * `DB_PASSWORD` = (Your database password)
   * `DB_DATABASE` = `postgres`
5. Click **Deploy Web Service**.

---

## 3. Post-Deployment Verification
Once the service shows `Live`, open the logs tab. You should see:
```text
SERVER STARTING
SERVER LISTENING ON PORT 5000
=============================================
   BrushIQ Rest API Service Booted Successful
=============================================
```
To check health, visit: `https://<your-render-app-url>/api/health` in your browser. It should return `{"status":"UP"}`.
