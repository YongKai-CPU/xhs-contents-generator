/**
 * AI Controller
 * Handles AI content generation job creation and management
 */

const { v4: uuidv4 } = require('uuid');
const { db, JOB_STATUS } = require('../../db/database');
const { detectPlatform, extractVideoId } = require('../../utils/video');
const { cleanTranscript } = require('../../utils/transcriptCleaner');
const aiService = require('../services/ai.service');
const videoService = require('../services/video.service');

/**
 * Create a new content generation job
 */
async function createJob(req, res) {
  try {
    const { videoUrl, transcript, options = {} } = req.body;

    if (!videoUrl && !transcript) {
      return res.status(400).json({
        error: {
          code: 'MISSING_INPUT',
          message: 'videoUrl or transcript is required'
        }
      });
    }

    const jobId = uuidv4();
    const videoId = videoUrl ? extractVideoId(videoUrl) : null;
    const platform = videoUrl ? detectPlatform(videoUrl) : (transcript ? 'manual' : 'unknown');

    // Check cache if videoUrl provided
    if (videoId) {
      const cachedJob = await db.getCachedJob(videoId);
      if (cachedJob && cachedJob.output_json) {
        console.log('Cache hit for video:', videoId);
        return res.json({
          jobId: cachedJob.id,
          status: JOB_STATUS.DONE,
          cached: true,
          output: JSON.parse(cachedJob.output_json)
        });
      }
    }

    // Create job in database
    await db.createJob({
      id: jobId,
      videoUrl,
      videoId,
      platform,
      options: {
        model: options.model || 'qwen-turbo',
        styles: options.styles || ['种草风', '干货风', '真实分享风'],
        includeCover: options.includeCover !== false,
        includeComments: options.includeComments !== false
      }
    });

    // If transcript provided directly, skip extraction
    if (transcript) {
      await db.updateJobStatus(jobId, JOB_STATUS.CLEANING_TRANSCRIPT, 60, {
        transcriptRaw: transcript
      });

      const cleaned = cleanTranscript(transcript);
      await db.updateJobStatus(jobId, JOB_STATUS.GENERATING_COPY, 80, {
        transcript: cleaned
      });

      // Start generation (async)
      generateContent(jobId, cleaned, videoUrl, options).catch(console.error);
    } else {
      // Start full processing (async)
      processVideo(jobId, videoUrl, videoId, platform, options).catch(console.error);
    }

    res.status(201).json({
      jobId,
      status: JOB_STATUS.CREATED,
      progress: 0,
      estimatedTime: transcript ? 30 : 60,
      pollUrl: `/api/jobs/${jobId}`
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
}

/**
 * Get job status and results
 */
async function getJobStatus(req, res) {
  try {
    const { id } = req.params;
    const job = await db.getJob(id);

    if (!job) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Job not found'
        }
      });
    }

    const response = {
      id: job.id,
      videoUrl: job.video_url,
      platform: job.platform,
      status: job.status,
      progress: job.progress,
      transcript: job.transcript,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      completedAt: job.completed_at
    };

    if (job.output_json) {
      response.output = JSON.parse(job.output_json);
    }

    res.json(response);

  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
}

/**
 * Regenerate content with existing transcript
 */
async function regenerateJob(req, res) {
  try {
    const { id } = req.params;
    const { options } = req.body;

    const job = await db.getJob(id);
    if (!job) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Job not found'
        }
      });
    }

    if (!job.transcript) {
      return res.status(400).json({
        error: {
          code: 'NO_TRANSCRIPT',
          message: 'No transcript available for regeneration'
        }
      });
    }

    // Reset job status
    await db.updateJobStatus(id, JOB_STATUS.GENERATING_COPY, 80);

    // Start regeneration (async)
    generateContent(id, job.transcript, job.video_url, options).catch(console.error);

    res.json({
      jobId: id,
      status: JOB_STATUS.GENERATING_COPY,
      message: 'Regeneration started'
    });

  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
}

/**
 * Process video: download → transcribe → clean → generate
 */
async function processVideo(jobId, videoUrl, videoId, platform, options) {
  try {
    // Step 1: Try to extract captions (free)
    await db.updateJobStatus(jobId, JOB_STATUS.DOWNLOADING_AUDIO, 10);

    let transcript = null;

    if (platform === 'youtube') {
      try {
        console.log('Trying YouTube captions...');
        transcript = await videoService.extractYouTubeCaptions(videoUrl);
        await db.updateJobStatus(jobId, JOB_STATUS.ASR_TRANSCRIBING, 40, {
          transcriptRaw: transcript
        });
      } catch (e) {
        console.log('No captions, will try ASR:', e.message);
      }
    } else if (platform === 'tiktok') {
      console.log('TikTok detected - will use Whisper transcription');
      // TikTok doesn't have public captions API, skip to Whisper
    }

    // Step 2: If no captions, download audio and transcribe
    if (!transcript) {
      const hasYtDlp = await videoService.checkYtDlp();
      if (!hasYtDlp) {
        throw new Error('此视频没有字幕。请安装 yt-dlp 和 ffmpeg 进行语音转写，或手动提供字幕。');
      }

      await db.updateJobStatus(jobId, JOB_STATUS.DOWNLOADING_AUDIO, 15);
      const audioPath = await videoService.downloadAudio(videoUrl, videoId);

      await db.updateJobStatus(jobId, JOB_STATUS.ASR_TRANSCRIBING, 40);

      // Try Whisper
      try {
        const whisperResult = await videoService.transcribeWithWhisper(audioPath);
        transcript = whisperResult.segments.map(s => s.text).join(' ');

        if (!transcript || transcript.trim().length === 0) {
          throw new Error('Whisper returned empty transcript');
        }
      } catch (e) {
        console.log('Whisper failed:', e.message);
        throw e;
      }

      await db.updateJobStatus(jobId, JOB_STATUS.ASR_TRANSCRIBING, 50, {
        transcriptRaw: transcript
      });
    }

    // Step 3: Clean transcript
    await db.updateJobStatus(jobId, JOB_STATUS.CLEANING_TRANSCRIPT, 60);
    const cleaned = cleanTranscript(transcript);
    
    // Check if transcript is too short
    if (!cleaned || cleaned.trim().length < 50) {
      console.warn('Transcript too short, using video URL as context');
      throw new Error('Video transcript is too short or empty. The video may have no speech, only music, or poor audio quality.');
    }
    
    await db.updateJobStatus(jobId, JOB_STATUS.CLEANING_TRANSCRIPT, 70, {
      transcript: cleaned
    });

    // Step 4: Generate content
    await generateContent(jobId, cleaned, videoUrl, options);

  } catch (error) {
    console.error('Process video error:', error);

    let friendlyError = error.message;

    if (error.message.includes('yt-dlp not installed')) {
      friendlyError = 'yt-dlp 未安装。请安装 yt-dlp 进行语音转写，或手动提供字幕。';
    } else if (error.message.includes('Download failed')) {
      friendlyError = '视频下载失败：' + error.message.replace('Download failed: ', '');
    } else if (error.message.includes('No captions')) {
      friendlyError = '此视频没有可用的字幕。请手动粘贴字幕内容。';
    }

    await db.updateJobStatus(jobId, JOB_STATUS.FAILED, 0, {
      errorMessage: friendlyError
    });
  }
}

/**
 * Generate Xiaohongshu content using AI
 */
async function generateContent(jobId, transcript, videoUrl, options) {
  try {
    await db.updateJobStatus(jobId, JOB_STATUS.GENERATING_COPY, 80);

    const output = await aiService.generateXiaohongshuContent(videoUrl, transcript, options);

    if (!output) {
      throw new Error('Failed to generate content');
    }

    await db.updateJobStatus(jobId, JOB_STATUS.DONE, 100, {
      output
    });

    console.log('Job completed:', jobId);

  } catch (error) {
    console.error('Generate content error:', error);
    await db.updateJobStatus(jobId, JOB_STATUS.FAILED, 0, {
      errorMessage: error.message
    });
  }
}

module.exports = {
  createJob,
  getJobStatus,
  regenerateJob
};
