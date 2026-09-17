const fs = require('fs');
const path = 'src/components/phone/wechat/ChatRoom.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix 1: Line 1200
const oldFallback1 = `const currentMessages = messagesRef.current || messages;
            const lastUserMsg = [...currentMessages].reverse().find(m => m.sender === 'user')?.content || '你好';
            validSegments.push(generateContextualInCharacterReply(contact, lastUserMsg));`;
const newFallback1 = `const currentMessages = messagesRef.current || messages;
            const lastUserMsg = [...currentMessages].reverse().find(m => m.sender === 'user')?.content || '你好';
            const rawFallback = generateContextualInCharacterReply(contact, lastUserMsg);
            validSegments.push(rawFallback.replace(/\\[心声[:：][^\\]]+\\]/gi, '').trim());`;
content = content.replace(oldFallback1, newFallback1);

// Fix 2: Line 1499 catch block
const oldCatch = `const recoveryReply = generateContextualInCharacterReply(contact, lastUserMsg);
      onSendMessage({
        sender: 'ai',
        content: recoveryReply,
        timestamp: Date.now(),
        type: 'text'
      });`;
const newCatch = `const recoveryReply = generateContextualInCharacterReply(contact, lastUserMsg);
      const parsedRecovery = parseAiResponse(recoveryReply);
      onSendMessage({
        sender: 'ai',
        content: parsedRecovery.segments.join(' '),
        innerVoice: parsedRecovery.innerVoice,
        timestamp: Date.now(),
        type: 'text'
      });`;
content = content.replace(oldCatch, newCatch);

// Fix 3: Line 1675
const oldFile1 = `if (!reply) {
        reply = generateContextualInCharacterReply(contact, \`我发了文件: \${file.name}\`) || \`收到你的文件【\${file.name}】啦，我稍后仔细查阅！\`;
      }

      // 发送 AI 回复
      setTimeout(() => {
        onSendMessage({
          sender: 'ai',
          content: reply,
          timestamp: Date.now(),
          type: 'text'
        });
      }, 400);`;
const newFile1 = `if (!reply) {
        reply = generateContextualInCharacterReply(contact, \`我发了文件: \${file.name}\`) || \`收到你的文件【\${file.name}】啦，我稍后仔细查阅！\`;
      }
      
      const parsedReply = parseAiResponse(reply);

      // 发送 AI 回复
      setTimeout(() => {
        onSendMessage({
          sender: 'ai',
          content: parsedReply.segments.join(' '),
          innerVoice: parsedReply.innerVoice,
          timestamp: Date.now(),
          type: 'text'
        });
      }, 400);`;
content = content.replace(oldFile1, newFile1);

// Fix 4: Line 1690
const oldFile2 = `const fallbackReply = generateContextualInCharacterReply(contact, \`我发了文件: \${file.name}\`) || \`收到你的文件【\${file.name}】啦，等我细看下！\`;
      onSendMessage({
        sender: 'ai',
        content: fallbackReply,
        timestamp: Date.now(),
        type: 'text'
      });`;
const newFile2 = `const fallbackReply = generateContextualInCharacterReply(contact, \`我发了文件: \${file.name}\`) || \`收到你的文件【\${file.name}】啦，等我细看下！\`;
      const parsedFallback = parseAiResponse(fallbackReply);
      onSendMessage({
        sender: 'ai',
        content: parsedFallback.segments.join(' '),
        innerVoice: parsedFallback.innerVoice,
        timestamp: Date.now(),
        type: 'text'
      });`;
content = content.replace(oldFile2, newFile2);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed chat room fallbacks');
