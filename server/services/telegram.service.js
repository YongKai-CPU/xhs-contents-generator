/**
 * Telegram Service - FRESH RECODE
 * Clean Telegram bot service
 */

const axios = require('axios');
const config = require('../config/env');

// Get bot token from environment
const TELEGRAM_BOT_TOKEN = config.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

console.log('🤖 Telegram Service initialized with token:', TELEGRAM_BOT_TOKEN ? '✅' : '❌');

/**
 * Send message to Telegram chat
 */
async function sendMessage(chatId, text, options = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not configured!');
    return { success: false, error: 'Token not configured' };
  }

  try {
    const requestBody = {
      chat_id: chatId,
      text: text,
      ...options
    };
    
    // Only add parse_mode if it's defined
    if (options.parse_mode !== undefined) {
      requestBody.parse_mode = options.parse_mode;
    }

    const response = await axios.post(
      `${TELEGRAM_API}/sendMessage`,
      requestBody
    );

    console.log('✅ Telegram message sent to:', chatId);
    return { success: true, message_id: response.data.result.message_id };
  } catch (error) {
    console.error('❌ Telegram send error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send chat action (typing, etc.)
 */
async function sendChatAction(chatId, action = 'typing') {
  try {
    await axios.post(`${TELEGRAM_API}/sendChatAction`, {
      chat_id: chatId,
      action: action
    });
    return true;
  } catch (error) {
    console.error('Send chat action error:', error);
    return false;
  }
}

/**
 * Answer callback query (button clicks)
 */
async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  try {
    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    });
    return true;
  } catch (error) {
    console.error('Answer callback error:', error);
    return false;
  }
}

/**
 * Edit message text
 */
async function editMessageText(chatId, messageId, text, options = {}) {
  try {
    const response = await axios.post(`${TELEGRAM_API}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown',
      ...options
    });
    return { success: true, result: response.data.result };
  } catch (error) {
    console.error('Edit message error:', error);
    throw error;
  }
}

module.exports = {
  sendMessage,
  sendChatAction,
  answerCallbackQuery,
  editMessageText,
  TELEGRAM_BOT_TOKEN
};
