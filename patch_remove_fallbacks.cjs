const fs = require('fs');

// 1. Update aiService.ts
const aiServicePath = 'src/services/aiService.ts';
let aiService = fs.readFileSync(aiServicePath, 'utf8');

const targetStr = `    if (res.ok) {
      const data = await res.json();
      const reply = data?.reply ? data.reply.trim() : '';
      if (reply && reply.toLowerCase() !== 'fallback' && reply.toLowerCase() !== '"fallback"') {
        return reply;
      }
    }
  } catch (serverErr: any) {
    console.warn('Server AI Chat error, will generate contextual reply:', serverErr);
  }

  // Graceful in-character fallback ensures the chat experience never fails or throws
  const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.content || '你好';
  return generateContextualInCharacterReply(contact, lastUserMsg);`;

const replacementStr = `    if (res.ok) {
      const data = await res.json();
      const reply = data?.reply ? data.reply.trim() : '';
      if (reply && reply.toLowerCase() !== 'fallback' && reply.toLowerCase() !== '"fallback"') {
        return reply;
      }
      throw new Error('AI 返回回复内容为空');
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || \`AI 接口通信失败 (\${res.status})\`);
    }
  } catch (serverErr: any) {
    console.error('Server AI Chat error:', serverErr);
    throw serverErr;
  }`;

if (aiService.includes(targetStr)) {
  aiService = aiService.replace(targetStr, replacementStr);
  fs.writeFileSync(aiServicePath, aiService, 'utf8');
  console.log('Successfully updated aiService.ts');
} else {
  console.log('Target string in aiService.ts not found, let format inspect...');
}

// 2. Update ChatRoom.tsx
const chatRoomPath = 'src/components/phone/wechat/ChatRoom.tsx';
let chatRoom = fs.readFileSync(chatRoomPath, 'utf8');

// Replace single-chat fallback in ChatRoom.tsx
const crTarget1 = `        // 如果重试后仍无回复，智能生成符合角色性格的自然回复，确保对话永不中断
        if (!fullReply) {
          const currentMessages = messagesRef.current || messages;
          const lastUserMsg = [...currentMessages].reverse().find(m => m.sender === 'user')?.content || '你好';
          fullReply = generateContextualInCharacterReply(contact, lastUserMsg);
        }`;

const crReplacement1 = `        if (!fullReply) {
          throw lastError || new Error('AI 未能生成有效回复');
        }`;

chatRoom = chatRoom.replace(crTarget1, crReplacement1);

// Replace empty validSegments fallback in ChatRoom.tsx
const crTarget2 = `            const currentMessages = messagesRef.current || messages;
            const lastUserMsg = [...currentMessages].reverse().find(m => m.sender === 'user')?.content || '你好';
            const rawFallback = generateContextualInCharacterReply(contact, lastUserMsg);
            validSegments.push(rawFallback.replace(/\\[心声[:：][^\\]]+\\]/gi, '').trim());`;

const crReplacement2 = `            throw new Error('AI 回复无法解析或为空');`;

chatRoom = chatRoom.replace(crTarget2, crReplacement2);

// Replace catch block in handleTriggerAi
const crTarget3 = `    } catch (err: any) {
      if (aiCancelRef.current) {
        console.log('AI response generation cancelled');
        return;
      }
      console.error('AI generation catch error:', err);
      // 优雅恢复：以人设口吻发送回复，避免系统红色错误提示中断用户沉浸式体验
      const currentMessages = messagesRef.current || messages;
      const lastUserMsg = [...currentMessages].reverse().find(m => m.sender === 'user')?.content || '你好';
      const recoveryReply = generateContextualInCharacterReply(contact, lastUserMsg);
      const parsedRecovery = parseAiResponse(recoveryReply);
      onSendMessage({
        sender: 'ai',
        content: parsedRecovery.segments.join(' '),
        innerVoice: parsedRecovery.innerVoice,
        timestamp: Date.now(),
        type: 'text'
      });
    }`;

const crReplacement3 = `    } catch (err: any) {
      if (aiCancelRef.current) {
        console.log('AI response generation cancelled');
        return;
      }
      console.error('AI generation catch error:', err);
      const errDetail = err?.message || '网络连接或接口服务异常';
      onSendMessage({
        sender: 'system',
        content: \`系统提示：AI回复生成失败（\${errDetail}）\`,
        timestamp: Date.now(),
        type: 'text'
      });
    }`;

chatRoom = chatRoom.replace(crTarget3, crReplacement3);

// Replace file handling fallback in ChatRoom.tsx
const crTarget4 = `      } catch (aiErr) {
        console.warn('AI call for file processing failed, using character fallback:', aiErr);
      }

      if (!reply) {
        reply = generateContextualInCharacterReply(contact, \`我发了文件: \${file.name}\`) || \`收到你的文件【\${file.name}】啦，我稍后仔细查阅！\`;
      }`;

const crReplacement4 = `      } catch (aiErr: any) {
        console.warn('AI call for file processing failed:', aiErr);
        onSendMessage({
          sender: 'system',
          content: \`系统提示：文件【\${file.name}】处理失败（\${aiErr?.message || 'AI响应异常'}）\`,
          timestamp: Date.now(),
          type: 'text'
        });
        return;
      }

      if (!reply) {
        onSendMessage({
          sender: 'system',
          content: \`系统提示：文件【\${file.name}】处理未获取到 AI 回复\`,
          timestamp: Date.now(),
          type: 'text'
        });
        return;
      }`;

chatRoom = chatRoom.replace(crTarget4, crReplacement4);

const crTarget5 = `    } catch (err: any) {
      console.warn('文件处理异常并使用角色兜底:', err);
      const fallbackReply = generateContextualInCharacterReply(contact, \`我发了文件: \${file.name}\`) || \`收到你的文件【\${file.name}】啦，等我细看下！\`;
      const parsedFallback = parseAiResponse(fallbackReply);
      onSendMessage({
        sender: 'ai',
        content: parsedFallback.segments.join(' '),
        innerVoice: parsedFallback.innerVoice,
        timestamp: Date.now(),
        type: 'text'
      });
    }`;

const crReplacement5 = `    } catch (err: any) {
      console.warn('文件处理异常:', err);
      onSendMessage({
        sender: 'system',
        content: \`系统提示：文件处理发生错误（\${err?.message || '无法处理该文件'}）\`,
        timestamp: Date.now(),
        type: 'text'
      });
    }`;

chatRoom = chatRoom.replace(crTarget5, crReplacement5);

fs.writeFileSync(chatRoomPath, chatRoom, 'utf8');
console.log('Successfully updated ChatRoom.tsx');

