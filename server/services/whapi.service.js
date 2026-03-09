/**
 * WHAPI Service
 * Handles WhatsApp and Telegram messaging via WHAPI
 * 
 * Stub implementation - ready for future integration
 */

const axios = require('axios');
const config = require('../config/env');

// WHAPI configuration (to be set in .env when ready)
const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL || 'https://api.whapi.com';
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

/**
 * Send WhatsApp message
 * @param {string} to - Recipient phone number
 * @param {string} message - Message text
 * @returns {Promise<object>} Send result
 */
async function sendWhatsAppMessage(to, message) {
  if (!WHAPI_TOKEN) {
    console.log('WHAPI not configured - mock send to:', to);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      `${WHAPI_BASE_URL}/v1/send-message`,
      {
        to,
        message: {
          type: 'text',
          text: {
            body: message
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    throw error;
  }
}

/**
 * Send Telegram message
 * @param {number} chatId - Telegram chat ID
 * @param {string} message - Message text
 * @returns {Promise<object>} Send result
 */
async function sendTelegramMessage(chatId, message) {
  if (!WHAPI_TOKEN) {
    console.log('WHAPI not configured - mock send to chat:', chatId);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      `${WHAPI_BASE_URL}/v1/send-message`,
      {
        to: chatId.toString(),
        platform: 'telegram',
        message: {
          type: 'text',
          text: {
            body: message
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Telegram send error:', error.message);
    throw error;
  }
}

/**
 * Send media message (WhatsApp)
 * @param {string} to - Recipient phone number
 * @param {string} mediaUrl - URL of media file
 * @param {string} caption - Optional caption
 * @returns {Promise<object>} Send result
 */
async function sendWhatsAppMedia(to, mediaUrl, caption = '') {
  if (!WHAPI_TOKEN) {
    console.log('WHAPI not configured - mock media send to:', to);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      `${WHAPI_BASE_URL}/v1/send-message`,
      {
        to,
        message: {
          type: 'image',
          image: {
            link: mediaUrl,
            caption
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('WhatsApp media send error:', error.message);
    throw error;
  }
}

/**
 * Get message status
 * @param {string} messageId - Message ID
 * @returns {Promise<object>} Message status
 */
async function getMessageStatus(messageId) {
  if (!WHAPI_TOKEN) {
    return { status: 'unknown', mock: true };
  }

  try {
    const response = await axios.get(
      `${WHAPI_BASE_URL}/v1/messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Get message status error:', error.message);
    throw error;
  }
}

/**
 * Set webhook URL
 * @param {string} webhookUrl - Webhook URL to receive messages
 * @returns {Promise<object>} Setup result
 */
async function setWebhook(webhookUrl) {
  if (!WHAPI_TOKEN) {
    console.log('WHAPI not configured - mock webhook setup:', webhookUrl);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      `${WHAPI_BASE_URL}/v1/webhooks`,
      {
        url: webhookUrl,
        events: ['message', 'status']
      },
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Set webhook error:', error.message);
    throw error;
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendTelegramMessage,
  sendWhatsAppMedia,
  getMessageStatus,
  setWebhook
};
