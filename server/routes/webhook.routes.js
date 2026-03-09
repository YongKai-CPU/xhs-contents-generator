/**
 * Webhook Routes
 * Handles incoming webhooks from WhatsApp and Telegram via WHAPI
 * 
 * Future integration - stub implementation ready
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

/**
 * POST /webhooks/whapi
 * Main webhook endpoint for WHAPI (WhatsApp/Telegram)
 * 
 * Handles incoming messages and events
 */
router.post('/whapi', 
  asyncHandler(webhookController.handleWhapiWebhook)
);

/**
 * POST /webhooks/whatsapp
 * Dedicated WhatsApp webhook endpoint
 */
router.post('/whatsapp',
  asyncHandler(webhookController.handleWhatsAppWebhook)
);

/**
 * POST /webhooks/telegram
 * Dedicated Telegram webhook endpoint
 */
router.post('/telegram',
  asyncHandler(webhookController.handleTelegramWebhook)
);

/**
 * GET /webhooks/verify
 * Webhook verification endpoint (for setup)
 */
router.get('/verify',
  asyncHandler(webhookController.verifyWebhook)
);

module.exports = router;
