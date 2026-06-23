-- Enable pg crypto for gen_random_uuid() if not loaded (default in newer pg)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if they exist (for easy resetting)
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS scans;
DROP TABLE IF EXISTS toothbrushes;
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tips;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Family Members Table
CREATE TABLE family_members (
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

-- Toothbrushes Table
CREATE TABLE toothbrushes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., Manual, Electric, Sonic, Kids
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scans Table
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toothbrush_id UUID NOT NULL REFERENCES toothbrushes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    wear_percentage DECIMAL(5,2) NOT NULL,
    health_score DECIMAL(5,2) NOT NULL,
    remaining_life_days INT NOT NULL,
    condition VARCHAR(50) NOT NULL, -- 'Good', 'Moderate Wear', 'Replace Soon', 'Replace Immediately'
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

-- Reminders Table
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    toothbrush_id UUID NOT NULL REFERENCES toothbrushes(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'Daily', 'Every 3 Days', 'Weekly'
    next_reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tips Table
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL, -- 'Dental Hygiene', 'Brushing Techniques', 'Brush Maintenance', 'Kids Oral Care', 'Senior Oral Care', 'AI Personalized Tips'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    illustration_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index optimization
CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_toothbrushes_family ON toothbrushes(family_member_id);
CREATE INDEX idx_scans_toothbrush ON scans(toothbrush_id);
CREATE INDEX idx_reminders_family ON reminders(family_member_id);
CREATE INDEX idx_reminders_brush ON reminders(toothbrush_id);
