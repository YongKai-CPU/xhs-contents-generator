# ============================================================
# Dockerfile for Render Deployment
# Xiaohongshu Content Generator
# ============================================================
# Fixed version with working faster-whisper installation
# ============================================================

# Use Node.js 18 with Python 3.11 (bullseye has better compatibility)
FROM node:18-bullseye

# Prevent Docker from prompting for user input
ENV DEBIAN_FRONTEND=noninteractive

# ============================================================
# Install System Dependencies
# ============================================================
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    git \
    curl \
    wget \
    ca-certificates \
    libgomp1 \
    libjemalloc2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================
# Upgrade pip (required for faster-whisper)
# ============================================================
RUN pip3 install --upgrade pip setuptools wheel

# ============================================================
# Install faster-whisper (compatible version)
# ============================================================
RUN pip3 install --no-cache-dir \
    faster-whisper==0.10.1 \
    torch \
    torchvision \
    torchaudio

# ============================================================
# Install yt-dlp
# ============================================================
RUN wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# ============================================================
# Set Working Directory
# ============================================================
WORKDIR /app

# ============================================================
# Copy Package Files
# ============================================================
COPY package*.json ./

# ============================================================
# Install Node.js Dependencies
# ============================================================
RUN npm install --legacy-peer-deps

# ============================================================
# Copy Application Code
# ============================================================
COPY . .

# ============================================================
# Create Storage Directories
# ============================================================
RUN mkdir -p storage/audio storage/artifacts

# ============================================================
# Set Environment Variables
# ============================================================
ENV NODE_ENV=production
ENV PORT=3000
ENV PATH=/app/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV PYTHONUNBUFFERED=1

# ============================================================
# Expose Port
# ============================================================
EXPOSE 3000

# ============================================================
# Health Check
# ============================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# ============================================================
# Start the Application
# ============================================================
CMD ["node", "server/index.js"]
