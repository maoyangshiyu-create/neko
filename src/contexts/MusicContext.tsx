import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { SongItem } from '../services/neteaseService';
import { Contact } from '../types/phone';
import { TogetherMessage } from '../types/togetherMusic';

interface MusicContextType {
  // Playback state
  currentSong: SongItem | null;
  setCurrentSong: (song: SongItem | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playMode: 'loop' | 'single' | 'random';
  setPlayMode: (mode: 'loop' | 'single' | 'random') => void;
  playlist: SongItem[];
  setPlaylist: (list: SongItem[]) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  audioError: string;
  setAudioError: (error: string) => void;
  
  // Actions
  playSong: (song: SongItem, newPlaylist?: SongItem[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekTo: (time: number) => void;
  
  // Together Listening
  togetherContact: Contact | null;
  setTogetherContact: (contact: Contact | null) => void;
  togetherMessages: TogetherMessage[];
  setTogetherMessages: React.Dispatch<React.SetStateAction<TogetherMessage[]>>;
  
  // Floating UI
  isFloating: boolean;
  setIsFloating: (floating: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

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
  }
];

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<SongItem | null>(() => {
    try {
      const saved = localStorage.getItem('wephone_netease_current_song');
      return saved ? JSON.parse(saved) : DEFAULT_PRESET_SONGS[0];
    } catch {
      return DEFAULT_PRESET_SONGS[0];
    }
  });

  const [playlist, setPlaylistState] = useState<SongItem[]>(() => {
    try {
      const saved = localStorage.getItem('wephone_netease_playlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PRESET_SONGS;
  });

  const [playMode, setPlayModeState] = useState<'loop' | 'single' | 'random'>(() => {
    try {
      const saved = localStorage.getItem('wephone_netease_play_mode');
      if (saved === 'single' || saved === 'random' || saved === 'loop') return saved;
    } catch {}
    return 'loop';
  });

  const setPlaylist = (list: SongItem[]) => {
    setPlaylistState(list);
    try {
      localStorage.setItem('wephone_netease_playlist', JSON.stringify(list));
    } catch {}
  };

  const setPlayMode = (mode: 'loop' | 'single' | 'random') => {
    setPlayModeState(mode);
    try {
      localStorage.setItem('wephone_netease_play_mode', mode);
    } catch {}
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [isFloating, setIsFloating] = useState(false);

  const [togetherContact, setTogetherContact] = useState<Contact | null>(() => {
    try {
      const saved = localStorage.getItem('together_listening_contact');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [togetherMessages, setTogetherMessages] = useState<TogetherMessage[]>(() => {
    try {
      const saved = localStorage.getItem('together_listening_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Latest refs to prevent stale closure in audio event handlers
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;
  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;
  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const playSong = (song: SongItem, newPlaylist?: SongItem[]) => {
    if (newPlaylist && Array.isArray(newPlaylist) && newPlaylist.length > 0) {
      const exists = newPlaylist.some(s => s.id === song.id);
      const updated = exists ? newPlaylist : [song, ...newPlaylist];
      setPlaylist(updated);
    } else {
      setPlaylistState(prev => {
        if (prev.some(s => s.id === song.id)) return prev;
        const updated = [song, ...prev];
        try {
          localStorage.setItem('wephone_netease_playlist', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
    setCurrentSong(song);
    setIsPlaying(true);
    setAudioError('');
  };

  const pauseSong = () => setIsPlaying(false);
  const resumeSong = () => setIsPlaying(true);

  const nextSong = () => {
    const list = playlistRef.current;
    const curr = currentSongRef.current;
    const mode = playModeRef.current;
    const audio = audioRef.current;

    if (list.length === 0) return;

    if (mode === 'random' && list.length > 1) {
      const currentIndex = list.findIndex(s => s.id === curr?.id);
      let nextIndex = Math.floor(Math.random() * (list.length - 1));
      if (currentIndex !== -1 && nextIndex >= currentIndex) {
        nextIndex += 1;
      }
      setCurrentSong(list[nextIndex] || list[0]);
      setIsPlaying(true);
      return;
    }

    const currentIndex = list.findIndex(s => s.id === curr?.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % list.length;
    const nextItem = list[nextIndex];
    if (nextItem) {
      if (curr?.id === nextItem.id) {
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        setCurrentTime(0);
        setIsPlaying(true);
      } else {
        setCurrentSong(nextItem);
        setIsPlaying(true);
      }
    }
  };

  const prevSong = () => {
    const list = playlistRef.current;
    const curr = currentSongRef.current;
    const mode = playModeRef.current;
    const audio = audioRef.current;

    if (list.length === 0) return;

    if (mode === 'random' && list.length > 1) {
      const currentIndex = list.findIndex(s => s.id === curr?.id);
      let prevIndex = Math.floor(Math.random() * (list.length - 1));
      if (currentIndex !== -1 && prevIndex >= currentIndex) {
        prevIndex += 1;
      }
      setCurrentSong(list[prevIndex] || list[0]);
      setIsPlaying(true);
      return;
    }

    const currentIndex = list.findIndex(s => s.id === curr?.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    const prevItem = list[prevIndex];
    if (prevItem) {
      if (curr?.id === prevItem.id) {
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        setCurrentTime(0);
        setIsPlaying(true);
      } else {
        setCurrentSong(prevItem);
        setIsPlaying(true);
      }
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Setup HTML5 Audio lifecycle and listeners
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleError = () => setAudioError('播放失败，可能需要登录或VIP权限');

    const handleEnded = () => {
      const mode = playModeRef.current;
      const list = playlistRef.current;
      const curr = currentSongRef.current;

      // 1. 单曲循环模式
      if (mode === 'single') {
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error('Single loop audio replay error:', err);
          setIsPlaying(false);
        });
        setCurrentTime(0);
        setIsPlaying(true);
        return;
      }

      if (list.length === 0) {
        setIsPlaying(false);
        return;
      }

      // 2. 随机播放模式
      if (mode === 'random') {
        if (list.length === 1) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          setCurrentTime(0);
          setIsPlaying(true);
          return;
        }
        const currentIndex = list.findIndex(s => s.id === curr?.id);
        let nextIndex = Math.floor(Math.random() * (list.length - 1));
        if (currentIndex !== -1 && nextIndex >= currentIndex) {
          nextIndex += 1;
        }
        const targetSong = list[nextIndex] || list[0];
        setCurrentSong(targetSong);
        setIsPlaying(true);
        return;
      }

      // 3. 列表循环 / 顺序播放模式
      const currentIndex = list.findIndex(s => s.id === curr?.id);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % list.length;
      const targetSong = list[nextIndex];
      if (targetSong) {
        if (curr?.id === targetSong.id) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          setCurrentTime(0);
          setIsPlaying(true);
        } else {
          setCurrentSong(targetSong);
          setIsPlaying(true);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audio = audioRef.current;
      const url = `https://music.163.com/song/media/outer/url?id=${currentSong.id}.mp3`;
      if (audio.src !== url) {
        audio.src = url;
        if (isPlaying) {
          audio.play().catch(err => {
            console.error('Audio play error:', err);
            setIsPlaying(false);
          });
        }
      }
      try {
        localStorage.setItem('wephone_netease_current_song', JSON.stringify(currentSong));
      } catch {}
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    try {
      if (togetherContact) {
        localStorage.setItem('together_listening_contact', JSON.stringify(togetherContact));
      } else {
        localStorage.removeItem('together_listening_contact');
      }
    } catch {}
  }, [togetherContact]);

  useEffect(() => {
    try {
      localStorage.setItem('together_listening_messages', JSON.stringify(togetherMessages.slice(-50)));
    } catch {}
  }, [togetherMessages]);

  return (
    <MusicContext.Provider value={{
      currentSong, setCurrentSong, isPlaying, setIsPlaying, playMode, setPlayMode, playlist, setPlaylist, 
      currentTime, setCurrentTime, duration, setDuration, isMuted, setIsMuted, audioError, setAudioError,
      playSong, pauseSong, resumeSong, nextSong, prevSong, seekTo,
      togetherContact, setTogetherContact, togetherMessages, setTogetherMessages,
      isFloating, setIsFloating
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};
