/**
 * Video Utilities - Extract video ID and detect platform
 */

/**
 * Detect video platform from URL
 */
function detectPlatform(url) {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  } else if (lowerUrl.includes('tiktok.com')) {
    return 'tiktok';
  } else if (lowerUrl.includes('bilibili.com')) {
    return 'bilibili';
  }
  return 'unknown';
}

/**
 * Extract video ID from YouTube URL
 */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /youtube\.com\/v\/([^&\s]+)/,
    /youtube\.com\/shorts\/([^&\s]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract video ID from TikTok URL
 */
function extractTikTokId(url) {
  const patterns = [
    /tiktok\.com\/@[^\/]+\/video\/(\d+)/,
    /tiktok\.com\/v\/(\d+)/,
    /vm\.tiktok\.com\/([^/\s]+)/,
    /vt\.tiktok\.com\/([^/\s]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract video ID from URL (auto-detect platform)
 */
function extractVideoId(url) {
  const platform = detectPlatform(url);
  
  switch (platform) {
    case 'youtube':
      return extractYouTubeId(url);
    case 'tiktok':
      return extractTikTokId(url);
    default:
      return null;
  }
}

/**
 * Generate cache key from video ID and platform
 */
function generateCacheKey(videoId, platform) {
  return `${platform}:${videoId}`;
}

module.exports = {
  detectPlatform,
  extractVideoId,
  extractYouTubeId,
  extractTikTokId,
  generateCacheKey
};
