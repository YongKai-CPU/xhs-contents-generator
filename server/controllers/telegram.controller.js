/**
 * Telegram Bot Controller - FRESH RECODE
 * Clean, simple Telegram bot handler
 */

const telegramService = require('../services/telegram.service');
const aiService = require('../services/ai.service');
const videoService = require('../services/video.service');
const { cleanTranscript } = require('../../utils/transcriptCleaner');
const { v4: uuidv4 } = require('uuid');

// Store processed update IDs to prevent duplicates
const processedUpdates = new Set();

/**
 * Handle Telegram webhook
 */
async function handleTelegramWebhook(req, res) {
  try {
    const update = req.body;
    console.log('📨 Telegram webhook:', JSON.stringify(update, null, 2));

    // Prevent processing same update twice
    if (update.update_id && processedUpdates.has(update.update_id)) {
      console.log('⚠️ Skipping duplicate update:', update.update_id);
      return res.json({ ok: true });
    }
    
    if (update.update_id) {
      processedUpdates.add(update.update_id);
      // Clean up old updates (keep last 100)
      if (processedUpdates.size > 100) {
        const firstKey = processedUpdates.keys().next().value;
        processedUpdates.delete(firstKey);
      }
    }

    // Handle different update types
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    return res.json({ ok: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.json({ ok: true }); // Always return ok to Telegram
  }
}

/**
 * Handle incoming message
 */
async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;
  const from = message.from;

  console.log(`💬 Message from ${from.username || from.first_name}: ${text}`);

  // Handle commands
  if (text && text.startsWith('/')) {
    await handleCommand(chatId, text);
    return;
  }

  // Handle video URLs
  if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('tiktok.com'))) {
    await handleVideoUrl(chatId, text);
    return;
  }

  // Default response
  await telegramService.sendMessage(
    chatId,
    `👋 Hello! I'm your Xiaohongshu Content Generator bot.

📌 *What I can do:*
• Generate 3 styles of Xiaohongshu content from video URLs
• Support YouTube and TikTok videos

🚀 *How to use:*
Just send me a YouTube or TikTok video URL!

💡 Or use /help to see available commands.`
  );
}

/**
 * Handle commands
 */
async function handleCommand(chatId, command) {
  const cmd = command.split(' ')[0].toLowerCase();

  switch (cmd) {
    case '/start':
      await telegramService.sendMessage(
        chatId,
        `👋 Welcome!

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
/status - Check status`
      );
      break;

    case '/help':
      await telegramService.sendMessage(
        chatId,
        `📖 *Help & Commands*

*Generation:*
• Send a YouTube/TikTok URL to generate content
• I'll create 3 styles of Xiaohongshu content
• Processing takes 1-3 minutes

*Commands:*
/start - Start the bot
/help - Show this help
/status - Check status

*Tips:*
• You can send video URLs directly
• I support both YouTube and TikTok`
      );
      break;

    default:
      await telegramService.sendMessage(
        chatId,
        `❓ Unknown command: ${cmd}\n\nUse /help to see available commands.`
      );
  }
}

/**
 * Handle video URL
 */
async function handleVideoUrl(chatId, videoUrl) {
  // Show typing indicator
  await telegramService.sendChatAction(chatId, 'typing');

  const jobId = uuidv4();

  try {
    // Send acknowledgment (plain text to avoid Markdown parsing issues with URLs)
    await telegramService.sendMessage(
      chatId,
      `🚀 Generation Started!

📋 Job ID: ${jobId}
🔗 Video: ${videoUrl}

⏳ Processing... This may take 1-2 minutes.`,
      { parse_mode: undefined } // Disable Markdown parsing
    );

    try {
      // Extract video ID and platform
      let videoId = null;
      let platform = 'unknown';
      
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        platform = 'youtube';
        const match = videoUrl.match(/[?&]v=([^&]+)/) || videoUrl.match(/youtu\.be\/([^?]+)/);
        videoId = match ? match[1] : null;
      } else if (videoUrl.includes('tiktok.com')) {
        platform = 'tiktok';
        const match = videoUrl.match(/\/video\/(\d+)/);
        videoId = match ? match[1] : null;
      }

      // Extract transcript
      console.log('📥 Extracting transcript...');
      let transcript = '';
      
      if (platform === 'youtube') {
        try {
          transcript = await videoService.extractYouTubeCaptions(videoUrl);
          console.log('✅ YouTube captions extracted');
        } catch (e) {
          console.log('⚠️ No captions, will try ASR:', e.message);
        }
      }

      // If no captions, download and transcribe
      if (!transcript) {
        const hasYtDlp = await videoService.checkYtDlp();
        if (hasYtDlp) {
          console.log('📥 Downloading audio...');
          const audioPath = await videoService.downloadAudio(videoUrl, videoId);
          
          console.log('🎤 Transcribing with Whisper...');
          const whisperResult = await videoService.transcribeWithWhisper(audioPath);
          transcript = whisperResult.segments.map(s => s.text).join(' ');
          console.log('✅ Transcription complete');
        } else {
          transcript = `Video: ${videoUrl}. Generate content based on typical content for this type of video.`;
        }
      }

      // Clean transcript
      const cleaned = cleanTranscript(transcript);
      console.log('🧹 Transcript cleaned');

      // Generate AI content (Telegram-specific format)
      console.log('🤖 Calling AI API for Telegram...');
      const output = await aiService.generateForTelegram(videoUrl, cleaned);
      console.log('✅ Real AI content generated for Telegram!');

      // Send generated content (Telegram format)
      await sendGeneratedContentTelegram(chatId, output, jobId);

    } catch (error) {
      console.error('❌ Process video error:', error);
      await telegramService.sendMessage(
        chatId,
        `❌ *Generation Failed*\n\nError: ${error.message}\n\nPlease try again.`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('❌ Process video error:', error);
    await telegramService.sendMessage(
      chatId,
      `❌ *Generation Failed*\n\nError: ${error.message}\n\nPlease try again.`
    );
  }
}

/**
 * Send generated content (Telegram format)
 */
async function sendGeneratedContentTelegram(chatId, output, jobId) {
  // Format for Telegram
  let message = `✅ *Content Generated!*\n\n`;
  
  // Add summary
  message += `📊 *Summary:*\n${output.topic || 'No summary'}\n\n`;
  message += `💡 *Key Points:*\n${(output.points || []).join(' • ')}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Add all 3 styles
  if (output.styles && Array.isArray(output.styles)) {
    output.styles.forEach((style, index) => {
      const emoji = index === 0 ? '🌸' : index === 1 ? '📚' : '💬';
      
      // Convert literal \n to actual newlines
      const content = style.content.replace(/\\n/g, '\n');
      
      message += `${emoji} *${style.name}*\n\n`;
      message += `📝 ${style.title}\n\n`;
      message += `${content}\n\n`;
      
      if (index < output.styles.length - 1) {
        message += `━━━━━━━━━━━━━━━━━━\n\n`;
      }
    });
  }
  
  // Send message (split if too long)
  if (message.length > 4000) {
    const parts = [
      message.substring(0, 4000),
      message.substring(4000)
    ];
    for (const part of parts) {
      await telegramService.sendMessage(chatId, part, { parse_mode: 'Markdown' });
    }
  } else {
    await telegramService.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
  
  // Send action buttons
  await telegramService.sendMessage(
    chatId,
    `📋 *Job: ${jobId}*\n\n_Tap to copy individual styles:_`,
    {
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
            { text: '📋 Copy All', callback_data: `copy_all_${jobId}` }
          ]
        ]
      })
    }
  );
}

/**
 * Send generated content
 */
async function sendGeneratedContent(chatId, output, jobId) {
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
  
  // Send as single message (or split if too long)
  if (message.length > 4000) {
    const firstPart = message.substring(0, 4000);
    const secondPart = message.substring(4000);
    
    await telegramService.sendMessage(chatId, firstPart);
    if (secondPart.trim()) {
      await telegramService.sendMessage(chatId, secondPart);
    }
  } else {
    await telegramService.sendMessage(chatId, message);
  }
  
  // Send action buttons
  await telegramService.sendMessage(
    chatId,
    `📋 *Job: ${jobId}*\n\n_Tap to copy individual styles:_`,
    {
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
            { text: '📋 Copy All', callback_data: `copy_all_${jobId}` }
          ]
        ]
      })
    }
  );
}

/**
 * Handle callback query (button clicks)
 */
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  console.log(`🔘 Callback: ${data}`);

  try {
    if (data.startsWith('copy_')) {
      // Send helpful instructions
      await telegramService.sendMessage(
        chatId,
        `ℹ️ *To copy content:*\n\nThe content was included in the message above.\n\nSimply scroll up and copy the section you need!\n\n*Tip:* Long-press on the message and select "Copy".`
      );
      
      await telegramService.answerCallbackQuery(callbackQuery.id, 'Content location sent!');
    }
  } catch (error) {
    console.error('❌ Callback query error:', error);
  }
}

module.exports = {
  handleTelegramWebhook,
  handleMessage,
  handleCommand,
  handleVideoUrl,
  handleCallbackQuery,
  sendGeneratedContent
};