/**
 * Telegram Bot Routes
 * Handles all Telegram Bot API webhook endpoints
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const telegramController = require('../controllers/telegram.controller');

const router = express.Router();

/**
 * POST /telegram/webhook
 * Main Telegram webhook endpoint
 */
router.post('/webhook',
  asyncHandler(telegramController.handleTelegramWebhook)
);

/**
 * GET /telegram/webhook
 * Webhook verification
 */
router.get('/webhook', (req, res) => {
  res.json({
    ok: true,
    message: 'Telegram webhook is running'
  });
});

module.exports = router;
