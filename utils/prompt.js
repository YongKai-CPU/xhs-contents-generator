/**
 * AI Agent Prompt for Qwen - Xiaohongshu Content Creator
 * Generates 3 versions of structured Xiaohongshu notes from video transcripts
 * Strict JSON output format for frontend card display
 */

const QWEN_PROMPT = `你是一个专门把视频 transcript 改写成「小红书文案」的中文内容创作者，同时你也是一个严格遵守输出格式的 API。

【输入 transcript】
{TRANSCRIPT}

【任务】
请基于 transcript 同时生成三种风格的小红书笔记：
1) 种草风
2) 干货风
3) 真实分享风

并把结果以 JSON 输出，供前端三个卡面直接展示。

【硬性要求】
- 只输出 JSON，不能有任何多余文本、解释、markdown、代码块标记。
- 三种风格都必须生成完整笔记：标题、hook、正文、结尾互动、hashtags。
- 每篇正文必须 900–1300 字，6–10 段，每段 2–4 句。
- 不允许提及"AI""模型""transcript""根据视频内容"等过程性词。
- 事实规则：只把 transcript 里出现的内容当作"视频事实"。缺失信息可用"通常/一般情况下/你可以先…"来补全，但不要编造具体人名、价格、数据、地点、年份。

【写作共通结构】
- title: 15–25 字，强钩子
- hook: 2–4 行，痛点/反差/直接结论
- body: 正文（900–1300 字）
- cta: 结尾互动（3 行）
- hashtags: 8–12 个

【风格差异要求】

(1) 种草风
- 情绪感染力更强，体验感更重，带一点"推荐冲动"，但不要油腻夸张。
- 必须包含：适合人群、推荐理由、使用/实践后的变化、避坑提醒（至少 2 条）。

(2) 干货风
- 信息密度最高，步骤清晰，可执行性强。
- 必须包含模块：
  A 核心观点总结（1 段）
  B 步骤清单（编号 1-6，每条含：为什么 + 怎么做）
  C 常见误区（至少 3 条，以"很多人会…"开头）
  D 例子（至少 2 个，以"比如…"开头）
  E 总结心法（以"我直接说重点："开头）

(3) 真实分享风
- 像个人经历，有过程、有转折、有反思，像在和朋友聊天。
- 必须包含：背景→过程→卡点→关键点→复盘
- 至少出现 2 次这些句式中的任意一句：
  "我直接说重点："
  "别急，后面才是关键。"
  "如果你也卡在这里，照做就行。"

【额外给卡面展示的资料（每种风格都要有）】
- key_takeaways: 3–5 条要点（短句）
- target_audience: 适合人群（3 条）
- caution: 注意事项/避坑（2–4 条）
- confidence: 0-100（你对"内容忠于 transcript"的自信程度；若 transcript 信息少就降低）
- source_coverage: 0-100（你觉得 transcript 覆盖文案关键信息的程度；信息少就降低）

【输出 JSON schema（必须严格遵守字段名）】
{
  "summary": {
    "mainTopic": "视频主题",
    "corePoints": ["要点 1", "要点 2", "要点 3"]
  },
  "cards": [
    {
      "style": "种草风",
      "title": "...",
      "hook": ["...", "..."],
      "body": "...",
      "cta": ["...", "...", "..."],
      "hashtags": ["#...","#..."],
      "key_takeaways": ["...","...","..."],
      "target_audience": ["...","...","..."],
      "caution": ["...","..."],
      "confidence": 0,
      "source_coverage": 0
    },
    {
      "style": "干货风",
      "title": "...",
      "hook": ["...", "..."],
      "body": "...",
      "cta": ["...", "...", "..."],
      "hashtags": ["#...","#..."],
      "key_takeaways": ["...","...","..."],
      "target_audience": ["...","...","..."],
      "caution": ["...","..."],
      "confidence": 0,
      "source_coverage": 0
    },
    {
      "style": "真实分享风",
      "title": "...",
      "hook": ["...", "..."],
      "body": "...",
      "cta": ["...", "...", "..."],
      "hashtags": ["#...","#..."],
      "key_takeaways": ["...","...","..."],
      "target_audience": ["...","...","..."],
      "caution": ["...","..."],
      "confidence": 0,
      "source_coverage": 0
    }
  ]
}

【最终提醒】
- 只输出 JSON。
- hook 与 cta 必须是字符串数组。
- hashtags 必须是数组且每个元素以 # 开头。
- body 里不要出现列表符号的 markdown（如"###""- "），用自然段落即可。
- ⚠️ 重要：字段名必须小写！"cta" 不能写成 "CTA"！
- ⚠️ 必须包含 "summary" 和 "cards" 两个顶级字段！
- ⚠️ cards 数组必须正好有 3 个元素！
- ⚠️ body 字段必须是一个完整的字符串，所有段落用 \\n 连接，不能分成多个字段！
- ⚠️ 除了 summary 和 cards，不能有任何其他顶级字段！`;

/**
 * Generate prompt with video link and transcript
 */
function generatePrompt(videoLink, transcript) {
  return QWEN_PROMPT
    .replace('{VIDEO_LINK}', videoLink || '未提供')
    .replace('{TRANSCRIPT}', transcript || '无字幕内容');
}

/**
 * Parse AI response JSON - Ultra Robust version
 * Always returns something, never null
 */
function parseResponse(content) {
  try {
    console.log('Parsing AI response, length:', content.length);

    // Step 1: Remove markdown code blocks
    let cleanContent = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/```typescript\s*/g, '')
      .replace(/```javascript\s*/g, '');

    // Step 2: Extract JSON between first { and last }
    const startIdx = cleanContent.indexOf('{');
    const endIdx = cleanContent.lastIndexOf('}');

    if (startIdx === -1 || endIdx === -1) {
      console.error('No JSON object found, creating minimal response');
      return createMinimalResponse(content);
    }

    cleanContent = cleanContent.substring(startIdx, endIdx + 1);

    // Step 3: Remove ALL newlines to make single-line JSON
    cleanContent = cleanContent.replace(/\n/g, ' ').replace(/\r/g, '');

    // Step 4: Fix common AI mistakes
    cleanContent = cleanContent.replace(/"CTA"/g, '"cta"');
    cleanContent = cleanContent.replace(/"Title"/g, '"title"');
    cleanContent = cleanContent.replace(/"Hook"/g, '"hook"');
    cleanContent = cleanContent.replace(/"Body"/g, '"body"');
    cleanContent = cleanContent.replace(/"Hashtags"/g, '"hashtags"');
    cleanContent = cleanContent.replace(/"Style"/g, '"style"');

    // Step 5: Fix AI adding extra fields after body
    cleanContent = cleanContent.replace(/"body":\s*"([^"]*)",\s*"([^"]*)"/g, '"body": "$1\\n$2"');
    cleanContent = cleanContent.replace(/"body":\s*"([^"]*)",\s*"([^"]*)"/g, '"body": "$1\\n$2"');
    cleanContent = cleanContent.replace(/"body":\s*"([^"]*)",\s*"([^"]*)"/g, '"body": "$1\\n$2"');

    // Step 6: Try to parse
    try {
      const parsed = JSON.parse(cleanContent);
      console.log('✅ Successfully parsed JSON');
      return parsed;
    } catch (parseError) {
      console.warn('First parse attempt failed, trying cleanup...');

      // Step 7: Try to fix common JSON issues
      cleanContent = cleanContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      cleanContent = cleanContent.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

      try {
        const parsed = JSON.parse(cleanContent);
        console.log('✅ Successfully parsed after cleanup');
        return parsed;
      } catch (e2) {
        console.error('Cleanup failed:', e2.message);

        // Step 8: ALWAYS return something - extract what we can
        return extractWhatWeCan(content);
      }
    }
  } catch (e) {
    console.error('Parser error:', e.message);
    // Step 9: Ultimate fallback - always return something
    return createMinimalResponse(content);
  }
}

/**
 * Extract whatever we can from broken JSON
 */
function extractWhatWeCan(content) {
  console.log('🔧 Extracting what we can from broken JSON...');
  
  const result = {
    summary: {
      mainTopic: 'AI 生成内容',
      corePoints: ['内容已生成', '请查看下方详情']
    },
    cards: []
  };

  // Try to extract topic
  const topicMatch = content.match(/"mainTopic":\s*"([^"]*)"/);
  if (topicMatch) {
    result.summary.mainTopic = topicMatch[1];
  }

  // Try to extract cards
  const cardsMatch = content.match(/"cards":\s*\[([\s\S]*?)\]/);
  if (cardsMatch) {
    // Try to parse cards
    try {
      const cardsText = '[' + cardsMatch[1] + ']';
      const cards = JSON.parse(cardsText);
      result.cards = cards.slice(0, 3); // Take first 3
    } catch (e) {
      // If can't parse, create cards from what we have
      result.cards = createCardsFromContent(content);
    }
  } else {
    result.cards = createCardsFromContent(content);
  }

  // Ensure we have at least 1 card
  if (result.cards.length === 0) {
    result.cards = createMinimalCards();
  }

  console.log('✅ Extracted partial content:', result.cards.length, 'cards');
  return result;
}

/**
 * Create cards from raw content
 */
function createCardsFromContent(content) {
  const cards = [];
  const styles = ['种草风', '干货风', '真实分享风'];

  for (let i = 0; i < 3; i++) {
    // Try to find this style's content
    const styleRegex = new RegExp(`"style":\\s*"${styles[i]}"[\\s\\S]*?"title":\\s*"([^"]*)"[\\s\\S]*?"body":\\s*"([^"]*)"`, 'i');
    const match = content.match(styleRegex);

    if (match) {
      cards.push({
        style: styles[i],
        title: match[1] || `${styles[i]}标题`,
        body: match[2] || '内容生成中...',
        hook: ['AI 生成的内容'],
        cta: ['点赞', '收藏', '评论'],
        hashtags: ['#AI 生成', '#小红书', '#内容创作'],
        key_takeaways: ['要点 1'],
        target_audience: ['目标用户'],
        caution: ['注意事项'],
        confidence: 70,
        source_coverage: 70
      });
    }
  }

  return cards;
}

/**
 * Create minimal cards as last resort
 */
function createMinimalCards() {
  return [
    {
      style: '种草风',
      title: 'AI 生成内容',
      body: '内容生成成功，但格式解析失败。请检查 AI 响应格式。',
      hook: ['AI 生成'],
      cta: ['点赞', '收藏', '评论'],
      hashtags: ['#AI 生成'],
      key_takeaways: ['要点'],
      target_audience: ['用户'],
      caution: ['注意'],
      confidence: 50,
      source_coverage: 50
    },
    {
      style: '干货风',
      title: 'AI 生成内容',
      body: '内容生成成功，但格式解析失败。请检查 AI 响应格式。',
      hook: ['AI 生成'],
      cta: ['点赞', '收藏', '评论'],
      hashtags: ['#AI 生成'],
      key_takeaways: ['要点'],
      target_audience: ['用户'],
      caution: ['注意'],
      confidence: 50,
      source_coverage: 50
    },
    {
      style: '真实分享风',
      title: 'AI 生成内容',
      body: '内容生成成功，但格式解析失败。请检查 AI 响应格式。',
      hook: ['AI 生成'],
      cta: ['点赞', '收藏', '评论'],
      hashtags: ['#AI 生成'],
      key_takeaways: ['要点'],
      target_audience: ['用户'],
      caution: ['注意'],
      confidence: 50,
      source_coverage: 50
    }
  ];
}

/**
 * Create minimal response when all else fails
 */
function createMinimalResponse(content) {
  console.log('🔧 Creating minimal response...');
  return {
    summary: {
      mainTopic: 'AI 生成内容',
      corePoints: ['内容已生成']
    },
    cards: createMinimalCards()
  };
}

/**
 * Validate output structure
 */
function validateOutput(output) {
  const errors = [];

  if (!output) {
    errors.push('Missing output');
    return { valid: false, errors };
  }

  // Check cards array
  if (!output.cards || !Array.isArray(output.cards)) {
    errors.push('Missing cards array');
    return { valid: false, errors };
  }

  // Check each card
  const requiredFields = ['style', 'title', 'hook', 'body', 'cta', 'hashtags'];
  output.cards.forEach((card, index) => {
    requiredFields.forEach(field => {
      if (!card[field]) {
        errors.push(`Card ${index} missing ${field}`);
      }
    });
    
    // Validate array fields
    if (!Array.isArray(card.hook)) {
      errors.push(`Card ${index} hook must be array`);
    }
    if (!Array.isArray(card.cta)) {
      errors.push(`Card ${index} cta must be array`);
    }
    if (!Array.isArray(card.hashtags)) {
      errors.push(`Card ${index} hashtags must be array`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format body text for display (convert markdown lists to natural paragraphs)
 */
function formatBody(rawBody) {
  if (!rawBody) return '';
  
  // Remove markdown formatting
  let formatted = rawBody
    .replace(/###\s*/g, '')
    .replace(/##\s*/g, '')
    .replace(/#\s*/g, '')
    .replace(/^- /gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '');
  
  return formatted;
}

/**
 * Format cards for frontend display
 */
function formatCardsForFrontend(cards) {
  if (!cards || !Array.isArray(cards)) return [];
  
  return cards.map(card => ({
    style: card.style || '',
    title: card.title || '',
    hook: Array.isArray(card.hook) ? card.hook.join('\n') : card.hook || '',
    body: formatBody(card.body) || '',
    cta: Array.isArray(card.cta) ? card.cta.join('\n') : card.cta || '',
    hashtags: card.hashtags || [],
    key_takeaways: card.key_takeaways || [],
    target_audience: card.target_audience || [],
    caution: card.caution || [],
    confidence: card.confidence || 0,
    source_coverage: card.source_coverage || 0
  }));
}

/**
 * Format output for frontend display
 */
function formatForFrontend(output) {
  if (!output) return null;
  
  const formatted = {
    summary: {
      mainTopic: '视频内容总结',
      corePoints: [],
      highlights: [],
      targetAudience: '所有用户',
      value: '提供实用信息'
    },
    cards: formatCardsForFrontend(output.cards)
  };
  
  // Extract summary from first card's key_takeaways
  if (output.cards && output.cards[0] && output.cards[0].key_takeaways) {
    formatted.summary.corePoints = output.cards[0].key_takeaways.slice(0, 3);
    formatted.summary.highlights = output.cards[0].key_takeaways.slice(0, 2);
  }
  
  return formatted;
}

module.exports = {
  QWEN_PROMPT,
  generatePrompt,
  parseResponse,
  validateOutput,
  formatForFrontend,
  formatCardsForFrontend
};
