/**
 * Webhook Controller
 * Handles incoming webhooks from WhatsApp and Telegram via WHAPI
 * 
 * Stub implementation - ready for future integration
 */

const config = require('../config/env');
const whapiService = require('../services/whapi.service');

/**
 * Handle WHAPI webhook (main endpoint)
 */
async function handleWhapiWebhook(req, res) {
  try {
    const webhookData = req.body;

    console.log('Received WHAPI webhook:', JSON.stringify(webhookData, null, 2));

    // Determine message type and route accordingly
    if (webhookData.platform === 'whatsapp') {
      return handleWhatsAppWebhook(req, res);
    } else if (webhookData.platform === 'telegram') {
      return handleTelegramWebhook(req, res);
    }

    // Generic response for unknown platforms
    res.json({
      status: 'received',
      message: 'Webhook received, platform not specified'
    });

  } catch (error) {
    console.error('WHAPI webhook error:', error);
    res.status(500).json({
      error: {
        code: 'WEBHOOK_ERROR',
        message: error.message
      }
    });
  }
}

/**
 * Handle WhatsApp webhook
 */
async function handleWhatsAppWebhook(req, res) {
  try {
    const { from, text, type } = req.body;

    console.log('WhatsApp message:', { from, text, type });

    // Process message based on type
    if (type === 'message') {
      // Check if it's a video URL
      if (text && (text.includes('youtube.com') || text.includes('tiktok.com'))) {
        // Trigger content generation
        // This would integrate with the AI service
        console.log('Video URL detected, would trigger generation');
      }

      // Send acknowledgment
      await whapiService.sendWhatsAppMessage(from, '✅ Message received. Processing...');
    }

    res.json({
      status: 'processed',
      message: 'WhatsApp webhook processed'
    });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({
      error: {
        code: 'WHATSAPP_WEBHOOK_ERROR',
        message: error.message
      }
    });
  }
}

/**
 * Handle Telegram webhook
 */
async function handleTelegramWebhook(req, res) {
  try {
    const { chat, from, text, entities } = req.body;

    console.log('Telegram message:', { chat, from, text, entities });

    // Process message
    if (text) {
      // Check for commands
      if (text.startsWith('/')) {
        await handleTelegramCommand(chat.id, text);
      } else if (text.includes('youtube.com') || text.includes('tiktok.com')) {
        // Video URL detected
        console.log('Video URL detected in Telegram');
      }
    }

    res.json({
      status: 'processed',
      message: 'Telegram webhook processed'
    });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({
      error: {
        code: 'TELEGRAM_WEBHOOK_ERROR',
        message: error.message
      }
    });
  }
}

/**
 * Handle Telegram commands
 */
async function handleTelegramCommand(chatId, command) {
  const cmd = command.split(' ')[0].toLowerCase();

  switch (cmd) {
    case '/start':
      await whapiService.sendTelegramMessage(chatId, 
        '👋 Welcome to Xiaohongshu Content Generator!\n\n' +
        'Send me a YouTube or TikTok video URL and I\'ll generate content for you.'
      );
      break;

    case '/help':
      await whapiService.sendTelegramMessage(chatId,
        '📖 Available commands:\n' +
        '/start - Start the bot\n' +
        '/help - Show this help\n' +
        '/status - Check job status\n\n' +
        'Just send a video URL to generate content!'
      );
      break;

    case '/status':
      await whapiService.sendTelegramMessage(chatId, 'No active jobs.');
      break;

    default:
      await whapiService.sendTelegramMessage(chatId, `Unknown command: ${cmd}`);
  }
}

/**
 * Verify webhook (for setup)
 */
async function verifyWebhook(req, res) {
  try {
    const { token } = req.query;

    // Simple verification
    if (token === process.env.WHAPI_VERIFY_TOKEN) {
      res.json({
        status: 'verified',
        message: 'Webhook verified successfully'
      });
    } else {
      res.status(401).json({
        status: 'failed',
        message: 'Invalid verification token'
      });
    }

  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).json({
      error: {
        code: 'VERIFICATION_ERROR',
        message: error.message
      }
    });
  }
}

module.exports = {
  handleWhapiWebhook,
  handleWhatsAppWebhook,
  handleTelegramWebhook,
  verifyWebhook
};
