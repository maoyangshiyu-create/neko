import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Search, 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ListMusic, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle, 
  ChevronDown, 
  User, 
  LogOut, 
  Sparkles, 
  Music, 
  Clock, 
  Disc,
  Heart,
  Plus,
  RefreshCw,
  ChevronRight,
  FolderHeart,
  Folder,
  Crown,
  Headphones,
  MessageCircle,
  Send
} from 'lucide-react';
import { 
  SongItem, 
  NeteaseUserProfile, 
  UserPlaylist,
  getSavedCookie, 
  saveCookie, 
  getSavedUser, 
  saveUser, 
  fetchUserAccount, 
  fetchUserPlaylists,
  fetchPlaylistDetail,
  searchSongs, 
  fetchSongPlayUrl, 
  fetchSongLyric, 
  formatDuration 
} from '../../../services/neteaseService';
import { QrLoginModal } from './QrLoginModal';
import { Contact, PhoneSettings, ChatMessage } from '../../../types/phone';
import { TogetherMessage } from '../../../types/togetherMusic';
import { fetchTogetherMusicComment, fetchContactReplyToUser } from '../../../services/togetherMusicService';
import { TogetherInviteModal } from './TogetherInviteModal';
import { TogetherChatDrawer } from './TogetherChatDrawer';
import { useMusic } from '../../../contexts/MusicContext';

interface CloudMusicAppProps {
  onReturnToDesktop: () => void;
  contacts?: Contact[];
  settings?: PhoneSettings;
  onSendMessage?: (contactId: string, msg: Partial<ChatMessage>) => void;
}

// 推荐热门搜索关键词
const HOT_TAGS = ['周杰伦', '晴天', '陈奕迅', '林俊杰', '海阔天空', 'Taylor Swift', '毛不易', '起风了'];

// 初始预设歌单（初次进入即有歌可听）
const DEFAULT_PRESET_SONGS: SongItem[] = [
  {
    id: 186016,
    name: '晴天',
    artists: [{ id: 6452, name: '周杰伦' }],
    album: { id: 18896, name: '叶惠美', picUrl: 'https://p3.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg' },
    duration: 269000,
    picUrl: 'https://p3.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'
  },
  {
    id: 33894312,
    name: '海阔天空',
    artists: [{ id: 11127, name: 'Beyond' }],
    album: { id: 32665, name: '海阔天空', picUrl: 'https://p3.music.126.net/q6cm6Pk70YArijk1_QDoEg==/109951163984013003.jpg' },
    duration: 324000,
    picUrl: 'https://p3.music.126.net/q6cm6Pk70YArijk1_QDoEg==/109951163984013003.jpg'
  },
  {
    id: 65766,
    name: '十年',
    artists: [{ id: 2116, name: '陈奕迅' }],
    album: { id: 6496, name: '黑·白·灰', picUrl: 'https://p4.music.126.net/VnZiSbpMdtGHioVs0qX5Shared==/109951165647004069.jpg' },
    duration: 205000,
    picUrl: 'https://p4.music.126.net/VnZiSbpMdtGHioVs0qX5Shared==/109951165647004069.jpg'
  },
  {
    id: 1330348068,
    name: '起风了',
    artists: [{ id: 12085562, name: '买辣椒也用券' }],
    album: { id: 74715426, name: '起风了', picUrl: 'https://p3.music.126.net/diGAyEmpymHgQIsnCwSdShared==/109951163699673355.jpg' },
    duration: 325000,
    picUrl: 'https://p3.music.126.net/diGAyEmpymHgQIsnCwSdShared==/109951163699673355.jpg'
  }
];

interface LyricLine {
  time: number;
  text: string;
}

export const CloudMusicApp: React.FC<CloudMusicAppProps> = ({ 
  onReturnToDesktop,
  contacts,
  settings,
  onSendMessage
}) => {
  // 账号与登录
  const [currentUser, setCurrentUser] = useState<NeteaseUserProfile | null>(() => getSavedUser());
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  // 主导航 Tab: 'discover' (发现推荐/搜索) 或 'playlists' (我的歌单)
  const [activeTab, setActiveTab] = useState<'discover' | 'playlists'>('discover');

  // 用户歌单状态
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<UserPlaylist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<SongItem[]>([]);
  const [isLoadingPlaylistSongs, setIsLoadingPlaylistSongs] = useState<boolean>(false);

  // 联系人列表（优先通过 props，其次从本地存储读取）
  const allContacts: Contact[] = contacts || (() => {
    try {
      const saved = localStorage.getItem('wechat_contacts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  // 一起听 (Listen Together) 状态
  const { 
    currentSong, setCurrentSong,
    isPlaying, setIsPlaying,
    playlist, setPlaylist,
    playMode, setPlayMode,
    currentTime, setCurrentTime,
    duration, setDuration,
    isMuted, setIsMuted,
    audioError, setAudioError,
    playSong, pauseSong, resumeSong, nextSong, prevSong, seekTo,
    togetherContact, setTogetherContact,
    togetherMessages, setTogetherMessages,
    isFloating, setIsFloating
  } = useMusic();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isTogetherChatOpen, setIsTogetherChatOpen] = useState<boolean>(false);
  const [isContactReplying, setIsContactReplying] = useState<boolean>(false);
  const [quickReplyText, setQuickReplyText] = useState<string>('');

  // 自己的头像与昵称
  const myAvatar = currentUser?.avatarUrl || settings?.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
  const myNickname = currentUser?.nickname || settings?.userNickname || '我';

  // 搜索
  const [keyword, setKeyword] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SongItem[]>(DEFAULT_PRESET_SONGS);
  const [searchHistory, setSearchHistory] = useState<string[]>(['晴天', '海阔天空']);

  // 歌词
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0);
  const lyricContainerRef = useRef<HTMLDivElement | null>(null);

  // 界面状态
  const [showFullPlayer, setShowFullPlayer] = useState<boolean>(false);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // 持久化一起听选中的联系人
  useEffect(() => {
    try {
      if (togetherContact) {
        localStorage.setItem('together_listening_contact', JSON.stringify(togetherContact));
      } else {
        localStorage.removeItem('together_listening_contact');
      }
    } catch {}
  }, [togetherContact]);

  // 一起听：每隔 30 秒联系人根据音乐相关信息发言
  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;
  const currentLyricRef = useRef(lyrics[currentLyricIndex]?.text || '');
  currentLyricRef.current = lyrics[currentLyricIndex]?.text || '';
  const togetherContactRef = useRef(togetherContact);
  togetherContactRef.current = togetherContact;
  const togetherMessagesRef = useRef(togetherMessages);
  togetherMessagesRef.current = togetherMessages;

  useEffect(() => {
    if (!togetherContact || !currentSong) return;

    let isMounted = true;

    const doContactSpeech = async (isGreeting = false) => {
      const activeContact = togetherContactRef.current;
      const activeSong = currentSongRef.current;
      if (!activeContact || !activeSong || !isMounted) return;

      const lyricSnippet = currentLyricRef.current;
      const commentText = await fetchTogetherMusicComment({
        contact: activeContact,
        song: activeSong,
        currentLyric: lyricSnippet,
        recentMessages: togetherMessagesRef.current
      });

      if (!isMounted) return;

      const newMsg: TogetherMessage = {
        id: `together_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'contact',
        text: commentText,
        timestamp: Date.now(),
        songName: activeSong.name,
        artistName: activeSong.artists.map(a => a.name).join(' / ')
      };

      setTogetherMessages(prev => {
        const next = [...prev, newMsg];
        try {
          localStorage.setItem('together_listening_messages', JSON.stringify(next.slice(-50)));
        } catch {}
        return next;
      });

      if (onSendMessage) {
        onSendMessage(activeContact.id, {
          content: `[🎧 一起听·《${activeSong.name}》] ${commentText}`,
          sender: 'ai',
          senderName: activeContact.remark || activeContact.name,
          senderAvatar: activeContact.avatar,
          timestamp: Date.now()
        });
      }
    };

    // 刚开启一起听或切换歌曲时，2.5秒后先分享一句音乐感想
    const initialTimer = setTimeout(() => {
      doContactSpeech(true);
    }, 2500);

    // 核心要求：每隔三十秒联系人根据音乐相关信息发言
    const intervalTimer = setInterval(() => {
      doContactSpeech(false);
    }, 30000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [togetherContact?.id, currentSong?.id]);

  // 用户与联系人互相回复
  const handleSendReply = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : quickReplyText).trim();
    if (!textToSend || !togetherContact || !currentSong) return;

    const userMsg: TogetherMessage = {
      id: `together_u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
      songName: currentSong.name
    };

    setTogetherMessages(prev => {
      const next = [...prev, userMsg];
      try {
        localStorage.setItem('together_listening_messages', JSON.stringify(next.slice(-50)));
      } catch {}
      return next;
    });
    setQuickReplyText('');
    setIsContactReplying(true);

    if (onSendMessage) {
      onSendMessage(togetherContact.id, {
        content: `[🎧 一起听·《${currentSong.name}》] ${textToSend}`,
        sender: 'user',
        timestamp: Date.now()
      });
    }

    try {
      const reply = await fetchContactReplyToUser({
        contact: togetherContact,
        song: currentSong,
        userMessage: textToSend,
        recentMessages: [...togetherMessages, userMsg]
      });

      const contactMsg: TogetherMessage = {
        id: `together_c_${Date.now()}`,
        sender: 'contact',
        text: reply,
        timestamp: Date.now(),
        songName: currentSong.name
      };

      setTogetherMessages(prev => {
        const next = [...prev, contactMsg];
        try {
          localStorage.setItem('together_listening_messages', JSON.stringify(next.slice(-50)));
        } catch {}
        return next;
      });

      if (onSendMessage) {
        onSendMessage(togetherContact.id, {
          content: `[🎧 一起听·《${currentSong.name}》] ${reply}`,
          sender: 'ai',
          senderName: togetherContact.remark || togetherContact.name,
          senderAvatar: togetherContact.avatar,
          timestamp: Date.now()
        });
      }
    } finally {
      setIsContactReplying(false);
    }
  };

  // 加载当前用户的网易云歌单
  const loadUserPlaylists = async (user?: NeteaseUserProfile | null) => {
    const targetUser = user || currentUser;
    if (!targetUser || !targetUser.userId) return;

    try {
      setIsLoadingPlaylists(true);
      const lists = await fetchUserPlaylists(targetUser.userId);
      setUserPlaylists(lists);
    } catch (err: any) {
      console.warn('获取网易云歌单失败:', err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // 页面初始加载：若有 cookie 尝试静默刷新用户资料与歌单
  useEffect(() => {
    setIsFloating(false);
    const cookie = getSavedCookie();
    if (cookie) {
      fetchUserAccount(cookie).then(user => {
        if (user) {
          setCurrentUser(user);
          saveUser(user);
          loadUserPlaylists(user);
        }
      });
    }
  }, []);

  // 当登录用户改变时，自动同步歌单
  useEffect(() => {
    if (currentUser?.userId) {
      loadUserPlaylists(currentUser);
    } else {
      setUserPlaylists([]);
      setSelectedPlaylist(null);
    }
  }, [currentUser?.userId]);

  // 执行搜索
  const handleSearch = async (kw: string) => {
    const query = kw.trim();
    if (!query) return;

    setKeyword(query);
    setIsSearching(true);
    setAudioError('');

    try {
      const results = await searchSongs(query, 20);
      setSearchResults(results);

      // 更新搜索历史
      setSearchHistory(prev => {
        const next = [query, ...prev.filter(item => item !== query)].slice(0, 6);
        return next;
      });
    } catch (err: any) {
      showToast(err?.message || '搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  };

  // 播放歌曲
  const handlePlaySong = async (song: SongItem, songList?: SongItem[]) => {
    setAudioError('');
    const contextList = songList && songList.length > 0 ? songList : playlist;
    playSong(song, contextList);
  };

  // 当当前播放歌曲改变时，自动加载解析对应歌词
  useEffect(() => {
    if (currentSong?.id) {
      loadLyric(currentSong.id);
    }
  }, [currentSong?.id]);

  // 加载并解析歌词
  const loadLyric = async (songId: number) => {
    try {
      const rawLrc = await fetchSongLyric(songId);
      if (!rawLrc) {
        setLyrics([{ time: 0, text: '纯音乐，请欣赏' }]);
        return;
      }
      const lines = rawLrc.split('\n');
      const parsed: LyricLine[] = [];
      const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

      lines.forEach(line => {
        const match = timeRegex.exec(line);
        if (match) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const milliseconds = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
          const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;
          const text = line.replace(timeRegex, '').trim();
          if (text) {
            parsed.push({ time: totalSeconds, text });
          }
        }
      });

      setLyrics(parsed.length > 0 ? parsed : [{ time: 0, text: '暂无歌词' }]);
    } catch {
      setLyrics([{ time: 0, text: '歌词加载失败' }]);
    }
  };

  // 播放/暂停切换
  const togglePlay = () => {
    if (isPlaying) pauseSong();
    else resumeSong();
  };

  // 下一曲
  const handleNext = () => {
    nextSong();
  };

  // 上一曲
  const handlePrev = () => {
    prevSong();
  };

  // 播放模式切换
  const togglePlayMode = () => {
    if (playMode === 'loop') {
      setPlayMode('single');
      showToast('🔂 单曲循环');
    } else if (playMode === 'single') {
      setPlayMode('random');
      showToast('🔀 随机播放');
    } else {
      setPlayMode('loop');
      showToast('🔁 列表循环');
    }
  };

  // 监听播放时间，更新高亮歌词
  useEffect(() => {
    const cur = currentTime;
    if (lyrics.length > 0) {
      let activeIndex = 0;
      for (let i = 0; i < lyrics.length; i++) {
        if (cur >= lyrics[i].time) {
          activeIndex = i;
        } else {
          break;
        }
      }
      setCurrentLyricIndex(activeIndex);

      // 歌词自动滚动
      if (lyricContainerRef.current) {
        const lineEl = lyricContainerRef.current.children[activeIndex] as HTMLElement;
        if (lineEl) {
          const containerHeight = lyricContainerRef.current.clientHeight;
          const lineTop = lineEl.offsetTop;
          const lineHeight = lineEl.clientHeight;
          lyricContainerRef.current.scrollTop = lineTop - containerHeight / 2 + lineHeight / 2;
        }
      }
    }
  }, [currentTime, lyrics]);

  // 歌曲播放结束处理 (Provider handles next, but we can do extra stuff here if needed)
  
  // 打开歌单详情并加载全部歌曲
  const handleOpenPlaylist = async (pl: UserPlaylist) => {
    setSelectedPlaylist(pl);
    setIsLoadingPlaylistSongs(true);
    setPlaylistSongs([]);
    try {
      const { songs } = await fetchPlaylistDetail(pl.id);
      setPlaylistSongs(songs);
    } catch (err: any) {
      showToast(err?.message || '加载歌单歌曲失败');
    } finally {
      setIsLoadingPlaylistSongs(false);
    }
  };

  // 播放整张歌单全部歌曲
  const handlePlayAllFromPlaylist = (songs: SongItem[]) => {
    if (!songs || songs.length === 0) {
      showToast('歌单中暂无歌曲');
      return;
    }
    handlePlaySong(songs[0], songs);
    showToast(`正在播放歌单: ${selectedPlaylist?.name || ''}`);
  };

  // 退出登录
  const handleLogout = () => {
    saveCookie('');
    saveUser(null);
    setCurrentUser(null);
    setUserPlaylists([]);
    setSelectedPlaylist(null);
    setShowUserDropdown(false);
    showToast('已退出网易云音乐账号');
  };

  // 进度条拖动
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  return (
    <div
      id="cloud-music-app"
      className="rococo-theme h-full w-full flex flex-col select-none relative overflow-hidden font-sans"
      style={{
        backgroundColor: 'var(--app-bg, #fdf6f0)',
        color: 'var(--app-text, #6b4a52)'
      }}
    >
      {/* 1. Header 顶部导航 */}
      <div 
        className="h-11 px-3 border-b flex items-center justify-between shrink-0 z-20"
        style={{
          backgroundColor: 'var(--app-card, #fffaf5)',
          borderColor: 'var(--app-card-border, #f0dfe0)'
        }}
      >
        <button
          onClick={() => {
            setIsFloating(true);
            onReturnToDesktop();
          }}
          className="flex items-center gap-1 text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
          style={{ color: 'var(--app-text, #6b4a52)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>桌面</span>
        </button>

        <div className="flex items-center gap-1.5 font-bold text-xs">
          <div 
            className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-white text-[10px]"
            style={{ backgroundColor: '#e60026' }}
          >
            <Music className="w-2.5 h-2.5" />
          </div>
          <span style={{ color: 'var(--app-text, #6b4a52)' }}>网易云音乐</span>
        </div>

        {/* 用户登录/头像入口 */}
        <div className="relative">
          {currentUser ? (
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-50/70 border border-rose-200/70 hover:bg-rose-100/70 cursor-pointer active:scale-95 transition-transform"
            >
              <img
                src={currentUser.avatarUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                alt={currentUser.nickname}
                className="w-5 h-5 rounded-full object-cover border border-rose-300 shadow-2xs"
              />
              <span className="text-[11px] font-bold max-w-[80px] truncate" style={{ color: 'var(--app-text, #6b4a52)' }}>
                {currentUser.nickname}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-stone-400" />
            </button>
          ) : (
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs active:scale-95 transition-transform cursor-pointer flex items-center gap-1"
              style={{
                backgroundColor: 'var(--app-btn-bg, #e89aab)',
                color: 'var(--app-btn-text, #ffffff)'
              }}
            >
              <User className="w-3 h-3" />
              <span>登录</span>
            </button>
          )}

          {/* 用户菜单下拉 */}
          {showUserDropdown && currentUser && (
            <div 
              className="absolute right-0 top-8 w-44 rounded-xl p-2 shadow-xl border z-30 animate-scaleUp"
              style={{
                backgroundColor: 'var(--app-card, #fffaf5)',
                borderColor: 'var(--app-card-border, #f0dfe0)'
              }}
            >
              <div className="px-2 py-1.5 border-b mb-1 flex items-center gap-2" style={{ borderColor: 'var(--app-divider, #f0dfe0)' }}>
                <img
                  src={currentUser.avatarUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                  alt={currentUser.nickname}
                  className="w-7 h-7 rounded-full object-cover border border-rose-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold truncate" style={{ color: 'var(--app-text, #6b4a52)' }}>
                    {currentUser.nickname}
                  </p>
                  <p className="text-[9px] flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    已关联网易云
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('playlists');
                  setSelectedPlaylist(null);
                  setShowUserDropdown(false);
                }}
                className="w-full px-2 py-1.5 text-left text-[11px] hover:bg-stone-100/60 rounded-lg flex items-center justify-between cursor-pointer"
                style={{ color: 'var(--app-text, #6b4a52)' }}
              >
                <div className="flex items-center gap-1.5">
                  <FolderHeart className="w-3.5 h-3.5 text-rose-500" />
                  <span>我的网易云歌单</span>
                </div>
                {userPlaylists.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-600 font-bold">
                    {userPlaylists.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  loadUserPlaylists(currentUser);
                  setShowUserDropdown(false);
                  showToast('正在同步最新歌单...');
                }}
                className="w-full px-2 py-1.5 text-left text-[11px] hover:bg-stone-100/60 rounded-lg flex items-center gap-1.5 cursor-pointer"
                style={{ color: 'var(--app-text, #6b4a52)' }}
              >
                <RefreshCw className="w-3 h-3 text-stone-400" />
                <span>刷新歌单数据</span>
              </button>
              <div className="h-px my-1" style={{ backgroundColor: 'var(--app-divider, #f0dfe0)' }} />
              <button
                onClick={handleLogout}
                className="w-full px-2 py-1.5 text-left text-[11px] text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>退出登录</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 页面主导航 Tabs: 发现 vs 我的网易云歌单 */}
      <div 
        className="px-3 pt-2 pb-1 border-b flex items-center justify-around shrink-0 text-xs font-semibold"
        style={{
          backgroundColor: 'var(--app-card, #fffaf5)',
          borderColor: 'var(--app-card-border, #f0dfe0)'
        }}
      >
        <button
          onClick={() => {
            setActiveTab('discover');
            setSelectedPlaylist(null);
          }}
          className={`flex-1 py-1.5 text-center relative cursor-pointer transition-colors ${
            activeTab === 'discover' ? 'font-bold' : 'opacity-60 hover:opacity-80'
          }`}
          style={{
            color: activeTab === 'discover' ? 'var(--app-btn-bg, #e89aab)' : 'var(--app-text, #6b4a52)'
          }}
        >
          <span>发现与搜索</span>
          {activeTab === 'discover' && (
            <span 
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" 
              style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)' }}
            />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('playlists');
            if (currentUser && userPlaylists.length === 0) {
              loadUserPlaylists(currentUser);
            }
          }}
          className={`flex-1 py-1.5 text-center relative cursor-pointer transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'playlists' ? 'font-bold' : 'opacity-60 hover:opacity-80'
          }`}
          style={{
            color: activeTab === 'playlists' ? 'var(--app-btn-bg, #e89aab)' : 'var(--app-text, #6b4a52)'
          }}
        >
          <span>我的网易云歌单</span>
          {userPlaylists.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-600 font-bold">
              {userPlaylists.length}
            </span>
          )}
          {activeTab === 'playlists' && (
            <span 
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" 
              style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)' }}
            />
          )}
        </button>
      </div>

      {/* 3. 视图渲染 (发现模式 vs 歌单模式) */}
      {activeTab === 'discover' ? (
        <>
          {/* 搜索框区域 */}
          <div 
            className="p-3 border-b space-y-2 shrink-0"
            style={{
              backgroundColor: 'var(--app-card, #fffaf5)',
              borderColor: 'var(--app-card-border, #f0dfe0)'
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="flex-1 relative flex items-center">
                <Search 
                  className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none" 
                  style={{ color: 'var(--app-text-soft, #b398a0)' }}
                />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(keyword);
                    }
                  }}
                  placeholder="搜索歌曲、歌手、专辑..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-full text-xs outline-hidden transition-all border"
                  style={{
                    backgroundColor: 'var(--app-bg, #fdf6f0)',
                    borderColor: 'var(--app-card-border, #f0dfe0)',
                    color: 'var(--app-text, #6b4a52)'
                  }}
                />
                {keyword && (
                  <button
                    onClick={() => setKeyword('')}
                    className="absolute right-2.5 p-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleSearch(keyword)}
                disabled={isSearching || !keyword.trim()}
                className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--app-btn-bg, #e89aab)',
                  color: 'var(--app-btn-text, #ffffff)'
                }}
              >
                {isSearching ? '搜索中' : '搜索'}
              </button>
            </div>

            {/* 热门快捷标签 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] shrink-0" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                热搜：
              </span>
              {HOT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSearch(tag)}
                  className="px-2 py-0.5 rounded-full text-[10px] shrink-0 border transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--app-bg, #fdf6f0)',
                    borderColor: 'var(--app-card-border, #f0dfe0)',
                    color: 'var(--app-text, #6b4a52)'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 歌曲列表区域 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* 已登录时的歌单入口横幅 */}
            {currentUser && (
              <div 
                onClick={() => {
                  setActiveTab('playlists');
                  setSelectedPlaylist(null);
                }}
                className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer hover:opacity-95 transition-all bg-gradient-to-r from-rose-50 to-pink-50/50 border-rose-200 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <FolderHeart className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: 'var(--app-text, #6b4a52)' }}>
                      欢迎你，{currentUser.nickname}
                    </p>
                    <p className="text-[9px] text-rose-600 font-medium">
                      点击查看您的 {userPlaylists.length} 个网易云同步歌单 →
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
              </div>
            )}

            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold" style={{ color: 'var(--app-text, #6b4a52)' }}>
                {keyword ? `搜索结果 (${searchResults.length})` : '发现好歌 · 精选推荐'}
              </h4>
              <span className="text-[10px]" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                共 {searchResults.length} 首
              </span>
            </div>

            {audioError && (
              <div className="p-2 rounded-xl text-[11px] bg-red-50 text-red-600 border border-red-100 flex items-center justify-between">
                <span>{audioError}</span>
                {!currentUser && (
                  <button
                    onClick={() => setIsQrModalOpen(true)}
                    className="font-bold underline cursor-pointer shrink-0"
                  >
                    去扫码登录
                  </button>
                )}
              </div>
            )}

            {isSearching ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs">
                <Disc className="w-6 h-6 animate-spin" style={{ color: 'var(--app-btn-bg, #e89aab)' }} />
                <span style={{ color: 'var(--app-text-soft, #b398a0)' }}>正在全网检索高品质音乐...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center text-xs" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                未找到相关歌曲，换个关键词试试吧
              </div>
            ) : (
              <div className="space-y-1.5">
                {searchResults.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const artistNames = song.artists.map(a => a.name).join(' / ') || '未知歌手';

                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      onClick={() => handlePlaySong(song, searchResults)}
                      className="p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer group active:scale-98"
                      style={{
                        backgroundColor: isCurrent ? 'var(--app-card, #fffaf5)' : 'var(--app-item-bg, #fffaf5)',
                        borderColor: isCurrent ? 'var(--app-item-active, #e89aab)' : 'var(--app-item-border, #f0dfe0)'
                      }}
                    >
                      {/* 序号或播放动效 */}
                      <div className="w-5 text-center text-[10px] font-bold shrink-0">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="w-0.5 h-3 bg-rose-500 animate-pulse" />
                            <span className="w-0.5 h-2 bg-rose-400 animate-pulse delay-75" />
                            <span className="w-0.5 h-3.5 bg-rose-500 animate-pulse delay-150" />
                          </div>
                        ) : (
                          <span style={{ color: isCurrent ? 'var(--app-item-active, #e89aab)' : 'var(--app-text-soft, #b398a0)' }}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>

                      {/* 封面图片 */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-stone-100 bg-stone-100 relative">
                        <img
                          src={song.picUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                          alt={song.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>

                      {/* 歌曲信息 */}
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-xs font-bold truncate leading-tight"
                          style={{ color: isCurrent ? 'var(--app-item-active, #e89aab)' : 'var(--app-text, #6b4a52)' }}
                        >
                          {song.name}
                        </p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                          {artistNames} · {song.album.name}
                        </p>
                      </div>

                      {/* 时长与操作 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                          {formatDuration(song.duration)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaylist(prev => {
                              if (!prev.some(s => s.id === song.id)) {
                                showToast('已加入播放列表');
                                return [...prev, song];
                              }
                              showToast('歌曲已在播放列表中');
                              return prev;
                            });
                          }}
                          className="p-1.5 rounded-full hover:bg-stone-200/50 cursor-pointer text-stone-400 hover:text-stone-600 active:scale-90"
                          title="添加到歌单"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* 我的网易云歌单视图 */
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {selectedPlaylist ? (
            /* 歌单详情视图 */
            <div className="space-y-3">
              {/* 返回按钮 */}
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 cursor-pointer active:scale-95 transition-transform"
                style={{ color: 'var(--app-btn-bg, #e89aab)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回全部歌单</span>
              </button>

              {/* 歌单信息卡片 */}
              <div 
                className="p-3 rounded-2xl border flex gap-3 shadow-xs"
                style={{
                  backgroundColor: 'var(--app-card, #fffaf5)',
                  borderColor: 'var(--app-card-border, #f0dfe0)'
                }}
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-stone-100 shadow-sm relative">
                  <img
                    src={selectedPlaylist.coverImgUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                    alt={selectedPlaylist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold leading-snug line-clamp-2" style={{ color: 'var(--app-text, #6b4a52)' }}>
                      {selectedPlaylist.name}
                    </h3>
                    <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                      创建者: {selectedPlaylist.creator?.nickname || '网易云音乐'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono">
                      {selectedPlaylist.trackCount} 首歌曲
                    </span>
                    <button
                      onClick={() => handlePlayAllFromPlaylist(playlistSongs)}
                      disabled={isLoadingPlaylistSongs || playlistSongs.length === 0}
                      className="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--app-btn-bg, #e89aab)',
                        color: 'var(--app-btn-text, #ffffff)'
                      }}
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>播放全部</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 歌单内歌曲列表 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-bold" style={{ color: 'var(--app-text, #6b4a52)' }}>
                    歌单曲目
                  </h4>
                  <span className="text-[10px]" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                    {isLoadingPlaylistSongs ? '正在加载歌曲...' : `共 ${playlistSongs.length} 首`}
                  </span>
                </div>

                {isLoadingPlaylistSongs ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs">
                    <Disc className="w-6 h-6 animate-spin" style={{ color: 'var(--app-btn-bg, #e89aab)' }} />
                    <span style={{ color: 'var(--app-text-soft, #b398a0)' }}>正在同步歌单曲目...</span>
                  </div>
                ) : playlistSongs.length === 0 ? (
                  <div className="py-10 text-center text-xs" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                    歌单中暂无歌曲或暂未公开
                  </div>
                ) : (
                  playlistSongs.map((song, idx) => {
                    const isCurrent = currentSong?.id === song.id;
                    const artistNames = song.artists.map(a => a.name).join(' / ') || '未知歌手';

                    return (
                      <div
                        key={`pl-song-${song.id}-${idx}`}
                        onClick={() => handlePlaySong(song, playlistSongs)}
                        className="p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer group active:scale-98"
                        style={{
                          backgroundColor: isCurrent ? 'var(--app-card, #fffaf5)' : 'var(--app-item-bg, #fffaf5)',
                          borderColor: isCurrent ? 'var(--app-item-active, #e89aab)' : 'var(--app-item-border, #f0dfe0)'
                        }}
                      >
                        <div className="w-5 text-center text-[10px] font-bold shrink-0">
                          {isCurrent && isPlaying ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <span className="w-0.5 h-3 bg-rose-500 animate-pulse" />
                              <span className="w-0.5 h-2 bg-rose-400 animate-pulse delay-75" />
                              <span className="w-0.5 h-3.5 bg-rose-500 animate-pulse delay-150" />
                            </div>
                          ) : (
                            <span style={{ color: isCurrent ? 'var(--app-item-active, #e89aab)' : 'var(--app-text-soft, #b398a0)' }}>
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>

                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-stone-100 bg-stone-100 relative">
                          <img
                            src={song.picUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                            alt={song.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-xs font-bold truncate leading-tight"
                            style={{ color: isCurrent ? 'var(--app-item-active, #e89aab)' : 'var(--app-text, #6b4a52)' }}
                          >
                            {song.name}
                          </p>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                            {artistNames} · {song.album.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                            {formatDuration(song.duration)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaylist(prev => {
                                if (!prev.some(s => s.id === song.id)) {
                                  showToast('已加入播放列表');
                                  return [...prev, song];
                                }
                                showToast('歌曲已在播放列表中');
                                return prev;
                              });
                            }}
                            className="p-1.5 rounded-full hover:bg-stone-200/50 cursor-pointer text-stone-400 hover:text-stone-600 active:scale-90"
                            title="添加到当前播放队列"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* 歌单主列表 */
            <>
              {currentUser ? (
                <>
                  {/* 用户账号状态卡片 */}
                  <div 
                    className="p-3 rounded-2xl border flex items-center justify-between shadow-xs"
                    style={{
                      backgroundColor: 'var(--app-card, #fffaf5)',
                      borderColor: 'var(--app-card-border, #f0dfe0)'
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={currentUser.avatarUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                        alt={currentUser.nickname}
                        className="w-10 h-10 rounded-full object-cover border-2 border-rose-300 shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold truncate" style={{ color: 'var(--app-text, #6b4a52)' }}>
                            {currentUser.nickname}
                          </h3>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-semibold shrink-0">
                            已同步
                          </span>
                        </div>
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                          已获取 {userPlaylists.length} 个网易云歌单
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        loadUserPlaylists(currentUser);
                        showToast('正在同步歌单...');
                      }}
                      disabled={isLoadingPlaylists}
                      className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer active:scale-95 transition-transform"
                      title="刷新歌单"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingPlaylists ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* 歌单列表 */}
                  {isLoadingPlaylists ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs">
                      <Disc className="w-6 h-6 animate-spin" style={{ color: 'var(--app-btn-bg, #e89aab)' }} />
                      <span style={{ color: 'var(--app-text-soft, #b398a0)' }}>正在同步您的网易云歌单...</span>
                    </div>
                  ) : userPlaylists.length === 0 ? (
                    <div className="py-12 text-center text-xs space-y-2" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                      <FolderHeart className="w-8 h-8 mx-auto text-rose-300" />
                      <p>暂未获取到歌单，请点击刷新按钮</p>
                      <button
                        onClick={() => loadUserPlaylists(currentUser)}
                        className="px-3 py-1 rounded-full text-xs font-bold cursor-pointer"
                        style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)', color: '#fff' }}
                      >
                        刷新同步
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-0.5">
                        <h4 className="text-xs font-bold" style={{ color: 'var(--app-text, #6b4a52)' }}>
                          全部歌单 ({userPlaylists.length})
                        </h4>
                        <span className="text-[10px]" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                          点击进入歌单畅听
                        </span>
                      </div>

                      {userPlaylists.map((pl, idx) => {
                        const isFavorite = pl.name.includes('喜欢的音乐') || idx === 0;

                        return (
                          <div
                            key={`pl-${pl.id}`}
                            onClick={() => handleOpenPlaylist(pl)}
                            className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer group hover:scale-[1.01] active:scale-98 shadow-2xs ${
                              isFavorite ? 'bg-gradient-to-r from-rose-50/90 to-amber-50/40 border-rose-200' : ''
                            }`}
                            style={!isFavorite ? {
                              backgroundColor: 'var(--app-card, #fffaf5)',
                              borderColor: 'var(--app-card-border, #f0dfe0)'
                            } : {}}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-stone-100 bg-stone-100 relative shadow-2xs">
                              <img
                                src={pl.coverImgUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                                alt={pl.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {isFavorite && (
                                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                  <Heart className="w-5 h-5 text-white fill-white drop-shadow-sm" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                {isFavorite && (
                                  <span className="text-[9px] px-1 py-0.2 rounded-xs bg-rose-500 text-white font-bold shrink-0">
                                    红心
                                  </span>
                                )}
                                <h4 className="text-xs font-bold truncate" style={{ color: 'var(--app-text, #6b4a52)' }}>
                                  {pl.name}
                                </h4>
                              </div>
                              <p className="text-[10px] mt-1" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                                {pl.trackCount} 首歌曲 {pl.playCount ? `· 播放 ${pl.playCount > 10000 ? `${(pl.playCount/10000).toFixed(1)}万` : pl.playCount} 次` : ''}
                              </p>
                            </div>

                            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* 未登录状态下的歌单引导 */
                <div 
                  className="p-5 rounded-2xl border text-center space-y-4 my-4 shadow-xs"
                  style={{
                    backgroundColor: 'var(--app-card, #fffaf5)',
                    borderColor: 'var(--app-card-border, #f0dfe0)'
                  }}
                >
                  <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-rose-100 text-rose-500 shadow-inner">
                    <FolderHeart className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--app-text, #6b4a52)' }}>
                      登录网易云音乐账号
                    </h3>
                    <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                      登录后即可一键同步您的「我喜欢的音乐」、自建歌单与收藏歌单，畅听您云端的全部曲目！
                    </p>
                  </div>
                  <button
                    onClick={() => setIsQrModalOpen(true)}
                    className="w-full py-2.5 rounded-full text-xs font-bold shadow-md active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: 'var(--app-btn-bg, #e89aab)',
                      color: 'var(--app-btn-text, #ffffff)'
                    }}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>立即扫码登录网易云音乐</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 4. 底部吸底 Mini 播放控制栏 */}
      {currentSong && (
        <div 
          onClick={() => setShowFullPlayer(true)}
          className="h-14 px-3 border-t flex items-center justify-between shrink-0 z-20 cursor-pointer shadow-lg active:opacity-95 transition-opacity"
          style={{
            backgroundColor: 'var(--app-card, #fffaf5)',
            borderColor: 'var(--app-card-border, #f0dfe0)'
          }}
        >
          {/* 黑胶旋转小唱片 + 歌名 */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-stone-800 shadow-md relative ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
              <img
                src={currentSong.picUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                alt={currentSong.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-white border border-stone-700" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate leading-tight" style={{ color: 'var(--app-text, #6b4a52)' }}>
                {currentSong.name}
              </p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                {currentSong.artists.map(a => a.name).join(' / ')}
              </p>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xs active:scale-90 transition-transform cursor-pointer"
              style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)' }}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-full text-stone-600 hover:bg-stone-200/50 cursor-pointer active:scale-90"
              title="下一曲"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowPlaylistDrawer(true)}
              className="p-1.5 rounded-full text-stone-600 hover:bg-stone-200/50 cursor-pointer active:scale-90"
              title="播放列表"
            >
              <ListMusic className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. 全屏播放器详情弹层 (Full Screen Player) */}
      {showFullPlayer && currentSong && (
        <div 
          className="absolute inset-0 z-40 flex flex-col p-4 animate-fadeIn select-none"
          style={{
            backgroundColor: 'var(--app-bg, #fdf6f0)',
            color: 'var(--app-text, #6b4a52)'
          }}
        >
          {/* 顶部标题与收起 */}
          <div className="flex items-center justify-between shrink-0 mb-2">
            <button
              onClick={() => setShowFullPlayer(false)}
              className="p-1 rounded-full hover:bg-stone-200/50 cursor-pointer active:scale-90"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            <div className="text-center min-w-0 max-w-[200px]">
              <h3 className="text-xs font-bold truncate">{currentSong.name}</h3>
              <p className="text-[10px] truncate" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                {currentSong.artists.map(a => a.name).join(' / ')}
              </p>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="p-1 rounded-full hover:bg-stone-200/50 cursor-pointer text-rose-500 active:scale-90"
              title="邀请好友一起听"
            >
              <Headphones className="w-4 h-4" />
            </button>
          </div>

          {/* 网易云经典 一起听 (Listen Together) 胶囊挂件 */}
          <div className="w-full px-1 mb-2 shrink-0">
            <div 
              className="p-2 rounded-2xl border shadow-xs flex flex-col gap-1.5 transition-all"
              style={{
                backgroundColor: 'var(--app-card, rgba(255, 250, 245, 0.85))',
                borderColor: 'var(--app-card-border, #f0dfe0)'
              }}
            >
              {/* 头像连接区 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 左边：自己头像 */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <img 
                        src={myAvatar} 
                        alt={myNickname} 
                        className="w-7 h-7 rounded-full object-cover border-2 border-rose-300 shadow-2xs"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold max-w-[46px] truncate" style={{ color: 'var(--app-text, #6b4a52)' }}>
                      {myNickname}
                    </span>
                  </div>

                  {/* 中间连接线与呼吸动态耳机图标 */}
                  <div className="flex items-center px-0.5">
                    <div className="w-2.5 h-0.5 bg-rose-300 rounded-full" />
                    <div className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-500 flex items-center gap-0.5">
                      <Headphones className="w-3 h-3" />
                      {togetherContact && (
                        <div className="flex items-end gap-0.5 h-2.5">
                          <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                          <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
                          <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                    <div className="w-2.5 h-0.5 bg-rose-300 rounded-full" />
                  </div>

                  {/* 右边：联系人头像 或 邀请按钮 */}
                  {togetherContact ? (
                    <div 
                      onClick={() => setIsTogetherChatOpen(true)}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                    >
                      <div className="relative">
                        <img 
                          src={togetherContact.avatar} 
                          alt={togetherContact.remark || togetherContact.name} 
                          className="w-7 h-7 rounded-full object-cover border-2 border-rose-400 shadow-2xs"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold max-w-[55px] truncate" style={{ color: 'var(--app-text, #6b4a52)' }}>
                          {togetherContact.remark || togetherContact.name}
                        </span>
                        <span className="text-[8px] text-emerald-600 font-medium">一起听歌中</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-rose-300 bg-rose-50/80 hover:bg-rose-100 text-rose-600 cursor-pointer active:scale-95 transition-all text-[10px] font-bold shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-white border border-rose-200 flex items-center justify-center text-[10px] font-bold">+</span>
                      <span>邀请联系人</span>
                    </button>
                  )}
                </div>

                {/* 右侧操作按钮：聊天记录 / 切换联系人 / 退出 */}
                <div className="flex items-center gap-1">
                  {togetherContact ? (
                    <>
                      <button
                        onClick={() => setIsTogetherChatOpen(true)}
                        className="p-1 rounded-lg hover:bg-stone-200/50 text-rose-500 cursor-pointer active:scale-90"
                        title="查看一起听互动记录"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200/70 text-stone-600 cursor-pointer"
                      >
                        换人
                      </button>
                      <button
                        onClick={() => {
                          setTogetherContact(null);
                          showToast('已结束一起听歌');
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 cursor-pointer"
                      >
                        退出
                      </button>
                    </>
                  ) : (
                    <span className="text-[8px]" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                      耳机分你一半
                    </span>
                  )}
                </div>
              </div>

              {/* 联系人实时发言气泡 (每30秒更新或点击回复) */}
              {togetherContact && (
                <div className="pt-1 border-t flex items-center justify-between gap-1.5" style={{ borderColor: 'var(--app-divider, #f0dfe0)' }}>
                  <div 
                    onClick={() => setIsTogetherChatOpen(true)}
                    className="flex-1 flex items-center gap-1 min-w-0 cursor-pointer hover:opacity-85"
                  >
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-600 font-bold shrink-0">
                      {isContactReplying ? '轻声说...' : `${togetherContact.remark || togetherContact.name}：`}
                    </span>
                    <span className="text-[10px] truncate leading-tight" style={{ color: 'var(--app-text, #6b4a52)' }}>
                      {isContactReplying 
                        ? '正在回复你的话...' 
                        : (togetherMessages.filter(m => m.sender === 'contact').slice(-1)[0]?.text || `戴着耳机和你一起听《${currentSong.name}》呢...`)}
                    </span>
                  </div>

                  {/* 快速回复按钮 */}
                  <button
                    onClick={() => setIsTogetherChatOpen(true)}
                    className="shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold shadow-2xs flex items-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
                    style={{
                      backgroundColor: 'var(--app-btn-bg, #e89aab)',
                      color: 'var(--app-btn-text, #ffffff)'
                    }}
                  >
                    <Send className="w-2.5 h-2.5" />
                    <span>回复</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 中间区：黑胶大唱盘 */}
          <div className="flex-1 flex flex-col items-center justify-center relative my-2 overflow-hidden">
            {/* 黑胶唱片本体 */}
            <div 
              className={`w-48 h-48 rounded-full border-8 border-stone-900 shadow-2xl p-6 bg-radial from-stone-900 via-stone-800 to-black flex items-center justify-center relative ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '14s' }}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-inner border border-stone-700 relative">
                <img
                  src={currentSong.picUrl || 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'}
                  alt={currentSong.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-white border border-stone-800" />
              </div>
            </div>

            {/* 动态同步滚动歌词 */}
            <div 
              ref={lyricContainerRef}
              className="w-full h-24 mt-4 overflow-y-auto text-center px-4 space-y-2 no-scrollbar scroll-smooth"
            >
              {lyrics.map((line, lIdx) => (
                <p
                  key={lIdx}
                  className={`text-xs transition-all duration-300 leading-relaxed ${
                    lIdx === currentLyricIndex
                      ? 'font-bold scale-105'
                      : 'opacity-40 text-[11px]'
                  }`}
                  style={{
                    color: lIdx === currentLyricIndex ? 'var(--app-btn-bg, #e89aab)' : 'var(--app-text, #6b4a52)'
                  }}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>

          {/* 进度条控制 */}
          <div className="w-full px-2 space-y-1 mb-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
            <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
              <span>{formatDuration(currentTime * 1000)}</span>
              <span>{formatDuration((duration || (currentSong.duration / 1000)) * 1000)}</span>
            </div>
          </div>

          {/* 底部控制按钮组 */}
          <div className="flex items-center justify-around shrink-0 pb-4">
            {/* 播放模式 */}
            <button
              onClick={togglePlayMode}
              className="p-2 text-stone-600 hover:text-stone-900 cursor-pointer active:scale-90"
              title="切换播放模式"
            >
              {playMode === 'loop' && <Repeat className="w-4 h-4" />}
              {playMode === 'single' && <Repeat className="w-4 h-4 text-rose-500" />}
              {playMode === 'random' && <Shuffle className="w-4 h-4" />}
            </button>

            {/* 上一曲 */}
            <button
              onClick={handlePrev}
              className="p-2 text-stone-700 hover:text-stone-900 cursor-pointer active:scale-90"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* 播放/暂停大按钮 */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform cursor-pointer"
              style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)' }}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>

            {/* 下一曲 */}
            <button
              onClick={handleNext}
              className="p-2 text-stone-700 hover:text-stone-900 cursor-pointer active:scale-90"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* 播放列表 */}
            <button
              onClick={() => setShowPlaylistDrawer(true)}
              className="p-2 text-stone-600 hover:text-stone-900 cursor-pointer active:scale-90"
            >
              <ListMusic className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. 播放队列抽屉 (Playlist Drawer) */}
      {showPlaylistDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end animate-fadeIn">
          <div 
            className="w-full max-h-[60vh] rounded-t-3xl p-4 flex flex-col border-t shadow-2xl animate-slideUp"
            style={{
              backgroundColor: 'var(--app-card, #fffaf5)',
              borderColor: 'var(--app-card-border, #f0dfe0)',
              color: 'var(--app-text, #6b4a52)'
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--app-divider, #f0dfe0)' }}>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <ListMusic className="w-4 h-4 text-rose-500" />
                <span>当前播放队列 ({playlist.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPlaylist([]);
                    showToast('已清空歌单');
                  }}
                  className="text-[10px] text-stone-400 hover:text-red-500 cursor-pointer"
                >
                  清空
                </button>
                <button
                  onClick={() => setShowPlaylistDrawer(false)}
                  className="p-1 rounded-full hover:bg-stone-200/50 cursor-pointer"
                >
                  <X className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-1">
              {playlist.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div
                    key={`${song.id}-${idx}`}
                    onClick={() => {
                      handlePlaySong(song);
                      setShowPlaylistDrawer(false);
                    }}
                    className="p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-stone-100/50 transition-colors"
                    style={{
                      color: isCurrent ? 'var(--app-btn-bg, #e89aab)' : 'var(--app-text, #6b4a52)',
                      fontWeight: isCurrent ? 700 : 400
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isCurrent ? <Play className="w-3 h-3 fill-current shrink-0" /> : <span className="w-3 shrink-0" />}
                      <span className="truncate">{song.name} - {song.artists.map(a => a.name).join(' / ')}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaylist(prev => prev.filter(s => s.id !== song.id));
                      }}
                      className="text-stone-300 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. 扫码登录弹窗 */}
      <QrLoginModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadUserPlaylists(user);
          setActiveTab('playlists');
          showToast(`欢迎回来，${user.nickname}！已为您同步歌单`);
        }}
      />

      {/* 8. 一起听：邀请联系人弹窗 */}
      <TogetherInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        contacts={allContacts}
        currentSelectedId={togetherContact?.id}
        onSelectContact={(contact) => {
          if (togetherContact && togetherContact.id !== contact.id) {
            setTogetherMessages([]);
            localStorage.removeItem('together_listening_messages');
          }
          setTogetherContact(contact);
          setIsInviteModalOpen(false);
          showToast(`已连接 ${contact.remark || contact.name} 一起听歌`);
        }}
      />

      {/* 9. 一起听：实时互动聊天抽屉 */}
      {togetherContact && currentSong && (
        <TogetherChatDrawer
          isOpen={isTogetherChatOpen}
          onClose={() => setIsTogetherChatOpen(false)}
          contact={togetherContact}
          currentSong={currentSong}
          messages={togetherMessages}
          myAvatar={myAvatar}
          myNickname={myNickname}
          isReplying={isContactReplying}
          onSendMessage={handleSendReply}
        />
      )}

      {/* 10. 顶部轻提示 Toast */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-stone-900/90 text-white text-[11px] font-medium shadow-lg backdrop-blur-xs flex items-center gap-1.5 animate-fadeIn">
          <Sparkles className="w-3 h-3 text-rose-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
