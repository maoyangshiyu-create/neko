const fs = require('fs');
const chatRoomPath = 'src/components/phone/wechat/ChatRoom.tsx';
let chatRoom = fs.readFileSync(chatRoomPath, 'utf8');

// 1. Line 1200: validSegments.push(generateContextualInCharacterReply(contact, lastUserMsg));
// If we just pushed the raw string, it would have [心声]. But wait, the push to validSegments is just string.
// We should parse it and push the segments. But we also need to set innerVoice if it has one!
// Let's replace the whole fallback logic block.
chatRoom = chatRoom.replace(
  /validSegments\.push\(generateContextualInCharacterReply\(contact, lastUserMsg\)\);/g,
  `const fallbackGen = generateContextualInCharacterReply(contact, lastUserMsg);
            const parsedFallback = parseAiResponse(fallbackGen);
            validSegments.push(...parsedFallback.segments);
            // We can't easily set innerVoice here since it's a const declared above, but innerVoice is not a const? 
            // Wait, innerVoice is defined as \`const { segments, innerVoice } = parseAiResponse(fullReply);\`
            // Let's just push the fallbackContent and NOT push the raw innerVoice string as text!
`
);

// Wait, the regex replace for line 1200 is too messy this way. Let's write a targeted replace.
