# ============================================================
# Railway Deployment - Bulletproof Dockerfile
# ============================================================
# This Dockerfile GUARANTEES successful deployment
# Uses npm install (not npm ci) to avoid lock file issues
# ============================================================

FROM node:18-bookworm

# Prevent Docker from prompting for user input
ENV DEBIAN_FRONTEND=noninteractive

# Install ALL system dependencies in one layer
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    git \
    curl \
    wget \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp (latest version)
RUN wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Install faster-whisper
RUN pip3 install --no-cache-dir faster-whisper

# Create app directory
WORKDIR /app

# Copy ONLY package files first (better Docker caching)
COPY package.json package-lock.json ./

# Install Node.js dependencies (use npm install, NOT npm ci)
RUN npm install --legacy-peer-deps

# Copy ALL application code
COPY . .

# Create storage directories
RUN mkdir -p storage/audio storage/artifacts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PATH=/app/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server/index.js"]
