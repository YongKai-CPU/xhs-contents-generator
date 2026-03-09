/**
 * Database Module - SQLite for job storage and caching
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'jobs.db');

// Job status constants
const JOB_STATUS = {
  CREATED: 'CREATED',
  DOWNLOADING_AUDIO: 'DOWNLOADING_AUDIO',
  ASR_TRANSCRIBING: 'ASR_TRANSCRIBING',
  CLEANING_TRANSCRIPT: 'CLEANING_TRANSCRIPT',
  GENERATING_COPY: 'GENERATING_COPY',
  DONE: 'DONE',
  FAILED: 'FAILED'
};

class Database {
  constructor() {
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('Connected to SQLite database');
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Jobs table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            video_url TEXT,
            video_id TEXT,
            platform TEXT,
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
          )
        `);

        // Artifacts table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS artifacts (
            id TEXT PRIMARY KEY,
            job_id TEXT REFERENCES jobs(id),
            type TEXT,
            file_path TEXT,
            file_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create indexes
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_video_id ON jobs(video_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_artifacts_hash ON artifacts(file_hash)`);

        resolve();
      });
    });
  }

  // Job operations
  createJob(jobData) {
    return new Promise((resolve, reject) => {
      const { id, videoUrl, videoId, platform, options } = jobData;
      const sql = `
        INSERT INTO jobs (id, video_url, video_id, platform, status, options)
        VALUES (?, ?, ?, ?, 'CREATED', ?)
      `;

      this.db.run(sql, [id, videoUrl || null, videoId || null, platform || 'unknown', JSON.stringify(options || {})], function(err) {
        if (err) reject(err);
        else resolve({ id, ...jobData });
      });
    });
  }

  getJob(jobId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM jobs WHERE id = ?', [jobId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getCachedJob(videoId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM jobs WHERE video_id = ? AND status = "DONE" ORDER BY completed_at DESC LIMIT 1',
        [videoId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  updateJobStatus(jobId, status, progress = null, data = {}) {
    return new Promise((resolve, reject) => {
      const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const values = [status];

      if (progress !== null) {
        fields.push('progress = ?');
        values.push(progress);
      }

      if (data.transcript !== undefined) {
        fields.push('transcript = ?');
        values.push(data.transcript);
      }

      if (data.transcriptRaw !== undefined) {
        fields.push('transcript_raw = ?');
        values.push(data.transcriptRaw);
      }

      if (data.output !== undefined) {
        fields.push('output_json = ?');
        values.push(JSON.stringify(data.output));
      }

      if (data.errorMessage !== undefined) {
        fields.push('error_message = ?');
        values.push(data.errorMessage);
      }

      if (data.retryCount !== undefined) {
        fields.push('retry_count = ?');
        values.push(data.retryCount);
      }

      if (status === JOB_STATUS.DONE || status === JOB_STATUS.FAILED) {
        fields.push('completed_at = CURRENT_TIMESTAMP');
      }

      values.push(jobId);

      const sql = `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`;
      
      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // Artifact operations
  createArtifact(artifactData) {
    return new Promise((resolve, reject) => {
      const { id, jobId, type, filePath, fileHash } = artifactData;
      const sql = `
        INSERT INTO artifacts (id, job_id, type, file_path, file_hash)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [id, jobId, type, filePath, fileHash], function(err) {
        if (err) reject(err);
        else resolve({ id, ...artifactData });
      });
    });
  }

  getArtifactByHash(fileHash) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM artifacts WHERE file_hash = ?', [fileHash], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Stats
  getStats() {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status IN ('CREATED', 'DOWNLOADING_AUDIO', 'ASR_TRANSCRIBING', 'CLEANING_TRANSCRIPT', 'GENERATING_COPY') THEN 1 ELSE 0 END) as pending
        FROM jobs
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

// Singleton instance
const db = new Database();

module.exports = {
  db,
  JOB_STATUS,
  Database
};
