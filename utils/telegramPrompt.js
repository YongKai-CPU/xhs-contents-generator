/**
 * Telegram-Specific AI Prompt
 * Simpler, shorter format optimized for Telegram display
 */

const TELEGRAM_PROMPT = `你是一个小红书文案创作者，专门为 Telegram 用户生成简短易懂的内容。

【输入 transcript】
{TRANSCRIPT}

【任务】
基于 transcript 生成 3 种风格的小红书文案，每种风格简短精炼。

【输出格式 - 必须严格遵守】
只输出 JSON，格式如下：
{
  "topic": "视频主题（20 字以内）",
  "points": ["要点 1", "要点 2", "要点 3"],
  "styles": [
    {
      "name": "种草风",
      "title": "标题（15 字以内）",
      "content": "内容（500 字以内，用\\\\n 分段）"
    },
    {
      "name": "干货风",
      "title": "标题（15 字以内）",
      "content": "内容（500 字以内，用\\\\n 分段）"
    },
    {
      "name": "真实分享风",
      "title": "标题（15 字以内）",
      "content": "内容（500 字以内，用\\\\n 分段）"
    }
  ]
}

【要求】
1. 只输出 JSON，不要任何其他文本
2. topic 必须简短（20 字以内）
3. 每个 content 必须 500 字以内
4. 用\\\\n 表示换行，不要用实际换行符
5. 不要有 markdown、代码块等标记
6. JSON 必须完整，不能截断

【风格说明】
- 种草风：推荐口吻，热情洋溢
- 干货风：教程口吻，步骤清晰
- 真实分享风：个人经历，真实感受`;

/**
 * Generate prompt for Telegram
 */
function generateTelegramPrompt(transcript) {
  return TELEGRAM_PROMPT.replace('{TRANSCRIPT}', transcript || '无内容');
}

/**
 * Parse Telegram JSON response
 */
function parseTelegramResponse(content) {
  try {
    // Remove any markdown
    let clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract JSON
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      return null;
    }
    
    clean = clean.substring(start, end + 1);
    
    // Make single line
    clean = clean.replace(/\n/g, ' ').replace(/\r/g, '');
    
    return JSON.parse(clean);
  } catch (e) {
    console.error('Failed to parse Telegram response:', e.message);
    return null;
  }
}

/**
 * Format Telegram response for display
 */
function formatTelegramDisplay(data) {
  if (!data) return null;
  
  const message = `✅ *Content Generated!*\n\n` +
    `📊 *Summary:*\n${data.topic || 'No summary'}\n\n` +
    `💡 *Key Points:*\n${(data.points || []).join(' • ')}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n`;
  
  const styles = (data.styles || []).map((style, index) => {
    const emoji = index === 0 ? '🌸' : index === 1 ? '📚' : '💬';
    return `${emoji} *${style.name}*\n\n` +
      `📝 ${style.title}\n\n` +
      `${style.content}\n\n` +
      `━━━━━━━━━━━━━━━━━━`;
  }).join('\n\n');
  
  return message + styles;
}

module.exports = {
  TELEGRAM_PROMPT,
  generateTelegramPrompt,
  parseTelegramResponse,
  formatTelegramDisplay
};
