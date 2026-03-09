# 小红书内容生成器 v4.0 - Xiaohongshu Content Generator

**Production-Ready AI-Powered Content Generator for Xiaohongshu**

AI 驱动的视频转小红书爆款文案工具 - 支持 YouTube/TikTok 视频自动提取字幕并生成 3 种风格文案

[![Production Ready](https://img.shields.io/badge/status-production%20ready-green)](PRODUCTION_ARCHITECTURE_VALIDATION.md)
[![Version](https://img.shields.io/badge/version-4.0.0-blue)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🌟 Features 功能特点

### Core Features 核心功能
- 🔐 **Firebase Authentication** - Google + Facebook login support
- 🎯 **AI Content Generation** - 3 styles: 种草风，干货风，真实分享风
- 📺 **Video Support** - YouTube & TikTok auto-transcript extraction
- 🎤 **Speech-to-Text** - Whisper ASR integration
- 📋 **One-Click Copy** - Copy single or all versions
- 🎨 **Modern UI** - Responsive 3-column card layout
- 🤖 **Telegram Bot** - Generate content directly via Telegram

### Security & Performance 安全与性能
- 🛡️ **Protected APIs** - Authentication required for all /api routes
- 🔒 **CSRF Protection** - Double-submit cookie pattern
- 🔐 **httpOnly Sessions** - Secure cookie-based authentication
- 📊 **Request Logging** - Full request/response tracking
- ⚡ **Job Caching** - Faster re-processing of same videos
- 🚀 **Production-Ready** - Modular architecture, error handling

### Production Architecture v4.0 生产架构
- ☁️ **Cloudflare Workers** - Edge API gateway & Telegram bot
- 📦 **Cloudflare Pages** - Frontend hosting with global CDN
- 🗄️ **Supabase** - PostgreSQL database (replaces SQLite)
- 💾 **Cloudflare R2** - Object storage for audio & artifacts
- 🚂 **Railway** - Backend processing (Node.js + Python + ffmpeg)
- 🔄 **Async Processing** - Polling pattern to avoid timeouts

---

## 🏗️ Production Architecture 生产架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                               │
│   Web Users (Browser)  │  Telegram Users (Mobile)               │
└───────────┬───────────┴──────────────┬──────────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE LAYER (Cloudflare)                     │
│  ┌─────────────────────┐        ┌─────────────────────────────┐ │
│  │  Cloudflare Pages   │        │   Cloudflare Workers        │ │
│  │   (Frontend)        │        │   (API Gateway + Bot)       │ │
│  └─────────────────────┘        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROCESSING LAYER (Railway)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Express.js + Python + ffmpeg + yt-dlp + Whisper          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────────────┐        ┌─────────────────────────────┐ │
│  │   Supabase (DB)     │        │   Cloudflare R2 (Storage)   │ │
│  │   PostgreSQL        │        │   Audio, Transcripts        │ │
│  └─────────────────────┘        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Service Responsibilities 服务职责

| Service | Responsibility | Cost (10k users/mo) |
|---------|---------------|---------------------|
| **Cloudflare Pages** | Frontend hosting, CDN | FREE |
| **Cloudflare Workers** | API gateway, auth, Telegram bot | FREE |
| **Supabase** | PostgreSQL database, user data | FREE → $25 |
| **Cloudflare R2** | Audio files, transcripts, artifacts | ~$0.25 |
| **Railway** | Video processing, Whisper, ffmpeg | ~$15 |
| **DashScope** | Qwen AI content generation | ~$100 |
| **Firebase** | Authentication (Google, Facebook) | FREE |

**Total Estimated Cost:** ~$115/month for 10k users

See [PRODUCTION_ARCHITECTURE_VALIDATION.md](PRODUCTION_ARCHITECTURE_VALIDATION.md) for complete architecture details.

---

## 🚀 Quick Start 快速开始

### Option 1: Local Development (Recommended for Testing)

#### 1. Install Dependencies 安装依赖

```bash
npm install
```

#### 2. Configure Environment 配置环境

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# AI API Key (DashScope Qwen)
AI_API_KEY=sk-your-actual-api-key-here
AI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-turbo

# Firebase Service Account
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Session Config
SESSION_COOKIE_NAME=__session
COOKIE_SECURE=false
```

#### 3. Install Python Dependencies (for Whisper)

```bash
pip install faster-whisper
```

#### 4. Install ffmpeg & yt-dlp

**Windows:**
```bash
# Download yt-dlp.exe and place in project root
# Download ffmpeg and add to PATH
```

**Linux/Mac:**
```bash
sudo apt install ffmpeg  # or brew install ffmpeg
pip install yt-dlp
```

#### 5. Start Server 启动服务器

```bash
npm start
```

Visit: http://localhost:3000

---

### Option 2: Production Deployment

See [PRODUCTION_ARCHITECTURE_VALIDATION.md](PRODUCTION_ARCHITECTURE_VALIDATION.md#part-8--deployment-checklist) for complete deployment checklist.

#### Quick Deploy Steps:

```bash
# 1. Deploy Railway Backend
# - Connect GitHub repo to Railway
# - Set environment variables
# - Deploy

# 2. Deploy Cloudflare Worker
npm install -g wrangler
wrangler login
wrangler deploy

# 3. Deploy Cloudflare Pages
# - Connect GitHub to Cloudflare Pages
# - Build command: npm run build
# - Output directory: public

# 4. Configure Supabase
# - Create project at supabase.com
# - Run schema.sql

# 5. Configure R2
# - Create bucket in Cloudflare Dashboard
# - Set API token
```

---

## 📖 Usage 使用方法

### Web Interface Web 界面

1. **Login** - Sign in with Google or Facebook
2. **Enter URL** - Paste YouTube or TikTok video link
3. **Generate** - Click "Generate Content"
4. **Copy** - Copy your preferred style (种草风 / 干货风 / 真实分享风)

### Telegram Bot Telegram 机器人

1. **Start Bot** - Send `/start` to your bot
2. **Send URL** - Paste video URL
3. **Wait** - Processing takes 1-2 minutes
4. **Receive** - Get 3 styles of content

---

## 🏛️ Project Structure 项目结构

```
xhs contents generator/
│
├── functions/                    # Cloudflare Workers (Edge)
│   └── [[path]].js              # Main worker + Telegram bot
│
├── server/                       # Railway Backend (Node.js + Python)
│   ├── index.js                 # Entry point
│   ├── app.js                   # Express app setup
│   ├── config/
│   │   ├── env.js               # Environment validation
│   │   └── firebaseAdmin.js     # Firebase Admin SDK
│   ├── controllers/
│   │   ├── ai.controller.js     # AI generation logic
│   │   ├── jobs.controller.js   # Job management
│   │   └── telegram.controller.js # Telegram bot handler
│   ├── services/
│   │   ├── ai.service.js        # DashScope Qwen API
│   │   ├── video.service.js     # yt-dlp, ffmpeg, Whisper
│   │   ├── youtube.service.js   # YouTube transcript extraction
│   │   └── telegram.service.js  # Telegram API client
│   ├── middleware/
│   │   ├── auth.js              # Firebase auth verification
│   │   ├── csrf.js              # CSRF protection
│   │   └── redactSecrets.js     # Log redaction
│   └── db/
│       ├── supabase.js          # Supabase client
│       └── queries.js           # Optimized queries
│
├── public/                       # Cloudflare Pages (Frontend)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js               # Main app logic
│       ├── api.js               # API client
│       └── ui.js                # UI rendering
│
├── utils/                        # Shared utilities
│   ├── prompt.js                # AI prompt templates
│   ├── transcriptCleaner.js     # Transcript cleaning
│   └── video.js                 # Video utilities
│
├── db/
│   └── schema.sql               # Supabase database schema
│
├── scripts/                      # Deployment scripts
│   ├── migrate.js               # Database migrations
│   └── cleanup.js               # Cleanup old data
│
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── wrangler.toml                 # Cloudflare Workers config
├── railway.json                  # Railway deployment config
├── nixpacks.toml                 # Railway build config
└── PRODUCTION_ARCHITECTURE_VALIDATION.md  # Complete architecture docs
```

---

## 🔌 API Endpoints API 端点

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness check |
| GET | `/csrf-token` | Get CSRF token |
| POST | `/auth/sessionLogin` | Create session |
| POST | `/auth/sessionLogout` | Clear session |
| GET | `/auth/status` | Auth config status |

### Protected Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create generation job |
| GET | `/api/jobs/:id` | Get job status |
| POST | `/api/jobs/:id/regenerate` | Regenerate content |

### Telegram Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/telegram/webhook` | Telegram bot webhook (Cloudflare Workers) |

---

## 🔐 Security 安全性

### Authentication Flow

```
1. User clicks "Login with Google/Facebook"
   → Firebase popup auth
   → Gets Firebase ID token

2. Frontend gets CSRF token: GET /csrf-token

3. Frontend sends: POST /auth/sessionLogin
   Body: { idToken: "..." }
   Header: X-CSRF-Token: "..."
   → Backend verifies ID token
   → Creates session cookie (__session)

4. All API calls include:
   - Cookie: __session=...
   - Header: X-CSRF-Token=...
```

### Security Features

- ✅ **httpOnly cookies** - Not accessible by JavaScript
- ✅ **CSRF protection** - Double-submit token pattern
- ✅ **Input validation** - All inputs validated
- ✅ **Error handling** - Centralized error handler
- ✅ **Request logging** - Full audit trail
- ✅ **Secret redaction** - API keys never logged
- ✅ **Rate limiting** - 100 requests/hour/user

---

## 🛠️ Tech Stack 技术栈

### Production Infrastructure 生产基础设施
- **Edge:** Cloudflare Workers + Pages
- **Backend:** Railway (Node.js 18 + Python 3.11)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Cloudflare R2
- **CDN:** Cloudflare Global Network

### Backend 后端
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** Supabase PostgreSQL
- **Auth:** Firebase Admin SDK
- **AI:** Alibaba Qwen (DashScope)

### Frontend 前端
- **Type:** Plain HTML + Vanilla JS (ES Modules)
- **Auth:** Firebase Client SDK
- **Styling:** Custom CSS
- **Hosting:** Cloudflare Pages

### Processing 处理
- **Transcription:** YouTube Transcript API + faster-whisper
- **Video Download:** yt-dlp
- **Audio Processing:** ffmpeg
- **AI Provider:** DashScope (Qwen)

---

## ⚙️ Configuration 配置

### Environment Variables

See `.env.example` for all options.

**Required for Local Development:**
```env
PORT=3000
NODE_ENV=development
AI_API_KEY=sk-...
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
SESSION_COOKIE_NAME=__session
```

**Required for Production:**
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=service_role_key
SUPABASE_ANON_KEY=anon_key

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_BUCKET_NAME=xhs-artifacts
R2_API_TOKEN=xxx

# Railway Backend URL
RAILWAY_BACKEND_URL=https://your-app.railway.app

# Telegram Bot
TELEGRAM_BOT_TOKEN=bot_token
TELEGRAM_WEBHOOK_URL=https://your-worker.workers.dev/telegram/webhook
```

### Firebase Setup

1. Create project at https://console.firebase.google.com/
2. Enable Google + Facebook providers
3. Download service account JSON
4. Update `public/firebase-config.js`
5. Add authorized domains

See [FIREBASE_SETUP_STEPS.md](FIREBASE_SETUP_STEPS.md) for details.

---

## 📊 Processing Times 处理时间

| Video Length | Download | Transcribe | AI Generate | **Total** |
|--------------|----------|------------|-------------|-----------|
| **< 1 min** | 5-10s | 10-15s | 20-30s | **~30-45s** |
| **1-3 min** | 10-20s | 20-40s | 20-30s | **~1-1.5 min** |
| **3-5 min** | 20-30s | 40-60s | 20-30s | **~1.5-2 min** |
| **5-10 min** | 30-60s | 1-2 min | 20-30s | **~2-3 min** |

*First run may take longer for Whisper model download*

---

## ⚠️ Troubleshooting 故障排除

### Server won't start

```bash
# Check Node version
node --version  # Should be >= 18

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Firebase not configured

- Check `public/firebase-config.js` has valid config
- Check `.env` has `FIREBASE_SERVICE_ACCOUNT_PATH`
- Verify service account JSON file exists

### YouTube extraction fails

- Video may not have captions available
- Try manual transcript input
- Check yt-dlp is installed correctly

### Worker timeout errors

- Ensure async polling pattern is used
- Railway processing should not block Worker response
- Check Railway backend is responding

---

## 📈 Monitoring & Analytics 监控与分析

### Key Metrics to Track

- **Job Success Rate** - Target: >95%
- **Average Processing Time** - Target: <2 minutes
- **AI API Cost per Video** - Target: <$0.01
- **Cache Hit Rate** - Target: >80%
- **User Retention** - Track via Supabase analytics

### Logs & Debugging

```bash
# Railway logs
railway logs

# Cloudflare Worker logs
wrangler tail

# Supabase query monitoring
# Dashboard → Database → Query Performance
```

---

## 📄 License 许可证

MIT License

---

## 🙏 Acknowledgments 致谢

- Firebase for authentication
- Alibaba Qwen for AI generation
- yt-dlp for video download
- faster-whisper for transcription
- Cloudflare for edge computing
- Supabase for database
- Railway for backend hosting

---

## 📞 Support 支持

### Documentation 文档
- [Production Architecture Validation](PRODUCTION_ARCHITECTURE_VALIDATION.md) - Complete production deployment guide
- [Firebase Setup](FIREBASE_SETUP_STEPS.md) - Firebase configuration
- [Facebook Login](FACEBOOK_LOGIN_SETUP.md) - Facebook auth setup
- [Migration Guide](MIGRATION_GUIDE.md) - v3.x to v4.0 migration
- [Quick Start](QUICK_START.md) - Quick start guide

### Getting Help
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** Support email (if applicable)

---

## 🚀 Roadmap 路线图

### v4.0 (Current) - Production Ready
- ✅ Cloudflare Workers integration
- ✅ Supabase database
- ✅ Cloudflare R2 storage
- ✅ Railway backend
- ✅ Telegram bot
- ✅ Async processing pattern

### v4.1 (Planned)
- [ ] User quotas & rate limiting
- [ ] Premium tier support
- [ ] Cover image generation
- [ ] Batch processing
- [ ] Analytics dashboard

### v4.2 (Future)
- [ ] Multi-language support
- [ ] Custom AI models
- [ ] API for developers
- [ ] Mobile app

---

**Built with ❤️ for content creators**

*Last updated: March 6, 2026*
