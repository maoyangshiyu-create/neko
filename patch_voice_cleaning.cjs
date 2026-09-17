const fs = require('fs');

// 1. Update aiService.ts
const aiServicePath = 'src/services/aiService.ts';
let aiService = fs.readFileSync(aiServicePath, 'utf8');

// Update system prompt rule 8
aiService = aiService.replace(
  /8\. 【偶尔发语音】：角色绝大多数时候打字，偶尔遇到特别适合语气的短句时，可在句首加上 \[语音\]。/g,
  '8. 【发语音规则】：绝大多数时候打字交流。偶尔遇到特别适合语气的短句时，可在句首加上 [语音]（例如：[语音] 晚安啦）。绝对严禁在文字消息中直接包含 [语音消息: ...] 或 [语音消息：...] 等带括号的字样！'
);

// Update parseAiResponse to extract and standardize [语音消息: xxx] or [语音消息：xxx]
const parseAiTarget = `  // 2. Clean bracketed name prefixes and formatting artifacts
  cleanText = cleanText.replace(/^([【\\[\\(（][^】\\]\\)）]{1,20}[】\\]\\)）]\\s*[:：]?\\s*)+/gu, '').trim();`;

const parseAiReplacement = `  // 1.5 Convert [语音消息: xxx] / [语音: xxx] into separate \\n[语音] xxx\\n segments so voice text is isolated
  cleanText = cleanText.replace(/\\[语音(?:消息)?[:：]\\s*([^\\]]+)\\]/gi, '\\n[语音] $1\\n');
  cleanText = cleanText.replace(/\\[语音消息\\]/gi, '[语音]');

  // 2. Clean bracketed name prefixes and formatting artifacts
  cleanText = cleanText.replace(/^([【\\[\\(（][^】\\]\\)）]{1,20}[】\\]\\)）]\\s*[:：]?\\s*)+/gu, '').trim();`;

if (aiService.includes(parseAiTarget)) {
  aiService = aiService.replace(parseAiTarget, parseAiReplacement);
  console.log('Updated parseAiResponse in aiService.ts');
} else {
  console.log('parseAiTarget not found in aiService.ts');
}

// Update line 931 in aiService.ts
aiService = aiService.replace(
  `.replace(/\\[语音\\]/g, '')`,
  `.replace(/\\[语音(?:消息)?[:：]?\\s*[^\\\]]*\\]|\\[发语音\\]/gi, '')`
);

fs.writeFileSync(aiServicePath, aiService, 'utf8');


// 2. Update ChatRoom.tsx
const chatRoomPath = 'src/components/phone/wechat/ChatRoom.tsx';
let chatRoom = fs.readFileSync(chatRoomPath, 'utf8');

// Replace regexes in ChatRoom.tsx
chatRoom = chatRoom.replace(
  /s\.replace\(\/\\\[语音\\\]\|\\\[发语音\\\]\|\\\[表情:\\s\*\[\^\\]\+\\\]\/g, ''\)/g,
  "s.replace(/\\[语音(?:消息)?[:：]?\\s*[^\\\]]*\\]|\\[发语音\\]|\\[表情:\\s*[^\\\]]+\\]/gi, '')"
);

chatRoom = chatRoom.replace(
  /segments\[i\]\.replace\(\/\\\[语音\\\]\|\\\[发语音\\\]\/g, ''\)/g,
  "segments[i].replace(/\\[语音(?:消息)?[:：]?\\s*[^\\\]]*\\]|\\[发语音\\]/gi, '')"
);

chatRoom = chatRoom.replace(
  /validSegments\[i\]\.replace\(\/\\\[语音\\\]\|\\\[发语音\\\]\/g, ''\)/g,
  "validSegments[i].replace(/\\[语音(?:消息)?[:：]?\\s*[^\\\]]*\\]|\\[发语音\\]/gi, '')"
);

// Update voice tag detection in ChatRoom.tsx (line 1204)
chatRoom = chatRoom.replace(
  "const taggedIdx = validSegments.findIndex(s => s.includes('[语音]') || s.includes('[发语音]'));",
  "const taggedIdx = validSegments.findIndex(s => /\\[语音(?:消息)?\\]|\\[发语音\\]/i.test(s));"
);

fs.writeFileSync(chatRoomPath, chatRoom, 'utf8');
console.log('Updated ChatRoom.tsx');


// 3. Update TwitterApp.tsx
const twitterPath = 'src/components/phone/twitter/TwitterApp.tsx';
let twitter = fs.readFileSync(twitterPath, 'utf8');

twitter = twitter.replace(
  /\.replace\(\/\\\[语音\\\]\|\\\[发语音\\\]\/g, ''\)/g,
  ".replace(/\\[语音(?:消息)?[:：]?\\s*[^\\\]]*\\]|\\[发语音\\]/gi, '')"
);

fs.writeFileSync(twitterPath, twitter, 'utf8');
console.log('Updated TwitterApp.tsx');

