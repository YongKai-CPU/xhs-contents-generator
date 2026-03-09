/**
 * Local Test Script - Test AI Generation Directly
 * Run with: node test-local-ai.js
 */

const AI_API_KEY = 'sk-f1c3545354d84d40b79c771911c694f0';

async function testAI() {
  console.log('=== Testing AI Generation ===\n');
  
  const testTranscript = 'This is a test video about coffee making. Learn how to brew perfect coffee at home with these simple tips.';
  
  const prompt = `请为以下视频生成 3 种风格的小红书文案：

视频内容/字幕：
${testTranscript}

请输出 JSON 格式，包含 3 种风格：种草风，干货风，真实分享风`;

  console.log('Calling AI API...\n');
  
  try {
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一名资深的小红书内容创作者。请生成 3 种不同风格的小红书笔记。输出必须是合法的 JSON 格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000
      })
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('\nAI Response:\n');
    console.log(data.choices[0].message.content);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAI();
