/**
 * Test JSON Parser with Real AI Response
 * Run with: node test-json-parser.js
 */

const { parseResponse } = require('./utils/prompt');

// This is the actual AI response from the logs
const aiResponse = `{
  "summary": {
    "mainTopic": "睡眠姿势与健康的关系",
    "corePoints": [
      "不同睡眠姿势会影响身体健康",
      "侧睡、仰睡、俯睡各有优劣",
      "没有一种姿势适合所有人"
    ]
  },
  "cards": [
    {
      "style": "种草风",
      "title": "你睡对了吗？这几种姿势真的能改善睡眠质量",
      "hook": [
        "每天早上醒来脖子酸、腰痛，是不是和睡姿有关？",
        "其实睡觉的姿势也能影响你的健康，甚至改变性格！"
      ],
      "body": "很多人可能不知道，睡眠姿势其实和我们的性格、身体状况息息相关。比如喜欢仰着睡的人通常比较自信，而喜欢趴着睡的人则被认为更沉稳。不过这些说法虽然有趣，但真正值得我们关注的是，不同的睡姿会对身体产生不同的影响。",
      "根据研究，大多数人最终都会倾向于侧睡，而俯睡是最少被选择的姿势。如果你是那种喜欢趴着睡的人，其实也有它的优点，比如对某些呼吸问题有帮助。不过大多数情况下，医生还是会建议避免俯睡，因为它容易让脊椎变形，造成不适。",
      "对于经常熬夜、压力大的人来说，选择一个合适的睡姿非常重要。你可以尝试在侧睡时在膝盖之间夹个枕头，这样能让脊柱保持自然弯曲，减少背部压力。同时，仰睡时在膝盖下垫个枕头，也能帮助缓解腰痛。",
      "不过，也有人喜欢自由发挥，喜欢像‘僵尸’一样躺着，或者像‘士兵’一样挺直。其实这些姿势虽然看起来不标准，但只要不影响健康，也没必要强迫自己改变。重要的是找到让自己舒服又不会伤害身体的方式。",
      "如果你正在寻找改善睡眠的方法，不妨从调整睡姿开始。尝试一些新的姿势，看看哪种更适合你。记得不要盲目跟风，每个人的身体都是独一无二的。",
      "别急，后面才是关键。如果你也卡在这里，照做就行。无论是为了健康还是舒适，选择一个适合自己的睡姿，真的很重要。",
      "我直接说重点：睡姿不仅影响第二天的精神状态，还可能关系到长期的健康问题。找到适合自己的方式，才能拥有高质量的睡眠。",
      "希望这篇分享能帮到你，如果你觉得有用，记得点赞收藏哦～",
      "cta": [
        "你也试试这个睡姿，有什么变化吗？",
        "评论区告诉我你现在的睡姿是什么？",
        "关注我，一起探索更好的生活方式"
      ],
      "hashtags": ["#睡眠姿势", "#好梦", "#健康生活", "#睡眠改善", "#生活小技巧"],
      "key_takeaways": [
        "睡姿对身体影响很大",
        "侧睡可以减轻脊椎压力",
        "不要强迫自己改变睡姿"
      ],
      "target_audience": [
        "睡眠质量差的人",
        "经常腰背酸痛的人",
        "想改善生活习惯的人"
      ],
      "caution": [
        "不要突然改变睡姿，要循序渐进",
        "如果有严重健康问题，建议咨询医生"
      ],
      "confidence": 75,
      "source_coverage": 80
    }
  ]
}`;

console.log('=== Testing JSON Parser ===\n');
console.log('AI Response length:', aiResponse.length);
console.log('\n--- Parsing ---\n');

const result = parseResponse(aiResponse);

console.log('\n--- Result ---\n');
if (result) {
  console.log('✅ SUCCESS!');
  console.log('Summary:', result.summary);
  console.log('Cards:', result.cards ? result.cards.length : 0);
} else {
  console.log('❌ FAILED!');
}
