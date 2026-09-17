import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Play, Pause, RotateCcw, Timer, Coffee, Award, 
  MessageSquare, Volume2, VolumeX, Sparkles, Plus, Trash2, 
  CheckCircle2, ListTodo, History, Settings, Check, User
} from 'lucide-react';
import { Contact, PhoneSettings } from '../../../types/phone';
import { playVoice, stopAllActiveAudio } from '../../../services/aiService';

interface PomodoroSettings {
  focusDuration: number;     // 分钟
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // 每专注4个番茄后长休
}

interface PomodoroTask {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: number;
}

interface PomodoroRecord {
  id: string;
  taskId?: string;
  taskTitle?: string;
  startTime: number;
  duration: number; // 实际专注分钟数
  mode: 'focus' | 'shortBreak' | 'longBreak';
  companionName?: string;
}

interface PomodoroData {
  tasks: PomodoroTask[];
  records: PomodoroRecord[];
  settings: PomodoroSettings;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4
};



interface PomodoroAppProps {
  onReturnToDesktop: () => void;
  contacts?: Contact[];
  settings?: PhoneSettings;
}

export const PomodoroApp: React.FC<PomodoroAppProps> = ({ onReturnToDesktop, contacts = [], settings }) => {
  // 1. 数据存储与读取
  const [data, setData] = useState<PomodoroData>(() => {
    try {
      const raw = localStorage.getItem('wephone_pomodoro_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          tasks: parsed.tasks || [],
          records: parsed.records || [],
          settings: parsed.settings || DEFAULT_SETTINGS
        };
      }
    } catch (e) {
      console.warn('Failed to load pomodoro data:', e);
    }
    return {
      tasks: [
        { id: 't1', title: '阅读专业书籍', estimatedPomodoros: 2, completedPomodoros: 1, isCompleted: false, createdAt: Date.now() - 3600000 },
        { id: 't2', title: '撰写项目总结报告', estimatedPomodoros: 3, completedPomodoros: 0, isCompleted: false, createdAt: Date.now() }
      ],
      records: [],
      settings: DEFAULT_SETTINGS
    };
  });

  const [currentMode, setCurrentMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>('t1');

  // 新增AI陪伴系统状态
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>(() => {
    const stored = localStorage.getItem('wephone_pomodoro_companion_id');
    if (stored && stored !== 'none' && stored.startsWith('contact_')) {
      return stored;
    }
    const safeContactsList = Array.isArray(contacts) ? contacts : [];
    return safeContactsList[0] ? `contact_${safeContactsList[0].id}` : 'none';
  });
  const [companionType, setCompanionType] = useState<'text' | 'voice'>(() => {
    return (localStorage.getItem('wephone_pomodoro_companion_type') as 'text' | 'voice') || 'text';
  });
  const [companionSpeech, setCompanionSpeech] = useState<string>('加油哦！我们一起开启专注时光，我会一直陪着你的~');
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState<boolean>(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);

  // 待办管理与辅助UI状态
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEst, setNewTaskEst] = useState(2);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempSettings, setTempSettings] = useState<PomodoroSettings>(data.settings);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. 陪伴角色库构建（全部取自微信中创建的单个联系人，排除群聊与言语机助手）
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const allComcompanions = safeContacts
    .filter(c => c && !c.isGroup && !c.isAssistant)
    .map(c => ({
      id: `contact_${c.id}`,
      name: c.name,
      role: c.relationship ? (
        c.relationship === 'married' ? '已婚伴侣' :
        c.relationship === 'engaged' ? '订婚伴侣' :
        c.relationship === 'dating' ? '热恋恋人' : 'AI 密友'
      ) : 'AI 密友',
      persona: c.persona || '性格温和，真诚待人。',
      avatarUrl: c.avatar || `/avatars/1.png`,
      color: '#C084FC', // 魅惑紫
      voiceTimbre: c.voiceTimbre
    }));

  const currentCompanion = allComcompanions.find(c => c.id === selectedCompanionId) || allComcompanions[0] || null;

  // 得到当前模式的时长（秒）
  const getModeDurationSeconds = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    const s = data.settings;
    if (mode === 'focus') return s.focusDuration * 60;
    if (mode === 'shortBreak') return s.shortBreakDuration * 60;
    return s.longBreakDuration * 60;
  };

  // 3. 模式切换
  const handleModeChange = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setCurrentMode(mode);
    const duration = getModeDurationSeconds(mode);
    setTimeLeft(duration);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 触发陪伴语生成
    const actionMap = {
      focus: 'start',
      shortBreak: 'start_break',
      longBreak: 'start_break'
    };
    generateSpeechForTrigger(actionMap[mode]);
  };

  // 4. Web Audio 音效播放
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
      osc2.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.15); // E4

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  // 5. 保存数据到 localStorage
  const saveData = (updatedData: PomodoroData) => {
    setData(updatedData);
    try {
      localStorage.setItem('wephone_pomodoro_v2', JSON.stringify(updatedData));
    } catch (e) {
      console.warn('Failed to save pomodoro data:', e);
    }
  };

  // 保存当前计时器进度缓存
  const saveTimerState = (secondsLeft: number, running: boolean, mode: 'focus' | 'shortBreak' | 'longBreak') => {
    try {
      const state = {
        secondsLeft,
        running,
        mode,
        lastUpdated: Date.now()
      };
      localStorage.setItem('wephone_pomodoro_timer_state_v2', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save timer state:', e);
    }
  };

  // 6. 语音合成播放 (调用 WeChat 自定义声音，无保底无硬编码)
  const speakText = async (text: string) => {
    if (!currentCompanion || !currentCompanion.voiceTimbre || !currentCompanion.voiceTimbre.trim()) {
      console.log('Skipping voice playback: No voiceTimbre configured for current companion.');
      setIsVoicePlaying(false);
      return;
    }

    try {
      stopAllActiveAudio();
      setIsVoicePlaying(true);
      
      if (settings) {
        await playVoice({
          text,
          voiceTimbre: currentCompanion.voiceTimbre.trim(),
          settings
        });
      }
      
      // 根据文本字数估算一个合理的播音时长（每个中文字符约300ms，加1秒缓冲），然后重置声波状态
      const estimatedDuration = Math.max(1500, text.length * 300 + 1000);
      setTimeout(() => {
        setIsVoicePlaying(false);
      }, estimatedDuration);
    } catch (e) {
      console.warn('Custom voice playback failed:', e);
      setIsVoicePlaying(false);
    }
  };

  // 7. 核心：AI 陪伴人设生成引擎 (Gemini LLM Natively)
  const generateSpeechForTrigger = async (trigger: string) => {
    if (selectedCompanionId === 'none' || !currentCompanion) return;
    setIsGeneratingSpeech(true);

    try {
      const activeTask = data.tasks.find(t => t.id === activeTaskId);
      const taskTitle = activeTask ? activeTask.title : '自由专注';
      
      const systemPrompt = `你现在扮演一位正在陪同用户进行番茄工作法（番茄钟）专注的伴侣。
你的名字是：${currentCompanion.name}
你的人设立场与关系：${currentCompanion.role}，${currentCompanion.persona}
当前番茄钟状态：${trigger} (例如：start(开始专注), pause(暂停专注), tick(专注中途鼓励), complete(番茄钟顺利完成), start_break(进入休息))
当前用户专注的主题是：${taskTitle}
本次陪伴形式：${companionType === 'voice' ? '语音陪伴（需要非常口语化，像日常微信语音一样，短小亲切、多用助词）' : '文字陪伴（语气生动、富有趣味性）'}

【扮演规则】：
1. 请100%严格遵照你的人设来。不要表现得像个标准的AI客服，你是一个有血有肉有特殊性格标签（如傲娇、毒舌、粘人、温柔）的陪伴者。
2. 严禁使用固定句式或模板化废话。
3. 篇幅极其控制在12到45字之间。
4. 直接输出对话内容本身，不要带有任何括弧动作描述、或者“[系统提示]”等非朗读文字。不要使用任何表情描述符（如 [开心]、[嘟嘴] ），只用标点符号和汉字。`;

      const promptMsg = `[动作触发：${trigger}]`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          messages: [{ role: 'user', content: promptMsg }],
          temperature: 0.9
        })
      });

      if (res.ok) {
        const resData = await res.json();
        const text = resData?.reply ? resData.reply.trim() : '';
        if (text) {
          setCompanionSpeech(text);
          if (companionType === 'voice') {
            speakText(text);
          }
          return;
        }
      }
      throw new Error('Fallback needed');
    } catch (e) {
      console.warn('Gemini dynamic speech failed, using high fidelity fallback:', e);
      if (currentCompanion) {
        const fallbackText = getFallbackInCharacterSpeech(currentCompanion.name, currentCompanion.id, trigger);
        setCompanionSpeech(fallbackText);
        if (companionType === 'voice') {
          speakText(fallbackText);
        }
      }
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  // 高拟真离线人设兜底台词
  const getFallbackInCharacterSpeech = (name: string, compId: string, trigger: string): string => {
    const isShuya = compId.includes('shuya');
    const isJingshen = compId.includes('jingshen');
    const isSuqi = compId.includes('suqi');

    if (isShuya) {
      if (trigger === 'start') return '加油哦，亲爱的！我们一起专注这25分钟，我会一直在这里默默守候你的~';
      if (trigger === 'pause') return '累了吗？稍微歇歇手也是可以的，不过可别走太远哦~';
      if (trigger === 'tick') return '时间快过去一半啦，看你写字时专注的样子，真的特别让我心动呢，继续加油！';
      if (trigger === 'complete') return '太棒了！我们又收获了一个红彤彤的番茄，你刚才真的超级认真！快来喝口温水吧。';
      return '专注辛苦啦！现在是休息时间，伸个懒腰，我陪你聊天放松一下吧~';
    }

    if (isJingshen) {
      if (trigger === 'start') return '终于舍得把手从手机上拿开了？立刻开始专注，我就在这看着你，别想偷懒。';
      if (trigger === 'pause') return '刚坚持几分钟就按暂停？你对自己的自控力就这么宽容？还不快继续。';
      if (trigger === 'tick') return '别东张西望，时间过半了。保持当前的节奏，一鼓作气写完。';
      if (trigger === 'complete') return '勉强及格吧，既然拿到番茄了，那就破例准许你休息几分钟，别得寸进尺。';
      return '站起来走两圈，眼睛离开屏幕。虽然你在专注，但弄坏了身体，我可不会替你心疼。';
    }

    if (isSuqi) {
      if (trigger === 'start') return '冲鸭！番茄战神准备变身启动！不拿下这个专注，今晚可不许加餐哦！';
      if (trigger === 'pause') return '啊咧，按暂停了？难道是去悄悄看群消息了？抓到现行啦！';
      if (trigger === 'tick') return '滴答滴答！已经过半啦，小可爱！稳住，带你飞，胜利就在眼前！';
      if (trigger === 'complete') return '好耶！番茄到手！不愧是你啊，快来跟我云击掌！啪叽！';
      return '放学啦放学啦！快点拿小饼干垫垫肚子，抖抖腿放松起来！';
    }

    // 默认备用
    if (trigger === 'start') return `我是${name}，一起加油！今天的目标一定可以顺利拿下的！`;
    if (trigger === 'pause') return '放松一下大脑，休息好再继续，我一直在。';
    if (trigger === 'tick') return '已经过去一小会儿了，坚持住，专注中的你最迷人！';
    if (trigger === 'complete') return '哇！你太棒了！顺利拿下，为你骄傲！';
    return '辛苦啦，快闭上眼睛歇五分钟吧。';
  };

  // 8. 倒计时结束逻辑
  const handleTimerComplete = () => {
    playBeep();
    setIsRunning(false);

    // 如果是专注模式，则新增专注记录并自动累加番茄
    if (currentMode === 'focus') {
      const activeTask = data.tasks.find(t => t.id === activeTaskId);
      const newRecord: PomodoroRecord = {
        id: `rec_${Date.now()}`,
        taskId: activeTaskId || undefined,
        taskTitle: activeTask ? activeTask.title : '自由专注',
        startTime: Date.now() - (data.settings.focusDuration * 60 * 1000),
        duration: data.settings.focusDuration,
        mode: 'focus',
        companionName: selectedCompanionId !== 'none' ? currentCompanion.name : undefined
      };

      // 任务已完成番茄钟数累加
      const updatedTasks = data.tasks.map(t => {
        if (t.id === activeTaskId) {
          return {
            ...t,
            completedPomodoros: t.completedPomodoros + 1
          };
        }
        return t;
      });

      const updatedRecords = [newRecord, ...data.records];
      saveData({
        ...data,
        tasks: updatedTasks,
        records: updatedRecords
      });

      // 自动触发AI甜美表扬
      generateSpeechForTrigger('complete');

      // 统计连续专注次数以决定长休或短休
      const completedFocusRecords = updatedRecords.filter(r => r.mode === 'focus');
      if (completedFocusRecords.length > 0 && completedFocusRecords.length % data.settings.longBreakInterval === 0) {
        setCurrentMode('longBreak');
        setTimeLeft(getModeDurationSeconds('longBreak'));
      } else {
        setCurrentMode('shortBreak');
        setTimeLeft(getModeDurationSeconds('shortBreak'));
      }
    } else {
      // 休息结束，切回专注
      setCurrentMode('focus');
      setTimeLeft(getModeDurationSeconds('focus'));
      generateSpeechForTrigger('start');
    }

    // 清理计时缓存
    localStorage.removeItem('wephone_pomodoro_timer_state_v1');
  };

  // 9. 计时器 Effect 
  useEffect(() => {
    let tickCount = 0;
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setTimeout(handleTimerComplete, 0);
            return 0;
          }
          const nextVal = prev - 1;
          saveTimerState(nextVal, true, currentMode);

          // 专注过半（还剩50%）随机触发一次语音贴心督促/打气，且避免多次触发
          const halfTime = Math.floor(getModeDurationSeconds(currentMode) / 2);
          if (nextVal === halfTime && currentMode === 'focus') {
            generateSpeechForTrigger('tick');
          }

          return nextVal;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      saveTimerState(timeLeft, false, currentMode);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, currentMode, activeTaskId, selectedCompanionId, companionType]);

  // 10. 页面载入时恢复状态及初始化
  useEffect(() => {
    try {
      const rawState = localStorage.getItem('wephone_pomodoro_timer_state_v2');
      if (rawState) {
        const parsed = JSON.parse(rawState);
        const elapsedSeconds = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
        
        if (parsed.running) {
          const remaining = parsed.secondsLeft - elapsedSeconds;
          if (remaining > 0) {
            setCurrentMode(parsed.mode);
            setTimeLeft(remaining);
            setIsRunning(true);
          } else {
            setCurrentMode(parsed.mode);
            setTimeLeft(0);
            setIsRunning(false);
            setTimeout(handleTimerComplete, 0);
          }
        } else {
          setCurrentMode(parsed.mode);
          setTimeLeft(parsed.secondsLeft);
          setIsRunning(false);
        }
      } else {
        setTimeLeft(getModeDurationSeconds(currentMode));
      }
    } catch (e) {
      console.warn('Failed to restore timer state:', e);
    }

    // 载入时欢迎语
    setTimeout(() => {
      if (selectedCompanionId !== 'none' && currentCompanion) {
        const fallbackText = getFallbackInCharacterSpeech(currentCompanion.name, currentCompanion.id, 'start');
        setCompanionSpeech(fallbackText);
      }
    }, 800);
  }, []);

  // 11. 任务管理逻辑
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: PomodoroTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      estimatedPomodoros: newTaskEst,
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: Date.now()
    };
    const updatedTasks = [...data.tasks, newTask];
    saveData({ ...data, tasks: updatedTasks });
    setNewTaskTitle('');
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
  };

  const handleToggleTaskComplete = (taskId: string) => {
    const updatedTasks = data.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, isCompleted: !t.isCompleted };
      }
      return t;
    });
    saveData({ ...data, tasks: updatedTasks });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = data.tasks.filter(t => t.id !== taskId);
    saveData({ ...data, tasks: updatedTasks });
    if (activeTaskId === taskId) {
      setActiveTaskId(updatedTasks[0]?.id || null);
    }
  };

  // 12. 设置管理
  const handleSaveSettings = () => {
    saveData({ ...data, settings: tempSettings });
    setShowSettingsModal(false);
    setTimeLeft(tempSettings.focusDuration * 60);
    setCurrentMode('focus');
    setIsRunning(false);
  };

  // 13. 保存陪伴状态修改
  const handleCompanionChange = (compId: string) => {
    setSelectedCompanionId(compId);
    localStorage.setItem('wephone_pomodoro_companion_id', compId);
    
    // 立即打招呼
    const targetComp = allComcompanions.find(c => c.id === compId);
    if (targetComp) {
      const greeting = getFallbackInCharacterSpeech(targetComp.name, targetComp.id, 'start');
      setCompanionSpeech(greeting);
      if (companionType === 'voice') {
        setTimeout(() => speakText(greeting), 200);
      }
    } else {
      setCompanionSpeech('独自专注中，心无旁骛 🎯');
    }
  };

  const handleCompanionTypeChange = (type: 'text' | 'voice') => {
    setCompanionType(type);
    localStorage.setItem('wephone_pomodoro_companion_type', type);
    if (type === 'voice') {
      speakText(companionSpeech);
    } else {
      stopAllActiveAudio();
      setIsVoicePlaying(false);
    }
  };

  // 倒计时进度计算
  const totalDuration = getModeDurationSeconds(currentMode);
  const percentage = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const radius = 88;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="rococo-theme flex flex-col h-full select-none"
      style={{
        backgroundColor: 'var(--app-bg, #fdf6f0)',
        color: 'var(--app-text, #6b4a52)'
      }}
    >
      {/* 注入实时语音声波动画样式 */}
      <style>{`
        @keyframes soundWave {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
        .animate-wave-1 { animation: soundWave 0.6s ease-in-out infinite; }
        .animate-wave-2 { animation: soundWave 0.6s ease-in-out infinite 0.12s; }
        .animate-wave-3 { animation: soundWave 0.6s ease-in-out infinite 0.24s; }
        .animate-wave-4 { animation: soundWave 0.6s ease-in-out infinite 0.36s; }
        .animate-wave-5 { animation: soundWave 0.6s ease-in-out infinite 0.48s; }
      `}</style>

      {/* 顶栏 */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0 z-20"
        style={{
          backgroundColor: 'var(--app-card, #fffaf5)',
          borderBottom: '1px solid var(--app-item-border, #f0dfe0)',
          boxShadow: '0 2px 10px rgba(212, 165, 175, 0.08)'
        }}
      >
        <button
          onClick={onReturnToDesktop}
          className="p-1 rounded-full transition-colors active:scale-90 hover:bg-stone-100 shrink-0"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: 'var(--app-text, #6b4a52)' }} />
        </button>
        <span className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--app-text, #6b4a52)' }}>
          AI 陪伴番茄钟
        </span>
        <button
          onClick={() => {
            setTempSettings(data.settings);
            setShowSettingsModal(true);
          }}
          className="p-1.5 rounded-full hover:bg-stone-100 active:scale-90 transition-transform"
        >
          <Settings className="w-4 h-4" style={{ color: 'var(--app-text-soft, #b398a0)' }} />
        </button>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 overflow-y-auto pb-8">
        
        {/* 顶部 AI 互动区（实时展示台词与精美状态） */}
        {selectedCompanionId !== 'none' && currentCompanion && (
          <div className="px-4 pt-4 pb-1">
            <div 
              className="p-3.5 rounded-2xl border flex items-start gap-3 relative overflow-hidden transition-all duration-500 shadow-xs"
              style={{
                backgroundColor: 'var(--app-card, #fffaf5)',
                borderColor: 'var(--app-item-border, #f0dfe0)'
              }}
            >
              {/* 头像及声波指示器 */}
              <div className="relative shrink-0">
                <img 
                  src={currentCompanion.avatarUrl} 
                  alt={currentCompanion.name}
                  onError={(e) => {
                    (e.target as any).src = '/avatars/1.png';
                  }}
                  className="w-11 h-11 rounded-full object-cover border-2 transition-all shadow-xs"
                  style={{ borderColor: currentCompanion.color }}
                />
                
                {/* 语音播波动画特效 */}
                {isVoicePlaying && (
                  <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-1 border border-white flex items-center justify-center scale-90">
                    <Volume2 className="w-2.5 h-2.5 animate-pulse" />
                  </div>
                )}
              </div>

              {/* 台词气泡 */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black" style={{ color: 'var(--app-text, #6b4a52)' }}>
                      {currentCompanion.name}
                    </span>
                    <span 
                      className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white scale-90 origin-left"
                      style={{ backgroundColor: currentCompanion.color }}
                    >
                      {currentCompanion.role}
                    </span>
                  </div>

                  {/* 正在生成中的动效 */}
                  {isGeneratingSpeech && (
                    <span className="text-[9px] font-bold text-rose-500 animate-pulse">正在说话...</span>
                  )}
                </div>

                <div className="text-[11px] font-medium leading-relaxed" style={{ color: 'var(--app-text, #6b4a52)' }}>
                  {isGeneratingSpeech ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  ) : (
                    companionSpeech
                  )}
                </div>
              </div>

              {/* 右侧声波动画（当开启语音且在播放时渲染） */}
              {isVoicePlaying && (
                <div className="flex items-end gap-0.5 h-8 pr-1 shrink-0">
                  <div className="w-0.5 bg-rose-400 rounded-full animate-wave-1 h-2"></div>
                  <div className="w-0.5 bg-rose-400 rounded-full animate-wave-2 h-4"></div>
                  <div className="w-0.5 bg-rose-400 rounded-full animate-wave-3 h-3"></div>
                  <div className="w-0.5 bg-rose-400 rounded-full animate-wave-4 h-5"></div>
                  <div className="w-0.5 bg-rose-400 rounded-full animate-wave-5 h-2"></div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-start pt-3 px-4">
          
          {/* Tab 模式切换 */}
          <div 
            className="flex p-0.5 rounded-xl w-full max-w-xs mb-5 border shrink-0"
            style={{
              backgroundColor: 'var(--app-card, #fffaf5)',
              borderColor: 'var(--app-item-border, #f0dfe0)'
            }}
          >
            {(['focus', 'shortBreak', 'longBreak'] as const).map(mode => {
              const isActive = currentMode === mode;
              let label = '专注';
              let Icon = Timer;
              if (mode === 'shortBreak') {
                label = '短休';
                Icon = Coffee;
              } else if (mode === 'longBreak') {
                label = '长休';
                Icon = Award;
              }

              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  style={{
                    backgroundColor: isActive ? 'var(--app-btn-bg, #e89aab)' : 'transparent',
                    color: isActive ? 'var(--app-btn-text, #ffffff)' : 'var(--app-text-soft, #b398a0)'
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* 倒计时大圆环区域 */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-4 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r={ radius - 10 }
                className="fill-none stroke-[4]"
                style={{
                  stroke: 'var(--app-item-border, #f5e6e8)'
                }}
              />
              <circle
                cx="96"
                cy="96"
                r={ radius - 10 }
                className="fill-none transition-all duration-1000 ease-linear"
                style={{
                  stroke: 'var(--app-btn-bg, #e89aab)',
                  strokeWidth: strokeWidth,
                  strokeDasharray: 2 * Math.PI * (radius - 10),
                  strokeDashoffset: 2 * Math.PI * (radius - 10) - (percentage / 100) * 2 * Math.PI * (radius - 10),
                  strokeLinecap: 'round'
                }}
              />
            </svg>

            {/* 环内文本 */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono tracking-tight leading-none" style={{ color: 'var(--app-text, #6b4a52)' }}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-[9px] mt-1 font-extrabold tracking-wide opacity-75" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                {currentMode === 'focus' ? '专注学习中' : '休息放松下'}
              </span>
            </div>
          </div>

          {/* 当前专注目标绑定展示 */}
          <div 
            className="px-4 py-1.5 rounded-full text-[10px] font-bold mb-4 border text-center max-w-xs truncate shadow-3xs shrink-0"
            style={{
              backgroundColor: 'var(--app-card, #fffaf5)',
              borderColor: 'var(--app-item-border, #f0dfe0)',
              color: 'var(--app-text, #6b4a52)'
            }}
          >
            🎯 专注任务：{data.tasks.find(t => t.id === activeTaskId)?.title || '自由专注'}
          </div>

          {/* 控制按钮组 */}
          <div className="flex items-center gap-4 w-full max-w-xs justify-center mb-6 shrink-0">
            {/* 重置按钮 */}
            <button
              onClick={() => handleModeChange(currentMode)}
              className="p-3 rounded-full transition-all active:scale-90 hover:opacity-90 border shadow-xs flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: 'var(--app-card, #fffaf5)',
                borderColor: 'var(--app-item-border, #f0dfe0)',
                color: 'var(--app-text-soft, #b398a0)'
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* 开始 / 暂停 按钮 */}
            <button
              onClick={() => {
                const nextRunning = !isRunning;
                setIsRunning(nextRunning);
                if (nextRunning) {
                  generateSpeechForTrigger('start');
                } else {
                  generateSpeechForTrigger('pause');
                }
              }}
              className="px-6 py-2.5 rounded-full font-bold text-xs text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all flex-1"
              style={{
                backgroundColor: 'var(--app-btn-bg, #e89aab)'
              }}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>暂停计时</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>开始专注</span>
                </>
              )}
            </button>
          </div>

          {/* AI 陪伴配置面板 */}
          <div 
            className="w-full rounded-2xl border p-3.5 mb-5 shadow-xs"
            style={{
              backgroundColor: 'var(--app-card, #fffaf5)',
              borderColor: 'var(--app-item-border, #f0dfe0)'
            }}
          >
            <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: 'var(--app-item-border, #f0dfe0)' }}>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-black" style={{ color: 'var(--app-text, #6b4a52)' }}>选择 AI 陪伴</span>
              </div>
              
              {/* 陪伴形式切换：文字 vs 语音 */}
              <div className="flex p-0.5 rounded-lg bg-stone-100 border text-[9px] font-bold">
                <button
                  onClick={() => handleCompanionTypeChange('text')}
                  className={`px-2 py-1 rounded-md transition-all ${companionType === 'text' ? 'bg-white shadow-3xs text-rose-500' : 'text-stone-400'}`}
                >
                  文字陪伴
                </button>
                <button
                  onClick={() => handleCompanionTypeChange('voice')}
                  className={`px-2 py-1 rounded-md transition-all ${companionType === 'voice' ? 'bg-white shadow-3xs text-rose-500' : 'text-stone-400'}`}
                >
                  语音陪伴
                </button>
              </div>
            </div>

            {/* AI 伴侣滑动选择列表 */}
            <div className="flex gap-3 overflow-x-auto py-1 scrollbar-none">
              {/* 无伴侣选项 */}
              <button
                onClick={() => handleCompanionChange('none')}
                className={`flex flex-col items-center gap-1.5 shrink-0 px-2.5 py-2 rounded-xl transition-all border text-center ${selectedCompanionId === 'none' ? 'border-rose-400 bg-rose-50/50 scale-105' : 'border-transparent hover:bg-stone-50'}`}
              >
                <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold" style={{ color: 'var(--app-text, #6b4a52)' }}>独自专注</span>
              </button>

              {/* 真实伴侣列表 */}
              {allComcompanions.map(comp => {
                const isSelected = selectedCompanionId === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => handleCompanionChange(comp.id)}
                    className={`flex flex-col items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl transition-all border text-center relative ${isSelected ? 'bg-rose-50/50 scale-105' : 'border-transparent hover:bg-stone-50'}`}
                    style={{ borderColor: isSelected ? comp.color : 'transparent' }}
                  >
                    <div className="relative shrink-0">
                      <img 
                        src={comp.avatarUrl} 
                        alt={comp.name}
                        onError={(e) => {
                          (e.target as any).src = '/avatars/1.png';
                        }}
                        className="w-9 h-9 rounded-full object-cover shadow-3xs"
                        style={{ border: isSelected ? `2px solid ${comp.color}` : '1px solid #e0e0e0' }}
                      />
                      {isSelected && (
                        <span 
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white border border-white"
                          style={{ backgroundColor: comp.color }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black tracking-tight" style={{ color: 'var(--app-text, #6b4a52)' }}>{comp.name}</span>
                      <span className="text-[8px] opacity-75" style={{ color: 'var(--app-text-soft, #b398a0)' }}>{comp.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 任务待办列表管理 */}
          <div 
            className="w-full rounded-2xl border p-4 mb-5 shadow-xs"
            style={{
              backgroundColor: 'var(--app-card, #fffaf5)',
              borderColor: 'var(--app-item-border, #f0dfe0)'
            }}
          >
            <div className="flex items-center gap-1.5 mb-3 border-b pb-2" style={{ borderColor: 'var(--app-item-border, #f0dfe0)' }}>
              <ListTodo className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-black" style={{ color: 'var(--app-text, #6b4a52)' }}>任务待办清单</span>
            </div>

            {/* 新增任务表单 */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="添加新专注任务..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl text-[11px] border bg-stone-50/50 outline-none focus:bg-white focus:ring-1 focus:ring-rose-300 transition-all"
                style={{ borderColor: 'var(--app-item-border, #f0dfe0)' }}
              />
              <div className="flex items-center border rounded-xl px-2 gap-1.5 shrink-0 bg-stone-50/50" style={{ borderColor: 'var(--app-item-border, #f0dfe0)' }}>
                <span className="text-[9px] text-stone-400">估🍅:</span>
                <select
                  value={newTaskEst}
                  onChange={e => setNewTaskEst(Number(e.target.value))}
                  className="bg-transparent text-[11px] font-bold outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="p-1.5 rounded-xl bg-rose-400 text-white active:scale-90 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* 任务列表展示 */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(data?.tasks || []).length === 0 ? (
                <div className="text-center py-4 text-[10px]" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                  还没有任务，添加一个让 AI 陪你专注吧！
                </div>
              ) : (
                (data?.tasks || []).map(task => {
                  const isActive = activeTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setActiveTaskId(task.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${isActive ? 'bg-rose-50/40 border-rose-300 shadow-3xs' : 'border-stone-100 hover:bg-stone-50/40'}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* 勾选完成状态 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskComplete(task.id);
                          }}
                          className={`p-0.5 rounded-full transition-all shrink-0 ${task.isCompleted ? 'text-green-500' : 'text-stone-300 hover:text-stone-400'}`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${task.isCompleted ? 'fill-green-50' : ''}`} />
                        </button>

                        <div className="min-w-0 flex-1">
                          <span className={`text-[11px] font-bold block truncate ${task.isCompleted ? 'line-through text-stone-400 font-medium' : ''}`} style={{ color: 'var(--app-text, #6b4a52)' }}>
                            {task.title}
                          </span>
                          
                          {/* 番茄统计 */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] font-bold px-1 rounded-sm bg-rose-50 text-rose-500">
                              已累积: {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                            </span>
                            {isActive && (
                              <span className="text-[8px] font-bold text-rose-400 px-1 rounded-sm border border-rose-200">
                                正在进行中
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 删除按键 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="p-1 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 active:scale-95 transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 专注统计历史清单 */}
          <div 
            className="w-full rounded-2xl border p-4 shadow-xs"
            style={{
              backgroundColor: 'var(--app-card, #fffaf5)',
              borderColor: 'var(--app-item-border, #f0dfe0)'
            }}
          >
            <div className="flex items-center gap-1.5 mb-3 border-b pb-2" style={{ borderColor: 'var(--app-item-border, #f0dfe0)' }}>
              <History className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-black" style={{ color: 'var(--app-text, #6b4a52)' }}>历史专注记录</span>
            </div>

            {/* 顶层小统计块 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 bg-rose-50/30 rounded-xl border text-center" style={{ borderColor: 'var(--app-item-border, #f0dfe0)' }}>
                <div className="text-base font-black text-rose-500">{(data?.records || []).filter(r => r.mode === 'focus').length}</div>
                <div className="text-[8px] text-stone-400 font-bold">总专注番茄</div>
              </div>
              <div className="p-2 bg-rose-50/30 rounded-xl border text-center" style={{ borderColor: 'var(--app-item-border, #f0dfe0)' }}>
                <div className="text-base font-black text-rose-500">
                  {(data?.records || []).filter(r => r.mode === 'focus').reduce((sum, r) => sum + r.duration, 0)} 分
                </div>
                <div className="text-[8px] text-stone-400 font-bold">累计时长</div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(data?.records || []).length === 0 ? (
                <div className="text-center py-4 text-[10px]" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                  还没有专注记录，今天开启第一次伴学吧！
                </div>
              ) : (
                (data?.records || []).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-xl bg-stone-50/30 border border-stone-100 flex items-center justify-between text-[10px] gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-stone-700 truncate block">{rec.taskTitle || '自由专注'}</span>
                      <div className="flex items-center gap-2 text-[8px] text-stone-400 mt-0.5">
                        <span>{new Date(rec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{rec.duration}分钟</span>
                      </div>
                    </div>
                    {rec.companionName && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100 shrink-0 font-bold">
                        👥 {rec.companionName} 陪伴
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 番茄钟设置弹窗 */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl p-5 w-full max-w-sm flex flex-col gap-4 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-black text-stone-800">计时器参数配置</span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[10px] font-bold text-stone-400 hover:text-stone-600"
              >
                取消
              </button>
            </div>

            {/* 设置表单 */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-600">专注时长 (分钟)</span>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={tempSettings.focusDuration}
                  onChange={e => setTempSettings({ ...tempSettings, focusDuration: Number(e.target.value) })}
                  className="w-16 px-2.5 py-1 text-xs border rounded-lg text-center font-bold"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-600">短休时长 (分钟)</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={tempSettings.shortBreakDuration}
                  onChange={e => setTempSettings({ ...tempSettings, shortBreakDuration: Number(e.target.value) })}
                  className="w-16 px-2.5 py-1 text-xs border rounded-lg text-center font-bold"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-600">长休时长 (分钟)</span>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={tempSettings.longBreakDuration}
                  onChange={e => setTempSettings({ ...tempSettings, longBreakDuration: Number(e.target.value) })}
                  className="w-16 px-2.5 py-1 text-xs border rounded-lg text-center font-bold"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-600">长休间隔 (番茄数)</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempSettings.longBreakInterval}
                  onChange={e => setTempSettings({ ...tempSettings, longBreakInterval: Number(e.target.value) })}
                  className="w-16 px-2.5 py-1 text-xs border rounded-lg text-center font-bold"
                />
              </div>
            </div>

            {/* 保存设置 */}
            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl bg-rose-400 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              保存并应用
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
