/**
 * Supabase Database Client
 * 
 * Replaces SQLite for production deployment
 * Provides PostgreSQL connectivity via Supabase
 * 
 * Usage:
 *   const { supabase, createJob, getJob, updateJobStatus } = require('./db/supabase');
 *   await supabase.init();
 */

const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

/**
 * Initialize Supabase client
 * @returns {Object|null} Supabase client or null if not configured
 */
function initSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase not configured - using SQLite fallback');
    console.warn('   Set SUPABASE_URL and SUPABASE_SERVICE_KEY to enable');
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Supabase initialized');
    console.log(`   URL: ${supabaseUrl}`);
    
    return supabaseClient;

  } catch (error) {
    console.error('❌ Supabase initialization failed:', error.message);
    return null;
  }
}

/**
 * Get Supabase client instance
 * @returns {Object|null} Supabase client
 */
function getSupabase() {
  return supabaseClient;
}

/**
 * Create a new job
 * @param {Object} jobData - Job data
 * @returns {Promise<Object>} Created job
 */
async function createJob(jobData) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { id, videoUrl, videoId, platform, options, userUid } = jobData;

  const { data, error } = await supabaseClient
    .from('jobs')
    .insert([{
      id,
      user_uid: userUid || null,
      video_url: videoUrl || null,
      video_id: videoId || null,
      platform: platform || 'unknown',
      status: 'CREATED',
      progress: 0,
      options: options || {}
    }])
    .select()
    .single();

  if (error) {
    console.error('Supabase createJob error:', error);
    throw error;
  }

  return data;
}

/**
 * Get job by ID
 * @param {string} jobId - Job ID
 * @returns {Promise<Object|null>} Job or null
 */
async function getJob(jobId) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseClient
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Supabase getJob error:', error);
    throw error;
  }

  return data;
}

/**
 * Get cached job by video ID
 * @param {string} videoId - Video ID
 * @returns {Promise<Object|null>} Cached job or null
 */
async function getCachedJob(videoId) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseClient
    .from('jobs')
    .select('*')
    .eq('video_id', videoId)
    .eq('status', 'DONE')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Supabase getCachedJob error:', error);
    throw error;
  }

  return data;
}

/**
 * Update job status
 * @param {string} jobId - Job ID
 * @param {string} status - New status
 * @param {number} progress - Progress percentage (0-100)
 * @param {Object} data - Additional data to update
 * @returns {Promise<Object>} Update result
 */
async function updateJobStatus(jobId, status, progress = null, data = {}) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const updateData = {
    status,
    updated_at: new Date().toISOString()
  };

  if (progress !== null) {
    updateData.progress = progress;
  }

  if (data.transcript !== undefined) {
    updateData.transcript = data.transcript;
  }

  if (data.transcriptRaw !== undefined) {
    updateData.transcript_raw = data.transcriptRaw;
  }

  if (data.output !== undefined) {
    updateData.output_json = data.output;
  }

  if (data.errorMessage !== undefined) {
    updateData.error_message = data.errorMessage;
  }

  if (data.retryCount !== undefined) {
    updateData.retry_count = data.retryCount;
  }

  if (status === 'DONE' || status === 'FAILED') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabaseClient
    .from('jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error('Supabase updateJobStatus error:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Create artifact record
 * @param {Object} artifactData - Artifact data
 * @returns {Promise<Object>} Created artifact
 */
async function createArtifact(artifactData) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { id, jobId, type, filePath, fileHash, r2Key, fileSize, mimeType, userUid } = artifactData;

  const { data, error } = await supabaseClient
    .from('artifacts')
    .insert([{
      id,
      job_id: jobId,
      user_uid: userUid,
      type,
      file_path: filePath,
      file_hash: fileHash,
      r2_key: r2Key,
      file_size: fileSize,
      mime_type: mimeType
    }])
    .select()
    .single();

  if (error) {
    console.error('Supabase createArtifact error:', error);
    throw error;
  }

  return data;
}

/**
 * Get artifact by hash
 * @param {string} fileHash - File hash
 * @returns {Promise<Object|null>} Artifact or null
 */
async function getArtifactByHash(fileHash) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseClient
    .from('artifacts')
    .select('*')
    .eq('file_hash', fileHash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Supabase getArtifactByHash error:', error);
    throw error;
  }

  return data;
}

/**
 * Get or create user
 * @param {Object} userData - User data from Firebase
 * @returns {Promise<Object>} User record
 */
async function getOrCreateUser(userData) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { uid, email, name, picture, email_verified } = userData;

  // Try to get existing user
  const { data: existingUser, error: getError } = await supabaseClient
    .from('users')
    .select('*')
    .eq('uid', uid)
    .single();

  if (existingUser) {
    // Update last login
    await supabaseClient
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('uid', uid);

    return existingUser;
  }

  // Create new user
  const { data: newUser, error: createError } = await supabaseClient
    .from('users')
    .insert([{
      uid,
      email,
      name: name || null,
      picture: picture || null,
      email_verified: email_verified || false
    }])
    .select()
    .single();

  if (createError) {
    console.error('Supabase create user error:', createError);
    throw createError;
  }

  return newUser;
}

/**
 * Get user stats
 * @param {string} userUid - User UID
 * @returns {Promise<Object>} User stats
 */
async function getUserStats(userUid) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseClient
    .from('user_job_stats')
    .select('*')
    .eq('user_uid', userUid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        user_uid: userUid,
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        pending_jobs: 0,
        avg_processing_time_seconds: 0,
        last_job_at: null
      };
    }
    console.error('Supabase getUserStats error:', error);
    throw error;
  }

  return data;
}

/**
 * Get recent jobs for user
 * @param {string} userUid - User UID
 * @param {number} limit - Max jobs to return
 * @returns {Promise<Array>} Recent jobs
 */
async function getRecentJobs(userUid, limit = 10) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseClient
    .from('jobs')
    .select('id, video_url, platform, status, progress, created_at, completed_at')
    .eq('user_uid', userUid)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Supabase getRecentJobs error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get database statistics
 * @returns {Promise<Object>} Database stats
 */
async function getStats() {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  // Get job counts
  const { data: jobStats, error: jobError } = await supabaseClient
    .from('jobs')
    .select('status', { count: 'exact', head: true });

  if (jobError) {
    console.error('Supabase getStats error:', jobError);
    throw jobError;
  }

  // Get total counts
  const { count: total } = await supabaseClient
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  const { count: completed } = await supabaseClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'DONE');

  const { count: failed } = await supabaseClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'FAILED');

  const { count: pending } = await supabaseClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .in('status', ['CREATED', 'DOWNLOADING_AUDIO', 'ASR_TRANSCRIBING', 'CLEANING_TRANSCRIPT', 'GENERATING_COPY']);

  return {
    total: total || 0,
    completed: completed || 0,
    failed: failed || 0,
    pending: pending || 0
  };
}

/**
 * Close Supabase connection
 * @returns {Promise<void>}
 */
async function close() {
  // Supabase client doesn't have explicit close method
  supabaseClient = null;
  console.log('Supabase connection closed');
}

module.exports = {
  initSupabase,
  getSupabase,
  createJob,
  getJob,
  getCachedJob,
  updateJobStatus,
  createArtifact,
  getArtifactByHash,
  getOrCreateUser,
  getUserStats,
  getRecentJobs,
  getStats,
  close
};
