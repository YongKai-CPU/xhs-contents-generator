#!/usr/bin/env node

/**
 * Telegram Bot Setup Script
 * Configures webhook and verifies bot connection
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Bot configuration
const BOT_TOKEN = '8714880125:AAE-h9fKlfNer5eyunzSHoUgY8fIo2aK9qU';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getBotInfo() {
  try {
    const response = await axios.get(`${TELEGRAM_API}/getMe`);
    return response.data.result;
  } catch (error) {
    throw new Error(`Failed to get bot info: ${error.message}`);
  }
}

async function getWebhookInfo() {
  try {
    const response = await axios.get(`${TELEGRAM_API}/getWebhookInfo`);
    return response.data.result;
  } catch (error) {
    throw new Error(`Failed to get webhook info: ${error.message}`);
  }
}

async function setWebhook(url) {
  try {
    const response = await axios.post(`${TELEGRAM_API}/setWebhook`, {
      url: url,
      allowed_updates: ['message', 'callback_query']
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to set webhook: ${error.message}`);
  }
}

async function deleteWebhook() {
  try {
    const response = await axios.post(`${TELEGRAM_API}/deleteWebhook`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete webhook: ${error.message}`);
  }
}

async function main() {
  log('\n🤖 Telegram Bot Setup Script\n', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  try {
    // Step 1: Verify bot token
    log('Step 1: Verifying bot token...', 'yellow');
    const botInfo = await getBotInfo();
    log(`✅ Bot verified: @${botInfo.username}`, 'green');
    log(`   Name: ${botInfo.first_name}`, 'green');
    log(`   ID: ${botInfo.id}`, 'green');
    log(`   Can join groups: ${botInfo.can_join_groups}`, 'green');
    log('', 'reset');

    // Step 2: Check current webhook
    log('Step 2: Checking current webhook...', 'yellow');
    const webhookInfo = await getWebhookInfo();
    
    if (webhookInfo.url) {
      log(`   Current webhook: ${webhookInfo.url}`, 'blue');
      log(`   Last update: ${webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000).toLocaleString() : 'Never'}`, 'blue');
      if (webhookInfo.last_error_message) {
        log(`   Last error: ${webhookInfo.last_error_message}`, 'red');
      }
    } else {
      log('   No webhook configured (polling mode)', 'blue');
    }
    log('', 'reset');

    // Step 3: Ask for action
    log('What would you like to do?', 'cyan');
    log('1. Set webhook (for production)', 'cyan');
    log('2. Delete webhook (use polling mode)', 'cyan');
    log('3. Exit (keep current settings)', 'cyan');
    log('', 'reset');

    rl.question('Enter choice (1-3): ', async (answer) => {
      try {
        if (answer === '1') {
          rl.question('\nEnter your webhook URL (e.g., https://your-domain.com/telegram/webhook): ', async (url) => {
            try {
              log('\nSetting webhook...', 'yellow');
              const result = await setWebhook(url);
              
              if (result.ok) {
                log(`✅ Webhook set successfully!`, 'green');
                log(`   URL: ${url}`, 'green');
                log('\nTest it by sending a message to your bot!', 'cyan');
              } else {
                log(`❌ Failed to set webhook: ${result.description}`, 'red');
              }
            } catch (error) {
              log(`❌ Error: ${error.message}`, 'red');
            } finally {
              rl.close();
            }
          });
        } else if (answer === '2') {
          log('\nDeleting webhook...', 'yellow');
          const result = await deleteWebhook();
          
          if (result.ok) {
            log(`✅ Webhook deleted! Bot will use polling mode.`, 'green');
          } else {
            log(`❌ Failed to delete webhook`, 'red');
          }
          rl.close();
        } else if (answer === '3') {
          log('\n👋 Exiting...', 'cyan');
          rl.close();
        } else {
          log('\n❌ Invalid choice. Run again.', 'red');
          rl.close();
        }
      } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        rl.close();
      }
    });

  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    log('\nMake sure:', 'yellow');
    log('  1. Your bot token is correct', 'yellow');
    log('  2. You have internet connection', 'yellow');
    log('  3. Telegram API is accessible', 'yellow');
    rl.close();
    process.exit(1);
  }
}

// Run setup
main();
