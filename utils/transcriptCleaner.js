/**
 * Transcript Cleaner - Clean and format ASR output
 */

/**
 * Clean transcript from ASR output
 * @param {string|Array} rawInput - Raw transcript text or segments array
 * @returns {string} - Cleaned transcript
 */
function cleanTranscript(rawInput) {
  let text = '';
  
  // Handle array of segments (from Whisper)
  if (Array.isArray(rawInput)) {
    text = rawInput.map(s => s.text || '').join(' ');
  } else {
    text = String(rawInput);
  }
  
  // Step 1: Remove timestamp markers
  text = text.replace(/\[\d{2}:\d{2}(:\d{2})?\]/g, '');
  text = text.replace(/\(\d{2}:\d{2}\)/g, '');
  
  // Step 2: Remove speaker labels
  text = text.replace(/^(Speaker \d+:|Host:|Guest:|\[.*?\]:)/gim, '');
  
  // Step 3: Remove special characters (keep Chinese punctuation)
  text = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！？、；：""''（）【】《》…—\s.,!?;:'"()\[\]-]/g, '');
  
  // Step 4: Remove repeated words (stuttering)
  text = text.replace(/(\w+)\s+\1+/gi, '$1');
  
  // Step 5: Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Step 6: Add proper spacing after punctuation
  text = text.replace(/([,.!?:;,.!?])\s*(?=[^\s])/g, '$1 ');
  
  // Step 7: Split into paragraphs by sentence endings
  const sentences = text.split(/([.!?。！？])/g);
  const paragraphs = [];
  let current = '';
  
  for (let i = 0; i < sentences.length; i++) {
    current += sentences[i];
    
    // Start new paragraph every 3-5 sentences or ~100 characters
    if (current.length >= 100 || (i % 6 === 0 && current.length >= 50)) {
      paragraphs.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) {
    paragraphs.push(current.trim());
  }
  
  // Step 8: Filter out very short paragraphs
  const filteredParagraphs = paragraphs.filter(p => p.length >= 10);
  
  return filteredParagraphs.join('\n\n');
}

/**
 * Extract key points from transcript
 */
function extractKeyPoints(transcript, maxPoints = 5) {
  const sentences = transcript.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
  
  // Simple extractive summarization - take first N meaningful sentences
  const keyPoints = sentences
    .filter(s => s.trim().length >= 10 && s.trim().length <= 100)
    .slice(0, maxPoints)
    .map(s => s.trim());
  
  return keyPoints;
}

/**
 * Detect language of transcript
 */
function detectLanguage(transcript) {
  const chineseChars = (transcript.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = transcript.replace(/\s/g, '').length;
  
  if (chineseChars / totalChars > 0.3) {
    return 'zh';
  }
  return 'en';
}

/**
 * Get transcript statistics
 */
function getStats(transcript) {
  const words = transcript.split(/\s+/).filter(w => w.length > 0);
  const sentences = transcript.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
  
  return {
    charCount: transcript.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: Math.round(transcript.length / Math.max(sentences.length, 1)),
    estimatedDuration: Math.round(words.length / 2.5) // ~2.5 words per second
  };
}

module.exports = {
  cleanTranscript,
  extractKeyPoints,
  detectLanguage,
  getStats
};
