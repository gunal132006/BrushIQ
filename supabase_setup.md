# Supabase PostgreSQL Database Setup

This document describes how to configure your PostgreSQL database on Supabase and run the schema setup query.

---

## 1. Setup a Supabase Database
1. Sign in to [Supabase](https://supabase.com).
2. Click **New Project** and select your organization.
3. Configure the project parameters:
   * **Name**: `BrushIQ Database`
   * **Database Password**: Set a strong password (you will need this for the `DB_PASSWORD` env variable).
   * **Region**: Choose a region close to your target audience.
4. Click **Create new project**. Wait a few minutes for the database to provision.

---

## 2. Obtain Connection Parameters
Once the project is ready:
1. Go to **Project Settings** (gear icon) > **Database**.
2. Scroll to the **Connection parameters** section.
3. Copy the values for:
   * **Host**: (e.g. `db.xxxx.supabase.co`) -> Use for `DB_HOST`
   * **Port**: `5432` -> Use for `DB_PORT`
   * **User**: `postgres` -> Use for `DB_USER`
   * **Database name**: `postgres` -> Use for `DB_DATABASE`

---

## 3. Populate Database Schema
1. On the left navigation bar, click on **SQL Editor** (terminal icon).
2. Click **New query**.
3. Open the file [schema.sql](file:///d:/BrushIQ/backend/src/db/schema.sql) in your editor and copy its entire text.
4. Paste the SQL query into the Supabase SQL editor:
   ```sql
   -- Create tables for users, family members, toothbrushes, scans, reminders, and tips...
   ```
5. Click **Run**. Verify the query completes successfully with `Success. No rows returned`.
6. Navigate to **Table Editor** (grid icon) to confirm all tables (`users`, `family_members`, `toothbrushes`, `scans`, `reminders`, `tips`) have been created successfully.
