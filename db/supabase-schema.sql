-- ============================================================
-- Xiaohongshu Content Generator - Supabase Database Schema
-- ============================================================
-- This schema replaces SQLite with PostgreSQL for production
-- Run this in Supabase SQL Editor after creating your project
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security (RLS)
-- This ensures only authenticated users can access their data

-- ============================================================
-- Users Table
-- Stores user information from Firebase authentication
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================================
-- Jobs Table
-- Stores content generation jobs and their status
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
  video_url TEXT,
  video_id TEXT,
  platform TEXT,
  status TEXT DEFAULT 'CREATED',
  progress INTEGER DEFAULT 0,
  transcript TEXT,
  transcript_raw TEXT,
  output_json JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_user_uid ON jobs(user_uid);
CREATE INDEX IF NOT EXISTS idx_jobs_video_id ON jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);

-- ============================================================
-- Artifacts Table
-- Stores file metadata for downloaded audio, transcripts, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  user_uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'audio', 'transcript', 'cover', etc.
  file_path TEXT,
  file_hash TEXT,
  r2_key TEXT, -- Cloudflare R2 storage key
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artifacts_job_id ON artifacts(job_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_user_uid ON artifacts(user_uid);
CREATE INDEX IF NOT EXISTS idx_artifacts_hash ON artifacts(file_hash);
CREATE INDEX IF NOT EXISTS idx_artifacts_r2_key ON artifacts(r2_key);

-- ============================================================
-- API Keys Table (Optional - for future premium features)
-- Stores user API keys for external integrations
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL, -- For display purposes (e.g., "xhs_abc...")
  permissions JSONB DEFAULT '{}',
  rate_limit INTEGER DEFAULT 100,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_uid ON api_keys(user_uid);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- ============================================================
-- Usage Stats Table (Optional - for analytics and quotas)
-- Tracks user usage for quota management
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_stats (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
  date DATE NOT NULL,
  jobs_count INTEGER DEFAULT 0,
  total_processing_time INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_uid, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_uid ON usage_stats(user_uid);
CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_stats(date);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (uid = current_setting('app.current_user_uid', TRUE));

-- Jobs table policies
CREATE POLICY "Users can read own jobs"
  ON jobs FOR SELECT
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT
  WITH CHECK (user_uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

-- Artifacts table policies
CREATE POLICY "Users can read own artifacts"
  ON artifacts FOR SELECT
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can insert own artifacts"
  ON artifacts FOR INSERT
  WITH CHECK (user_uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can delete own artifacts"
  ON artifacts FOR DELETE
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

-- API Keys table policies
CREATE POLICY "Users can read own API keys"
  ON api_keys FOR SELECT
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (user_uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

CREATE POLICY "Users can revoke own API keys"
  ON api_keys FOR DELETE
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

-- Usage Stats table policies
CREATE POLICY "Users can read own usage stats"
  ON usage_stats FOR SELECT
  USING (user_uid = current_setting('app.current_user_uid', TRUE));

-- ============================================================
-- Functions and Triggers
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_stats_updated_at
  BEFORE UPDATE ON usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create daily usage stats entry
CREATE OR REPLACE FUNCTION create_daily_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usage_stats (user_uid, date, jobs_count)
  VALUES (NEW.user_uid, CURRENT_DATE, 1)
  ON CONFLICT (user_uid, date) DO UPDATE
  SET jobs_count = usage_stats.jobs_count + 1,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage stats on job creation
CREATE TRIGGER track_job_creation
  AFTER INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION create_daily_usage_stats();

-- ============================================================
-- Views (Optional - for easier querying)
-- ============================================================

-- View for job statistics by user
CREATE OR REPLACE VIEW user_job_stats AS
SELECT
  user_uid,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'DONE') as completed_jobs,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed_jobs,
  COUNT(*) FILTER (WHERE status IN ('CREATED', 'DOWNLOADING_AUDIO', 'ASR_TRANSCRIBING', 'CLEANING_TRANSCRIPT', 'GENERATING_COPY')) as pending_jobs,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE status = 'DONE') as avg_processing_time_seconds,
  MAX(created_at) as last_job_at
FROM jobs
GROUP BY user_uid;

-- View for recent jobs with user info
CREATE OR REPLACE VIEW recent_jobs AS
SELECT
  j.id,
  j.video_url,
  j.platform,
  j.status,
  j.progress,
  j.created_at,
  j.completed_at,
  u.email,
  u.name
FROM jobs j
LEFT JOIN users u ON j.user_uid = u.uid
ORDER BY j.created_at DESC
LIMIT 100;

-- ============================================================
-- Initial Data (Optional)
-- ============================================================

-- Insert a demo user (for testing)
-- Note: In production, users are created via Firebase auth
-- INSERT INTO users (uid, email, name, email_verified)
-- VALUES ('demo-user', 'demo@example.com', 'Demo User', TRUE);

-- ============================================================
-- Cleanup Functions (Optional - for maintenance)
-- ============================================================

-- Function to cleanup old jobs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_jobs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM jobs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
  AND status IN ('DONE', 'FAILED');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old artifacts (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_artifacts(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM artifacts
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Comments for Documentation
-- ============================================================

COMMENT ON TABLE users IS 'User accounts from Firebase authentication';
COMMENT ON TABLE jobs IS 'Content generation jobs and their status';
COMMENT ON TABLE artifacts IS 'File metadata for downloaded audio, transcripts, etc.';
COMMENT ON TABLE api_keys IS 'User API keys for external integrations';
COMMENT ON TABLE usage_stats IS 'Daily usage statistics for quota management';

COMMENT ON COLUMN jobs.output_json IS 'Generated content in JSON format';
COMMENT ON COLUMN jobs.platform IS 'Source platform: youtube, tiktok, or manual';
COMMENT ON COLUMN artifacts.r2_key IS 'Cloudflare R2 storage key for the file';

-- ============================================================
-- Schema Version
-- ============================================================
-- Version: 1.0.0
-- Created: 2026-03-09
-- Last Updated: 2026-03-09
