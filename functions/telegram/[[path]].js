/**
 * Telegram Bot Handler - Cloudflare Pages Functions
 * Optimized version with:
 * - Single message for all content (no duplicates)
 * - Helpful copy button instructions
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

// Get bot token from environment
function getBotToken(env) {
  return env.TELEGRAM_BOT_TOKEN || '8714880125:AAE-h9fKlfNer5eyunzSHoUgY8fIo2aK9qU';
}

/**
 * Handle Telegram webhook - Pages Functions format
 */
export async function onRequest(context) {
  const { request, env, ctx } = context;
  const botToken = getBotToken(env);
  
  try {
    const update = await request.json();
    console.log('Telegram webhook:', JSON.stringify(update));

    // Process update
    if (update.message) {
      await handleMessage(update.message, botToken, env);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, botToken, env);
    }

    return Response.json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ ok: true }); // Always return ok to Telegram
  }
}

/**
 * Handle incoming message
 */
async function handleMessage(message, botToken, env) {
  const chatId = message.chat.id;
  const text = message.text;

  console.log(`Message from ${message.from.username}: ${text}`);

  // Handle commands
  if (text && text.startsWith('/')) {
    await handleCommand(chatId, text, botToken);
    return;
  }

  // Handle video URLs
  if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('tiktok.com'))) {
    await handleVideoUrl(chatId, text, botToken, env);
    return;
  }

  // Default response
  await sendMessage(botToken, chatId, `👋 Hello! I'm your Xiaohongshu Content Generator bot.

📌 *What I can do:*
• Generate 3 styles of Xiaohongshu content from video URLs
• Support YouTube and TikTok videos

🚀 *How to use:*
Just send me a YouTube or TikTok video URL!

💡 Or use /help to see available commands.`, { parse_mode: 'Markdown' });
}

/**
 * Handle commands
 */
async function handleCommand(chatId, command, botToken) {
  const cmd = command.split(' ')[0].toLowerCase();

  switch (cmd) {
    case '/start':
      await sendMessage(botToken, chatId, `👋 Welcome!

I'm your *Xiaohongshu Content Generator* bot.

🎯 *What I do:*
Transform YouTube & TikTok videos into viral Xiaohongshu content with 3 different styles:
• 🌸 种草风 (Recommendation style)
• 📚 干货风 (Tutorial style)
• 💬 真实分享风 (Authentic sharing style)

🚀 *How to use:*
Simply send me a YouTube or TikTok video URL!

💡 *Commands:*
/help - Show help
/status - Check job status`, { parse_mode: 'Markdown' });
      break;

    case '/help':
      await sendMessage(botToken, chatId, `📖 *Help & Commands*

*Generation:*
• Send a YouTube/TikTok URL to generate content
• I'll create 3 styles of Xiaohongshu content
• Processing takes 1-3 minutes

*Commands:*
/start - Start the bot
/help - Show this help
/status - Check job status

*Tips:*
• You can send video URLs directly
• I support both YouTube and TikTok
• Content is generated with 3 different styles`, { parse_mode: 'Markdown' });
      break;

    default:
      await sendMessage(botToken, chatId, `❓ Unknown command: ${cmd}\n\nUse /help to see available commands.`, { parse_mode: 'Markdown' });
  }
}

/**
 * Handle video URL
 */
async function handleVideoUrl(chatId, videoUrl, botToken, env) {
  // Send acknowledgment
  await sendMessage(botToken, chatId, `🚀 *Generation Started!*

🔗 Video: ${videoUrl}

⏳ Processing... This may take 1-2 minutes.`, { parse_mode: 'Markdown' });

  // Generate content (simplified for Cloudflare - uses demo content)
  // In production, you would call your AI API here
  const content = getDemoContent(videoUrl);
  
  // Send generated content (OPTIMIZED: single message)
  await sendGeneratedContent(botToken, chatId, content, 'demo-job-id');
}

/**
 * Send generated content - OPTIMIZED VERSION
 * Sends all content in ONE message (max 2 if too long)
 */
async function sendGeneratedContent(botToken, chatId, output, jobId) {
  // Format content as ONE clean message
  let message = `✅ *Content Generated!*\n\n`;
  
  // Add summary
  if (output.summary) {
    const s = output.summary;
    message += `📊 *Summary:*\n`;
    if (s.mainTopic) message += `${s.mainTopic}\n\n`;
    if (s.corePoints && s.corePoints.length > 0) {
      message += `💡 *Key Points:*\n${s.corePoints.join(' • ')}\n\n`;
    }
  }
  
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Add all 3 styles
  if (output.cards && Array.isArray(output.cards)) {
    output.cards.forEach((card, index) => {
      const emoji = index === 0 ? '🌸' : index === 1 ? '📚' : '💬';
      
      message += `${emoji} *${card.style}*\n\n`;
      
      if (card.title) message += `📝 ${card.title}\n\n`;
      if (card.hook) message += `${card.hook}\n\n`;
      if (card.body) message += `${card.body}\n\n`;
      if (card.cta) message += `${card.cta}\n`;
      if (card.hashtags && card.hashtags.length > 0) {
        message += `\n${card.hashtags.join(' ')}\n`;
      }
      
      if (index < output.cards.length - 1) {
        message += `\n━━━━━━━━━━━━━━━━━━\n\n`;
      }
    });
  }
  
  // Send as ONE message (Telegram allows up to 4096 characters)
  // If too long, split into 2 messages max
  if (message.length > 4000) {
    const firstPart = message.substring(0, 4000);
    const secondPart = message.substring(4000);
    
    await sendMessage(botToken, chatId, firstPart, { parse_mode: 'Markdown' });
    
    if (secondPart.trim()) {
      await sendMessage(botToken, chatId, secondPart, { parse_mode: 'Markdown' });
    }
  } else {
    // Send as single message
    await sendMessage(botToken, chatId, message, { parse_mode: 'Markdown' });
  }
  
  // Send action buttons as separate message
  await sendMessage(
    botToken,
    chatId,
    `📋 *Job: ${jobId}*\n\n_Tap to copy individual styles:_`,
    {
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            { text: '🌸 Copy 种草风', callback_data: `copy_A_${jobId}` },
            { text: '📚 Copy 干货风', callback_data: `copy_B_${jobId}` }
          ],
          [
            { text: '💬 Copy 真实分享风', callback_data: `copy_C_${jobId}` }
          ],
          [
            { text: '📋 Copy All', callback_data: `copy_all_${jobId}` },
            { text: '🔄 Regenerate', callback_data: `regenerate_${jobId}` }
          ]
        ]
      })
    }
  );
}

/**
 * Handle callback query (button clicks) - OPTIMIZED VERSION
 * Sends helpful instructions instead of just "Copied!"
 */
async function handleCallbackQuery(callbackQuery, botToken, env) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  console.log(`Callback: ${data}`);

  // Parse callback data: action_style_jobId
  const parts = data.split('_');
  const action = parts[0];
  const style = parts[1]; // A, B, C, or all

  try {
    if (action === 'copy') {
      // Send helpful instructions
      const styleNames = { 'A': '种草风', 'B': '干货风', 'C': '真实分享风' };
      const styleEmojis = { 'A': '🌸', 'B': '📚', 'C': '💬' };
      
      await sendMessage(
        botToken,
        chatId,
        `ℹ️ *To copy this style:*\n\nThe content for ${styleEmojis[style] || '🌸'} *${styleNames[style] || 'Style'}* was included in the main message above.\n\nSimply scroll up and copy the section you need!\n\n*Tip:* Long-press on the message and select "Copy" to copy the text.`,
        { parse_mode: 'Markdown' }
      );
      
      await answerCallbackQuery(botToken, callbackQuery.id, 'Content location sent!');
      
    } else if (action === 'copy_all') {
      await sendMessage(
        botToken,
        chatId,
        `ℹ️ *To copy all content:*\n\nAll 3 styles were included in the main message above.\n\nSimply scroll up and copy the entire message!\n\n*Tip:* Long-press on the message and select "Copy" to copy all text.`,
        { parse_mode: 'Markdown' }
      );
      
      await answerCallbackQuery(botToken, callbackQuery.id, 'Content location sent!');
      
    } else if (action === 'regenerate') {
      await answerCallbackQuery(botToken, callbackQuery.id, '🔄 Regeneration started...');
      // Would trigger regeneration here
    }
    
  } catch (error) {
    console.error('Callback query error:', error);
  }
}

/**
 * Send message via Telegram API
 */
async function sendMessage(botToken, chatId, text, options = {}) {
  try {
    const response = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        ...options
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
}

/**
 * Answer callback query
 */
async function answerCallbackQuery(botToken, callbackQueryId, text, showAlert = false) {
  try {
    await fetch(`${TELEGRAM_API}${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
      })
    });
  } catch (error) {
    console.error('Answer callback query error:', error);
  }
}

/**
 * Get demo content (for testing without AI API)
 */
function getDemoContent(videoUrl) {
  return {
    summary: {
      mainTopic: 'Demo content - Configure AI_API_KEY for real generation',
      corePoints: ['This is demo data', 'Configure AI_API_KEY for real AI', 'Supports YouTube/TikTok']
    },
    cards: [
      {
        style: '种草风',
        title: '我后悔太晚知道这个方法',
        hook: '姐妹们！今天一定要分享这个超级实用的技巧✨',
        body: '📌 核心要点：\n• 第一步：理解视频核心内容\n• 第二步：提炼关键信息点\n• 第三步：用口语化表达分享',
        cta: '觉得有用记得点赞 + 收藏⭐',
        hashtags: ['#小红书干货', '#效率提升', '#生活技巧']
      },
      {
        style: '干货风',
        title: '完整教程来了！建议收藏',
        hook: '很多人问我这个方法具体怎么操作，今天出一期完整教程📝',
        body: '【Step 1】分析内容核心\n【Step 2】提炼关键卖点\n【Step 3】调整表达风格\n【Step 4】生成文案',
        cta: '干货不易，记得点赞支持一下💪',
        hashtags: ['#教程', '#小红书教程', '#干货分享']
      },
      {
        style: '真实分享风',
        title: '亲测有效才来分享',
        hook: '说实话，一开始我也是抱着试试看的心态🤷‍♀️',
        body: '我之前也走过不少弯路，试过各种方法都不太行😅\n后来慢慢摸索出这套方法，亲测确实好用！',
        cta: '如果对你有帮助，记得给我点个赞哦💕',
        hashtags: ['#真实分享', '#亲测有效', '#使用感受']
      }
    ]
  };
}
