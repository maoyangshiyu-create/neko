import React, { useState, useEffect, useRef } from 'react';
import { 
  ActiveApp, 
  Contact, 
  ChatMessage, 
  WorldBookItem, 
  PhoneSettings, 
  MomentPost,
  TakeawayOrder,
  UserPersona,
  FavoriteItem,
  StickerItem,
  ContactMemory
} from './types/phone';
import { 
  DEFAULT_SETTINGS, 
  DEFAULT_CONTACTS, 
  DEFAULT_MESSAGES, 
  DEFAULT_WORLDBOOKS, 
  DEFAULT_MOMENTS,
  DEFAULT_MASKS
} from './data/defaultData';
import { IPhoneFrame } from './components/phone/IPhoneFrame';
import { DesktopView } from './components/phone/DesktopView';
import { WeChatApp } from './components/phone/wechat/WeChatApp';
import { SettingsApp } from './components/phone/settings/SettingsApp';
import { WorldBookApp } from './components/phone/worldbook/WorldBookApp';
import { CharacterCardApp } from './components/phone/characters/CharacterCardApp';
import { MarriageCertificateApp } from './components/phone/MarriageCertificateApp';
import { SukiBabyApp } from './components/phone/suki/SukiBabyApp';
import { PomodoroApp } from './components/phone/pomodoro/PomodoroApp';
import { PhoneCallApp, NovelApp } from './components/phone/dock/DockApps';
import { MasksApp } from './components/phone/masks/MasksApp';
import { TwitterApp } from './components/phone/twitter/TwitterApp';
import { DIYWorkshop } from './components/phone/DIYWorkshop';
import { CloudMusicApp } from './components/phone/music/CloudMusicApp';
import { FloatingMusicBall } from './components/phone/music/FloatingMusicBall';
import { LuckinApp } from './components/phone/luckin/LuckinApp';
import { BilibiliApp } from './components/phone/bilibili/BilibiliApp';
import { HomesteadApp } from './components/phone/homestead/HomesteadApp';
import { TheaterApp } from './components/phone/theater/TheaterApp';
import { TakeawayModal } from './components/phone/takeaway/TakeawayModal';
import { applyTheme, getInitialTheme } from './utils/theme';
import { downloadStandaloneHtmlFile } from './components/phone/standaloneExport';
import { 
  Download, 
  RotateCcw, 
  Smartphone, 
  Maximize2, 
  Check, 
  Sparkles,
  Info,
  Share2
} from 'lucide-react';

import { generateMomentComment } from './services/aiService';
import { generateTakeawayLocalFallback } from './utils/takeawayHelper';
import { useProactiveMessages } from './hooks/useProactiveMessages';
import { MessagePopupBanner } from './components/phone/wechat/MessagePopupBanner';
import { fetchWeatherForCity } from './utils/weatherService';
import { useMusic } from './contexts/MusicContext';
import { saveItem, loadItem, clearStorage } from './utils/storage';
import { saveThemeAssets, loadThemeAssets, deleteThemeAssets, getAllThemeAssets } from './utils/themeAssetsDB';
import GlobalLoader from './components/GlobalLoader';
import ActivationGate from './components/ActivationGate';
import { verifyGateCode } from './utils/gateCode';
import { UpdateNoticeModal } from './components/UpdateNoticeModal';
import { ShareModal } from './components/ShareModal';
import { CURRENT_VERSION } from './data/versionLog';

const DEFAULT_STICKERS: StickerItem[] = [];

const STORAGE_KEYS = {
  SETTINGS: 'wephone_settings_v1',
  CONTACTS: 'wephone_contacts_v1',
  MESSAGES: 'wephone_messages_v1',
  WORLDBOOKS: 'wephone_worldbooks_v1',
  MOMENTS: 'wephone_moments_v1',
  TAKEAWAY: 'wephone_takeaway_order_v1',
  MASKS: 'wephone_masks_v1',
  FAVORITES: 'wephone_favorites_v1',
  STICKERS: 'wephone_stickers_v1',
  MEMORIES: 'wephone_contact_memories_v1'
};

export default function App() {
  const { isFloating, setIsFloating, currentSong, isPlaying } = useMusic();

  // 1. Settings state (persisted)
  const [settings, setSettings] = useState<PhoneSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const initialTheme = getInitialTheme();
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ttsVoiceId === 'female-sweet' || parsed.ttsVoiceId === 'female-shaonv') {
          parsed.ttsVoiceId = '';
        }
        return { ...DEFAULT_SETTINGS, themeStyle: initialTheme, ...parsed };
      }
      return { ...DEFAULT_SETTINGS, themeStyle: initialTheme };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 2. Contacts state (persisted)
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Sanitize legacy invalid/default voice IDs to empty string so user configures real custom voice IDs
          parsed.forEach((c: any) => {
            if (c && (c.voiceTimbre === 'female-sweet' || c.voiceTimbre === 'female-shaonv')) {
              c.voiceTimbre = '';
            }
          });

          const cleanContacts = parsed.filter((c: Contact) => c && c.id !== 'assistant' && c.remark !== '开发工具' && !c.isAssistant);
          return cleanContacts;
        }
      }
      return DEFAULT_CONTACTS;
    } catch {
      return DEFAULT_CONTACTS;
    }
  });

  // 3. Messages state (persisted)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          delete parsed['assistant'];
          return parsed;
        }
      }
      return DEFAULT_MESSAGES;
    } catch {
      return DEFAULT_MESSAGES;
    }
  });

  // 4. World Books state (persisted)
  const [worldBooks, setWorldBooks] = useState<WorldBookItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORLDBOOKS);
      return saved ? JSON.parse(saved) : DEFAULT_WORLDBOOKS;
    } catch {
      return DEFAULT_WORLDBOOKS;
    }
  });

  // 5. Moments state (persisted)
  const [moments, setMoments] = useState<MomentPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const isOldDefault = parsed.length > 0 && parsed.every((m: MomentPost) => ['mom_1', 'mom_2'].includes(m.id));
          if (isOldDefault) {
            return DEFAULT_MOMENTS; // Clear old default moments
          }
          console.log('[Moments] 已恢复朋友圈动态，共', parsed.length, '条');
          return parsed;
        }
      }
    } catch (e) {
      console.error('[Moments] 读取朋友圈动态失败:', e);
    }
    return DEFAULT_MOMENTS;
  });

  // 6. Takeaway Order state (persisted)
  const [takeawayOrder, setTakeawayOrder] = useState<TakeawayOrder | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAKEAWAY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 7. User Masks/Personas state (persisted)
  const [masks, setMasks] = useState<UserPersona[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MASKS);
      return saved ? JSON.parse(saved) : DEFAULT_MASKS;
    } catch {
      return DEFAULT_MASKS;
    }
  });

  // 8. Favorites state (persisted)
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 9. Stickers state (persisted)
  const [stickers, setStickers] = useState<StickerItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STICKERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // 过滤掉所有预设表情（通过 url 或名称判断）
          const filtered = parsed.filter((s: StickerItem) => {
            const isPreset = 
              s.url?.includes('unsplash.com') ||
              ['点赞', '猫咪疑惑', '柴犬笑', '开心', '哭泣', '委屈', '吃瓜', '晕厥'].includes(s.name);
            return !isPreset;
          });
          // 如果过滤后数量变化，更新存储
          if (filtered.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(filtered));
          }
          return filtered;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // 10. Contact Memories state (persisted)
  const [contactMemories, setContactMemories] = useState<Record<string, ContactMemory>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      const parsed: Record<string, ContactMemory> = (saved && JSON.parse(saved)) || {};
      
      // 自动修复：如果已结为夫妻或包含婚礼事实，但日记曾被错误记录为泛泛的“线下相聚很愉快”，自动修复为正式婚礼仪式日记
      let hasChanges = false;
      const contactsSaved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      const contactsParsed = contactsSaved ? JSON.parse(contactsSaved) : [];
      const contactsList: Contact[] = Array.isArray(contactsParsed) ? contactsParsed : [];
      const settingsSaved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const userNick = settingsSaved ? (JSON.parse(settingsSaved).userNickname || '玩家') : '玩家';

      if (parsed && typeof parsed === 'object') {
        for (const [cId, mem] of Object.entries(parsed)) {
          if (!mem) continue;
          const contactObj = contactsList.find(c => c && c.id === cId);
          const isMarried = contactObj?.relationship === 'married' || 
            (Array.isArray(mem.facts) && mem.facts.some(f => f && f.fact && (f.fact.includes('结为夫妻') || f.fact.includes('婚礼') || f.fact.includes('结婚'))));
          
          if (isMarried && mem.diaries && Array.isArray(mem.diaries) && mem.diaries.length > 0) {
            const latest = mem.diaries[0];
            if (latest && latest.content && !latest.content.includes('婚') && !latest.content.includes('夫妻') && (latest.content.includes('线下相聚') || latest.content.includes('线下场景') || latest.content.includes('度过了愉快'))) {
              latest.content = `[${new Date(latest.timestamp).toLocaleDateString('zh-CN')}] 今天，我和${userNick}举办了正式庄重的婚礼仪式。在那神圣而浪漫的时刻，我们彼此交换了誓言，正式结为夫妻。这一刻的感动与幸福，将永远铭刻在我的心里。`;
              hasChanges = true;
            }
          }
        }
      }

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return {};
    }
  });

  const [isTakeawayModalOpen, setIsTakeawayModalOpen] = useState(false);

  // Gate State
  const [isGatePassed, setIsGatePassed] = useState<boolean>(false);
  const [isGateChecking, setIsGateChecking] = useState<boolean>(true);

  // Version Update Notice Modal state
  const [isUpdateNoticeOpen, setIsUpdateNoticeOpen] = useState<boolean>(() => {
    try {
      const lastSeen = localStorage.getItem('wephone_last_seen_version');
      return lastSeen !== CURRENT_VERSION;
    } catch {
      return false;
    }
  });

  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkGate = async () => {
      const storedCode = localStorage.getItem('wephone_gate_code');
      if (storedCode) {
        const res = await verifyGateCode(storedCode);
        if (res.valid) {
          setIsGatePassed(true);
        } else {
          localStorage.removeItem('wephone_gate_code');
        }
      }
      setIsGateChecking(false);
    };
    checkGate();
  }, []);

  // Global loader state
  const [showLoader, setShowLoader] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Active App on Phone screen
  const [activeApp, setActiveApp] = useState<ActiveApp>('desktop');
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  
  // Refs to track latest state for async callbacks (like AI replies)
  const activeAppRef = useRef<ActiveApp>('desktop');
  const activeChatContactIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeAppRef.current = activeApp;
  }, [activeApp]);

  useEffect(() => {
    activeChatContactIdRef.current = activeChatContactId;
  }, [activeChatContactId]);
  const [activeMessagePopup, setActiveMessagePopup] = useState<{ contactId: string; contactName: string; contactAvatar: string; content: string; } | null>(null);
  const [selectedPopupContactId, setSelectedPopupContactId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHeaderResetConfirm, setShowHeaderResetConfirm] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Initialize and apply theme on change
  useEffect(() => {
    applyTheme(settings.themeStyle || 'morandi');

    // Apply active DIY theme CSS variables if enabled
    if (settings.activeDIYThemeId && settings.diyThemes) {
      const activeTheme = settings.diyThemes.find(t => t.id === settings.activeDIYThemeId);
      if (activeTheme && activeTheme.css) {
        const targets = [document.documentElement, document.body];
        targets.forEach(target => {
          Object.entries(activeTheme.css).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim()) {
              target.style.setProperty(key, value);
            }
          });
        });
      }
    } else {
      // Clear inline styles if no DIY theme is active
      const targets = [document.documentElement, document.body];
      targets.forEach(target => {
        for (let i = 0; i < target.style.length; i++) {
          const key = target.style[i];
          if (key.startsWith('--gg-')) {
            target.style.removeProperty(key);
            i--; // Adjust index after removal
          }
        }
      });
    }
  }, [settings.themeStyle, settings.activeDIYThemeId, settings.diyThemes]);

  // Apply custom font family and URL globally (supporting both remote CSS & uploaded font data)
  useEffect(() => {
    if (settings.customFontFamily) {
      document.body.style.fontFamily = `"${settings.customFontFamily}", sans-serif`;
    } else {
      document.body.style.fontFamily = '';
    }
    
    if (settings.customFontUrl) {
      let styleEl = document.getElementById('custom-global-font-style');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-global-font-style';
        document.head.appendChild(styleEl);
      }
      const fontName = settings.customFontFamily || 'CustomGlobalFont';
      const isCssUrl = settings.customFontUrl.includes('.css') || settings.customFontUrl.includes('fonts.googleapis.com');
      
      if (isCssUrl) {
        styleEl.innerHTML = `
          @import url('${settings.customFontUrl}');
          body, *, .morandi-locked, button, input, textarea, select {
            font-family: "${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
          }
        `;
      } else {
        const formatStr = settings.customFontUrl.includes('.ttf') ? ' format("truetype")' : settings.customFontUrl.includes('.woff2') ? ' format("woff2")' : settings.customFontUrl.includes('.woff') ? ' format("woff")' : '';
        styleEl.innerHTML = `
          @font-face {
            font-family: "${fontName}";
            src: url("${settings.customFontUrl}")${formatStr};
            font-display: swap;
          }
          body, *, .morandi-locked, button, input, textarea, select {
            font-family: "${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
          }
        `;
      }
    } else if (settings.customFontFamily) {
      let styleEl = document.getElementById('custom-global-font-style');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-global-font-style';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        body, *, .morandi-locked, button, input, textarea, select {
          font-family: "${settings.customFontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
        }
      `;
    } else {
      const styleEl = document.getElementById('custom-global-font-style');
      if (styleEl) styleEl.remove();
    }
  }, [settings.customFontFamily, settings.customFontUrl]);

  const settingsLoadedRef = useRef(false);

  // Initial hydration from IndexedDB for persistent large data (DIY Themes assets from wephone_themes_db, etc.)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const idbSettings = await loadItem<PhoneSettings | null>(STORAGE_KEYS.SETTINGS, null);
        const allAssets = await getAllThemeAssets().catch(() => ({}));

        if (active && idbSettings) {
          setSettings(prev => {
            const rawThemes = (idbSettings.diyThemes && Array.isArray(idbSettings.diyThemes)) ? idbSettings.diyThemes : (prev.diyThemes || []);
            const hydratedThemes = rawThemes.map(theme => {
              const dbAssets = allAssets[theme.id] || {};
              const resolvedAssets: Record<string, string> = {};
              const themeAssets = theme.assets || {};

              // Resolve asset:// references from dbAssets, or keep if already base64
              Object.keys(themeAssets).forEach(k => {
                const val = themeAssets[k];
                if (typeof val === 'string' && val.startsWith('asset://')) {
                  const assetKey = val.replace('asset://', '');
                  resolvedAssets[k] = dbAssets[assetKey] || dbAssets[k] || '';
                } else if (val) {
                  resolvedAssets[k] = val;
                }
              });

              Object.keys(dbAssets).forEach(k => {
                if (!resolvedAssets[k]) {
                  resolvedAssets[k] = dbAssets[k];
                }
              });

              return { ...theme, assets: resolvedAssets };
            });

            const finalActiveId = idbSettings.activeDIYThemeId !== undefined ? idbSettings.activeDIYThemeId : prev.activeDIYThemeId;
            const finalWallpaper = idbSettings.wallpaperUrl || prev.wallpaperUrl;

            return {
              ...prev,
              ...idbSettings,
              diyThemes: hydratedThemes,
              activeDIYThemeId: finalActiveId,
              wallpaperUrl: finalWallpaper
            };
          });
        }
        settingsLoadedRef.current = true;
      } catch (err) {
        console.warn('[Storage] Hydrating settings from IndexedDB failed:', err);
        settingsLoadedRef.current = true;
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Sync to dual storage: raw Base64 assets to wephone_themes_db; settings (with asset:// references) to storage
  useEffect(() => {
    if (settings.diyThemes && Array.isArray(settings.diyThemes)) {
      const storageThemes = settings.diyThemes.map(theme => {
        if (!theme.id) return theme;
        const rawAssets: Record<string, string> = {};
        const compactAssets: Record<string, string> = {};
        const currentAssets = theme.assets || {};

        Object.keys(currentAssets).forEach(k => {
          const val = currentAssets[k];
          if (val && typeof val === 'string') {
            if (val.startsWith('asset://')) {
              compactAssets[k] = val;
            } else if (val.startsWith('data:') || val.length > 50) {
              rawAssets[k] = val;
              compactAssets[k] = `asset://${k}`;
            } else {
              compactAssets[k] = val;
            }
          }
        });

        if (Object.keys(rawAssets).length > 0) {
          saveThemeAssets(theme.id, rawAssets).catch(err => console.warn('[ThemeAssetsDB] Save failed:', err));
        }

        return {
          ...theme,
          assets: compactAssets
        };
      });

      const settingsForStorage = {
        ...settings,
        diyThemes: storageThemes
      };
      saveItem(STORAGE_KEYS.SETTINGS, settingsForStorage);
    }
  }, [settings]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.CONTACTS, contacts);
  }, [contacts]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.MESSAGES, messages);
  }, [messages]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.WORLDBOOKS, worldBooks);
  }, [worldBooks]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.MOMENTS, moments);
  }, [moments]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.TAKEAWAY, takeawayOrder);
  }, [takeawayOrder]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.MASKS, masks);
  }, [masks]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.FAVORITES, favorites);
  }, [favorites]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.STICKERS, stickers);
  }, [stickers]);

  useEffect(() => {
    saveItem(STORAGE_KEYS.MEMORIES, contactMemories);
  }, [contactMemories]);

  const handleUpdateContactMemory = (contactId: string, memory: ContactMemory) => {
    setContactMemories(prev => ({
      ...prev,
      [contactId]: memory
    }));
  };

  // Handle live delivery timer and trigger AI arrival WeChat message
  useEffect(() => {
    if (!takeawayOrder || takeawayOrder.status === 'arrived' || takeawayOrder.hasNotifiedArrival) {
      return;
    }

    const timer = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - takeawayOrder.orderTime) / 1000);
      if (elapsed >= takeawayOrder.durationSeconds) {
        // Immediately mark order as arrived to prevent duplicate processing
        setTakeawayOrder(prev => prev ? { ...prev, status: 'arrived', hasNotifiedArrival: true } : null);

        const targetContactId = takeawayOrder.aiContactId;
        const targetContact = contacts.find(c => c.id === targetContactId) || contacts[0];
        const contactName = targetContact ? (targetContact.remark || targetContact.name) : (takeawayOrder.aiContactName || '好友');
        const contactPersona = targetContact?.persona || '';
        const foodName = takeawayOrder.foodName || '美食';
        const storeName = takeawayOrder.storeName || '外卖店';
        const customNote = takeawayOrder.customNote || '';

        // Generate persona-tailored thank-you message via Gemini API
        let arrivalMessage = '';
        try {
          const res = await fetch('/api/takeaway/generate-thank-you', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactName,
              contactPersona,
              foodName,
              storeName,
              customNote
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data?.message && typeof data.message === 'string' && data.message.trim().length > 0) {
              arrivalMessage = data.message.trim();
            }
          }
        } catch (err) {
          console.warn('Failed to fetch AI thank-you from API, using local persona fallback:', err);
        }

        // Fallback to persona-keyword-based local diverse template if API fails or is unavailable
        if (!arrivalMessage) {
          arrivalMessage = generateTakeawayLocalFallback(contactName, contactPersona, foodName, storeName);
        }

        // 1. Deliver WeChat message
        const newMsg: ChatMessage = {
          id: `msg_${Date.now()}_takeaway`,
          sender: 'ai',
          content: arrivalMessage,
          timestamp: Date.now(),
          type: 'text'
        };

        setMessages(prev => {
          const list = prev[targetContactId] 
            ? [...prev[targetContactId], newMsg] 
            : [newMsg];
          return { ...prev, [targetContactId]: list };
        });

        // 2. Increment unread count for contact
        setContacts(prev =>
          prev.map(c =>
            c.id === targetContactId
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessageTime: Date.now() }
              : c
          )
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [takeawayOrder, contacts]);

  // Update Settings
  const handleUpdateSettings = (updates: Partial<PhoneSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const handleToggleFavorite = (msg: ChatMessage, senderName: string, senderAvatar: string) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === msg.id);
      if (exists) {
        return prev.filter(f => f.id !== msg.id);
      } else {
        const newItem: FavoriteItem = {
          id: msg.id || `fav_${Date.now()}`,
          type: msg.type || 'text',
          content: msg.content,
          senderName: senderName || '未知',
          senderAvatar: senderAvatar || '',
          timestamp: msg.timestamp || Date.now()
        };
        return [newItem, ...prev];
      }
    });
  };

  // Add / Send Message
  const triggerMessagePopup = (contactId: string, content: string) => {
    if (settings.enableMessagePopup === false) return;
    
    // Use the latest state via refs for async callbacks
    const isActive = activeAppRef.current === 'wechat' && activeChatContactIdRef.current === contactId;
    
    if (!isActive) {
      const contactObj = contacts.find(c => c.id === contactId);
      if (contactObj) {
        // Group messages or normal AI messages should all trigger popup if not in that specific chat
        setActiveMessagePopup({
          contactId,
          contactName: contactObj.remark || contactObj.name,
          contactAvatar: contactObj.avatar,
          content
        });
      }
    }
  };

  const handleSendMessage = (contactId: string, msg: Partial<ChatMessage>) => {
    const newMsg: ChatMessage = {
      id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: msg.sender || 'user',
      content: msg.content || '',
      timestamp: msg.timestamp || Date.now(),
      type: msg.type || 'text',
      imageUrl: msg.imageUrl,
      photoDesc: msg.photoDesc,
      transferAmount: msg.transferAmount,
      transferStatus: msg.transferStatus,
      transferTo: msg.transferTo,
      transferNote: msg.transferNote,
      innerVoice: msg.innerVoice,
      voiceDuration: msg.voiceDuration,
      isVoiceListened: msg.isVoiceListened,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar,
      senderId: msg.senderId,
      actionDesc: msg.actionDesc,
      sceneNote: msg.sceneNote
    };

    setMessages(prev => {
      const list = prev[contactId] ? [...prev[contactId], newMsg] : [newMsg];
      return { ...prev, [contactId]: list };
    });

    // Update contact last message time
    setContacts(prev =>
      prev.map(c => (c.id === contactId ? { ...c, lastMessageTime: Date.now() } : c))
    );

    if (newMsg.sender === 'ai') {
      triggerMessagePopup(contactId, newMsg.content);
    }
  };

  const handleDeleteMessage = (contactId: string, messageId: string) => {
    setMessages(prev => {
      if (!prev[contactId]) return prev;
      return {
        ...prev,
        [contactId]: prev[contactId].filter(m => m.id !== messageId)
      };
    });
  };

  const handleEditMessage = (contactId: string, messageId: string, newContent: string) => {
    setMessages(prev => {
      if (!prev[contactId]) return prev;
      return {
        ...prev,
        [contactId]: prev[contactId].map(m => m.id === messageId ? { ...m, content: newContent } : m)
      };
    });
  };

  const handleUpdateMessage = (contactId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => {
      if (!prev[contactId]) return prev;
      return {
        ...prev,
        [contactId]: prev[contactId].map(m => m.id === messageId ? { ...m, ...updates } : m)
      };
    });
  };

  const handleRecallMessage = (contactId: string, messageId: string) => {
    setMessages(prev => {
      if (!prev[contactId]) return prev;
      return {
        ...prev,
        [contactId]: prev[contactId].map(m => m.id === messageId ? { ...m, type: 'text', sender: 'system', content: '你撤回了一条消息' } : m)
      };
    });
  };

  // Add New Contact
  const handleAddContact = (contact: Partial<Contact>, initialMessages?: ChatMessage[]) => {
    const isGrp = Boolean(contact.isGroup || contact.group === '群聊' || contact.id?.startsWith('group_'));
    const newContactId = contact.id || (isGrp ? `group_${Date.now()}` : `contact_${Date.now()}`);
    const newContact: Contact = {
      id: newContactId,
      name: contact.name || (isGrp ? '新群聊' : '新好友'),
      remark: contact.remark,
      avatar: contact.avatar || '',
      group: contact.group || (isGrp ? '群聊' : '好友'),
      persona: contact.persona || (isGrp ? '这是一个由多位好友组成的群聊。' : '你是一名热情好客的微信好友。'),
      worldBookIds: contact.worldBookIds || ['wb_common'],
      replySpeed: contact.replySpeed ?? 30,
      replyStyle: contact.replyStyle || 'balanced',
      shortTermMemory: contact.shortTermMemory ?? 10,
      longTermMemory: contact.longTermMemory ?? 50,
      voiceTimbre: contact.voiceTimbre || '',
      enableInnerVoice: contact.enableInnerVoice ?? true,
      isOfflineMode: false,
      unreadCount: initialMessages && initialMessages.length > 0 ? initialMessages.length : 0,
      lastMessageTime: Date.now(),
      isGroup: isGrp,
      groupMemberIds: contact.groupMemberIds,
      groupNotice: contact.groupNotice,
      backgroundUrl: contact.backgroundUrl,
      affection: contact.affection ?? 10,
      relationship: contact.relationship || 'friend'
    };
    setContacts(prev => [newContact, ...prev]);

    if (initialMessages && initialMessages.length > 0) {
      setMessages(prev => ({
        ...prev,
        [newContactId]: initialMessages
      }));
    }
  };

  // Update Contact
  const handleUpdateContact = (contactId: string, updates: Partial<Contact>) => {
    setContacts(prev =>
      prev.map(c => (c.id === contactId ? { ...c, ...updates } : c))
    );
  };

  // Delete Contact
  const handleDeleteContact = (contactId: string) => {
    const contactToDelete = contacts.find(c => c.id === contactId);
    const namesToMatch = new Set([
      contactId,
      contactToDelete?.name,
      contactToDelete?.remark
    ].filter(Boolean) as string[]);

    setContacts(prev => prev.filter(c => c.id !== contactId));
    setMessages(prev => {
      const next = { ...prev };
      delete next[contactId];
      return next;
    });
    // 同步清除被删除好友的婚书记录 (根据 partnerId 及 名字 全面清除)
    setSettings(prev => ({
      ...prev,
      marriages: (prev.marriages || []).filter(m => 
        m.partnerId !== contactId && 
        !namesToMatch.has(m.partnerId) &&
        !namesToMatch.has(m.partnerName)
      )
    }));
  };

  // 保持婚书与现有联系人列表严格同步：若存在历史孤立婚书（无对应联系人），自动进行清理
  useEffect(() => {
    if (settings.marriages && settings.marriages.length > 0) {
      const validMarriages = settings.marriages.filter(m => 
        contacts.some(c => c.id === m.partnerId || c.name === m.partnerName || (c.remark && c.remark === m.partnerName))
      );
      if (validMarriages.length !== settings.marriages.length) {
        setSettings(prev => ({ ...prev, marriages: validMarriages }));
      }
    }
  }, [contacts]);

  // Weather auto-refresh effect (every 30 minutes)
  useEffect(() => {
    if (!settings.enableWeatherAwareness) return;

    const checkAndRefreshWeather = async () => {
      const now = Date.now();
      const cache = settings.weatherCache;
      const thirtyMinutes = 30 * 60 * 1000;

      if (!cache || (now - cache.updatedAt > thirtyMinutes)) {
        const city = settings.userCity || '杭州';
        try {
          const data = await fetchWeatherForCity(city);
          setSettings(prev => ({
            ...prev,
            weatherCache: {
              data,
              updatedAt: now
            }
          }));
        } catch (err) {
          console.warn('Auto weather refresh failed:', err);
        }
      }
    };

    checkAndRefreshWeather();
    const interval = setInterval(checkAndRefreshWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.enableWeatherAwareness, settings.userCity]);

  // Synchronize state to refs for asynchronous closures
  const contactsRef = useRef(contacts);
  const momentsRef = useRef(moments);
  const settingsRef = useRef(settings);
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);
  useEffect(() => { momentsRef.current = moments; }, [moments]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useProactiveMessages(
    contacts,
    messages,
    settings,
    activeApp,
    activeChatContactId,
    (contactId, msg) => {
      setMessages(prev => {
        const contactMsgs = prev[contactId] || [];
        return { ...prev, [contactId]: [...contactMsgs, msg] };
      });
      setContacts(prev => prev.map(c => {
        if (c.id === contactId) {
          const isActive = activeApp === 'wechat' && activeChatContactId === contactId;
          return {
            ...c,
            unreadCount: isActive ? c.unreadCount : (c.unreadCount || 0) + 1,
            lastMessageTime: msg.timestamp
          };
        }
        return c;
      }));
      triggerMessagePopup(contactId, msg.content);
    }
  );

  // Add Moment (and simulate AI friends liking & commenting if authored by user)
  const handleAddMoment = (post: Partial<MomentPost>) => {
    const newPost: MomentPost = {
      id: `mom_${Date.now()}`,
      authorId: post.authorId || 'user',
      authorName: post.authorName || settings.userNickname,
      authorAvatar: post.authorAvatar || settings.userAvatar,
      timestamp: Date.now(),
      content: post.content || '',
      images: post.images,
      likes: post.likes || [],
      comments: post.comments || []
    };
    setMoments(prev => [newPost, ...prev]);

    // If posted by user, simulate 1-2 AI friends liking and 1 AI friend commenting on the post content
    if (newPost.authorId === 'user') {
      console.log('[朋友圈] 用户成功发布新动态:', newPost.content, '配图数:', newPost.images?.length || 0);

      setTimeout(async () => {
        try {
          const currentContacts = contactsRef.current || contacts;
          const currentSettings = settingsRef.current || settings;

          const aiContacts = currentContacts.filter(c => !c.isGroup && c.group !== '群聊' && !c.id.startsWith('group_'));
          console.log('[朋友圈] 检索到可用 AI 好友数量:', aiContacts.length, '好友列表:', aiContacts.map(c => c.remark || c.name));
          if (aiContacts.length === 0) {
            console.warn('[朋友圈] 未找到可用 AI 好友，跳过自动互动');
            return;
          }

          // Shuffle AI contacts
          const shuffled = [...aiContacts].sort(() => 0.5 - Math.random());
          // 1-2 AI contacts like the post
          const likersCount = Math.min(shuffled.length, Math.floor(Math.random() * 2) + 1);
          const chosenLikers = shuffled.slice(0, likersCount);
          const likerNames = chosenLikers.map(c => c.remark || c.name);

          // 1 AI contact comments based on post content
          const commenter = shuffled[0];
          const commenterName = commenter.remark || commenter.name;
          const hasImages = (newPost.images && newPost.images.length > 0) || false;

          console.log('[朋友圈] 选定点赞 AI 好友:', likerNames, '| 选定评论 AI 好友:', commenterName);

          let generatedComment = '';
          try {
            generatedComment = await generateMomentComment(
              commenter,
              newPost.content,
              hasImages,
              undefined,
              currentSettings
            );
            console.log('[朋友圈] AI 生成评论成功:', generatedComment);
          } catch (aiErr) {
            console.warn('[朋友圈] AI 评论生成失败，仅保留点赞，不发布预设评论:', aiErr);
          }

          setMoments(currentMoments =>
            currentMoments.map(m => {
              if (m.id !== newPost.id) return m;
              const mergedLikes = Array.from(new Set([...m.likes, ...likerNames]));
              const updatedComments = generatedComment ? [
                ...m.comments,
                { id: `c_${Date.now()}`, authorName: commenterName, content: generatedComment }
              ] : m.comments;
              return {
                ...m,
                likes: mergedLikes,
                comments: updatedComments
              };
            })
          );
        } catch (error) {
          console.error('[朋友圈] 用户发圈后 AI 自动互动发生异常:', error);
        }
      }, 2500);
    }
  };

  // Like Moment
  const handleLikeMoment = (momentId: string, userName: string) => {
    setMoments(prev =>
      prev.map(m => {
        if (m.id !== momentId) return m;
        const exists = m.likes.includes(userName);
        const newLikes = exists ? m.likes.filter(n => n !== userName) : [...m.likes, userName];
        return { ...m, likes: newLikes };
      })
    );
  };

  // Comment Moment
  const handleCommentMoment = (
    momentId: string,
    comment: { authorName: string; content: string }
  ) => {
    // Add comment immediately to state
    setMoments(prev =>
      prev.map(m => {
        if (m.id !== momentId) return m;
        return {
          ...m,
          comments: [
            ...m.comments,
            { id: `c_${Date.now()}`, authorName: comment.authorName, content: comment.content }
          ]
        };
      })
    );

    // AI Replies to the comment based on context & target
    setTimeout(async () => {
      try {
        const currentContacts = contactsRef.current || contacts;
        const currentMoments = momentsRef.current || moments;
        const currentSettings = settingsRef.current || settings;

        const aiContacts = currentContacts.filter(c => !c.isGroup && c.group !== '群聊' && !c.id.startsWith('group_'));
        if (aiContacts.length === 0) return;

        // Find the target moment
        const targetMoment = currentMoments.find(m => m.id === momentId);
        if (!targetMoment) return;

        // Check if user is replying to someone specific (e.g. "回复 @林婉清: ...")
        const replyMatch = comment.content.match(/^回复\s*@?([^:：]+)[:：]/);
        const targetUserName = replyMatch ? replyMatch[1].trim() : null;

        let replierAI: Contact | undefined;

        if (targetUserName) {
          // Case 1: User replied to a specific AI's comment -> ONLY that AI responds
          replierAI = aiContacts.find(c => (c.remark || c.name) === targetUserName || c.name === targetUserName || c.id === targetUserName);
        } else {
          // Case 2: User commented on the post -> ONLY the post author (if AI) responds
          const isPostAuthorAI = targetMoment.authorId !== 'user' && targetMoment.authorName !== currentSettings.userNickname;
          if (isPostAuthorAI) {
            replierAI = aiContacts.find(c => c.id === targetMoment.authorId || (c.remark || c.name) === targetMoment.authorName || c.name === targetMoment.authorName);
          }
        }

        // If no matching AI is eligible to reply, stop
        if (!replierAI || replierAI.isGroup) return;
        const replierName = replierAI.remark || replierAI.name;

        // Don't reply to self
        if (replierName === comment.authorName) return;

        const hasImages = (targetMoment.images && targetMoment.images.length > 0) || false;
        console.log('[朋友圈] AI 准备回复评论，作者:', replierName, '目标原帖:', targetMoment.content, '评论内容:', comment.content);

        const generatedReply = await generateMomentComment(
          replierAI,
          targetMoment.content,
          hasImages,
          comment.content,
          currentSettings
        );

        console.log('[朋友圈] AI 生成回复成功:', generatedReply);

        setMoments(currentMoments =>
          currentMoments.map(m => {
            if (m.id !== momentId) return m;
            return {
              ...m,
              comments: [
                ...m.comments,
                { id: `c_${Date.now()}`, authorName: replierName, content: `回复 @${comment.authorName}: ${generatedReply}` }
              ]
            };
          })
        );
      } catch (error) {
        console.error('Error in AI moment comment reply:', error);
      }
    }, 2800);
  };

  // Add Mask
  const handleAddMask = (newMask: UserPersona) => {
    setMasks(prev => [...prev, newMask]);
  };

  // Update Mask
  const handleUpdateMask = (maskId: string, updates: Partial<UserPersona>) => {
    setMasks(prev => prev.map(m => m.id === maskId ? { ...m, ...updates } : m));
    
    // If the mask being updated is the active one, also sync with current settings (excluding avatar and signature)
    setMasks(currentMasks => {
      const updatedActive = currentMasks.find(m => m.id === maskId);
      if (updatedActive?.isActive) {
        setSettings(prev => ({
          ...prev,
          userNickname: updates.nickname !== undefined ? updates.nickname : prev.userNickname,
          userPersonaDescription: updates.personaDescription !== undefined ? updates.personaDescription : prev.userPersonaDescription
        }));
      }
      return currentMasks;
    });
  };

  // Delete Mask
  const handleDeleteMask = (maskId: string) => {
    setMasks(prev => prev.filter(m => m.id !== maskId));
  };

  // Activate Mask
  const handleActivateMask = (maskId: string) => {
    setMasks(prev => {
      const updated = prev.map(m => ({ ...m, isActive: m.id === maskId }));
      const targetMask = updated.find(m => m.id === maskId);
      if (targetMask) {
        setSettings(prevSettings => ({
          ...prevSettings,
          userNickname: targetMask.nickname,
          userPersonaDescription: targetMask.personaDescription
        }));
      }
      return updated;
    });
  };

  // Reset to Factory Default Data
  const handleResetData = () => {
    Object.values(STORAGE_KEYS).forEach(k => {
      localStorage.removeItem(k);
    });
    clearStorage();

    setSettings(DEFAULT_SETTINGS);
    setContacts(DEFAULT_CONTACTS);
    setMessages(DEFAULT_MESSAGES);
    setWorldBooks(DEFAULT_WORLDBOOKS);
    setMoments(DEFAULT_MOMENTS);
    setMasks(DEFAULT_MASKS);
    setActiveApp('desktop');
  };

  const activeDIYTheme = settings.activeDIYThemeId && settings.diyThemes
    ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
    : null;
  const effectiveHomeWallpaper =
    activeDIYTheme?.assets?.homeWallpaper ||
    activeDIYTheme?.assets?.wallpaper ||
    activeDIYTheme?.assets?.desktopWallpaper ||
    activeDIYTheme?.assets?.bgWallpaper ||
    activeDIYTheme?.assets?.wallpaperUrl ||
    settings.wallpaperUrl;

  if (isGateChecking || !isGatePassed) {
    return (
      <div className="min-h-screen w-full bg-[#0d1117] text-stone-200 flex flex-col items-center justify-center p-2 sm:p-4 selection:bg-emerald-500 selection:text-white">
        <GlobalLoader visible={showLoader || isGateChecking} />
        {!isGateChecking && !isGatePassed && (
          <ActivationGate onActivated={() => setIsGatePassed(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-stone-200 flex flex-col items-center justify-between p-2 sm:p-4 selection:bg-emerald-500 selection:text-white">
      <GlobalLoader visible={showLoader} />
      
      {/* Top Floating Control Bar */}
      <header className="w-full max-w-4xl py-2 px-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 mb-3 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#07c160] to-[#2bd97b] flex items-center justify-center shadow-xs">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>iPhone 桌面 × 微信 AI 聊天模拟器</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
                375×700
              </span>
            </h1>
            <p className="text-[11px] text-stone-400">
              纯前端本地存储 · 微信全功能 · 智能 AI 回复 · TTS 语音 · 朋友圈 · 世界书
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Share with Others Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d9828b] to-[#c7727b] hover:from-[#c7727b] hover:to-[#b5616a] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer border border-[#b5616a]/50"
            title="分享独立纯净网页给他人使用"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>分享给好友</span>
          </button>

          {/* Version Update Notice Button */}
          <button
            onClick={() => setIsUpdateNoticeOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d9828b]/20 to-[#c7727b]/20 hover:from-[#d9828b]/30 hover:to-[#c7727b]/30 text-[#fca5a5] border border-[#d9828b]/40 text-xs font-medium active:scale-95 transition-all cursor-pointer shadow-xs"
            title="查看系统版本与更新公告"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>更新公告</span>
            <span className="text-[10px] font-mono bg-rose-500/30 text-rose-200 px-1 py-0.2 rounded font-bold">
              {CURRENT_VERSION}
            </span>
          </button>

          {/* Reset Data */}
          <button
            onClick={() => setShowHeaderResetConfirm(true)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs cursor-pointer active:scale-90 transition-transform"
            title="恢复默认数据"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Interactive iPhone Area */}
      <main className="flex-1 w-full flex items-center justify-center py-1">
        <IPhoneFrame
          onHomeClick={() => {
            if (activeApp === 'music' && currentSong) {
              setIsFloating(true);
            }
            setActiveApp('desktop');
          }}
          wallpaperUrl={effectiveHomeWallpaper}
        >
          {/* 1. DESKTOP VIEW */}
          {activeApp === 'desktop' && (
            <DesktopView
              onOpenApp={(app) => setActiveApp(app)}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              contacts={contacts}
              messages={messages}
              takeawayOrder={takeawayOrder}
              onOpenTakeawayModal={() => setIsTakeawayModalOpen(true)}
            />
          )}

          {/* 2. WECHAT APP */}
          {activeApp === 'wechat' && (
            <WeChatApp
              onReturnToDesktop={() => {
                setActiveApp('desktop');
                setActiveChatContactId(null);
                setSelectedPopupContactId(null);
              }}
              onActiveContactChange={setActiveChatContactId}
              initialActiveContactId={selectedPopupContactId}
              contacts={contacts}
              messages={messages}
              worldBooks={worldBooks}
              settings={settings}
              moments={moments}
              onUpdateSettings={handleUpdateSettings}
              onSendMessage={handleSendMessage}
              onDeleteMessage={handleDeleteMessage}
              onEditMessage={handleEditMessage}
              onUpdateMessage={handleUpdateMessage}
              onRecallMessage={handleRecallMessage}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onAddMoment={handleAddMoment}
              onLikeMoment={handleLikeMoment}
              onCommentMoment={handleCommentMoment}
              onOpenSettingsApp={() => setActiveApp('settings')}
              favorites={favorites}
              stickers={stickers}
              onUpdateStickers={setStickers}
              onToggleFavorite={handleToggleFavorite}
              contactMemories={contactMemories}
              onUpdateContactMemory={handleUpdateContactMemory}
            />
          )}

          {/* 3. SETTINGS APP */}
          {activeApp === 'settings' && (
            <SettingsApp
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onReturnToDesktop={() => setActiveApp('desktop')}
              onResetData={handleResetData}
            />
          )}

          {/* 4. WORLDBOOK APP */}
          {activeApp === 'worldbook' && (
            <WorldBookApp
              worldBooks={worldBooks}
              onAddWorldBook={(wb) => setWorldBooks(prev => [wb, ...prev])}
              onUpdateWorldBook={(id, updates) =>
                setWorldBooks(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)))
              }
              onDeleteWorldBook={(id) => setWorldBooks(prev => prev.filter(w => w.id !== id))}
              onReturnToDesktop={() => setActiveApp('desktop')}
            />
          )}

          {/* 5. CHARACTERS APP */}
          {activeApp === 'characters' && (
            <CharacterCardApp
              contacts={contacts}
              worldBooks={worldBooks}
              onUpdateContact={handleUpdateContact}
              onSelectContactToChat={(contactId) => {
                setActiveApp('wechat');
              }}
              onReturnToDesktop={() => setActiveApp('desktop')}
            />
          )}

          {/* 6. DOCK APP: PHONE */}
          {activeApp === 'phone_call' && (
            <PhoneCallApp onReturnToDesktop={() => setActiveApp('desktop')} />
          )}

          {/* 7. DOCK APP: NOVEL */}
          {activeApp === 'novel' && (
            <NovelApp onReturnToDesktop={() => setActiveApp('desktop')} />
          )}

          {/* 8.5. MASKS APP */}
          {activeApp === 'masks' && (
            <MasksApp
              masks={masks}
              onAddMask={handleAddMask}
              onUpdateMask={handleUpdateMask}
              onDeleteMask={handleDeleteMask}
              onActivateMask={handleActivateMask}
              onReturnToDesktop={() => setActiveApp('desktop')}
            />
          )}

          {/* 9. MARRIAGE APP */}
          {activeApp === 'marriage' && (
            <MarriageCertificateApp
              settings={settings}
              onReturnToDesktop={() => setActiveApp('desktop')}
              contacts={contacts}
            />
          )}

          {/* 10. SUKI BABY APP */}
          {activeApp === 'suki_baby' && (
            <SukiBabyApp
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onReturnToDesktop={() => setActiveApp('desktop')}
              contacts={contacts}
              contactMemories={contactMemories}
              onUpdateContactMemory={handleUpdateContactMemory}
              onAddContact={handleAddContact}
            />
          )}

          {/* 11. POMODORO APP */}
          {activeApp === 'pomodoro' && (
            <PomodoroApp 
              onReturnToDesktop={() => setActiveApp('desktop')} 
              contacts={contacts}
              settings={settings}
            />
          )}

          {/* 8.6. TWITTER APP */}
          {activeApp === 'twitter' && (
            <TwitterApp 
              onReturnToDesktop={() => setActiveApp('desktop')}
              settings={settings}
              contacts={contacts}
              worldBooks={worldBooks}
            />
          )}

          {/* 8.7. DIY WORKSHOP APP */}
          {activeApp === 'diy' && (
            <DIYWorkshop
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onReturnToDesktop={() => setActiveApp('desktop')}
              contacts={contacts}
            />
          )}

          {/* 8.8. CLOUD MUSIC APP */}
          {activeApp === 'music' && (
            <CloudMusicApp 
              onReturnToDesktop={() => setActiveApp('desktop')} 
              contacts={contacts}
              settings={settings}
            />
          )}

          {/* 8.9. LUCKIN COFFEE APP */}
          {activeApp === 'luckin' && (
            <LuckinApp
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              contacts={contacts}
              onReturnToDesktop={() => setActiveApp('desktop')}
              onUpdateContact={handleUpdateContact}
              onUpdateContactMemory={handleUpdateContactMemory}
            />
          )}

          {/* 8.10. BILIBILI APP */}
          {activeApp === 'bilibili' && (
            <BilibiliApp
              settings={settings}
              contacts={contacts}
              onBack={() => setActiveApp('desktop')}
            />
          )}

          {/* 8.11. HOMESTEAD APP */}
          {activeApp === 'homestead' && (
            <HomesteadApp
              settings={settings}
              contacts={contacts}
              worldBooks={worldBooks}
              onReturnToDesktop={() => setActiveApp('desktop')}
              contactMemories={contactMemories}
              onUpdateContactMemory={handleUpdateContactMemory}
            />
          )}

          {/* 8.12. THEATER APP */}
          {activeApp === 'theater' && (
            <TheaterApp
              settings={settings}
              contacts={contacts}
              worldBooks={worldBooks}
              onBack={() => setActiveApp('desktop')}
            />
          )}

          {/* 9. TAKEAWAY ORDER MODAL */}
          <TakeawayModal
            isOpen={isTakeawayModalOpen}
            onClose={() => setIsTakeawayModalOpen(false)}
            contacts={contacts}
            onPlaceOrder={(order) => {
              setTakeawayOrder(order);
              setIsTakeawayModalOpen(false);
            }}
          />

          {/* New Message Popup Banner - Moved to end for top-level visibility */}
          <MessagePopupBanner
            popup={activeMessagePopup}
            onClose={() => setActiveMessagePopup(null)}
            onClick={(contactId) => {
              setActiveMessagePopup(null);
              setSelectedPopupContactId(contactId);
              setActiveApp('wechat');
            }}
          />

          {/* Floating Music Ball - Stays above all apps */}
          {isFloating && currentSong && <FloatingMusicBall />}
        </IPhoneFrame>
      </main>

      {/* Bottom Footer Helper Info */}
      <footer className="w-full max-w-4xl py-2 px-4 rounded-xl bg-stone-900/60 border border-stone-800/80 text-[11px] text-stone-400 flex flex-wrap items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>点击手机底部白色横条随时返回桌面 · 微信内点击联系人右下角 🤖 让 AI 即时回复 · 点击 🔊 播放真实语音</span>
        </div>
        <div className="flex items-center gap-3">
          <span>当前联系人: {contacts.length} 位</span>
          <span>动态圈: {moments.length} 条</span>
        </div>
      </footer>

      {/* Safe Custom Header Reset Confirm Modal */}
      {showHeaderResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[280px] bg-white rounded-2xl p-4 shadow-xl text-center animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-stone-900 mb-2">恢复出厂预设</h3>
            <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">确定要恢复出厂预设数据吗？此操作会清空当前的聊天、设置和自定义联系人。</p>
            <div className="flex items-center gap-2.5">
              <button
                className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => setShowHeaderResetConfirm(false)}
              >
                取消
              </button>
              <button
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => {
                  handleResetData();
                  setShowHeaderResetConfirm(false);
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Version Update Notice Modal */}
      <UpdateNoticeModal
        isOpen={isUpdateNoticeOpen}
        onClose={() => setIsUpdateNoticeOpen(false)}
      />

      {/* Global Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
