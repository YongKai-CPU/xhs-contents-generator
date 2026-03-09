/**
 * Cloudflare R2 Storage Service
 * 
 * Provides object storage for:
 * - Downloaded audio files
 * - Transcripts
 * - Generated content artifacts
 * 
 * Uses S3-compatible API for compatibility
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

let s3Client = null;
let bucketName = null;

/**
 * Initialize R2 client
 * @returns {Object|null} R2 client or null if not configured
 */
function initR2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || 'xhs-artifacts';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('⚠️  R2 not configured - using local storage fallback');
    console.warn('   Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
    return null;
  }

  try {
    bucketName = bucket;

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      forcePathStyle: true
    });

    console.log('✅ R2 initialized');
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Endpoint: https://${accountId}.r2.cloudflarestorage.com`);

    return s3Client;

  } catch (error) {
    console.error('❌ R2 initialization failed:', error.message);
    return null;
  }
}

/**
 * Get R2 client instance
 * @returns {Object|null} R2 client
 */
function getR2Client() {
  return s3Client;
}

/**
 * Upload file to R2
 * @param {string} key - Storage key (path in bucket)
 * @param {Buffer|string} content - File content
 * @param {Object} options - Upload options
 * @returns {Promise<string>} Public URL or R2 key
 */
async function uploadFile(key, content, options = {}) {
  if (!s3Client || !bucketName) {
    throw new Error('R2 not initialized');
  }

  try {
    const contentType = options.contentType || 'application/octet-stream';
    const metadata = options.metadata || {};

    // Convert string to Buffer if needed
    const body = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata
    });

    await s3Client.send(command);

    console.log(`📦 Uploaded to R2: ${key} (${body.length} bytes)`);

    // Return the R2 key (you can construct public URL if bucket has public access)
    return key;

  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
}

/**
 * Upload file from local path
 * @param {string} key - Storage key
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<string>} R2 key
 */
async function uploadFileFromPath(key, filePath, options = {}) {
  try {
    const content = await fs.readFile(filePath);
    const contentType = options.contentType || getMimeType(filePath);

    return await uploadFile(key, content, { ...options, contentType });

  } catch (error) {
    console.error('R2 upload from path error:', error);
    throw error;
  }
}

/**
 * Download file from R2
 * @param {string} key - Storage key
 * @returns {Promise<Buffer>} File content
 */
async function downloadFile(key) {
  if (!s3Client || !bucketName) {
    throw new Error('R2 not initialized');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    const response = await s3Client.send(command);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    console.log(`📥 Downloaded from R2: ${key} (${buffer.length} bytes)`);

    return buffer;

  } catch (error) {
    console.error('R2 download error:', error);
    throw error;
  }
}

/**
 * Download file to local path
 * @param {string} key - Storage key
 * @param {string} filePath - Local file path
 * @returns {Promise<void>}
 */
async function downloadFileToPath(key, filePath) {
  try {
    const buffer = await downloadFile(key);
    await fs.writeFile(filePath, buffer);
  } catch (error) {
    console.error('R2 download to path error:', error);
    throw error;
  }
}

/**
 * Delete file from R2
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
async function deleteFile(key) {
  if (!s3Client || !bucketName) {
    throw new Error('R2 not initialized');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await s3Client.send(command);

    console.log(`🗑️  Deleted from R2: ${key}`);

  } catch (error) {
    console.error('R2 delete error:', error);
    throw error;
  }
}

/**
 * List files in R2 bucket
 * @param {string} prefix - Key prefix (folder)
 * @param {string} delimiter - Delimiter for grouping
 * @returns {Promise<Array>} List of objects
 */
async function listFiles(prefix = '', delimiter = '') {
  if (!s3Client || !bucketName) {
    throw new Error('R2 not initialized');
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: delimiter || undefined
    });

    const response = await s3Client.send(command);

    const files = (response.Contents || []).map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag
    }));

    console.log(`📋 Listed ${files.length} files in R2: ${prefix || '/'}`);

    return files;

  } catch (error) {
    console.error('R2 list error:', error);
    throw error;
  }
}

/**
 * Check if file exists
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} Exists flag
 */
async function fileExists(key) {
  try {
    await downloadFile(key);
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Generate unique storage key
 * @param {string} prefix - Key prefix
 * @param {string} extension - File extension
 * @returns {string} Unique key
 */
function generateKey(prefix, extension = '') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = extension ? `.${extension.replace(/^\./, '')}` : '';

  return `${prefix}/${timestamp}-${random}${ext}`;
}

/**
 * Get MIME type from file extension
 * @param {string} filePath - File path
 * @returns {string} MIME type
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Get public URL for file (if bucket has public access)
 * @param {string} key - Storage key
 * @returns {string} Public URL
 */
function getPublicUrl(key) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const publicBucketUrl = process.env.R2_PUBLIC_URL || `https://pub-${accountId}.r2.cloudflarestorage.com`;

  return `${publicBucketUrl}/${key}`;
}

/**
 * Cleanup old files (older than specified days)
 * @param {string} prefix - Key prefix
 * @param {number} daysOld - Days threshold
 * @returns {Promise<number>} Number of deleted files
 */
async function cleanupOldFiles(prefix = '', daysOld = 7) {
  try {
    const files = await listFiles(prefix);
    const now = Date.now();
    const threshold = daysOld * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      const age = now - file.lastModified.getTime();

      if (age > threshold) {
        await deleteFile(file.key);
        deletedCount++;
      }
    }

    console.log(`🧹 Cleaned up ${deletedCount} old files from R2`);

    return deletedCount;

  } catch (error) {
    console.error('R2 cleanup error:', error);
    throw error;
  }
}

module.exports = {
  initR2,
  getR2Client,
  uploadFile,
  uploadFileFromPath,
  downloadFile,
  downloadFileToPath,
  deleteFile,
  listFiles,
  fileExists,
  generateKey,
  getMimeType,
  getPublicUrl,
  cleanupOldFiles
};
