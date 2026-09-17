import React, { useState, useRef, useEffect } from 'react';
import { Contact } from '../../../types/phone';
import { TogetherMessage } from '../../../types/togetherMusic';
import { SongItem } from '../../../services/neteaseService';
import { X, Send, Music2, MessageCircle, Sparkles } from 'lucide-react';

interface TogetherChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  myAvatar?: string;
  myNickname?: string;
  userAvatar?: string;
  userNickname?: string;
  currentSong: SongItem | null;
  messages: TogetherMessage[];
  isReplying: boolean;
  onSendMessage: (text: string) => void;
}

export const TogetherChatDrawer: React.FC<TogetherChatDrawerProps> = ({
  isOpen,
  onClose,
  contact,
  myAvatar,
  myNickname,
  userAvatar,
  userNickname,
  currentSong,
  messages = [],
  isReplying,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const safeMessages = Array.isArray(messages) ? messages : [];

  const effectiveAvatar = myAvatar || userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
  const effectiveNickname = myNickname || userNickname || '我';

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isReplying]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const formatMsgTime = (ts: number) => {
    const d = new Date(ts);
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    return `${d.getHours()}:${m}:${s}`;
  };

  const contactName = contact.remark || contact.name;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn select-none">
      {/* 点击背景关闭 */}
      <div className="flex-1" onClick={onClose} />

      {/* 抽屉主体 */}
      <div 
        className="rounded-t-3xl border-t shadow-2xl flex flex-col h-[75%] max-h-[520px] animate-slideUp overflow-hidden"
        style={{
          backgroundColor: 'var(--app-card, #fffaf5)',
          borderColor: 'var(--app-card-border, #f0dfe0)',
          color: 'var(--app-text, #6b4a52)'
        }}
      >
        {/* 顶部标题栏 */}
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--app-divider, #f0dfe0)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-rose-200 shrink-0">
              <img src={contact.avatar} alt={contactName} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xs font-bold leading-none flex items-center gap-1.5" style={{ color: 'var(--app-text, #6b4a52)' }}>
                <span>与 {contactName} 一起听歌记录</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              </h3>
              {currentSong && (
                <p className="text-[10px] mt-1 flex items-center gap-1 truncate" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                  <Music2 className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">正听：《{currentSong.name}》</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/50 cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* 消息对话列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {safeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
              <MessageCircle className="w-8 h-8 text-rose-300 mb-2 animate-bounce" />
              <p className="text-xs font-bold">和 {contactName} 戴着同一副耳机</p>
              <p className="text-[10px] text-stone-400 mt-1 max-w-[200px]">
                Ta 每隔 30 秒会根据正在播放的歌曲跟你分享心声，你也可以随时在这里回复 Ta
              </p>
            </div>
          ) : (
            safeMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-0.5`}
                >
                  {/* 伴随歌曲标签 */}
                  {msg.songName && (
                    <div className="text-[9px] px-2 py-0.5 rounded-full bg-stone-200/50 text-stone-500 mb-0.5 flex items-center gap-1">
                      <Music2 className="w-2 h-2" />
                      <span>{msg.songName}</span>
                      <span>·</span>
                      <span>{formatMsgTime(msg.timestamp)}</span>
                    </div>
                  )}

                  <div className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* 头像 */}
                    <img
                      src={isUser ? effectiveAvatar : contact.avatar}
                      alt={isUser ? effectiveNickname : contactName}
                      className="w-7 h-7 rounded-full object-cover border border-rose-200/80 shrink-0 shadow-2xs mt-0.5"
                    />

                    {/* 气泡 */}
                    <div
                      className={`px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? 'rounded-tr-xs bg-rose-500 text-white'
                          : 'rounded-tl-xs border'
                      }`}
                      style={!isUser ? {
                        backgroundColor: 'var(--app-bg, #fdf6f0)',
                        borderColor: 'var(--app-card-border, #f0dfe0)',
                        color: 'var(--app-text, #6b4a52)'
                      } : {}}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* 联系人正在输入中 */}
          {isReplying && (
            <div className="flex items-start gap-2 max-w-[85%]">
              <img
                src={contact.avatar}
                alt={contactName}
                className="w-7 h-7 rounded-full object-cover border border-rose-200 shrink-0 mt-0.5"
              />
              <div 
                className="px-3 py-1.5 rounded-2xl rounded-tl-xs text-[11px] border flex items-center gap-1.5 shadow-2xs"
                style={{
                  backgroundColor: 'var(--app-bg, #fdf6f0)',
                  borderColor: 'var(--app-card-border, #f0dfe0)',
                  color: 'var(--app-text-soft, #b398a0)'
                }}
              >
                <Sparkles className="w-3 h-3 text-rose-400 animate-spin" />
                <span>{contactName} 正在轻声说...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 底部输入框 */}
        <div className="p-3 border-t shrink-0 flex items-center gap-2" style={{ borderColor: 'var(--app-divider, #f0dfe0)' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={`对 ${contactName} 说点什么...`}
            className="flex-1 px-3.5 py-2 rounded-full text-xs outline-hidden border transition-all"
            style={{
              backgroundColor: 'var(--app-bg, #fdf6f0)',
              borderColor: 'var(--app-card-border, #f0dfe0)',
              color: 'var(--app-text, #6b4a52)'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-xs active:scale-95 ${
              inputText.trim() ? 'opacity-100 hover:brightness-105' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)' }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
