import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Play, ExternalLink, Loader2, Users, Check, Tv, Video, AlertCircle, RefreshCw } from 'lucide-react';
import { Contact, PhoneSettings } from '../../../types/phone';
import { parseBilibiliInput, resolveB23Link, BilibiliInfo } from '../../../utils/bilibiliHelper';
import { fetchVideoInfo, generateTucao, BilibiliVideoInfo, TucaoMessage } from '../../../services/bilibiliService';
import { Avatar } from '../Avatar';

interface DanmakuBullet {
  id: string;
  text: string;
  topPercent: number;
  color: string;
  sender: 'user' | 'ai';
}

interface BilibiliAppProps {
  onBack: () => void;
  settings: PhoneSettings;
  contacts: Contact[];
}

export const BilibiliApp: React.FC<BilibiliAppProps> = ({ onBack, settings, contacts }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<BilibiliVideoInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCid, setCurrentCid] = useState<number | null>(null);
  const [tucaoList, setTucaoList] = useState<TucaoMessage[]>([]);
  const [userTucao, setUserTucao] = useState('');
  const [activeContacts, setActiveContacts] = useState<Contact[]>([]);
  const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false);

  // Player & Danmaku States
  const [playerMode, setPlayerMode] = useState<'native' | 'iframe'>('native');
  const [nativeError, setNativeError] = useState(false);
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [danmakuBullets, setDanmakuBullets] = useState<DanmakuBullet[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const eligibleContacts = contacts.filter(c => !c.isAssistant && !c.isTool && !c.isGroup);

  const pushDanmaku = (text: string, sender: 'user' | 'ai') => {
    if (!text || !text.trim()) return;
    const newBullet: DanmakuBullet = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: text.trim(),
      sender,
      color: sender === 'user' ? '#f43f5e' : '#ffffff',
      topPercent: 10 + Math.floor(Math.random() * 65)
    };
    setDanmakuBullets(prev => [...prev.slice(-25), newBullet]);
  };

  useEffect(() => {
    // Pick a random contact to watch together if not set
    if (activeContacts.length === 0 && eligibleContacts.length > 0) {
      setActiveContacts([eligibleContacts[Math.floor(Math.random() * eligibleContacts.length)]]);
    }
  }, [eligibleContacts, activeContacts]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tucaoList]);

  // Periodic AI tucao
  useEffect(() => {
    if (currentVideo && activeContacts.length > 0) {
      const startTimer = () => {
        const delay = 15000 + Math.random() * 15000; // 15-30s
        timerRef.current = setTimeout(async () => {
          try {
            // Pick a random poster from active contacts
            const poster = activeContacts[Math.floor(Math.random() * activeContacts.length)];
            const tucao = await generateTucao(currentVideo, poster, undefined, tucaoList);
            const newMessage: TucaoMessage = {
              id: Date.now().toString(),
              sender: 'ai',
              senderName: poster.name,
              senderAvatar: poster.avatar,
              content: tucao,
              timestamp: Date.now()
            };
            setTucaoList(prev => [...prev, newMessage]);
            pushDanmaku(tucao, 'ai');
          } catch (e) {
            console.error('Failed to generate AI tucao:', e);
          }
          startTimer();
        }, delay);
      };
      
      startTimer();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [currentVideo, activeContacts, tucaoList]);

  const handleStartWatching = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setNativeError(false);
    
    try {
      let info: BilibiliInfo | null = null;
      if (input.includes('b23.tv')) {
        info = await resolveB23Link(input);
      } else {
        info = parseBilibiliInput(input);
      }

      if (!info) {
        alert('解析失败，请输入有效的 B 站链接或 BV 号');
        setLoading(false);
        return;
      }

      const videoData = await fetchVideoInfo(info.bvid);
      setCurrentVideo(videoData);
      setCurrentPage(info.page);
      
      // Find matching cid for current page
      let targetCid = videoData.cid;
      if (videoData.pages) {
        const p = videoData.pages.find(p => p.page === info.page);
        targetCid = p ? p.cid : videoData.cid;
      }

      if (!targetCid) {
        alert('该视频无法播放');
        setLoading(false);
        return;
      }

      setCurrentCid(targetCid);
      setDanmakuBullets([]);

      if (activeContacts.length > 0) {
        const poster = activeContacts[0];
        const greetText = `哇，看起来这个视频不错诶！一起看吧~`;
        setTucaoList([{
          id: 'init',
          sender: 'ai',
          senderName: poster.name,
          senderAvatar: poster.avatar,
          content: greetText,
          timestamp: Date.now()
        }]);
        pushDanmaku(greetText, 'ai');
      }
    } catch (e: any) {
      alert(`加载失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = (pageNumber: number, cid: number) => {
    setCurrentPage(pageNumber);
    setCurrentCid(cid);
    setNativeError(false);
  };

  const handleSendUserTucao = async () => {
    if (!userTucao.trim() || !currentVideo || activeContacts.length === 0) return;
    
    const userMsg: TucaoMessage = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: settings.userNickname,
      senderAvatar: settings.userAvatar,
      content: userTucao,
      timestamp: Date.now()
    };
    
    setTucaoList(prev => [...prev, userMsg]);
    pushDanmaku(userTucao, 'user');
    const currentInput = userTucao;
    setUserTucao('');

    // AI replies immediately to user tucao (pick a random active contact to reply)
    try {
      const poster = activeContacts[Math.floor(Math.random() * activeContacts.length)];
      const tucao = await generateTucao(currentVideo, poster, currentInput, tucaoList.concat(userMsg));
      const aiMsg: TucaoMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        senderName: poster.name,
        senderAvatar: poster.avatar,
        content: tucao,
        timestamp: Date.now()
      };
      setTucaoList(prev => [...prev, aiMsg]);
      pushDanmaku(tucao, 'ai');
    } catch (e) {
      console.error('AI reply failed:', e);
    }
  };

  const toggleContact = (contact: Contact) => {
    setActiveContacts(prev => {
      const exists = prev.find(c => c.id === contact.id);
      let next;
      if (exists) {
        next = prev.filter(c => c.id !== contact.id);
      } else {
        next = [...prev, contact];
        // If video is playing, new AI greets
        if (currentVideo) {
          const greet = `来了来了！大家在看什么呢？`;
          setTucaoList(l => [...l, {
            id: `join_${Date.now()}`,
            sender: 'ai',
            senderName: contact.name,
            senderAvatar: contact.avatar,
            content: greet,
            timestamp: Date.now()
          }]);
          pushDanmaku(greet, 'ai');
        }
      }
      return next;
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[var(--app-bg,#f4f4f4)] overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200 shrink-0">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 B 站链接 / BV 号"
            className="flex-1 bg-transparent text-sm outline-none text-gray-800"
            onKeyDown={(e) => e.key === 'Enter' && handleStartWatching()}
          />
          <button 
            onClick={handleStartWatching}
            disabled={loading}
            className="p-1 text-pink-500 hover:text-pink-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
        </div>
        <button 
          onClick={() => setIsContactSelectorOpen(true)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors relative"
        >
          <Users className="w-5 h-5 text-gray-600" />
          {activeContacts.length > 0 && (
            <div className="absolute -bottom-1 -right-1 flex -space-x-1.5">
              {activeContacts.slice(0, 2).map((c) => (
                <div key={c.id} className="w-3.5 h-3.5 border border-white rounded-full overflow-hidden bg-white shadow-sm">
                  <Avatar src={c.avatar} className="w-full h-full" />
                </div>
              ))}
              {activeContacts.length > 2 && (
                <div className="w-3.5 h-3.5 border border-white rounded-full bg-pink-500 text-[6px] flex items-center justify-center text-white font-bold shadow-sm">
                  +{activeContacts.length - 2}
                </div>
              )}
            </div>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!currentVideo ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-24 h-24 bg-pink-100 rounded-3xl flex items-center justify-center">
              <Play className="w-10 h-10 text-pink-500 fill-current" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-800">一起看 B 站</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                输入视频链接，和 AI 好友实时吐槽互动吧
              </p>
              {activeContacts.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-400">当前陪看：</span>
                  {activeContacts.map(c => (
                    <span key={c.id} className="text-[10px] bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full font-bold">
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[10px] text-gray-400 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              支持 BV 号、完整链接、b23.tv 短链（原生高清解码，不黑屏）
            </div>
          </div>
        ) : (
          <>
            {/* Player Container */}
            <div className="w-full aspect-video bg-black shrink-0 relative overflow-hidden group">
              {playerMode === 'native' ? (
                <>
                  <video
                    ref={videoRef}
                    key={`bili-native-${currentVideo.bvid}-${currentCid}`}
                    src={`/api/bilibili/stream?bvid=${currentVideo.bvid}&cid=${currentCid || ''}`}
                    poster={currentVideo.pic?.replace(/^http:\/\//, 'https://')}
                    controls
                    playsInline
                    autoPlay
                    preload="auto"
                    className="w-full h-full object-contain bg-black"
                    onError={() => {
                      setNativeError(true);
                    }}
                  />
                  {/* Floating Danmaku Overlay */}
                  {showDanmaku && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                      {danmakuBullets.map(bullet => (
                        <div
                          key={bullet.id}
                          className="absolute whitespace-nowrap text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] animate-danmaku select-none pointer-events-none"
                          style={{
                            top: `${bullet.topPercent}%`,
                            animationDuration: '6s',
                            color: bullet.color
                          }}
                        >
                          {bullet.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {nativeError && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-30 space-y-2">
                      <AlertCircle className="w-7 h-7 text-amber-400" />
                      <p className="text-xs text-stone-200">该视频需要大会员或版权保护，内置流播放受限</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setPlayerMode('iframe');
                            setNativeError(false);
                          }}
                          className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-xs font-medium transition-colors"
                        >
                          切换官方网页播放器
                        </button>
                        <button
                          onClick={() => {
                            setNativeError(false);
                            if (videoRef.current) {
                              videoRef.current.load();
                            }
                          }}
                          className="px-2.5 py-1 bg-stone-700 hover:bg-stone-600 text-white rounded-full text-xs font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> 重试
                        </button>
                        <a
                          href={`https://www.bilibili.com/video/${currentVideo.bvid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-pink-400 rounded-full text-xs font-medium"
                        >
                          原站打开 ↗
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <iframe
                  key={`bili-iframe-${currentVideo.bvid}-${currentCid}-${currentPage}`}
                  src={`https://player.bilibili.com/player.html?bvid=${currentVideo.bvid}&cid=${currentCid || ''}&p=${currentPage}&autoplay=0`}
                  className="w-full h-full border-0 bg-black"
                  allowFullScreen={true}
                  scrolling="no"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                />
              )}

              {/* Player Top Controls Bar */}
              <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                {playerMode === 'native' && !nativeError && (
                  <button
                    onClick={() => setShowDanmaku(prev => !prev)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md transition-all ${
                      showDanmaku
                        ? 'bg-pink-500/90 text-white shadow-sm'
                        : 'bg-black/60 text-stone-300 hover:text-white'
                    }`}
                    title="弹幕开关"
                  >
                    弹幕
                  </button>
                )}

                <button
                  onClick={() => {
                    setPlayerMode(prev => prev === 'native' ? 'iframe' : 'native');
                    setNativeError(false);
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/70 hover:bg-black/90 text-stone-200 backdrop-blur-md border border-white/20 transition-all flex items-center gap-1 shadow-sm"
                  title="切换内置流 / 官方网页播放器"
                >
                  <Tv className="w-3 h-3 text-pink-400" />
                  <span>{playerMode === 'native' ? '切官方源' : '切内置流'}</span>
                </button>

                <a
                  href={`https://www.bilibili.com/video/${currentVideo.bvid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/70 hover:bg-black/90 text-pink-400 backdrop-blur-md border border-white/20 transition-all flex items-center gap-0.5 shadow-sm"
                  title="在新标签页直接打开 B 站原站"
                >
                  <span>原站</span>
                  <span className="text-[9px]">↗</span>
                </a>
              </div>
            </div>

            {/* Video Multi-Page Selector */}
            {currentVideo.pages && currentVideo.pages.length > 1 && (
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
                <span className="text-gray-400 shrink-0 font-medium">分P:</span>
                {currentVideo.pages.map((p) => {
                  const isSelected = p.page === currentPage;
                  return (
                    <button
                      key={p.cid}
                      onClick={() => handleSelectPage(p.page, p.cid)}
                      className={`px-2.5 py-1 rounded-md shrink-0 transition-all ${
                        isSelected
                          ? 'bg-pink-500 text-white font-bold shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      P{p.page} {p.part ? (p.part.length > 8 ? p.part.slice(0, 8) + '...' : p.part) : ''}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Video Meta */}
            <div className="p-3 bg-white border-b border-gray-100 shrink-0">
              <h1 className="text-sm font-bold line-clamp-1 text-gray-900">{currentVideo.title}</h1>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2">
                  <img src={currentVideo.owner.face} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                  <span className="text-[10px] text-gray-500">{currentVideo.owner.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <a 
                    href={`https://www.bilibili.com/video/${currentVideo.bvid}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-0.5 text-pink-500 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    浏览器打开
                  </a>
                  <span>{Math.floor(currentVideo.stat.view / 10000)}万播放</span>
                  <span>{currentVideo.stat.danmaku}弹幕</span>
                </div>
              </div>
            </div>

            {/* Tucao Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa]">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {tucaoList.map((msg) => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-fadeIn`}>
                    <Avatar src={msg.senderAvatar} className="w-8 h-8 rounded-full border border-white shadow-sm shrink-0" />
                    <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : ''} max-w-[80%]`}>
                      <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.senderName}</span>
                      <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-pink-500 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-2xl">
                  <input
                    value={userTucao}
                    onChange={(e) => setUserTucao(e.target.value)}
                    placeholder={activeContacts.length > 0 ? "实时吐槽..." : "请先选择陪看好友"}
                    disabled={activeContacts.length === 0}
                    className="flex-1 bg-transparent text-sm outline-none px-2"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendUserTucao()}
                  />
                  <button 
                    onClick={handleSendUserTucao}
                    disabled={!userTucao.trim() || activeContacts.length === 0}
                    className="p-1.5 bg-pink-500 text-white rounded-full disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contact Selector Modal */}
      {isContactSelectorOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-end animate-fadeIn">
          <div className="w-full bg-white rounded-t-[32px] p-6 pb-10 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-gray-800">选择陪看好友</h3>
                <p className="text-[10px] text-gray-400 font-medium">支持多选，共同吐槽（不包含群聊与工具）</p>
              </div>
              <button 
                onClick={() => setIsContactSelectorOpen(false)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold text-gray-600 transition-colors"
              >
                完成
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pt-2">
              {eligibleContacts.map(contact => {
                const isActive = activeContacts.some(c => c.id === contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContact(contact)}
                    className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                  >
                    <div className="relative">
                      <Avatar src={contact.avatar} className={`w-12 h-12 rounded-full border-2 transition-all ${isActive ? 'border-pink-500 shadow-md scale-105' : 'border-gray-50'}`} />
                      {isActive && (
                        <div className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full ring-2 ring-white">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium truncate w-full text-center ${isActive ? 'text-pink-600 font-bold' : 'text-gray-500'}`}>
                      {contact.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


