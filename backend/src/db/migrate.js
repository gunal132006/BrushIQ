const db = require('../config/db');
const { runSeeding } = require('./seeder');

const initSchemaSql = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(50) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS toothbrushes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toothbrush_id UUID NOT NULL REFERENCES toothbrushes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    wear_percentage DECIMAL(5,2) NOT NULL,
    health_score DECIMAL(5,2) NOT NULL,
    remaining_life_days INT NOT NULL,
    condition VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    bristle_spreading DECIMAL(5,2) NOT NULL,
    bristle_bending DECIMAL(5,2) NOT NULL,
    bristle_damage DECIMAL(5,2) NOT NULL,
    brushing_frequency VARCHAR(50) DEFAULT '2x daily',
    detected_issues TEXT[] NOT NULL DEFAULT '{}',
    ai_recommendation TEXT NOT NULL,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    toothbrush_id UUID NOT NULL REFERENCES toothbrushes(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    next_reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    illustration_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_toothbrushes_family ON toothbrushes(family_member_id);
CREATE INDEX IF NOT EXISTS idx_scans_toothbrush ON scans(toothbrush_id);
CREATE INDEX IF NOT EXISTS idx_reminders_family ON reminders(family_member_id);
CREATE INDEX IF NOT EXISTS idx_reminders_brush ON reminders(toothbrush_id);
`;

async function ensureSchema() {
  try {
    console.log('Ensuring PostgreSQL database schema exists...');
    await db.query(initSchemaSql);
    console.log('PostgreSQL database schema verified.');
    await runSeeding(db);
  } catch (err) {
    console.error('Error verifying database schema:', err.message);
  }
}

module.exports = { ensureSchema };
