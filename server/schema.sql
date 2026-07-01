-- LinkHub Supabase/PostgreSQL Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  recovery_code VARCHAR(6) UNIQUE NOT NULL,
  theme_preference VARCHAR(10) NOT NULL DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast recovery code authentication
CREATE INDEX IF NOT EXISTS idx_users_recovery_code ON users(recovery_code);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  project_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) NOT NULL DEFAULT 'indigo',
  archived_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for listing user projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 3. Links Table
CREATE TABLE IF NOT EXISTS links (
  link_id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'other',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fetching links under projects
CREATE INDEX IF NOT EXISTS idx_links_project_id ON links(project_id);
