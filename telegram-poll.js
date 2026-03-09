#!/usr/bin/env node

/**
 * Telegram Bot - Polling Mode
 * For local development without webhook
 */

const telegramService = require('../server/services/telegram.service');
const telegramController = require('../server/controllers/telegram.controller');

let lastUpdateId = 0;
let isPolling = false;

async function pollUpdates() {
  if (isPolling) return;
  
  isPolling = true;
  console.log('🤖 Starting Telegram bot in polling mode...');
  console.log('Press Ctrl+C to stop\n');

  try {
    while (isPolling) {
      const updates = await telegramService.getUpdates(lastUpdateId + 1, 100, 30);
      
      for (const update of updates) {
        lastUpdateId = update.update_id;
        
        // Process message
        if (update.message) {
          console.log(`📩 Received message from ${update.message.from.username || update.message.from.first_name}: ${update.message.text}`);
          
          // Create a mock request/response for the controller
          const req = { body: update.message };
          const res = {
            json: (data) => {
              console.log('✅ Message processed:', data);
            }
          };
          
          try {
            await telegramController.handleMessage(update.message);
          } catch (error) {
            console.error('❌ Error handling message:', error.message);
          }
        }
        
        // Process callback query
        if (update.callback_query) {
          console.log(`🔘 Received callback from ${update.callback_query.from.username}: ${update.callback_query.data}`);
          
          try {
            await telegramController.handleCallbackQuery(update.callback_query);
          } catch (error) {
            console.error('❌ Error handling callback:', error.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Polling error:', error.message);
    isPolling = false;
    setTimeout(pollUpdates, 5000); // Retry after 5 seconds
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping polling...');
  isPolling = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Stopping polling...');
  isPolling = false;
  process.exit(0);
});

// Start polling
pollUpdates();
