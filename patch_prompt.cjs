const fs = require('fs');

const aiServicePath = 'src/services/aiService.ts';
let aiService = fs.readFileSync(aiServicePath, 'utf8');

// We need to add strict rules against action descriptions in BOTH prompt generation blocks.

const newPromptRule = `
10. 【严禁动作描写与括号旁白】：微信聊天就是纯文字交流，绝对不允许在回复中加入任何动作描写、神态描写或括号旁白（如 (微笑)、*叹气*、[递给你一杯水]、(我) 等），必须像真人打字一样纯粹，不要当成小说角色扮演！
`;

// It's easier to just do a string replacement on the line `9. 【必须回复所有未回复消息】...`
aiService = aiService.replace(
  /9\. 【必须回复所有未回复消息】：如果用户连续发送了多条消息，必须优先回复最新一条消息，顺带回复之前未回复的旧消息，一条回复里覆盖所有未回复的内容。\\n\\n`;/g,
  `9. 【必须回复所有未回复消息】：如果用户连续发送了多条消息，必须优先回复最新一条消息，顺带回复之前未回复的旧消息，一条回复里覆盖所有未回复的内容。
10. 【严禁动作描写与括号旁白】：微信聊天就是纯文字交流，绝对不允许在回复中加入任何动作描写、神态描写或括号旁白（如 (微笑)、*叹气*、[递给你一杯水]、(我) 等），必须像真人发微信一样纯文字（仅限表情包和心声标签），不要当成小说语C！\\n\\n\`;`
);

fs.writeFileSync(aiServicePath, aiService, 'utf8');
console.log('Patched aiService.ts prompt');
