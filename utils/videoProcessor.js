/**
 * Video Processor - Download audio and transcribe
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');

const execAsync = promisify(exec);

// Storage directory
const STORAGE_DIR = path.join(__dirname, '..', 'storage');
const AUDIO_DIR = path.join(STORAGE_DIR, 'audio');

// Ensure storage directories exist
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// Add project directory to PATH for yt-dlp
const projectDir = path.join(__dirname, '..');
const customEnv = Object.create(process.env);
if (process.platform === 'win32') {
  customEnv.PATH = `${projectDir};${customEnv.PATH}`;
}

/**
 * Check if yt-dlp is installed
 */
async function checkYtDlp() {
  const projectYtDlp = path.join(__dirname, '..', 'yt-dlp.exe');
  
  console.log('Checking yt-dlp at:', projectYtDlp);
  console.log('__dirname:', __dirname);
  console.log('File exists:', fs.existsSync(projectYtDlp));

  // Check if file exists - if it does, consider it installed
  if (fs.existsSync(projectYtDlp)) {
    console.log('yt-dlp found at:', projectYtDlp);
    return true;
  }

  // Fallback: try system PATH
  try {
    await execAsync('yt-dlp --version');
    return true;
  } catch (e) {
    console.log('yt-dlp not found in PATH');
    return false;
  }
}

/**
 * Get yt-dlp command path
 */
function getYtDlpCommand() {
  const projectYtDlp = path.join(__dirname, '..', 'yt-dlp.exe');
  if (fs.existsSync(projectYtDlp)) {
    return `"${projectYtDlp}"`;
  }
  return 'yt-dlp';
}

/**
 * Get ffmpeg command path
 */
function getFfmpegCommand() {
  const projectFfmpeg = path.join(__dirname, '..', 'ffmpeg', 'ffmpeg-master-latest-win64-gpl', 'bin', 'ffmpeg.exe');
  if (fs.existsSync(projectFfmpeg)) {
    return `"${projectFfmpeg}"`;
  }
  const projectFfmpegAlt = path.join(__dirname, '..', 'ffmpeg.exe');
  if (fs.existsSync(projectFfmpegAlt)) {
    return `"${projectFfmpegAlt}"`;
  }
  return 'ffmpeg';
}

/**
 * Download audio from video URL using yt-dlp
 */
async function downloadAudio(videoUrl, videoId) {
  // Note: We download as video file since we don't have ffmpeg for audio extraction
  // The Whisper model can process video files directly
  const baseFileName = `${videoId || Date.now()}`;

  // Check if file already exists (any format)
  try {
    const existingFiles = fs.readdirSync(AUDIO_DIR)
      .filter(f => f.startsWith(baseFileName));
    if (existingFiles.length > 0) {
      const existingPath = path.join(AUDIO_DIR, existingFiles[0]);
      console.log('File already exists:', existingPath);
      return existingPath;
    }
  } catch (e) {
    // Directory might not exist yet
  }

  // Check if yt-dlp is available
  const hasYtDlp = await checkYtDlp();
  if (!hasYtDlp) {
    throw new Error('yt-dlp not installed. Please install it or provide manual transcript.');
  }

  const ytDlpCmd = getYtDlpCommand();

  return new Promise((resolve, reject) => {
    // Download video file - use simple format to avoid ffmpeg requirement
    const command = `${ytDlpCmd} -f best -o "${baseFileName}" --no-playlist "${videoUrl}"`;
    
    console.log('Downloading with command:', command);
    console.log('Working directory:', AUDIO_DIR);

    // Execute from the AUDIO_DIR to avoid path issues
    exec(command, { cwd: AUDIO_DIR, env: customEnv }, (error, stdout, stderr) => {
      console.log('Download output:', stdout.substring(0, 500));
      if (error) {
        console.error('Download error:', stderr || error.message);
        reject(new Error(`Download failed: ${stderr || error.message}`));
        return;
      }
      
      // Find the downloaded file (could be .mp4, .webm, .mkv, etc.)
      try {
        const files = fs.readdirSync(AUDIO_DIR)
          .filter(f => f.startsWith(baseFileName))
          .sort((a, b) => {
            const statA = fs.statSync(path.join(AUDIO_DIR, a));
            const statB = fs.statSync(path.join(AUDIO_DIR, b));
            return statB.mtime - statA.mtime;
          });
        
        if (files.length > 0) {
          const downloadedPath = path.join(AUDIO_DIR, files[0]);
          console.log('Download successful:', downloadedPath);
          resolve(downloadedPath);
        } else {
          reject(new Error('No file found after download'));
        }
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Extract transcript from YouTube using captions API
 */
async function extractYouTubeCaptions(videoUrl) {
  console.log('=== EXTRACTING YOUTUBE CAPTIONS ===');
  console.log('Video URL:', videoUrl);
  
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) {
    console.error('Invalid YouTube URL:', videoUrl);
    throw new Error('Invalid YouTube URL');
  }

  console.log('Video ID:', videoId);

  try {
    console.log('Fetching transcript (Chinese)...');
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'zh' });
    console.log('Chinese transcript result:', transcript ? '✅' : '❌');
    console.log('Transcript length:', transcript ? transcript.length : 0);
    
    if (transcript && transcript.length > 0) {
      const text = transcript.map(t => t.text).join(' ');
      console.log('Transcript preview:', text.substring(0, 200));
      return text;
    }

    // Try English
    console.log('Fetching transcript (English)...');
    const enTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    console.log('English transcript result:', enTranscript ? '✅' : '❌');
    console.log('English transcript length:', enTranscript ? enTranscript.length : 0);
    
    if (enTranscript && enTranscript.length > 0) {
      const text = enTranscript.map(t => t.text).join(' ');
      console.log('English transcript preview:', text.substring(0, 200));
      return text;
    }
    
    throw new Error('No captions available for this video');
  } catch (e) {
    console.error('=== TRANSCRIPT EXTRACTION ERROR ===');
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
    throw new Error('No captions available for this video: ' + e.message);
  }
}

/**
 * Extract transcript from TikTok
 * TikTok doesn't have public captions API, so we'll need to download and transcribe
 */
async function extractTikTokCaptions(videoUrl) {
  console.log('=== EXTRACTING TIKTOK CAPTIONS ===');
  console.log('Video URL:', videoUrl);
  console.log('Note: TikTok requires download + Whisper transcription');
  
  // For TikTok, we need to download the video and use Whisper
  // This is handled by the processVideo flow automatically
  throw new Error('TikTok requires audio download and Whisper transcription');
}

/**
 * Transcribe audio using Whisper (via Python script)
 */
async function transcribeWithWhisper(audioPath) {
  const scriptPath = path.join(__dirname, '..', 'whisper_transcribe.py');
  
  // Check if Python script exists
  if (!fs.existsSync(scriptPath)) {
    throw new Error('Whisper transcription script not found');
  }
  
  return new Promise((resolve, reject) => {
    const python = spawn('python', [scriptPath, audioPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Whisper stdout:', data.toString().substring(0, 200));
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Whisper stderr:', data.toString().substring(0, 200));
    });

    python.on('close', (code) => {
      console.log('Whisper process closed with code:', code);
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          console.error('Failed to parse Whisper output:', e);
          console.error('Output:', output.substring(0, 500));
          reject(new Error(`Whisper output parsing failed: ${e.message}`));
        }
      } else {
        reject(new Error(`Whisper exited with code ${code}: ${errorOutput || output}`));
      }
    });

    // Timeout after 30 minutes for first run (model download)
    setTimeout(() => {
      console.log('Whisper transcription timeout - killing process');
      python.kill();
      reject(new Error('Transcription timeout (30 minutes) - model download may still be in progress'));
    }, 1800000); // 30 minutes
  });
}

/**
 * Transcribe audio using DashScope API (fallback)
 */
async function transcribeWithDashScope(audioPath) {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    // Return empty transcript instead of throwing
    // This allows the system to continue with what we have
    console.log('DashScope not configured, using empty transcript');
    return '';
  }

  // Note: This is a simplified version - actual implementation requires file upload
  throw new Error('DashScope transcription requires file upload - implement separately');
}

/**
 * Get video duration using yt-dlp
 */
async function getVideoDuration(videoUrl) {
  try {
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-download "${videoUrl}"`
    );
    const info = JSON.parse(stdout);
    return info.duration || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Clean up old audio files (older than 24 hours)
 */
function cleanupOldAudio() {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();
  
  fs.readdir(AUDIO_DIR, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      const filePath = path.join(AUDIO_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

// Helper function
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

module.exports = {
  downloadAudio,
  extractYouTubeCaptions,
  transcribeWithWhisper,
  transcribeWithDashScope,
  getVideoDuration,
  cleanupOldAudio,
  checkYtDlp,
  STORAGE_DIR,
  AUDIO_DIR
};
