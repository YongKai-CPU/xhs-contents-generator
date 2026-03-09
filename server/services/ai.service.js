/**
 * AI Service
 * Handles all AI/LLM interactions for content generation
 */

const config = require('../config/env');
const { generatePrompt, parseResponse, validateOutput, formatForFrontend } = require('../../utils/prompt');
const { generateTelegramPrompt, parseTelegramResponse, formatTelegramDisplay } = require('../../utils/telegramPrompt');
const { generateOptimizedPrompt, parseOptimizedResponse, formatOptimizedDisplay } = require('../../utils/optimizedPrompt');

/**
 * Generate Xiaohongshu content from video transcript (TELEGRAM VERSION - OPTIMIZED)
 * Uses optimized prompt for more natural, human-like content
 * @param {string} videoUrl - Source video URL
 * @param {string} transcript - Video transcript text
 * @returns {Promise<object>} Generated content for Telegram
 */
async function generateForTelegram(videoUrl, transcript) {
  const apiKey = config.ai.apiKey;

  // Demo mode
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.log('Demo mode - returning sample output for Telegram');
    return getTelegramDemoOutput(videoUrl, transcript);
  }

  try {
    const baseURL = config.ai.baseURL;
    const model = 'qwen-turbo';

    // Use OPTIMIZED prompt for more natural content
    const prompt = generateOptimizedPrompt(transcript);

    console.log('🤖 Calling AI API with OPTIMIZED prompt...');
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
            content: '你是一名专业的小红书内容创作者，输出必须是自然、真实的 JSON 格式'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,  // Slightly higher for more creative content
        max_tokens: 2500   // Increased for longer content
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'AI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('=== AI OPTIMIZED RESPONSE RECEIVED ===');
    console.log('Content length:', content.length);

    // Parse optimized response
    const output = parseOptimizedResponse(content);

    if (!output) {
      console.error('Failed to parse optimized response, using fallback');
      return getTelegramDemoOutput(videoUrl, transcript);
    }

    console.log('✅ Optimized AI content generated successfully!');
    console.log('Topic:', output.topic);
    console.log('Styles:', output.styles ? output.styles.length : 0);

    return output;

  } catch (error) {
    console.error('Telegram AI generation error:', error);
    return getTelegramDemoOutput(videoUrl, transcript);
  }
}

/**
 * Get demo output for Telegram
 */
function getTelegramDemoOutput(videoUrl, transcript) {
  return {
    topic: '视频内容分析',
    points: ['AI 生成的示例内容', '配置 API Key 获取真实内容'],
    styles: [
      {
        name: '种草风',
        title: '这个视频太棒了！',
        content: '刚刚看了这个视频，收获满满！\n\n视频里的内容非常实用，让我学到了很多新知识。\n\n强烈推荐给大家，相信也会对你有帮助！\n\n#视频推荐 #实用技巧 #学习成长'
      },
      {
        name: '干货风',
        title: '完整教程来了！',
        content: '【Step 1】分析内容核心\n\n【Step 2】提炼关键卖点\n\n【Step 3】调整表达风格\n\n干货不易，记得点赞支持！\n\n#教程 #干货分享 #学习方法'
      },
      {
        name: '真实分享风',
        title: '亲测有效！',
        content: '说实话，一开始我也是抱着试试看的心态。\n\n结果发现真的有用！\n\n如果对你有帮助，记得点赞哦～\n\n#真实分享 #亲测有效 #经验分享'
      }
    ]
  };
}

/**
 * Generate Xiaohongshu content from video transcript
 * @param {string} videoUrl - Source video URL
 * @param {string} transcript - Video transcript text
 * @param {object} options - Generation options
 * @returns {Promise<object>} Generated content
 */
async function generateXiaohongshuContent(videoUrl, transcript, options = {}) {
  const apiKey = config.ai.apiKey;
  
  // Demo mode - return sample output if no API key
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.log('Demo mode - returning sample output');
    return getDemoOutput(videoUrl, transcript);
  }

  try {
    const baseURL = config.ai.baseURL;
    const model = options.model || config.ai.model;

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
        max_tokens: 4000  // Increased to allow full JSON response
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'AI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('=== AI RESPONSE RECEIVED ===');
    console.log('Content length:', content.length);
    console.log('Content preview:', content.substring(0, 500));

    // Parse and validate output
    const output = parseResponse(content);

    if (!output) {
      console.error('=== AI RESPONSE PARSING FAILED ===');
      console.error('Raw AI response (first 1000 chars):', content.substring(0, 1000));
      console.error('Raw AI response (last 500 chars):', content.substring(content.length - 500));
      
      // Try to extract partial content instead of using demo
      console.warn('Attempting to extract partial AI content...');
      const partialOutput = extractPartialContent(content);
      
      if (partialOutput) {
        console.log('✅ Successfully extracted partial AI content!');
        return partialOutput;
      }
      
      // Only use demo as last resort
      console.warn('Using demo content as last resort fallback');
      return getDemoOutput(videoUrl, transcript);
    }

    console.log('=== AI RESPONSE PARSED SUCCESSFULLY ===');
    console.log('Summary:', output.summary);
    console.log('Number of cards:', output.cards ? output.cards.length : 0);

    const validation = validateOutput(output);
    if (!validation.valid) {
      console.warn('Output validation warnings:', validation.errors);
    }

    // Format for frontend
    const formattedOutput = formatForFrontend(output);

    return formattedOutput;

  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Extract partial content from incomplete AI response
 */
function extractPartialContent(content) {
  try {
    // Try to find and extract the summary
    const summaryMatch = content.match(/"mainTopic":\s*"([^"]*)"/);
    const corePointsMatch = content.match(/"corePoints":\s*\[([\s\S]*?)\]/);
    
    // Try to extract any complete card objects
    const cardsMatch = content.match(/"cards":\s*\[([\s\S]*?)\]/);
    
    if (summaryMatch || cardsMatch) {
      const partial = {
        summary: {
          mainTopic: summaryMatch ? summaryMatch[1] : 'AI content generated',
          corePoints: corePointsMatch ? 
            corePointsMatch[1].match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, '')) : 
            ['Content extracted from video']
        },
        cards: []
      };
      
      // Try to extract individual cards
      if (cardsMatch) {
        const cardTexts = cardsMatch[1].split('"style":');
        for (let i = 1; i < Math.min(cardTexts.length, 4); i++) {
          const cardText = cardTexts[i];
          const styleMatch = cardText.match(/^"([^"]*)"/);
          const titleMatch = cardText.match(/"title":\s*"([^"]*)"/);
          const bodyMatch = cardText.match(/"body":\s*"([^"]*)"/);
          
          if (styleMatch) {
            partial.cards.push({
              style: styleMatch[1],
              title: titleMatch ? titleMatch[1] : 'AI Generated Title',
              hook: ['AI generated content based on video'],
              body: bodyMatch ? bodyMatch[1].substring(0, 500) + '...' : 'Content extracted from video transcript',
              cta: ['Like and save this post!', 'Comment your thoughts!', 'Follow for more!'],
              hashtags: ['#AI 生成', '#视频内容', '#小红书'],
              key_takeaways: ['AI extracted key point'],
              target_audience: ['Video viewers'],
              caution: ['AI generated content'],
              confidence: 60,
              source_coverage: 70
            });
          }
        }
      }
      
      if (partial.cards.length > 0) {
        return partial;
      }
    }
    
    return null;
  } catch (e) {
    console.error('Extract partial content error:', e.message);
    return null;
  }
}

/**
 * Generate summary from text
 * @param {string} text - Text to summarize
 * @returns {Promise<object>} Summary
 */
async function generateSummary(text) {
  const apiKey = config.ai.apiKey;
  
  if (!apiKey) {
    return { summary: 'Demo mode - no API key configured' };
  }

  try {
    const response = await fetch(`${config.ai.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [
          {
            role: 'system',
            content: 'Summarize the following text concisely.'
          },
          {
            role: 'user',
            content: text.substring(0, 4000) // Limit input size
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    return { summary: data.choices[0].message.content };

  } catch (error) {
    console.error('Summary generation error:', error);
    throw error;
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
    cards: [
      {
        style: "种草风",
        title: "我后悔太晚知道这个方法",
        hook: "姐妹们！今天一定要分享这个超级实用的技巧✨",
        body: "📌 核心要点：\n• 第一步：理解视频核心内容\n• 第二步：提炼关键信息点\n• 第三步：用口语化表达分享",
        cta: "觉得有用记得点赞 + 收藏⭐",
        hashtags: ["#小红书干货", "#效率提升", "#生活技巧"],
        key_takeaways: ["实用技巧", "易于上手", "效果显著"],
        target_audience: ["内容创作者", "自媒体人", "营销人员"],
        caution: ["不要过度使用 emoji", "保持真实感"],
        confidence: 100,
        source_coverage: 100
      },
      {
        style: "干货风",
        title: "完整教程来了！建议收藏",
        hook: "很多人问我这个方法具体怎么操作，今天出一期完整教程📝",
        body: "【Step 1】分析内容核心\n【Step 2】提炼关键卖点\n【Step 3】调整表达风格\n【Step 4】生成文案",
        cta: "干货不易，记得点赞支持一下💪",
        hashtags: ["#教程", "#小红书教程", "#干货分享"],
        key_takeaways: ["完整流程", "步骤清晰", "可复制"],
        target_audience: ["新手", "学习者", "进阶用户"],
        caution: ["按步骤操作", "注意细节"],
        confidence: 100,
        source_coverage: 100
      },
      {
        style: "真实分享风",
        title: "亲测有效才来分享",
        hook: "说实话，一开始我也是抱着试试看的心态🤷‍♀️",
        body: "我之前也走过不少弯路，试过各种方法都不太行😅\n后来慢慢摸索出这套方法，亲测确实好用！",
        cta: "如果对你有帮助，记得给我点个赞哦💕",
        hashtags: ["#真实分享", "#亲测有效", "#使用感受"],
        key_takeaways: ["真实体验", "避坑指南", "心得分享"],
        target_audience: ["普通用户", "初学者", "探索者"],
        caution: ["因人而异", "需要实践"],
        confidence: 100,
        source_coverage: 100
      }
    ]
  };
}

module.exports = {
  generateXiaohongshuContent,
  generateSummary,
  getDemoOutput,
  generateForTelegram,
  getTelegramDemoOutput,
  generateOptimizedPrompt,
  parseOptimizedResponse,
  formatOptimizedDisplay
};
