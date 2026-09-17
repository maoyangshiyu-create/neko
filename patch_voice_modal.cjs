const fs = require('fs');
const path = 'src/components/phone/wechat/VoiceCallModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add callAI to imports
content = content.replace(
  "import { playVoice, resolveTtsEndpoint, stopAllActiveAudio } from '../../../services/aiService';",
  "import { callAI, playVoice, resolveTtsEndpoint, stopAllActiveAudio } from '../../../services/aiService';"
);

// 2. Update startAiGreeting / handleAiFirstSpeak logic to not require settings.apiKey
content = content.replace(
  "if (recentText && settings.apiKey) {",
  "if (recentText) {"
);

// 3. Update triggerAiResponse to use callAI
const oldTriggerAiResponse = `  const triggerAiResponse = async (userMessage: string) => {
    setIsGenerating(true);
    setIsAiSpeaking(true);

    try {
      let aiReply = '';
      if (settings.apiKey && settings.apiKey.trim().length > 0) {
        const base = (settings.apiUrl || 'https://api.openai.com/v1').trim().replace(/\\/+$/, '');
        const endpoint = base.endsWith('/v1') ? \`\${base}/chat/completions\` : \`\${base}/v1/chat/completions\`;

        const systemPrompt = \`你正在与好友【\${contact.name}】进行【实时微信语音电话】。
人设：\${contact.persona}
【语音通话规则】：
1. 你的回答是直接通过语音播放给对方听的，必须极其口语化、亲切自然，适合实时通话。
2. 绝对不要加任何表情符号、波浪号、符号、括号动作描写或 Markdown 格式。
3. 保持在 1-3 句话以内，就像真实的电话交谈一样。\`;

        const historyContext = logs.map(l => ({
          role: l.sender === 'user' ? 'user' : 'assistant',
          content: l.text
        }));

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${settings.apiKey.trim()}\`
          },
          body: JSON.stringify({
            model: settings.modelName || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...historyContext,
              { role: 'user', content: userMessage }
            ],
            temperature: 0.8
          })
        });

        if (res.ok) {
          const data = await res.json();
          aiReply = data?.choices?.[0]?.message?.content?.trim() || '';
        }
      }

      if (!aiReply) {
        throw new Error('AI 通话回复生成失败，请检查模型连接与API设置');
      }

      // Clean all emojis & brackets for clean speech
      aiReply = aiReply.replace(/\\[.*?\\]|\\(.*\\)|（.*?）/g, '').replace(/[\\p{Extended_Pictographic}\\u2600-\\u27BF]/gu, '').trim();

      setCurrentAiText(aiReply);
      const newLog: CallLogItem = {
        id: 'call_' + Date.now(),
        sender: 'ai',
        text: aiReply,
        timestamp: Date.now()
      };
      setLogs(prev => [...prev, newLog]);

      // Automatically play voice of AI reply!
      await playVoice({
        text: aiReply,
        voiceTimbre: contact.voiceTimbre,
        settings
      });
    } catch (err) {
      console.error('Call AI speech error:', err);
    } finally {
      setIsGenerating(false);
      setIsAiSpeaking(false);
    }
  };`;

const newTriggerAiResponse = `  const triggerAiResponse = async (userMessage: string) => {
    setIsGenerating(true);
    setIsAiSpeaking(true);

    try {
      const historyChatMsgs: ChatMessage[] = logs.map(l => ({
        id: l.id,
        sender: l.sender === 'user' ? 'user' as const : 'ai' as const,
        content: l.text,
        timestamp: l.timestamp,
        type: 'text'
      }));

      historyChatMsgs.push({
        id: 'call_msg_' + Date.now(),
        sender: 'user',
        content: userMessage,
        timestamp: Date.now(),
        type: 'text'
      });

      const contactForCall = {
        ...contact,
        enableInnerVoice: false
      };

      let rawAiReply = await callAI({
        contact: contactForCall,
        messages: historyChatMsgs,
        worldBooks,
        settings
      });

      let aiReply = (rawAiReply || '')
        .replace(/\\[心声[:：][^\\]]+\\\]/gi, '')
        .replace(/\\[.*?\\]|\\(.*\\)|（.*?）/g, '')
        .replace(/[\\p{Extended_Pictographic}\\u2600-\\u27BF]/gu, '')
        .trim();

      if (!aiReply) {
        throw new Error('AI 未能生成有效的通话回复');
      }

      setCurrentAiText(aiReply);
      const newLog: CallLogItem = {
        id: 'call_' + Date.now(),
        sender: 'ai',
        text: aiReply,
        timestamp: Date.now()
      };
      setLogs(prev => [...prev, newLog]);

      // Automatically play voice of AI reply!
      await playVoice({
        text: aiReply,
        voiceTimbre: contact.voiceTimbre,
        settings
      });
    } catch (err: any) {
      console.error('Call AI speech error:', err);
      const errText = err?.message || '网络连接异常或服务响应故障';
      const errorLog: CallLogItem = {
        id: 'call_err_' + Date.now(),
        sender: 'ai',
        text: \`[通话提示] 语音回复生成失败：\${errText}\`,
        timestamp: Date.now()
      };
      setLogs(prev => [...prev, errorLog]);
    } finally {
      setIsGenerating(false);
      setIsAiSpeaking(false);
    }
  };`;

content = content.replace(oldTriggerAiResponse, newTriggerAiResponse);

fs.writeFileSync(path, content, 'utf8');
console.log('VoiceCallModal.tsx patched successfully');
