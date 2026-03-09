/**
 * Telegram Bot Webhook Handler for Cloudflare Workers
 * 
 * Handles incoming Telegram messages and commands
 * Forwards video processing requests to Railway backend
 * 
 * Commands:
 * - /start - Welcome message
 * - /help - Help information
 * - /new - Start new generation
 * - Video URLs - Trigger content generation
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

/**
 * Handle Telegram webhook
 * @param {Request} request - Incoming webhook request
 * @param {Object} env - Worker environment
 * @param {ExecutionContext} ctx - Execution context
 * @returns {Promise<Response>} Response
 */
export async function handleTelegramWebhook(request, env, ctx) {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('Telegram bot token not configured');
      return new Response('Bot token not configured', { status: 500 });
    }

    // Parse webhook payload
    const update = await request.json();
    console.log('Telegram webhook:', JSON.stringify(update));

    // Handle different update types
    if (update.message) {
      // Run message handling in background (don't wait for response)
      ctx.waitUntil(handleMessage(update.message, botToken, env, ctx));
    } else if (update.callback_query) {
      // Handle callback queries (button clicks)
      ctx.waitUntil(handleCallbackQuery(update.callback_query, botToken, env, ctx));
    } else if (update.edited_message) {
      // Ignore edited messages
      console.log('Ignoring edited message');
    }

    // Always return OK to Telegram (they retry if not 200)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Still return OK to prevent Telegram from retrying
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle incoming message
 */
async function handleMessage(message, botToken, env, ctx) {
  const chatId = message.chat.id;
  const text = message.text;
  const from = message.from;

  console.log(`Message from ${from.username || from.first_name}: ${text}`);

  try {
    // Handle commands
    if (text && text.startsWith('/')) {
      await handleCommand(chatId, text, botToken, env);
      return;
    }

    // Handle video URLs
    if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('tiktok.com'))) {
      await handleVideoUrl(chatId, text, botToken, env, ctx);
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

  } catch (error) {
    console.error('Message handling error:', error);
    try {
      await sendMessage(botToken, chatId, '❌ Sorry, an error occurred. Please try again later.');
    } catch (e) {
      // Ignore send errors
    }
  }
}

/**
 * Handle commands
 */
async function handleCommand(chatId, command, botToken, env) {
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
/status - Check job status
/new - Start new generation

Ready to create viral content? Send me a video URL!`, { parse_mode: 'Markdown' });
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
/new - Start new generation

*Tips:*
• You can send video URLs directly
• I support both YouTube and TikTok
• Content is generated with 3 different styles`, { parse_mode: 'Markdown' });
      break;

    case '/new':
      await sendMessage(botToken, chatId, `🆕 *New Generation*

Send me a YouTube or TikTok video URL to generate content!`);
      break;

    case '/status':
      await sendMessage(botToken, chatId, `📊 *Status Check*

To check a job status, use:
/status <job_id>

Or just send a video URL to start a new generation.`);
      break;

    default:
      await sendMessage(botToken, chatId, `❓ Unknown command: ${cmd}

Use /help to see available commands.`);
  }
}

/**
 * Handle video URL
 */
async function handleVideoUrl(chatId, videoUrl, botToken, env, ctx) {
  // Send acknowledgment
  await sendMessage(botToken, chatId, `🚀 *Generation Started!*

🔗 Video: ${videoUrl}

⏳ Processing... This may take 1-3 minutes.

I'll notify you when the content is ready!`, { parse_mode: 'Markdown' });

  // Forward to Railway backend for processing
  try {
    const backendUrl = env.RAILWAY_BACKEND_URL;

    if (!backendUrl) {
      // Use demo content if backend not configured
      await sendDemoContent(botToken, chatId, videoUrl);
      return;
    }

    // Create job in backend
    const response = await fetch(`${backendUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoUrl,
        _telegram: {
          chatId,
          botToken
        }
      })
    });

    if (!response.ok) {
      throw new Error('Backend request failed');
    }

    const result = await response.json();

    // Store job info for later notification
    ctx.waitUntil(storeTelegramJob(result.jobId, chatId, env));

    // Note: Backend will send results back via webhook or polling
    // This is handled asynchronously

  } catch (error) {
    console.error('Video processing error:', error);
    // Fallback to demo content
    await sendDemoContent(botToken, chatId, videoUrl);
  }
}

/**
 * Handle callback query (button clicks)
 */
async function handleCallbackQuery(callbackQuery, botToken, env, ctx) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  console.log(`Callback: ${data}`);

  try {
    // Parse callback data: action_style_jobId
    const parts = data.split('_');
    const action = parts[0];
    const style = parts[1]; // A, B, C, or all

    if (action === 'copy') {
      await answerCallbackQuery(botToken, callbackQuery.id, 'ℹ️ Content is in the message above - scroll up to copy!');

      // Send helpful instructions
      const styleNames = { 'A': '种草风', 'B': '干货风', 'C': '真实分享风' };
      const styleEmojis = { 'A': '🌸', 'B': '📚', 'C': '💬' };

      await sendMessage(botToken, chatId, `ℹ️ *To copy this style:*

The content for ${styleEmojis[style] || '🌸'} *${styleNames[style] || 'Style'}* was included in the main message above.

Simply scroll up and copy the section you need!

*Tip:* Long-press on the message and select "Copy" to copy the text.`, { parse_mode: 'Markdown' });

    } else if (action === 'copy_all') {
      await answerCallbackQuery(botToken, callbackQuery.id, 'ℹ️ Content is in the message above - scroll up to copy!');

      await sendMessage(botToken, chatId, `ℹ️ *To copy all content:*

All 3 styles were included in the main message above.

Simply scroll up and copy the entire message!

*Tip:* Long-press on the message and select "Copy" to copy all text.`, { parse_mode: 'Markdown' });

    } else if (action === 'regenerate') {
      await answerCallbackQuery(botToken, callbackQuery.id, '🔄 Regeneration started...');
      // Would trigger regeneration via backend
    }

  } catch (error) {
    console.error('Callback query error:', error);
  }
}

/**
 * Send demo content (fallback when backend not available)
 */
async function sendDemoContent(botToken, chatId, videoUrl) {
  const content = getDemoContent(videoUrl);

  // Format as single message
  let message = `✅ *Content Generated!* (Demo Mode)

📊 *Summary:*
${content.summary.mainTopic}

💡 *Key Points:*
${content.summary.corePoints.join(' • ')}

━━━━━━━━━━━━━━━━━━

`;

  content.cards.forEach((card, index) => {
    const emoji = index === 0 ? '🌸' : index === 1 ? '📚' : '💬';
    message += `${emoji} *${card.style}*

📝 ${card.title}

${card.hook}

${card.body}

${card.cta}

${card.hashtags.join(' ')}

`;

    if (index < content.cards.length - 1) {
      message += '━━━━━━━━━━━━━━━━━━\n\n';
    }
  });

  // Send content
  await sendMessage(botToken, chatId, message, { parse_mode: 'Markdown' });

  // Send action buttons
  await sendMessage(
    botToken,
    chatId,
    `📋 *Demo Job*\n\n_Tap to get copy instructions:_`,
    {
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            { text: '🌸 Copy 种草风', callback_data: 'copy_A_demo' },
            { text: '📚 Copy 干货风', callback_data: 'copy_B_demo' }
          ],
          [
            { text: '💬 Copy 真实分享风', callback_data: 'copy_C_demo' }
          ],
          [
            { text: '📋 Copy All', callback_data: 'copy_all_demo' }
          ]
        ]
      })
    }
  );
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
 * Store Telegram job info for later notification
 */
async function storeTelegramJob(jobId, chatId, env) {
  try {
    if (!env.RATE_LIMITER) {
      console.warn('KV not configured - skipping job storage');
      return;
    }

    const key = `telegram_job:${jobId}`;
    await env.RATE_LIMITER.put(
      key,
      JSON.stringify({ chatId, createdAt: Date.now() }),
      { expirationTtl: 3600 } // 1 hour
    );
  } catch (error) {
    console.error('Store Telegram job error:', error);
  }
}

/**
 * Get Telegram job info
 */
async function getTelegramJob(jobId, env) {
  try {
    if (!env.RATE_LIMITER) {
      return null;
    }

    const key = `telegram_job:${jobId}`;
    const data = await env.RATE_LIMITER.get(key, 'json');
    return data;
  } catch (error) {
    console.error('Get Telegram job error:', error);
    return null;
  }
}

/**
 * Get demo content
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
