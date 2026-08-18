-- ==============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Creates initial schema for BuildCost platform
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_text VARCHAR(255) NOT NULL,
    region_code VARCHAR(50) NOT NULL,
    land_size_sqft NUMERIC(12, 2) NOT NULL,
    zoning_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_region_code ON projects(region_code);

-- 3. Land Details Table
CREATE TABLE IF NOT EXISTS land_details (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    topography VARCHAR(100) NOT NULL,
    soil_type VARCHAR(100) NOT NULL,
    utilities_status VARCHAR(100) NOT NULL,
    has_access_road BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_land_details_project_id ON land_details(project_id);

-- 4. Build Specs Table
CREATE TABLE IF NOT EXISTS build_specs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    build_type VARCHAR(100) NOT NULL,
    floors INTEGER NOT NULL DEFAULT 1,
    total_sqft NUMERIC(12, 2) NOT NULL,
    material_tier VARCHAR(50) NOT NULL,
    timeline_months INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_build_specs_project_id ON build_specs(project_id);

-- 5. Cost Rates Table (Deterministic Baseline Data Table)
CREATE TABLE IF NOT EXISTS cost_rates (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'sqft',
    unit_cost NUMERIC(12, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cost_rates_region_category UNIQUE (region_code, category)
);

CREATE INDEX IF NOT EXISTS idx_cost_rates_lookup ON cost_rates(region_code, category);

-- 6. Estimate Source Type Enum
DO $$ BEGIN
    CREATE TYPE estimate_source_type AS ENUM ('rate_table', 'ai_adjusted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Estimates Table (Itemized breakdown)
CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    category VARCHAR(100) NOT NULL,
    estimated_cost NUMERIC(14, 2) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    source estimate_source_type NOT NULL DEFAULT 'rate_table',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estimates_project_version ON estimates(project_id, version_number);

-- 8. Estimate Summaries Table
CREATE TABLE IF NOT EXISTS estimate_summaries (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    total_low NUMERIC(14, 2) NOT NULL,
    total_expected NUMERIC(14, 2) NOT NULL,
    total_high NUMERIC(14, 2) NOT NULL,
    ai_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_summary_project_version UNIQUE (project_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_estimate_summaries_project_id ON estimate_summaries(project_id);
