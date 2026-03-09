/**
 * Video Service
 * Handles video download, transcription, and processing
 * 
 * Wrapper around utils/videoProcessor for cleaner service layer
 */

const videoProcessor = require('../../utils/videoProcessor');
const videoUtils = require('../../utils/video');

/**
 * Download audio from video URL
 * @param {string} videoUrl - Video URL
 * @param {string} videoId - Video ID for filename
 * @returns {Promise<string>} Path to downloaded file
 */
async function downloadAudio(videoUrl, videoId) {
  return videoProcessor.downloadAudio(videoUrl, videoId);
}

/**
 * Extract transcript from YouTube using captions API
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<string>} Transcript text
 */
async function extractYouTubeCaptions(videoUrl) {
  return videoProcessor.extractYouTubeCaptions(videoUrl);
}

/**
 * Transcribe audio using Whisper
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<object>} Transcription result
 */
async function transcribeWithWhisper(audioPath) {
  return videoProcessor.transcribeWithWhisper(audioPath);
}

/**
 * Transcribe audio using DashScope API (fallback)
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<string>} Transcript text
 */
async function transcribeWithDashScope(audioPath) {
  return videoProcessor.transcribeWithDashScope(audioPath);
}

/**
 * Check if yt-dlp is available
 * @returns {Promise<boolean>} True if available
 */
async function checkYtDlp() {
  return videoProcessor.checkYtDlp();
}

/**
 * Get video duration
 * @param {string} videoUrl - Video URL
 * @returns {Promise<number>} Duration in seconds
 */
async function getVideoDuration(videoUrl) {
  return videoProcessor.getVideoDuration(videoUrl);
}

/**
 * Detect platform from URL
 * @param {string} url - Video URL
 * @returns {string} Platform name
 */
function detectPlatform(url) {
  return videoUtils.detectPlatform(url);
}

/**
 * Extract video ID from URL
 * @param {string} url - Video URL
 * @returns {string|null} Video ID
 */
function extractVideoId(url) {
  return videoUtils.extractVideoId(url);
}

module.exports = {
  downloadAudio,
  extractYouTubeCaptions,
  transcribeWithWhisper,
  transcribeWithDashScope,
  checkYtDlp,
  getVideoDuration,
  detectPlatform,
  extractVideoId
};
