import { useEffect, useRef } from 'react';
import { Contact, ChatMessage, PhoneSettings } from '../types/phone';
import { generateProactiveMessage, playVoice, extractAndStripInnerVoice } from '../services/aiService';

interface ProactiveState {
  lastProactiveAt: number;
  todayGreetings: string[];
  todayMeals: string[]; // Track lunch/dinner asked
  mealFollowUpStatus: Record<string, { sentAt: number; type: 'lunch' | 'dinner'; status: 'pending' | 'sent' | 'replied' }>;
  lastWeatherAlertDate: string;
  dailyProactiveCount: number;
  dateStr: string;
}

export function useProactiveMessages(
  contacts: Contact[],
  messagesMap: Record<string, ChatMessage[]>,
  settings: PhoneSettings,
  activeApp: string,
  activeChatContactId: string | null,
  onNewMessage: (contactId: string, msg: ChatMessage) => void
) {
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (settings.enableProactiveMessages === false) return;

    const interval = setInterval(async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const now = new Date();
        const hour = now.getHours();
        const dateStr = now.toISOString().split('T')[0];
        
        // Load state
        const stateStr = localStorage.getItem('wephone_proactive_v2');
        const proactiveState: Record<string, ProactiveState> = stateStr ? JSON.parse(stateStr) : {};

        // Settings frequency
        const freq = settings.proactiveMessageFrequency || 'medium';
        const dailyLimit = freq === 'low' ? 3 : freq === 'high' ? 12 : 6;
        const probMultiplier = freq === 'low' ? 0.5 : freq === 'high' ? 2 : 1;

        const safeContacts = Array.isArray(contacts) ? contacts : [];
        const safeMessagesMap = (messagesMap && typeof messagesMap === 'object') ? messagesMap : {};

        for (const contact of safeContacts) {
          // Skip groups, tools, assistants
          if (
            contact.isGroup ||
            contact.isTool ||
            contact.isAssistant ||
            contact.id.startsWith('group_') ||
            contact.id.startsWith('tool_') ||
            contact.id === 'assistant' ||
            contact.group === '工具' ||
            contact.group === '助手'
          ) continue;
          
          let cState = proactiveState[contact.id] || {
            lastProactiveAt: 0,
            todayGreetings: [],
            todayMeals: [],
            mealFollowUpStatus: {},
            lastWeatherAlertDate: '',
            dailyProactiveCount: 0,
            dateStr
          };

          // Reset daily state if new day
          if (cState.dateStr !== dateStr) {
            cState = {
              lastProactiveAt: cState.lastProactiveAt,
              todayGreetings: [],
              todayMeals: [],
              mealFollowUpStatus: {},
              lastWeatherAlertDate: cState.lastWeatherAlertDate,
              dailyProactiveCount: 0,
              dateStr
            };
          }

          const contactMessages = (safeMessagesMap && Array.isArray(safeMessagesMap[contact.id])) ? safeMessagesMap[contact.id] : [];
          const lastMsg = contactMessages[contactMessages.length - 1];
          const timeSinceLastMsg = lastMsg ? now.getTime() - lastMsg.timestamp : 9999999999;
          const lastUserMsg = [...contactMessages].reverse().find(m => m.sender === 'user');
          
          const timeSinceLastProactive = now.getTime() - cState.lastProactiveAt;
          
          // Lower minimum interval to 15 mins for more activity
          const MIN_INTERVAL = 15 * 60 * 1000;
          if (timeSinceLastProactive < MIN_INTERVAL) continue;

          let triggeredScenario = '';
          let ignoreDailyLimit = false;

          // 1. Weather Alert (7 AM, only extreme weather)
          if (hour === 7 && cState.lastWeatherAlertDate !== dateStr && settings.enableWeatherAwareness && settings.weatherCache?.data) {
            const w = settings.weatherCache.data;
            const isExtreme = w.weather.includes('雨') || w.weather.includes('雪') || w.weather.includes('雷') || w.temperature < 5 || w.temperature > 35;
            if (isExtreme) {
              triggeredScenario = `天气提醒：今天天气极端（${w.weather}，气温${w.temperature}°C）。请结合人设给玩家发一句关怀消息，严禁硬模板，禁止报时。`;
              cState.lastWeatherAlertDate = dateStr;
              ignoreDailyLimit = true;
            }
          }

          // 2. Scheduled Greetings (Morning/Night)
          if (!triggeredScenario) {
            if (hour >= 7 && hour < 10 && !cState.todayGreetings.includes('morning')) {
              triggeredScenario = '早安问候：开启新的一天。请结合人设发一句早安并附带具体的、符合性格的关心。禁止使用模板。';
              cState.todayGreetings.push('morning');
              ignoreDailyLimit = true;
            } else if (hour >= 21 && hour < 23 && !cState.todayGreetings.includes('evening')) {
              triggeredScenario = '晚安问候：总结今天或道声晚安。请结合人设发一句晚安，聊聊今天发生的（虚构且符合人设）事或叮嘱早点休息。禁止使用模板。';
              cState.todayGreetings.push('evening');
              ignoreDailyLimit = true;
            }
          }

          // 3. Eating Together (Meal time + 1h Follow-up)
          if (!triggeredScenario) {
            const isLunchTime = hour >= 11 && hour < 13;
            const isDinnerTime = hour >= 17 && hour < 19;
            const mealType = isLunchTime ? 'lunch' : (isDinnerTime ? 'dinner' : null);

            if (mealType && !cState.todayMeals.includes(mealType)) {
              triggeredScenario = `吃饭问候：${mealType === 'lunch' ? '午餐' : '晚餐'}时间。请告诉玩家你要去吃饭了，并问对方吃了吗。必须符合人设语气，严禁“在干嘛/吃了没”等AI感废话。`;
              cState.todayMeals.push(mealType);
              cState.mealFollowUpStatus[mealType] = { sentAt: now.getTime(), type: mealType, status: 'pending' };
              ignoreDailyLimit = true;
            } else {
              // Follow-up check
              for (const mType of ['lunch', 'dinner']) {
                const fStatus = cState.mealFollowUpStatus[mType];
                if (fStatus && fStatus.status === 'pending') {
                  const timeSinceSent = now.getTime() - fStatus.sentAt;
                  if (lastUserMsg && lastUserMsg.timestamp > fStatus.sentAt) {
                    fStatus.status = 'replied';
                  } else if (timeSinceSent > 45 * 60 * 1000) { // Reduced to 45 mins
                    triggeredScenario = `吃饭催促：之前问了吃饭没回。请发一句自然的追问或叮嘱，带上性格情感（如“是不是还没吃？记得吃饭”）。`;
                    fStatus.status = 'sent';
                    ignoreDailyLimit = true;
                    break;
                  }
                }
              }
            }
          }
          
          if (!triggeredScenario && cState.dailyProactiveCount < dailyLimit) {
            // 4. Short-term Interaction Follow-up (NEW)
            // If user messaged recently and conversation paused (5 to 45 minutes)
            const timeSinceLastMsgSec = timeSinceLastMsg / 1000;
            if (timeSinceLastMsgSec > 5 * 60 && timeSinceLastMsgSec < 45 * 60) {
              if (Math.random() < 0.25 * probMultiplier) {
                triggeredScenario = '互动后续：刚才聊过天，但现在安静下来了。请结合刚才的聊天内容，发一句自然的回应、延伸话题或分享一件相关的琐事，打破沉默。';
              }
            }

            // 5. Long Time No Contact (reduced from 3h to 1.5h)
            if (!triggeredScenario && timeSinceLastMsg > 90 * 60 * 1000 && timeSinceLastProactive > 60 * 60 * 1000) {
              if (Math.random() < 0.5 * probMultiplier) {
                triggeredScenario = '长时间未联系：距离上次聊天已经有一阵子了，发句自然的问候，展现你的性格。可以直接发起一个话题或分享一件生活小事。';
              }
            }

            // 6. Sharing Content (NEW)
            if (!triggeredScenario && timeSinceLastProactive > 60 * 60 * 1000) {
              if (Math.random() < 0.25 * probMultiplier) {
                const shareTypes = ['photo', 'link', 'voice', 'thought'];
                const type = shareTypes[Math.floor(Math.random() * shareTypes.length)];
                triggeredScenario = `内容分享：你想和对方分享一个${type === 'photo' ? '生活瞬间（描述照片内容）' : type === 'link' ? '有趣的推文/文章（描述标题）' : type === 'voice' ? '语音消息（描述声音语境）' : '突如其来的想法'}。请用极其自然且符合人设的语气开启话题。`;
              }
            }

            // 7. Emotion Follow-up
            if (!triggeredScenario && timeSinceLastProactive > 2 * 60 * 60 * 1000) {
              const emotionWords = ['难受', '累', '烦', '开心', '生气', '郁闷', '绝望', '崩溃', '激动', '高兴', '委屈', '想你'];
              const recentMsgs = contactMessages.slice(-20);
              const hasEmotion = recentMsgs.some(m => m.sender === 'user' && emotionWords.some(w => m.content.includes(w)));
              if (hasEmotion) {
                if (Math.random() < 0.7 * probMultiplier) {
                  triggeredScenario = '情绪跟进：对方之前表达过一些情绪，请根据上下文自然关心或跟进，展现性格。不仅是安慰，也可以是分享快乐或分担忧愁。';
                }
              }
            }

            // 8. Random Missing
            if (!triggeredScenario && timeSinceLastProactive > 60 * 60 * 1000) {
              if (Math.random() < 0.3 * probMultiplier) {
                triggeredScenario = '随机想念：突然想到对方了，发一句自然的话表达想念，符合人设逻辑。可以是分享一段有趣的脑洞，或者问问对方现在在忙什么。';
              }
            }
          }

          // 9. AI 主动拍一拍 (仅当用户显式开启 allowProactivePat 时才允许，否则绝不拍一拍)
          let isPatScenario = false;
          if (
            settings.allowProactivePat &&
            !triggeredScenario &&
            timeSinceLastProactive > 12 * 60 * 60 * 1000 &&
            cState.dailyProactiveCount < dailyLimit
          ) {
            // 极低概率触发，绝不喧宾夺主
            if (Math.random() < 0.01 * probMultiplier) {
              const userSuffix = settings.userPatSuffix || '';
              triggeredScenario = `拍一拍互动：你刚才在微信聊天框里拍了拍玩家${userSuffix || '了一下'}。请结合人设回应并针对后缀吐槽，严禁幻觉改了后缀。`;
              isPatScenario = true;
            }
          }

          // Execution (Works with custom API or built-in Gemini proxy)
          if (triggeredScenario) {
            try {
              if (isPatScenario) {
                const contactName = contact.remark || contact.name;
                const userSuffix = settings.userPatSuffix || '';
                onNewMessage(contact.id, {
                  id: `pat_sys_${Date.now()}`,
                  sender: 'system',
                  type: 'pat',
                  content: `${contactName}拍了拍你${userSuffix}`,
                  timestamp: Date.now()
                });
              }

              const textContent = await generateProactiveMessage({
                contact,
                messages: contactMessages,
                settings,
                triggerScenario: triggeredScenario
              });

              if (textContent) {
                const { cleanText, innerVoice } = extractAndStripInnerVoice(textContent);
                const finalContent = cleanText || textContent;

                // 有一定概率（30%）且联系人有音色时，直接发送语音消息类型
                const isVoiceMessage = settings.ttsVoiceId && contact.voiceTimbre && Math.random() < 0.3;
                
                const newMsg: ChatMessage = {
                  id: `msg_proactive_${Date.now()}`,
                  sender: 'ai',
                  senderId: contact.id,
                  senderName: contact.remark || contact.name,
                  senderAvatar: contact.avatar,
                  content: finalContent,
                  innerVoice: (contact.enableInnerVoice !== false && innerVoice) ? innerVoice : undefined,
                  timestamp: Date.now(),
                  type: isVoiceMessage ? 'voice' : 'text',
                  voiceDuration: isVoiceMessage ? Math.min(Math.floor(finalContent.length / 3) + 1, 15) : undefined
                };
                
                // Proactive voice autoplay disabled (click to play only)

                cState.lastProactiveAt = now.getTime();
                if (!ignoreDailyLimit) cState.dailyProactiveCount += 1;
                proactiveState[contact.id] = cState;
                localStorage.setItem('wephone_proactive_v2', JSON.stringify(proactiveState));
                
                // 如果是拍一拍，稍微延迟 1-2 秒再发文字/语音，显得更像真人在操作
                if (isPatScenario) {
                  setTimeout(() => onNewMessage(contact.id, newMsg), 1500);
                } else {
                  onNewMessage(contact.id, newMsg);
                }
                break;
              }
            } catch (err) {
              console.error('Proactive failed:', err);
            }
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [contacts, messagesMap, settings, activeApp, activeChatContactId, onNewMessage]);
}
