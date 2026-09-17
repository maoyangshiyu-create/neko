import React, { useState, useEffect, useRef } from 'react';
import { Contact, PhoneSettings, WorldBookItem, ChatMessage } from '../../../types/phone';
import { callAI, playVoice, resolveTtsEndpoint, stopAllActiveAudio } from '../../../services/aiService';
import { Avatar } from '../Avatar';
import { 
  PhoneOff, 
  PhoneCall, 
  Send, 
  History, 
  Volume2, 
  Sparkles, 
  MessageSquare, 
  X,
  Mic,
  Clock,
  Minus
} from 'lucide-react';

export interface CallLogItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

interface VoiceCallModalProps {
  contact: Contact;
  settings: PhoneSettings;
  worldBooks: WorldBookItem[];
  direction: 'outgoing' | 'incoming'; // outgoing: 玩家打给对方, incoming: 对方打给玩家
  onClose: (callLogs: CallLogItem[]) => void;
  recentMessages?: ChatMessage[];  // 最近聊天记录
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  contact,
  settings,
  worldBooks,
  direction,
  onClose,
  recentMessages
}) => {
  const activeTheme = settings.activeDIYThemeId && settings.diyThemes
    ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
    : undefined;

  // Call State: 'calling' (等待接通/来电振铃) | 'connected' (已接通) | 'ended' (已结束)
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [callDuration, setCallDuration] = useState(0);
  const [logs, setLogs] = useState<CallLogItem[]>([]);
  const [currentAiText, setCurrentAiText] = useState<string>('');
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [playingLogId, setPlayingLogId] = useState<string | null>(null);
  
  // UI Panels
  const [showHistory, setShowHistory] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Minimized Floating Widget State
  const [isMinimized, setIsMinimized] = useState(false);
  const [floatY, setFloatY] = useState(160);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startY: number; initialFloatY: number; moved: boolean }>({
    startY: 0,
    initialFloatY: 160,
    moved: false
  });

  const durationTimerRef = useRef<any>(null);
  const connectTimeoutRef = useRef<any>(null);
  const firstSpeakTimeoutRef = useRef<any>(null);
  const audioRingRef = useRef<any>(null);

  // Call lifecycle & abort safety refs to completely prevent speech after hangup
  const callActiveRef = useRef(true);
  const callAbortControllerRef = useRef<AbortController | null>(null);

  // Drag handlers for the floating widget on the right side
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      startY: clientY,
      initialFloatY: floatY,
      moved: false
    };
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const handleDragMove = (e: TouchEvent | MouseEvent) => {
      if (!isDraggingRef.current) return;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const deltaY = clientY - dragStartRef.current.startY;
      if (Math.abs(deltaY) > 5) {
        dragStartRef.current.moved = true;
      }
      // Clamped within screen bounds
      const maxH = typeof window !== 'undefined' ? window.innerHeight - 120 : 600;
      const newY = Math.max(50, Math.min(maxH, dragStartRef.current.initialFloatY + deltaY));
      setFloatY(newY);
    };

    const handleDragEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, []);

  // 1. Initial Call Flow & Component Lifecycle
  useEffect(() => {
    callActiveRef.current = true;
    callAbortControllerRef.current = new AbortController();

    if (direction === 'outgoing') {
      // 玩家打给对方：等待对方接听，2.5秒后自动接通
      connectTimeoutRef.current = setTimeout(() => {
        if (callActiveRef.current) {
          handleCallConnected();
        }
      }, 2600);
    }
    // incoming 则等待玩家点击“接通”

    return () => {
      callActiveRef.current = false;
      if (callAbortControllerRef.current) {
        try {
          callAbortControllerRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      if (firstSpeakTimeoutRef.current) clearTimeout(firstSpeakTimeoutRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      stopAllActiveAudio();
    };
  }, [direction]);

  // When call connected: start call timer & AI speaks greeting first!
  const handleCallConnected = () => {
    if (!callActiveRef.current) return;
    setCallStatus('connected');
    
    // Start duration timer
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      if (!callActiveRef.current) return;
      setCallDuration(prev => prev + 1);
    }, 1000);

    // AI greets first
    if (firstSpeakTimeoutRef.current) clearTimeout(firstSpeakTimeoutRef.current);
    firstSpeakTimeoutRef.current = setTimeout(() => {
      if (callActiveRef.current) {
        handleAiFirstSpeak();
      }
    }, 600);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // AI makes the opening statement
  const handleAiFirstSpeak = async () => {
    if (!callActiveRef.current) return;
    setIsAiSpeaking(true);
    
    // 从最近的聊天记录中提取话题
    const context = recentMessages || [];
    const recentText = context.slice(-10).map(m => 
      `${m.sender === 'user' ? '用户' : '对方'}: ${m.content}`
    ).join('\n');
    
    let greeting = '';
    
    // 如果有上下文，用 AI 生成相关开场白
    if (recentText && callActiveRef.current) {
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: `你正在给好友【${contact.name}】打电话。
人设：${contact.persona}
最近聊天记录：
${recentText}

⚠️ 这是你主动打给对方的电话！

【规则】：
1. 承接最近聊天中的话题，主动提问或表达关心
2. 绝对不能问"你找我有什么事"或"为什么给我打电话"
3. 电话是你打过去的，你是主动方
4. 只输出纯口语对话，不要任何动作描写（如"清了清嗓子"、"笑着说"等）
5. 20字以内，口语化

示例：
- "喂，你刚才说交了男朋友？跟我讲讲呗"
- "喂，我有点担心你，打个电话问问"`,
            messages: [{ role: 'user', content: '打电话' }],
            temperature: 0.8
          }),
          signal: callAbortControllerRef.current?.signal
        });
        if (!callActiveRef.current) return;
        const data = await res.json();
        greeting = data?.reply?.trim() || '';
      } catch (e: any) {
        if (!callActiveRef.current || e?.name === 'AbortError') return;
        console.warn('生成开场白失败:', e);
      }
    }
    
    if (!callActiveRef.current) return;

    // 备用开场白（确保是主动打电话的语气）
    if (!greeting) {
      const fallbacks = [
        `喂，是我！刚才聊到的事，我打电话跟你说。`,
        `喂，突然想听听你的声音，就打了。`,
        `喂，有点想你了，你在干嘛呢？`
      ];
      greeting = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // 清理动作描写残留
    greeting = greeting.replace(/[（\()[*]*[^）\)*]*[*]*[）\)]/g, '').trim();
    greeting = greeting.replace(/[*]+[^*]*[*]+/g, '').trim();
    greeting = greeting.replace(/清了清嗓子|笑了笑|轻声|低声|语气|声音/g, '').trim();

    if (!callActiveRef.current) return;

    setCurrentAiText(greeting);
    const newLog: CallLogItem = {
      id: 'call_' + Date.now(),
      sender: 'ai',
      text: greeting,
      timestamp: Date.now()
    };
    setLogs(prev => [...prev, newLog]);

    try {
      await playVoice({
        text: greeting,
        voiceTimbre: contact.voiceTimbre,
        settings,
        abortSignal: callAbortControllerRef.current?.signal
      });
    } catch (err: any) {
      if (!callActiveRef.current || err?.name === 'AbortError') return;
      console.warn('Voice call playback failed:', err);
    } finally {
      if (callActiveRef.current) {
        setIsAiSpeaking(false);
      }
    }
  };

  // AI responds to player during phone call
  const triggerAiResponse = async (userMessage: string) => {
    if (!callActiveRef.current) return;
    setIsGenerating(true);
    setIsAiSpeaking(true);

    try {
      let aiReply = '';
      if (settings.apiKey && settings.apiKey.trim().length > 0) {
        const base = (settings.apiUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
        const endpoint = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;

        const systemPrompt = `你正在与好友【${contact.name}】进行【实时微信语音电话】。
人设：${contact.persona}
【语音通话规则】：
1. 你的回答是直接通过语音播放给对方听的，必须极其口语化、亲切自然，适合实时通话。
2. 绝对不要加任何表情符号、波浪号、符号、括号动作描写或 Markdown 格式。
3. 保持在 1-3 句话以内，就像真实的电话交谈一样。`;

        const historyContext = logs.map(l => ({
          role: l.sender === 'user' ? 'user' : 'assistant',
          content: l.text
        }));

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: settings.modelName || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...historyContext,
              { role: 'user', content: userMessage }
            ],
            temperature: 0.8
          }),
          signal: callAbortControllerRef.current?.signal
        });

        if (!callActiveRef.current) return;

        if (res.ok) {
          const data = await res.json();
          aiReply = data?.choices?.[0]?.message?.content?.trim() || '';
        }
      }

      if (!callActiveRef.current) return;

      if (!aiReply) {
        throw new Error('AI 通话回复生成失败，请检查模型连接与API设置');
      }

      // Clean all emojis & brackets for clean speech
      aiReply = aiReply.replace(/\[.*?\]|\(.*?\)|（.*?）/g, '').replace(/[\p{Extended_Pictographic}\u2600-\u27BF]/gu, '').trim();

      if (!callActiveRef.current) return;

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
        settings,
        abortSignal: callAbortControllerRef.current?.signal
      });
    } catch (err: any) {
      if (!callActiveRef.current || err?.name === 'AbortError') return;
      console.error('Call AI speech error:', err);
    } finally {
      if (callActiveRef.current) {
        setIsGenerating(false);
        setIsAiSpeaking(false);
      }
    }
  };

  // Player sends message in call
  const handleUserSend = () => {
    if (!userInput.trim() || isGenerating || !callActiveRef.current) return;
    const text = userInput.trim();
    setUserInput('');

    const userLog: CallLogItem = {
      id: 'call_user_' + Date.now(),
      sender: 'user',
      text,
      timestamp: Date.now()
    };
    setLogs(prev => [...prev, userLog]);

    triggerAiResponse(text);
  };

  // Replay a previous voice snippet from history
  const handleReplayLog = async (log: CallLogItem) => {
    if (!callActiveRef.current) return;
    setPlayingLogId(log.id);
    try {
      await playVoice({
        text: log.text,
        voiceTimbre: log.sender === 'user' ? 'male-qn' : contact.voiceTimbre,
        settings,
        abortSignal: callAbortControllerRef.current?.signal
      });
    } catch (e: any) {
      if (!callActiveRef.current || e?.name === 'AbortError') return;
      console.warn('Replay voice failed:', e);
    } finally {
      if (callActiveRef.current) {
        setPlayingLogId(null);
      }
    }
  };

  // Hangup call
  const handleHangup = () => {
    callActiveRef.current = false;
    if (callAbortControllerRef.current) {
      try {
        callAbortControllerRef.current.abort();
      } catch (e) {
        // ignore
      }
    }
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    if (firstSpeakTimeoutRef.current) clearTimeout(firstSpeakTimeoutRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);

    stopAllActiveAudio();
    
    setCallStatus('ended');
    onClose(logs);
  };

  // 1. Minimized Mode: Right-side draggable floating WeChat call pill
  if (isMinimized) {
    const floatBg = activeTheme?.css?.['--gg-call-float-bg'];
    const floatBorder = activeTheme?.css?.['--gg-call-float-border'];
    const floatText = activeTheme?.css?.['--gg-call-float-text'];

    return (
      <div
        style={{ 
          top: `${floatY}px`,
          backgroundColor: floatBg || undefined,
          borderColor: floatBorder || undefined,
          color: floatText || undefined
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={() => {
          // If the user was dragging, don't trigger restore
          if (dragStartRef.current.moved) {
            dragStartRef.current.moved = false;
            return;
          }
          setIsMinimized(false);
        }}
        className={`absolute right-2 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl ${
          floatBg ? '' : 'bg-emerald-600/95 hover:bg-emerald-500'
        } ${
          floatText ? '' : 'text-white'
        } shadow-2xl ${
          floatBorder ? 'border' : 'border border-emerald-400/60'
        } backdrop-blur-md cursor-grab active:cursor-grabbing active:scale-95 transition-all select-none animate-in slide-in-from-right-4 duration-200`}
        title="点击返回通话界面，上下拖动可调整位置"
      >
        {/* Contact Avatar + Pulse green icon badge */}
        <div className="relative shrink-0 pointer-events-none">
          <Avatar
            src={contact.avatar}
            name={contact.name}
            className="w-8 h-8 rounded-full border shadow-xs"
            style={{ borderColor: activeTheme?.css?.['--gg-call-float-avatar-border'] || 'rgba(255, 255, 255, 0.4)' }}
            size={16}
          />
          <span 
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 text-emerald-950 rounded-full flex items-center justify-center ring-1 ring-white"
            style={{ backgroundColor: activeTheme?.css?.['--gg-call-dot-color'] || undefined }}
          >
            <PhoneCall className="w-2 h-2 text-emerald-950" />
          </span>
        </div>

        {/* Info: Contact Name & Call Duration / Status */}
        <div className="flex flex-col min-w-0 pr-1 text-left pointer-events-none">
          <span 
            className="text-[11px] font-bold max-w-[70px] truncate leading-tight"
            style={{ color: floatText || undefined }}
          >
            {contact.remark || contact.name}
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono opacity-90">
            <span 
              className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" 
              style={{ backgroundColor: activeTheme?.css?.['--gg-call-dot-color'] || undefined }}
            />
            <span style={{ color: floatText || undefined }}>{callStatus === 'connected' ? formatTime(callDuration) : '呼叫中...'}</span>
          </div>
        </div>

        {/* Animated mini sound wave bars */}
        <div className="flex items-end gap-0.5 ml-0.5 h-3.5 shrink-0 pointer-events-none">
          <span 
            className={`w-0.5 bg-emerald-200 rounded-full transition-all ${isAiSpeaking ? 'h-3 animate-pulse' : 'h-1.5'}`} 
            style={{ backgroundColor: activeTheme?.css?.['--gg-call-wave-color'] || undefined }}
          />
          <span 
            className={`w-0.5 bg-emerald-200 rounded-full transition-all ${isAiSpeaking ? 'h-3.5 animate-bounce' : 'h-2.5'}`} 
            style={{ backgroundColor: activeTheme?.css?.['--gg-call-wave-color'] || undefined }}
          />
          <span 
            className={`w-0.5 bg-emerald-200 rounded-full transition-all ${isAiSpeaking ? 'h-2 animate-pulse' : 'h-1'}`} 
            style={{ backgroundColor: activeTheme?.css?.['--gg-call-wave-color'] || undefined }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 z-50 bg-gradient-to-b from-stone-900 via-stone-850 to-stone-950 text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
      style={{
        backgroundColor: activeTheme?.css?.['--gg-call-bg'] || undefined,
        color: activeTheme?.css?.['--gg-call-text'] || undefined
      }}
    >
      {/* Custom Theme Call Background or Dynamic Ambient Background Blur */}
      {activeTheme?.assets?.callBg ? (
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0"
          style={{ backgroundImage: `url('${activeTheme.assets.callBg}')` }}
        />
      ) : (
        <div 
          className="absolute inset-0 opacity-15 bg-cover bg-center filter blur-3xl scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${contact.avatar})` }}
        />
      )}

      {/* Top Bar: Minus / Minimize Button + Status + History Button */}
      <div className="relative z-10 px-4 pt-6 pb-2 flex items-center justify-between">
        {/* Left: Minimize Button (左上角减号按钮) */}
        <button
          onClick={() => setIsMinimized(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white cursor-pointer backdrop-blur-md border border-white/10 group shadow-sm"
          style={{
            backgroundColor: activeTheme?.css?.['--gg-call-minimize-bg'] || undefined,
            color: activeTheme?.css?.['--gg-call-minimize-color'] || undefined
          }}
          title="最小化为悬浮窗"
        >
          <Minus className="w-4 h-4 text-stone-200 group-hover:text-white" style={{ color: activeTheme?.css?.['--gg-call-minimize-color'] || undefined }} />
        </button>

        {/* Center: Status & Timer */}
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" 
            style={{ backgroundColor: activeTheme?.css?.['--gg-call-dot-color'] || undefined }}
          />
          <span 
            className="text-xs text-stone-300 font-medium tracking-wide"
            style={{ color: activeTheme?.css?.['--gg-call-subtext'] || (activeTheme?.css?.['--gg-call-text'] ? `${activeTheme.css['--gg-call-text']}cc` : undefined) }}
          >
            {callStatus === 'connected' ? `通话中 · ${formatTime(callDuration)}` : (direction === 'outgoing' ? '正在呼叫...' : '来电邀请...')}
          </span>
        </div>

        {/* Right: History records button (右上角查看通话历史) */}
        {callStatus === 'connected' ? (
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-medium cursor-pointer backdrop-blur-md border border-white/10 text-stone-200"
            style={{
              backgroundColor: activeTheme?.css?.['--gg-call-history-bg'] || undefined,
              color: activeTheme?.css?.['--gg-call-history-text'] || undefined
            }}
          >
            <History 
              className="w-3.5 h-3.5 text-emerald-400" 
              style={{ color: activeTheme?.css?.['--gg-call-history-icon-color'] || undefined }}
            />
            <span style={{ color: activeTheme?.css?.['--gg-call-history-text'] || undefined }}>通话记录 ({logs.length})</span>
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Center Main Stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-2">
        {/* Avatar with pulse waves when speaking */}
        <div className="relative flex items-center justify-center my-4">
          {isAiSpeaking && (
            <>
              <div 
                className="absolute w-32 h-32 rounded-full bg-emerald-500/20 animate-ping" 
                style={{ backgroundColor: activeTheme?.css?.['--gg-call-wave-color'] ? `${activeTheme.css['--gg-call-wave-color']}33` : undefined }}
              />
              <div 
                className="absolute w-40 h-40 rounded-full border border-emerald-500/30 animate-pulse" 
                style={{ borderColor: activeTheme?.css?.['--gg-call-wave-color'] ? `${activeTheme.css['--gg-call-wave-color']}66` : undefined }}
              />
            </>
          )}
          <Avatar
            src={contact.avatar}
            name={contact.name}
            className={`w-24 h-24 rounded-full border-3 shadow-2xl relative z-10 transition-transform ${
              isAiSpeaking ? 'border-emerald-400 scale-105' : 'border-stone-700'
            }`}
            style={{
              borderColor: isAiSpeaking ? (activeTheme?.css?.['--gg-call-wave-color'] || undefined) : undefined
            }}
            size={48}
          />
        </div>

        {/* Contact Remark / Name */}
        <h3 
          className="text-lg font-bold text-white tracking-wide text-center"
          style={{ color: activeTheme?.css?.['--gg-call-text'] || undefined }}
        >
          {contact.remark || contact.name}
        </h3>
        <p 
          className="text-xs text-stone-400 mt-0.5 text-center font-mono"
          style={{ color: activeTheme?.css?.['--gg-call-subtext'] || undefined }}
        >
          音色: {contact.voiceTimbre || '默认'}
        </p>

        {/* Real-time Spoken Text Display Box (中间显示对应的语音文字) */}
        {callStatus === 'connected' && (
          <div className="w-full max-w-xs mt-6">
            <div 
              className="p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-center shadow-lg transition-all min-h-[72px] flex flex-col justify-center items-center"
              style={{ backgroundColor: activeTheme?.css?.['--gg-call-card-bg'] || undefined }}
            >
              {currentAiText ? (
                <>
                  <div 
                    className="flex items-center gap-1.5 text-[11px] text-emerald-400 mb-1 font-medium"
                    style={{ color: activeTheme?.css?.['--gg-call-wave-color'] || undefined }}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isAiSpeaking ? 'animate-bounce' : ''}`} style={{ color: activeTheme?.css?.['--gg-call-wave-color'] || undefined }} />
                    <span>{isAiSpeaking ? '对方正在说话...' : '对方刚刚说：'}</span>
                  </div>
                  <p 
                    className="text-sm font-medium text-stone-100 leading-relaxed"
                    style={{ color: activeTheme?.css?.['--gg-call-card-text'] || undefined }}
                  >
                    "{currentAiText}"
                  </p>
                </>
              ) : (
                <p 
                  className="text-xs text-stone-400 animate-pulse"
                  style={{ color: activeTheme?.css?.['--gg-call-subtext'] || undefined }}
                >
                  通话已建立，对方正在倾听...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Area: Controls & Inputs */}
      <div className="relative z-10 p-4 pb-8 space-y-4">
        {callStatus === 'calling' ? (
          /* Waiting for connect stage */
          <div className="flex justify-around items-center pt-6">
            {/* 挂断按钮（任何状态都存在） */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={handleHangup}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 flex items-center justify-center shadow-lg cursor-pointer transition-transform"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-call-hangup-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-call-hangup-text'] || undefined
                }}
              >
                <PhoneOff className="w-7 h-7" style={{ color: activeTheme?.css?.['--gg-call-hangup-text'] || undefined }} />
              </button>
              <span 
                className="text-xs text-stone-300 font-medium"
                style={{ color: activeTheme?.css?.['--gg-call-subtext'] || undefined }}
              >
                取消 / 挂断
              </span>
            </div>

            {/* 如果是对方打给玩家（incoming），才显示接听按钮 */}
            {direction === 'incoming' && (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={handleCallConnected}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 flex items-center justify-center shadow-lg cursor-pointer transition-transform animate-bounce"
                  style={{
                    backgroundColor: activeTheme?.css?.['--gg-call-send-btn-bg'] || undefined,
                    color: activeTheme?.css?.['--gg-call-send-icon-color'] || undefined
                  }}
                >
                  <PhoneCall className="w-7 h-7" style={{ color: activeTheme?.css?.['--gg-call-send-icon-color'] || undefined }} />
                </button>
                <span className="text-xs text-emerald-300 font-medium">接通</span>
              </div>
            )}
          </div>
        ) : (
          /* Connected stage: Bottom Input Bar + Hangup */
          <div className="space-y-3">
            {/* Input bar for speaking to AI (最下方输入框) */}
            <div 
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/15"
              style={{ backgroundColor: activeTheme?.css?.['--gg-call-input-bg'] || undefined }}
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUserSend();
                }}
                disabled={isGenerating || isAiSpeaking}
                placeholder={isAiSpeaking ? '对方正在说话中...' : '输入你想对TA说的话...'}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-hidden"
                style={{ color: activeTheme?.css?.['--gg-call-input-text'] || undefined }}
              />
              <button
                onClick={handleUserSend}
                disabled={!userInput.trim() || isGenerating || isAiSpeaking}
                className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:bg-stone-700 disabled:opacity-50 text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-call-send-btn-bg'] || undefined,
                }}
              >
                <Send className="w-4 h-4" style={{ color: activeTheme?.css?.['--gg-call-send-icon-color'] || undefined }} />
              </button>
            </div>

            {/* Quick Prompts & Hangup bar */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex gap-1.5 overflow-x-auto py-1 max-w-[200px] no-scrollbar">
                {['喂？', '你在忙什么呢？', '一会儿见面说！', '哈哈真的假的'].map((quick, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserInput(quick);
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-[10px] text-stone-300 whitespace-nowrap cursor-pointer transition-all border border-white/5"
                  >
                    {quick}
                  </button>
                ))}
              </div>

              {/* Red Hangup button */}
              <button
                onClick={handleHangup}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-medium text-xs shadow-lg cursor-pointer transition-transform shrink-0"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-call-hangup-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-call-hangup-text'] || undefined
                }}
              >
                <PhoneOff className="w-4 h-4" style={{ color: activeTheme?.css?.['--gg-call-hangup-text'] || undefined }} />
                <span>挂断</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Drawer Modal (右上角历史记录与重播) */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col animate-in fade-in duration-150">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-stone-900/80">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">本次通话语音记录</h4>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Logs List with Replay Button */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                暂无通话记录
              </div>
            ) : (
              logs.map((log) => {
                const isAI = log.sender === 'ai';
                const isPlaying = playingLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className={`flex flex-col p-3 rounded-2xl border transition-all ${
                      isAI
                        ? 'bg-stone-800/80 border-stone-700/80 text-left'
                        : 'bg-emerald-950/40 border-emerald-800/40 text-left'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[11px] font-bold ${isAI ? 'text-emerald-400' : 'text-stone-300'}`}>
                        {isAI ? (contact.remark || contact.name) : '我'}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-stone-200 leading-relaxed mb-2">
                      {log.text}
                    </p>

                    {/* 只有对方 (AI) 的语音内容才显示重播按钮，玩家发送的不需要重播按钮 */}
                    {isAI && (
                      <button
                        onClick={() => handleReplayLog(log)}
                        disabled={isPlaying}
                        className={`self-start flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-emerald-500 text-white animate-pulse'
                            : 'bg-white/10 hover:bg-white/20 text-stone-300 active:scale-95'
                        }`}
                      >
                        <Volume2 className={`w-3 h-3 ${isPlaying ? 'animate-bounce' : ''}`} />
                        <span>{isPlaying ? '正在重播...' : '重播此条语音'}</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
