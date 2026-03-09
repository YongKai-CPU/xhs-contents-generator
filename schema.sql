-- Xiaohongshu Content Generator - D1 Database Schema
-- Cloudflare D1 SQLite-compatible schema

-- Jobs table for content generation
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  video_url TEXT,
  video_id TEXT,
  platform TEXT DEFAULT 'unknown',
  telegram_chat_id TEXT,
  telegram_message_id INTEGER,
  status TEXT DEFAULT 'CREATED',
  progress INTEGER DEFAULT 0,
  transcript TEXT,
  transcript_raw TEXT,
  output_json TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  options TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Artifacts table for file storage metadata
CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT,
  file_path TEXT,
  file_hash TEXT,
  file_size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table for tracking (optional, for analytics)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  telegram_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- Sessions table (optional, for server-side sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cache table for video transcripts
CREATE TABLE IF NOT EXISTS cache (
  id TEXT PRIMARY KEY,
  cache_key TEXT UNIQUE,
  cache_type TEXT,
  data TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_video_id ON jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_telegram_chat ON jobs(telegram_chat_id);

CREATE INDEX IF NOT EXISTS idx_artifacts_job_id ON artifacts(job_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_hash ON artifacts(file_hash);

CREATE INDEX IF NOT EXISTS idx_users_firebase ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);

-- Insert default data (optional)
INSERT OR IGNORE INTO jobs (id, status) VALUES ('demo-job', 'DONE');
