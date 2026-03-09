/**
 * Xiaohongshu Content Generator - Server v2.0
 * Job-based architecture for video → transcript → content generation
 * 
 * With Firebase Authentication (Google + Facebook login)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Add ffmpeg and project directory to PATH
const ffmpegPath = path.join(__dirname, 'ffmpeg', 'ffmpeg-master-latest-win64-gpl', 'bin');
if (process.platform === 'win32') {
  process.env.PATH = `${ffmpegPath};${process.env.PATH}`;
}

// Import modules
const { db, JOB_STATUS } = require('./db/database');
const { detectPlatform, extractVideoId, generateCacheKey } = require('./utils/video');
const { cleanTranscript } = require('./utils/transcriptCleaner');
const { generatePrompt, parseResponse, validateOutput, formatForFrontend } = require('./utils/prompt');
const {
  downloadAudio,
  extractYouTubeCaptions,
  transcribeWithWhisper,
  transcribeWithDashScope,
  checkYtDlp
} = require('./utils/videoProcessor');
const { initFirebaseAdmin } = require('./utils/firebaseAdmin');
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { generateCSRFToken, validateCSRFToken } = require('./middleware/csrf');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Middleware Setup
// ============================================================

// Trust proxy for production (behind reverse proxy/Cloudflare)
app.set('trust proxy', 1);

// CORS with credentials support
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization']
}));

// JSON parser with limit
app.use(express.json({ limit: '10mb' }));

// Cookie parser (required for session cookies and CSRF)
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// CSRF token generation on all requests
app.use(generateCSRFToken);

// ============================================================
// Auth Routes (public, no auth required)
// ============================================================

app.use('/auth', authRoutes);

// CSRF token endpoint (public)
app.get('/csrf-token', (req, res) => {
  // Token is already set by generateCSRFToken middleware
  res.json({ token: req.cookies.csrf_token });
});

// ============================================================
// Protected API Routes
// ============================================================

// Apply auth and CSRF validation to all /api routes
app.use('/api', requireAuth);
app.use('/api', validateCSRFToken);

// ============================================================
// API Endpoints
// ============================================================

/**
 * POST /api/jobs - Create a new job
 * Request: { videoUrl, options }
 * Response: { jobId, status, pollUrl }
 */
app.post('/api/jobs', async (req, res) => {
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
});

/**
 * GET /api/jobs/:id - Get job status and results
 */
app.get('/api/jobs/:id', async (req, res) => {
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
    console.error('Get job error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/jobs/:id/regenerate - Regenerate content with existing transcript
 */
app.post('/api/jobs/:id/regenerate', async (req, res) => {
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
});

/**
 * GET /api/stats - Get system statistics
 */
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    const hasYtDlp = await checkYtDlp();
    
    res.json({
      jobs: stats,
      features: {
        ytDlpInstalled: hasYtDlp,
        apiKeyConfigured: !!(process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_api_key_here')
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Video Processing Pipeline
// ============================================================

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
        transcript = await extractYouTubeCaptions(videoUrl);
        await db.updateJobStatus(jobId, JOB_STATUS.ASR_TRANSCRIBING, 40, {
          transcriptRaw: transcript
        });
      } catch (e) {
        console.log('No captions, will try ASR:', e.message);
      }
    }
    
    // Step 2: If no captions, download audio and transcribe
    if (!transcript) {
      const hasYtDlp = await checkYtDlp();
      if (!hasYtDlp) {
        throw new Error('此视频没有 YouTube 字幕。请安装 yt-dlp 和 ffmpeg 进行语音转写，或手动提供字幕。\n\n安装步骤:\n1. yt-dlp 已下载在项目文件夹\n2. ffmpeg 已下载在项目文件夹\n3. 重启终端或电脑让 PATH 生效\n\n或者：直接在字幕框粘贴视频字幕/摘要');
      }

      await db.updateJobStatus(jobId, JOB_STATUS.DOWNLOADING_AUDIO, 15);
      const audioPath = await downloadAudio(videoUrl, videoId);

      await db.updateJobStatus(jobId, JOB_STATUS.ASR_TRANSCRIBING, 40);

      // Try Whisper first
      try {
        const whisperResult = await transcribeWithWhisper(audioPath);
        transcript = whisperResult.segments.map(s => s.text).join(' ');
        
        if (!transcript || transcript.trim().length === 0) {
          throw new Error('Whisper returned empty transcript');
        }
      } catch (e) {
        console.log('Whisper failed:', e.message);
        // Don't fallback to DashScope - just let the error propagate
        throw e;
      }
      
      await db.updateJobStatus(jobId, JOB_STATUS.ASR_TRANSCRIBING, 50, {
        transcriptRaw: transcript
      });
    }
    
    // Step 3: Clean transcript
    await db.updateJobStatus(jobId, JOB_STATUS.CLEANING_TRANSCRIPT, 60);
    const cleaned = cleanTranscript(transcript);
    await db.updateJobStatus(jobId, JOB_STATUS.CLEANING_TRANSCRIPT, 70, {
      transcript: cleaned
    });
    
    // Step 4: Generate content
    await generateContent(jobId, cleaned, videoUrl, options);
    
  } catch (error) {
    console.error('Process video error:', error);

    // Provide helpful error message based on the actual error
    let friendlyError = error.message;
    
    // Check for specific error types
    if (error.message.includes('yt-dlp not installed')) {
      friendlyError = 'yt-dlp 未安装。此视频没有 YouTube 字幕，需要安装 yt-dlp 进行语音转写，或手动提供字幕。\n\n安装方法：\n1. Windows: choco install yt-dlp\n2. 或下载：https://github.com/yt-dlp/yt-dlp/releases\n\n或者：直接在字幕框粘贴视频字幕/摘要';
    } else if (error.message.includes('Download failed')) {
      friendlyError = '视频下载失败：' + error.message.replace('Download failed: ', '') + '\n\n请检查网络连接或尝试手动粘贴字幕。';
    } else if (error.message.includes('No captions')) {
      friendlyError = '此视频没有可用的字幕。请手动粘贴字幕内容，或安装 yt-dlp 进行语音转写。';
    } else if (error.message.includes('Whisper') || error.message.includes('transcription')) {
      friendlyError = '语音转写失败：' + error.message + '\n\n解决方案：\n1. 确保已安装 faster-whisper: pip install faster-whisper\n2. 或者手动粘贴视频字幕到输入框\n3. 或使用有 YouTube 字幕的视频';
    } else if (error.message.includes('JSON') || error.message.includes('parse')) {
      friendlyError = 'AI 生成格式错误，请重试。\n\n可能原因：\n1. AI 输出格式不符合要求\n2. 网络问题导致响应不完整\n\n建议：\n- 点击"生成文案"重试\n- 或手动粘贴视频字幕';
    }
    
    // Log the full error for debugging
    console.error('Full error:', error.stack || error);

    await db.updateJobStatus(jobId, JOB_STATUS.FAILED, 0, {
      errorMessage: friendlyError
    });
  }
}

/**
 * Generate Xiaohongshu content using Qwen AI
 */
async function generateContent(jobId, transcript, videoUrl, options) {
  try {
    await db.updateJobStatus(jobId, JOB_STATUS.GENERATING_COPY, 80);
    
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      // Demo mode - return sample output
      const demoOutput = getDemoOutput(videoUrl, transcript);
      await db.updateJobStatus(jobId, JOB_STATUS.DONE, 100, {
        output: demoOutput
      });
      return;
    }
    
    const baseURL = process.env.AI_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    const model = options?.model || process.env.AI_MODEL || 'qwen-turbo';
    
    const prompt = generatePrompt(videoUrl, transcript);

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一名资深的小红书内容创作者，输出必须是合法 JSON'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'AI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse and validate output
    const output = parseResponse(content);

    if (!output) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const validation = validateOutput(output);
    if (!validation.valid) {
      console.warn('Output validation warnings:', validation.errors);
    }

    // Format for frontend
    const formattedOutput = formatForFrontend(output);

    await db.updateJobStatus(jobId, JOB_STATUS.DONE, 100, {
      output: formattedOutput
    });
    
    console.log('Job completed:', jobId);
    
  } catch (error) {
    console.error('Generate content error:', error);
    await db.updateJobStatus(jobId, JOB_STATUS.FAILED, 0, {
      errorMessage: error.message
    });
  }
}

/**
 * Demo output for testing without API key
 */
function getDemoOutput(videoUrl, transcript) {
  return {
    summary: {
      mainTopic: "演示内容 - 配置 API Key 后生成真实分析",
      corePoints: ["这是演示数据", "配置 AI_API_KEY 后使用真实 AI 生成", "支持 YouTube/TikTok 视频链接"],
      highlights: ["自动提取字幕", "AI 生成文案", "三种风格可选"],
      targetAudience: "小红书内容创作者",
      value: "快速生成高质量小红书文案"
    },
    versions: {
      A: {
        style: "种草风",
        titles: [
          "我后悔太晚知道这个方法",
          "这个技巧真的太实用了",
          "90% 的人忽略了这个细节",
          "用了之后效率提升 3 倍",
          "闺蜜问我为什么最近这么厉害"
        ],
        hook: "姐妹们！今天一定要分享这个超级实用的技巧✨ 我之前也是各种踩坑，直到发现了这个方法，真的后悔没有早点知道！😭",
        body: "📌 核心要点：\n• 第一步：理解视频核心内容\n• 第二步：提炼关键信息点\n• 第三步：用口语化表达分享\n\n💡 小技巧：多用 emoji 增加亲和力，但不要过度哦～\n\n🔥 最重要的是真实感，让读者觉得你就是在使用后真心推荐！",
        cta: "觉得有用记得点赞 + 收藏⭐ 不然划走就找不到了！\n\n你们还有什么想了解的？评论区告诉我👇",
        hashtags: ["#小红书干货", "#效率提升", "#生活技巧", "#实用技巧", "#经验分享"],
        coverText: "超实用技巧！",
        commentQuestion: "你们有什么好用的小技巧？"
      },
      B: {
        style: "干货风",
        titles: [
          "完整教程来了！建议收藏",
          "一篇讲清楚这个方法",
          "新手必看的全流程指南",
          "超详细步骤拆解",
          "看完就能上手的教程"
        ],
        hook: "很多人问我这个方法具体怎么操作，今天出一期完整教程📝 从 0 到 1 手把手教你，建议先马住慢慢看！",
        body: "【Step 1】分析内容核心\n找出视频的主要观点和亮点\n\n【Step 2】提炼关键卖点\n总结 3-5 个最容易吸引人的点\n\n【Step 3】调整表达风格\n根据内容类型选择合适的语气\n\n【Step 4】生成文案\n按照标题 +Hook+ 正文+CTA+ 标签结构",
        cta: "干货不易，记得点赞支持一下💪\n\n有什么问题可以在评论区提问，我会尽量回复大家！",
        hashtags: ["#教程", "#小红书教程", "#干货分享", "#学习方法", "#技能提升"],
        coverText: "完整教程",
        commentQuestion: "还有什么想了解的？"
      },
      C: {
        style: "真实分享风",
        titles: [
          "亲测有效才来分享",
          "我的真实使用感受",
          "试了很多次才总结出来",
          "说说我的真实经历",
          "这个真的帮到我了"
        ],
        hook: "说实话，一开始我也是抱着试试看的心态🤷‍♀️ 结果用了几次后发现真的有用！今天来跟你们分享一下我的真实感受～",
        body: "我之前也走过不少弯路，试过各种方法都不太行😅\n\n后来慢慢摸索出这套方法，亲测确实好用！\n\n最大的感受就是：\n✅ 节省了很多时间\n✅ 内容质量提高了\n✅ 发出去反馈也不错\n\n关键是操作简单，新手也能快速上手👌",
        cta: "如果对你有帮助，记得给我点个赞哦💕\n\n你们有什么好用的方法也欢迎分享在评论区～",
        hashtags: ["#真实分享", "#亲测有效", "#使用感受", "#经验分享", "#小红书日常"],
        coverText: "亲测有效",
        commentQuestion: "你们有什么心得？"
      }
    },
    compliance: {
      hasFabrication: false,
      lowConfidenceParts: ["演示模式，未分析实际内容"],
      warnings: ["请配置 API Key 获取真实分析"],
      contentScore: {
        engagement: 80,
        value: 70,
        authenticity: 100
      }
    }
  };
}

// ============================================================
// Server Startup
// ============================================================

async function startServer() {
  try {
    // Initialize database
    await db.init();
    console.log('Database initialized');

    // Initialize Firebase Admin
    initFirebaseAdmin();

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Xiaohongshu Content Generator v2.0`);
      console.log(`📺 Server running at http://localhost:${PORT}`);
      console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/stats`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
      console.log(`\nFeatures:`);
      console.log(`  - YouTube caption extraction`);
      console.log(`  - Job-based processing with status tracking`);
      console.log(`  - Transcript caching for faster re-processing`);
      console.log(`  - JSON output format`);
      console.log(`  - Firebase Authentication (Google + Facebook)`);
      console.log(`  - Protected API endpoints`);
      console.log(`\nAuth Setup:`);
      if (process.env.FIREBASE_PROJECT_ID) {
        console.log(`  ✅ Firebase configured for project: ${process.env.FIREBASE_PROJECT_ID}`);
      } else {
        console.log(`  ⚠️  Firebase not configured - running in demo mode`);
        console.log(`     Set FIREBASE_PROJECT_ID to enable authentication`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
