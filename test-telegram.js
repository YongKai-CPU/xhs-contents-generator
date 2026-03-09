const axios = require('axios');

const BOT_TOKEN = '8714880125:AAE-h9fKlfNer5eyunzSHoUgY8fIo2aK9qU';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Your chat ID (from the test messages)
const CHAT_ID = 6500856787;

async function testBot() {
  console.log('🤖 Testing Telegram Bot...\n');

  try {
    // Test 1: Get bot info
    console.log('Test 1: Getting bot info...');
    const botInfo = await axios.get(`${TELEGRAM_API}/getMe`);
    console.log(`✅ Bot: @${botInfo.data.result.username}`);
    console.log(`   Name: ${botInfo.data.result.first_name}\n`);

    // Test 2: Send welcome message
    console.log('Test 2: Sending welcome message...');
    const message = '👋 Welcome! I am your Xiaohongshu Content Generator bot.\n\n' +
      '🎯 I can transform YouTube & TikTok videos into viral Xiaohongshu content.\n\n' +
      '🚀 Just send me a video URL to get started!\n\n' +
      'Commands:\n' +
      '/start - Start the bot\n' +
      '/help - Show help\n' +
      '/new - Start new generation';

    const result = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message
    });

    console.log(`✅ Message sent! Message ID: ${result.data.result.message_id}`);
    console.log('\n✅ All tests passed! Check your Telegram!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBot();
