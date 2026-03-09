#!/usr/bin/env node

/**
 * Telegram Bot - Simple Polling Mode
 * No webhook needed - works locally!
 */

const axios = require('axios');

const BOT_TOKEN = '8714880125:AAE-h9fKlfNer5eyunzSHoUgY8fIo2aK9qU';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let lastUpdateId = 0;
let isRunning = false;

// Simple sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Send message via Telegram API
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
    return true;
  } catch (error) {
    console.error('Send message error:', error.response?.data || error.message);
    return false;
  }
}

// Send chat action (typing indicator)
async function sendChatAction(chatId, action = 'typing') {
  try {
    await axios.post(`${TELEGRAM_API}/sendChatAction`, {
      chat_id: chatId,
      action: action
    });
  } catch (error) {
    // Ignore errors
  }
}

// Handle /start command
async function handleStart(chatId, firstName) {
  const message = `👋 Welcome, ${firstName}!

I'm your *Xiaohongshu Content Generator* bot.

🎯 *What I do:*
Transform YouTube & TikTok videos into viral Xiaohongshu content with 3 different styles:
• 🌸 种草风 (Recommendation style)
• 📚 干货风 (Tutorial style)  
• 💬 真实分享风 (Authentic sharing style)

🚀 *How to use:*
Simply send me a YouTube or TikTok video URL and I'll generate content for you!

💡 *Commands:*
/help - Show help
/status - Check job status
/new - Start new generation

Ready to create viral content? Send me a video URL!`;

  await sendMessage(chatId, message);
}

// Handle /help command
async function handleHelp(chatId) {
  const message = `📖 *Help & Commands*

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
• Generated content is saved in your history

Need help? Contact the developer.`;

  await sendMessage(chatId, message);
}

// Handle /new command
async function handleNew(chatId) {
  await sendMessage(chatId, `🆕 *New Generation*

Send me a YouTube or TikTok video URL to generate content!`);
}

// Handle video URL
async function handleVideoUrl(chatId, videoUrl) {
  // Show typing indicator
  await sendChatAction(chatId, 'typing');

  // Generate demo content
  const demoOutput = `📊 *Video Content Summary*

🎯 Topic: Demo content - Configure AI API key for real generation
💡 Core Points: This is demo data, Configure AI_API_KEY, Supports YouTube/TikTok

━━━━━━━━━━━━━━━━━━

🌸 *种草风*

📝 我后悔太晚知道这个方法

姐妹们！今天一定要分享这个超级实用的技巧✨

📌 核心要点：
• 第一步：理解视频核心内容
• 第二步：提炼关键信息点
• 第三步：用口语化表达分享

觉得有用记得点赞 + 收藏⭐

#小红书干货 #效率提升 #生活技巧

━━━━━━━━━━━━━━━━━━

📚 *干货风*

📝 完整教程来了！建议收藏

很多人问我这个方法具体怎么操作，今天出一期完整教程📝

【Step 1】分析内容核心
【Step 2】提炼关键卖点
【Step 3】调整表达风格
【Step 4】生成文案

干货不易，记得点赞支持一下💪

#教程 #小红书教程 #干货分享

━━━━━━━━━━━━━━━━━━

💬 *真实分享风*

📝 亲测有效才来分享

说实话，一开始我也是抱着试试看的心态🤷‍♀️

我之前也走过不少弯路，试过各种方法都不太行😅
后来慢慢摸索出这套方法，亲测确实好用！

如果对你有帮助，记得给我点个赞哦💕

#真实分享 #亲测有效 #使用感受

━━━━━━━━━━━━━━━━━━

✅ Generation complete! (Demo mode - configure AI_API_KEY for real generation)`;

  // Send acknowledgment first
  await sendMessage(chatId, `🚀 *Generation Started!*

🔗 Video: ${videoUrl}

⏳ Processing... This may take 1-3 minutes.`);

  // Simulate processing delay
  await sleep(2000);

  // Send content
  await sendMessage(chatId, demoOutput);
}

// Handle incoming message
async function handleMessage(message) {
  const chatId = message.chat.id;
  const from = message.from;
  const text = message.text;
  const firstName = from.first_name || 'User';

  console.log(`📩 Message from ${firstName}: ${text}`);

  // Check if it's a command
  if (text && text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();

    switch (command) {
      case '/start':
        await handleStart(chatId, firstName);
        break;
      case '/help':
        await handleHelp(chatId);
        break;
      case '/new':
        await handleNew(chatId);
        break;
      default:
        await sendMessage(chatId, `❓ Unknown command: ${command}\n\nUse /help to see available commands.`);
    }
    return;
  }

  // Check if it's a URL (YouTube or TikTok)
  if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('tiktok.com'))) {
    await handleVideoUrl(chatId, text.trim());
    return;
  }

  // Default response
  await sendMessage(chatId, `👋 Hello! I'm your Xiaohongshu Content Generator bot.

📌 *What I can do:*
• Generate 3 styles of Xiaohongshu content from video URLs
• Support YouTube and TikTok videos

🚀 *How to use:*
Just send me a YouTube or TikTok video URL!

💡 Or use /help to see available commands.`);
}

// Main polling loop
async function pollUpdates() {
  try {
    const response = await axios.get(`${TELEGRAM_API}/getUpdates`, {
      params: {
        offset: lastUpdateId + 1,
        limit: 100,
        timeout: 30
      }
    });

    const updates = response.data.result;

    for (const update of updates) {
      lastUpdateId = update.update_id;

      if (update.message) {
        await handleMessage(update.message);
      }
    }
  } catch (error) {
    console.error('❌ Poll error:', error.message);
  }
}

// Start the bot
async function startBot() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 Telegram Bot Starting...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get bot info
  try {
    const botInfo = await axios.get(`${TELEGRAM_API}/getMe`);
    console.log(`✅ Bot: @${botInfo.data.result.username}`);
    console.log(`   Name: ${botInfo.data.result.first_name}`);
    console.log(`   ID: ${botInfo.data.result.id}\n`);
  } catch (error) {
    console.error('❌ Failed to get bot info:', error.message);
    console.log('   Check your bot token!\n');
    return;
  }

  console.log('🫡 Polling for messages...');
  console.log('   Press Ctrl+C to stop\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  isRunning = true;

  // Start polling loop
  while (isRunning) {
    await pollUpdates();
    await sleep(1000); // Wait 1 second before next poll
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping bot...');
  isRunning = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Stopping bot...');
  isRunning = false;
  process.exit(0);
});

// Start!
startBot();
