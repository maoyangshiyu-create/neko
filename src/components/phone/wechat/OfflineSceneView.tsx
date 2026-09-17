import React, { useState, useRef, useEffect } from 'react';
import { Contact, WorldBookItem, PhoneSettings, ContactMemory, ThemeStyle, MarriageRecord } from '../../../types/phone';
import { getWeddingRoles } from '../../../utils/genderHelper';
import { callOfflineSceneAI, callGroupOfflineSceneAI, playVoice } from '../../../services/aiService';
import { Avatar } from '../Avatar';
import { MarriageCertificateModal } from '../MarriageCertificateModal';
import { 
  ArrowLeft, 
  MapPin, 
  Volume2, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Compass, 
  Info,
  History,
  BookOpen,
  Trash2,
  X,
  BookmarkPlus,
  Eye,
  Play,
  Save,
  LogOut
} from 'lucide-react';

const WeddingChurchSVG = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v3" />
    <path d="M10.5 3.5h3" />
    <path d="M12 5L4 11v10h16V11L12 5z" fill="currentColor" fillOpacity="0.1" />
    <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    <path d="M12 9v3" />
    <path d="M10.5 10.5h3" />
  </svg>
);

export interface OfflineBeat {
  id: string;
  timestamp: number;
  playerAction?: string;
  playerDialogue?: string;
  actionDesc: string;
  characterDialogue: string;
  innerVoice?: string;
  barrages?: string[];
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  voiceTimbre?: string;
}

export interface OfflineMemoryRecord {
  id: string;
  title: string;
  sceneDesc: string;
  timestamp: number;
  beats: OfflineBeat[];
  participants?: { id: string; name: string; avatar: string }[];
  isWedding?: boolean;
}

interface OfflineSceneViewProps {
  contact: Contact;
  settings: PhoneSettings;
  worldBooks: WorldBookItem[];
  members?: Contact[];
  allContacts?: Contact[];
  onBack: () => void;
  onUpdateContact?: (id: string, updates: Partial<Contact>) => void;
  onUpdateSettings?: (updates: Partial<PhoneSettings>) => void;
  contactMemories?: Record<string, ContactMemory>;
  onUpdateContactMemory?: (contactId: string, memory: ContactMemory) => void;
  themeStyle?: ThemeStyle;
  className?: string;
}

const theaterResetStyle = {
  '--theater-bg': '#fcf6f0',
  '--bg': 'var(--theater-bg)',
  '--theater-paper': '#fffdfa',
  '--paper': 'var(--theater-paper)',
  '--theater-ink': '#382933',
  '--ink': 'var(--theater-ink)',
  '--theater-ink-soft': '#7d6371',
  '--ink-soft': 'var(--theater-ink-soft)',
  '--theater-line': '#ebd6ce',
  '--line': 'var(--theater-line)',
  '--theater-rose': '#c47885',
  '--rose': 'var(--theater-rose)',
  '--theater-sage': '#8ea89d',
  '--sage': 'var(--theater-sage)',
  '--theater-sand': '#dbc5b8',
  '--sand': 'var(--theater-sand)',
  '--theater-blue': '#7a9cb5',
  '--blue': 'var(--theater-blue)',
  '--theater-danger': '#cf5965',
  '--danger': 'var(--theater-danger)',
  '--theater-accent': '#8c5274',
  '--accent': 'var(--theater-accent)',
  '--theater-accent-text': '#ffffff',
  '--accent-text': 'var(--theater-accent-text)',
  '--theater-accent-deep': '#773e60',
  '--accent-deep': 'var(--theater-accent-deep)',
  '--theater-radius': '14px',
  '--radius': 'var(--theater-radius)',
  '--theater-shadow': '0 4px 18px rgba(56, 41, 51, 0.08)',
  '--shadow': 'var(--theater-shadow)',
  '--theater-glass-bg': 'rgba(253, 248, 245, 0.88)',
  '--glass-bg': 'var(--theater-glass-bg)',
  '--theater-glass-border': 'rgba(140, 82, 116, 0.28)',
  '--glass-border': 'var(--theater-glass-border)',
  '--theater-phone-border': '#382933',
  '--phone-border': 'var(--theater-phone-border)',

  '--theater-online-badge-bg': '#8c5274',
  '--gg-online-badge-bg': 'var(--theater-online-badge-bg)',
  '--theater-online-badge-text': '#ffffff',
  '--gg-online-badge-text': 'var(--theater-online-badge-text)',
  '--theater-success-color': '#8c5274',
  '--gg-success-color': 'var(--theater-success-color)',
  '--theater-warning-color': '#d4a373',
  '--gg-warning-color': 'var(--theater-warning-color)',
  '--theater-danger-color': '#cf5965',
  '--gg-danger-color': 'var(--theater-danger-color)',
  '--theater-info-color': '#dbc5b8',
  '--gg-info-color': 'var(--theater-info-color)',
  '--theater-delivery-badge-bg': 'rgba(140, 82, 116, 0.18)',
  '--gg-delivery-badge-bg': 'var(--theater-delivery-badge-bg)',
  '--theater-delivery-badge-text': '#8c5274',
  '--gg-delivery-badge-text': 'var(--theater-delivery-badge-text)',
} as React.CSSProperties;

export const OfflineSceneView: React.FC<OfflineSceneViewProps> = ({
  contact,
  settings,
  worldBooks,
  members = [],
  allContacts = [],
  onBack,
  onUpdateContact,
  onUpdateSettings,
  contactMemories = {},
  onUpdateContactMemory,
  themeStyle,
  className = ''
}) => {
  // 剧场采用洛可可美学风格（绛紫与玫瑰木），不受主题工坊或全局换肤的主题影响
  const currentTheme: ThemeStyle = 'rococo';
  const isDarkAccent = false;
  const accentBtnTextColor = isDarkAccent ? '#ffffff' : 'var(--ink)';

  const [sceneDesc, setSceneDesc] = useState<string>(() => {
    try {
      return localStorage.getItem(`offline_scenedesc_${contact.id}`) || '';
    } catch {
      return '';
    }
  });
  const [scenePromptInput, setScenePromptInput] = useState('');
  const [playingBeatId, setPlayingBeatId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [enableBarrage, setEnableBarrage] = useState(() => {
    try {
      return localStorage.getItem(`offline_barrage_enabled_${contact.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [activeBarrages, setActiveBarrages] = useState<{ id: string; content: string; top: number; duration: number }[]>([]);

  // Context Menu states
  const [contextMenuBeatId, setContextMenuBeatId] = useState<string | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<'player' | 'character' | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'playerDialogue' | 'characterDialogue' | 'actionDesc' | 'playerAction' | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedBeatIds, setSelectedBeatIds] = useState<Set<string>>(new Set());

  const [inputText, setInputText] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isSavingScene, setIsSavingScene] = useState(false);
  const [showMarriageCertificateModal, setShowMarriageCertificateModal] = useState<MarriageRecord | null>(null);

  // 检查是否当前处于婚礼场景
  const isCurrentWedding = (() => {
    try {
      const storedFlag = localStorage.getItem(`wedding_offline_${contact.id}`) === 'true';
      const desc = sceneDesc || localStorage.getItem(`offline_scenedesc_${contact.id}`) || '';
      return storedFlag || desc.includes('婚礼') || desc.includes('结婚') || desc.includes('中式婚礼') || desc.includes('西式婚礼') || desc.includes('新娘') || desc.includes('新郎');
    } catch {
      return false;
    }
  })();

  // Resume Session state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasCheckedResume, setHasCheckedResume] = useState(false);

  // 线下模式过往回忆录状态
  const memoryStorageKey = `offline_history_memories_${contact.id}`;
  const storageKey = `offline_beats_${contact.id}_custom`;
  const [pastMemories, setPastMemories] = useState<OfflineMemoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(memoryStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [showMemoriesModal, setShowMemoriesModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<OfflineMemoryRecord | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(memoryStorageKey, JSON.stringify(pastMemories));
    } catch {}
  }, [pastMemories, memoryStorageKey]);

  // Check for resume on mount
  useEffect(() => {
    if (!hasCheckedResume) {
      try {
        const savedBeats = localStorage.getItem(storageKey);
        if (savedBeats) {
          const parsed = JSON.parse(savedBeats);
          if (parsed && parsed.length > 0) {
            setShowResumeDialog(true);
          }
        }
      } catch (err) {
        console.error('Failed to check resume state:', err);
      }
      setHasCheckedResume(true);
    }
  }, [hasCheckedResume, storageKey]);

  // 保存当前场景到【线下回忆录】
  const saveCurrentSceneToHistory = (customSceneDesc?: string, customBeats?: OfflineBeat[], isWedding?: boolean) => {
    const currentSceneDesc = (customSceneDesc || sceneDesc || localStorage.getItem(`offline_scenedesc_${contact.id}`) || '').trim();
    const currentBeats = customBeats || beats;

    if (!currentSceneDesc && currentBeats.length === 0) {
      return false;
    }

    const groupMembers = members.length > 0 
      ? members 
      : allContacts.filter(c => (contact.groupMemberIds || []).includes(c.id) && !c.isGroup);

    const involvedContacts = contact.isGroup && groupMembers.length > 0
      ? groupMembers
      : [contact];

    const titleText = currentSceneDesc.replace(/[【】]/g, '').slice(0, 24) || (contact.isGroup ? '线下群聚会' : '线下互动');

    const newMemory: OfflineMemoryRecord = {
      id: `off_mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: titleText,
      sceneDesc: currentSceneDesc,
      timestamp: Date.now(),
      beats: [...currentBeats],
      participants: involvedContacts.map(c => ({
        id: c.id,
        name: c.remark || c.name,
        avatar: c.avatar
      })),
      isWedding: !!isWedding
    };

    setPastMemories(prev => [newMemory, ...prev]);
    return true;
  };

  const handleManualArchiveCurrentScene = () => {
    if (beats.length === 0) {
      showToast('⚠️ 当前线下场景暂无互动对话');
      return;
    }
    const success = saveCurrentSceneToHistory();
    if (success) {
      showToast('✨ 已成功将当前线下模式归档至回忆录！');
    }
  };

  const handleDeleteMemory = (memoryId: string) => {
    setPastMemories(prev => prev.filter(m => m.id !== memoryId));
    if (selectedMemory?.id === memoryId) {
      setSelectedMemory(null);
    }
    showToast('已删除该条线下回忆');
  };

  const handleResumeMemory = (mem: OfflineMemoryRecord) => {
    if (beats.length > 0 && sceneDesc) {
      saveCurrentSceneToHistory();
    }
    setSceneDesc(mem.sceneDesc || '');
    setBeats(mem.beats || []);
    setSelectedMemory(null);
    setShowMemoriesModal(false);
    showToast(`已载入过往回忆「${mem.title || '线下相聚'}」，可继续互动！`);
  };

  const handleBackClick = () => {
    if (isCurrentWedding || beats.length > 0 || (sceneDesc && sceneDesc.trim().length > 0)) {
      setShowExitConfirmModal(true);
    } else {
      onBack();
    }
  };

  const handleResetScene = async (save: boolean) => {
    setShowSaveModal(false);
    setShowExitConfirmModal(false);
    let weddingRecordToDisplay: MarriageRecord | null = null;

    // 获取具体场景描述与婚礼标记
    const currentSceneDesc = (sceneDesc || localStorage.getItem(`offline_scenedesc_${contact.id}`) || '').trim();
    const isWeddingFromDesc = 
      currentSceneDesc.includes('婚礼') || 
      currentSceneDesc.includes('结婚') || 
      currentSceneDesc.includes('中式婚礼') || 
      currentSceneDesc.includes('西式婚礼') || 
      currentSceneDesc.includes('新娘') || 
      currentSceneDesc.includes('新郎');
    const isOfflineWedding = isCurrentWedding || localStorage.getItem(`wedding_offline_${contact.id}`) === 'true' || isWeddingFromDesc;

    if (save) {
      setIsSavingScene(true);
      try {
        // 自动存档至线下时光回忆录（如有交互步骤或婚礼标记）
        saveCurrentSceneToHistory(currentSceneDesc, beats, isOfflineWedding);
        
        const groupMembers = members.length > 0 
          ? members 
          : allContacts.filter(c => (contact.groupMemberIds || []).includes(c.id) && !c.isGroup);

        const involvedContacts = contact.isGroup && groupMembers.length > 0
          ? groupMembers
          : [contact];

        console.log('--- [OfflineScene] Saving Scene Memories ---');
        console.log('Is Group:', contact.isGroup);
        console.log('Scene Description:', currentSceneDesc);
        console.log('Involved Contacts:', involvedContacts.map(c => ({ id: c.id, name: c.remark || c.name })));
        if (isOfflineWedding) console.log('Offline Wedding completion detected!');

        // Build dialogue record with explicit speaker tags:
        // 【玩家】说：... / 【角色名】说：...
        let dialoguesWithSpeakers = beats.map(b => {
          const sName = b.senderName || contact.remark || contact.name;
          const lines: string[] = [];
          if (b.playerDialogue) {
            lines.push(`【玩家】说：${b.playerDialogue}`);
          }
          if (b.playerAction) {
            lines.push(`【玩家】动作：${b.playerAction}`);
          }
          if (b.characterDialogue) {
            lines.push(`【${sName}】说：${b.characterDialogue}`);
          }
          if (b.actionDesc) {
            lines.push(`【${sName}】动作：${b.actionDesc}`);
          }
          return lines.join('\n');
        }).filter(Boolean).join('\n');

        // 如果没有对话记录但属于婚礼仪式，提供仪式过程概要作为生成依据
        if (!dialoguesWithSpeakers && isOfflineWedding) {
          dialoguesWithSpeakers = `【${settings.userNickname || '玩家'}】与【${contact.remark || contact.name}】在庄严浪漫的婚礼现场许下相伴一生的誓言，彼此交换婚戒，在所有人的见证下正式结为夫妻。`;
        }

        console.log('[OfflineScene] Dialogues with speaker tags:\n', dialoguesWithSpeakers);

        let mems: Record<string, ContactMemory> = {};
        try {
          const savedMem = localStorage.getItem('wephone_contact_memories_v1');
          if (savedMem) mems = JSON.parse(savedMem);
        } catch {}

        for (const c of involvedContacts) {
          const contactId = c.id;
          const memberName = c.remark || c.name;
          const roles = getWeddingRoles(c, settings);

          let diaryContent = '';
          if (isOfflineWedding) {
            if (roles.isContactGroom) {
              diaryContent = `[${new Date().toLocaleDateString('zh-CN')}] 今天在婚礼仪式现场，我和${settings.userNickname || '玩家'}正式举行了婚礼。看着她穿上嫁衣成为我的新娘，心中满是幸福与守护她的坚定决心。从今往后，携手一生，永不相负。`;
            } else if (roles.isContactBride) {
              diaryContent = `[${new Date().toLocaleDateString('zh-CN')}] 今天在婚礼仪式现场，我和${settings.userNickname || '玩家'}正式举行了婚礼。当我们彼此交换誓言并戴上婚戒的那一刻，眼里满是温柔与感动。从今天起，我们正式结为夫妻了。`;
            } else {
              diaryContent = `[${new Date().toLocaleDateString('zh-CN')}] 今天，我和${settings.userNickname || '玩家'}举办了庄重而神圣的婚礼仪式。在那神圣而浪漫的时刻，我们交换了誓言，正式结为夫妻。这一刻将永远铭刻在我的心里。`;
            }
          } else if (currentSceneDesc) {
            const loc = currentSceneDesc.replace(/[【】]/g, '').slice(0, 30);
            diaryContent = `[${new Date().toLocaleDateString('zh-CN')}] 今天和${settings.userNickname || '玩家'}在【${loc}】线下相聚，置身其中用心交流互动，留下了真切而难忘的美好回忆。`;
          } else {
            diaryContent = `[${new Date().toLocaleDateString('zh-CN')}] 今天和${settings.userNickname || '玩家'}在线下相聚，度过了一段非常愉快且温馨的时光。`;
          }
          
          let newFactsList = [{
            id: 'fact_' + Date.now() + '_' + Math.random(),
            timestamp: Date.now(),
            fact: isOfflineWedding 
              ? `与${settings.userNickname || '玩家'}举行了婚礼，正式结为夫妻` 
              : currentSceneDesc 
              ? `与${settings.userNickname || '玩家'}在${currentSceneDesc.replace(/[【】]/g, '').slice(0, 14)}线下互动`
              : `与${settings.userNickname || '玩家'}在线下进行了互动`
          }];

          try {
            const diaryRes = await fetch('/api/memory/generate-diary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contactName: memberName,
                userNickname: settings.userNickname || '玩家',
                persona: `${c.persona || ''}\n${isOfflineWedding ? roles.aiPerspectivePrompt : ''}`,
                dialoguesWithSpeakers,
                sceneDesc: currentSceneDesc,
                isWedding: isOfflineWedding,
                weddingRoles: isOfflineWedding ? {
                  isGroom: roles.isContactGroom,
                  isBride: roles.isContactBride,
                  roleTitle: roles.contactTitle,
                  partnerTitle: roles.userTitle,
                  groomName: roles.groomName,
                  brideName: roles.brideName
                } : undefined,
                date: new Date().toLocaleDateString('zh-CN')
              })
            });
            const diaryData = await diaryRes.json();
            if (diaryData?.diary && typeof diaryData.diary === 'string' && diaryData.diary.trim().length > 0) {
              let finalDiary = diaryData.diary.trim();
              if (isOfflineWedding && !finalDiary.includes('婚') && !finalDiary.includes('夫妻')) {
                finalDiary = `[${new Date().toLocaleDateString('zh-CN')}] 今天在婚礼仪式现场，我和${settings.userNickname || '玩家'}正式结为夫妻。` + finalDiary.replace(/^\[.*?\]\s*/, '');
              }
              diaryContent = finalDiary;
            }
          } catch (err) {
            console.warn('Failed to generate offline diary for', memberName, err);
          }

          try {
            const factsRes = await fetch('/api/memory/extract-facts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contactName: memberName,
                userNickname: settings.userNickname || '玩家',
                dialoguesWithSpeakers,
                sceneDesc: currentSceneDesc,
                isWedding: isOfflineWedding,
                weddingRoles: isOfflineWedding ? {
                  isGroom: roles.isContactGroom,
                  isBride: roles.isContactBride,
                  roleTitle: roles.contactTitle,
                  partnerTitle: roles.userTitle
                } : undefined
              })
            });
            const factsData = await factsRes.json();
            if (Array.isArray(factsData?.facts) && factsData.facts.length > 0) {
              let extracted = factsData.facts.slice(0, 2).map((f: string) => ({
                id: 'fact_' + Date.now() + '_' + Math.random(),
                timestamp: Date.now(),
                fact: f.trim().slice(0, 30)
              }));
              if (isOfflineWedding && !extracted.some(item => item.fact.includes('婚') || item.fact.includes('夫妻'))) {
                extracted.unshift({
                  id: 'fact_' + Date.now() + '_' + Math.random(),
                  timestamp: Date.now(),
                  fact: `与${settings.userNickname || '玩家'}举行了婚礼，正式结为夫妻`
                });
              }
              newFactsList = extracted;
            }
          } catch (err) {
            console.warn('Failed to extract offline facts for', memberName, err);
          }

          const newDiaryItem = {
            id: 'diary_' + Date.now() + '_' + Math.random(),
            timestamp: Date.now(),
            content: diaryContent
          };

          const existingMemory = contactMemories[contactId] || mems[contactId] || { diaries: [], facts: [] };
          const updatedMemory: ContactMemory = {
            diaries: [newDiaryItem, ...(existingMemory?.diaries || [])],
            facts: [...(existingMemory?.facts || []), ...newFactsList]
          };

          console.log(`[OfflineScene] Saved data for member ID ${contactId} (${memberName}):`, {
            generatedDiary: diaryContent,
            newFacts: newFactsList,
            updatedMemory
          });

          mems[contactId] = updatedMemory;
          if (onUpdateContactMemory) {
            onUpdateContactMemory(contactId, updatedMemory);
          }

          // 如果是婚礼完成，更新关系为已婚并记录婚书
          if (isOfflineWedding && onUpdateContact && onUpdateSettings) {
            const isTargetSpouse = !contact.isGroup || contactId === contact.id || involvedContacts.length === 1;
            if (isTargetSpouse) {
              onUpdateContact(contactId, { relationship: 'married' });
              
              const newMarriage: MarriageRecord = {
                partnerId: contactId,
                partnerName: memberName,
                partnerAvatar: c.avatar || contact.avatar,
                marryDate: new Date().toLocaleDateString('zh-CN'),
                certificateId: `MC${Date.now().toString().slice(-8)}`
              };
              
              const currentMarriages = settings.marriages || [];
              if (!currentMarriages.find(m => m.partnerId === contactId)) {
                onUpdateSettings({ marriages: [...currentMarriages, newMarriage] });
              }
              weddingRecordToDisplay = newMarriage;
            }
          }
        }

        console.log('[OfflineScene] Final updated contactMemories state across all members:', mems);

        try {
          localStorage.setItem('wephone_contact_memories_v1', JSON.stringify(mems));
        } catch {}
      } catch (err: any) {
        console.error('Error saving offline scene memories:', err);
      } finally {
        setIsSavingScene(false);
      }
    }

    setSceneDesc('');
    setBeats([]);
    setScenePromptInput('');
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`offline_scenedesc_${contact.id}`);
      localStorage.removeItem(`wedding_offline_${contact.id}`);
      localStorage.removeItem(`wedding_roles_${contact.id}`);
    } catch {}

    if (weddingRecordToDisplay) {
      setShowMarriageCertificateModal(weddingRecordToDisplay);
      showToast('🎉 恭喜！婚礼圆满礼成，已更新为已婚关系并生成婚书与日记！');
    } else {
      showToast(save ? '已成功生成日记与记忆并重设场景' : '已重设场景');
      if (!save) {
        onBack();
      }
    }
  };

  // Storage key for persisting beats
  const [beats, setBeats] = useState<OfflineBeat[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(beats));
    } catch {}
    try {
      localStorage.setItem(`offline_scenedesc_${contact.id}`, sceneDesc);
    } catch {}
    try {
      localStorage.setItem(`offline_barrage_enabled_${contact.id}`, String(enableBarrage));
    } catch {}
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [beats, sceneDesc, storageKey, contact.id, enableBarrage]);

  // Handle barrage spawning
  const spawnBarrages = (barrageTexts: string[]) => {
    if (!enableBarrage || !barrageTexts.length) return;
    
    const newBarrages = barrageTexts.map((text, idx) => ({
      id: `barrage_${Date.now()}_${idx}_${Math.random()}`,
      content: text,
      top: 15 + (idx * 8) % 65, // Spread across top 15% to 80%
      duration: 6 + Math.random() * 4 // 6-10 seconds
    }));

    // Sequential spawning for better effect
    newBarrages.forEach((b, i) => {
      setTimeout(() => {
        setActiveBarrages(prev => [...prev, b]);
        // Auto remove after animation
        setTimeout(() => {
          setActiveBarrages(prev => prev.filter(item => item.id !== b.id));
        }, b.duration * 1000 + 500);
      }, i * 400);
    });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const cleanVoiceTimbre = (t?: string) => {
    const val = (t || '').trim();
    if (val === 'female-sweet' || val === 'female-sweet-sweet' || val === 'female-shaonv') {
      return '';
    }
    return val;
  };

  // Helper to get contact info by senderId
  const getMemberInfo = (senderId?: string) => {
    // 构建完整的成员列表（优先使用 members，否则从 allContacts 中筛选）
    const groupMembers = members.length > 0 
      ? members 
      : allContacts.filter(c => (contact.groupMemberIds || []).includes(c.id) && !c.isGroup);

    // 如果有 senderId，精确查找该成员
    if (senderId) {
      // 先从 groupMembers 中查找
      let found = groupMembers.find(m => m.id === senderId);
      // 如果没找到，再从 allContacts 中查找
      if (!found) {
        found = allContacts.find(c => c.id === senderId && !c.isGroup);
      }
      if (found) {
        const timbre = cleanVoiceTimbre(found.voiceTimbre);
        console.log(`[OfflineScene] ✅ 找到成员: ${found.remark || found.name}, voiceTimbre: "${timbre}"`);
        return {
          name: found.remark || found.name,
          avatar: found.avatar,
          timbre: timbre  // ⚠️ 不要在这里加 fallback，让调用方决定
        };
      }
    }

    // 如果没有 senderId 或找不到，取第一个成员
    if (groupMembers.length > 0) {
      const first = groupMembers[0];
      const timbre = cleanVoiceTimbre(first.voiceTimbre);
      console.log(`[OfflineScene] ⚠️ 回退到第一个成员: ${first.remark || first.name}, voiceTimbre: "${timbre}"`);
      return {
        name: first.remark || first.name,
        avatar: first.avatar,
        timbre: timbre
      };
    }

    // 最终回退到当前联系人
    const timbre = cleanVoiceTimbre(contact.voiceTimbre);
    console.log(`[OfflineScene] ⚠️ 最终回退到联系人: ${contact.remark || contact.name}, voiceTimbre: "${timbre}"`);
    return {
      name: contact.remark || contact.name,
      avatar: contact.avatar,
      timbre: timbre
    };
  };

  // Voice playback
  const handlePlayVoice = async (beatId: string, dialogueText: string, timbre?: string) => {
    if (playingBeatId === beatId) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingBeatId(null);
      return;
    }

    setPlayingBeatId(beatId);
    try {
      const beat = beats.find(b => b.id === beatId);

      // ✅ 步骤1：优先使用传入的 timbre 参数
      let finalTimbre = cleanVoiceTimbre(timbre);
      
      // ✅ 步骤2：如果 timbre 参数为空，通过 senderId 从联系人中获取
      if (!finalTimbre && beat?.senderId) {
        const info = getMemberInfo(beat.senderId);
        finalTimbre = cleanVoiceTimbre(info.timbre);
        console.log(`[OfflineScene] 从成员信息获取音色: "${finalTimbre}"`);
      }
      
      // ✅ 步骤3：如果还是空，尝试从当前联系人获取
      if (!finalTimbre) {
        finalTimbre = cleanVoiceTimbre(contact.voiceTimbre);
        console.log(`[OfflineScene] 从当前联系人获取音色: "${finalTimbre}"`);
      }

      // ✅ 步骤4：如果最终仍然为空，提示用户并停止
      if (!finalTimbre) {
        console.warn('[OfflineScene] ⚠️ 所有方式都无法获取音色 ID，请在联系人设置中填写自定义音色 ID');
        showToast('⚠️ 该角色未设置音色 ID，请在私聊设置中填写自定义音色');
        setPlayingBeatId(null);
        return;
      }

      console.log(`[OfflineScene] ✅ 最终使用音色: "${finalTimbre}"`);
      
      await playVoice({
        text: dialogueText,
        voiceTimbre: finalTimbre,
        settings
      });
      
      const estDuration = Math.max(2500, dialogueText.length * 280);
      setTimeout(() => {
        setPlayingBeatId(prev => (prev === beatId ? null : prev));
      }, estDuration);
    } catch (err: any) {
      console.warn('[OfflineScene] 语音播放失败:', err);
      showToast(err.message || '语音播放失败，请检查TTS设置');
      setPlayingBeatId(null);
    }
  };

  // Start custom scene
  const handleStartCustomScene = async () => {
    if (!scenePromptInput.trim()) return;
    const desc = scenePromptInput.trim();
    setSceneDesc(desc);
    setIsGenerating(true);

    try {
      const groupMembers = members.length > 0 
        ? members 
        : allContacts.filter(c => (contact.groupMemberIds || []).includes(c.id) && !c.isGroup);

      if (contact.isGroup && groupMembers.length > 1) {
        const resList = await callGroupOfflineSceneAI({
          members: groupMembers,
          sceneDesc: desc,
          history: [],
          playerAction: '（你来到了这个场景，等待大家的回应）',
          playerDialogue: '',
          worldBooks,
          settings
        });

        const newBeats: OfflineBeat[] = resList.map((r, idx) => {
          const info = getMemberInfo(r.senderId);
          return {
            id: `beat_${Date.now()}_${idx}`,
            timestamp: Date.now() + idx,
            actionDesc: r.actionDesc,
            characterDialogue: r.characterDialogue,
            innerVoice: r.innerVoice,
            senderId: r.senderId,
            senderName: info.name,
            senderAvatar: info.avatar,
            voiceTimbre: info.timbre
          };
        });

        setBeats(newBeats);
      } else {
        const singleContact = groupMembers.length === 1 ? groupMembers[0] : contact;
        const res = await callOfflineSceneAI({
          contact: singleContact,
          sceneTitle: '自定义场景',
          sceneDesc: desc,
          history: [],
          playerAction: '（你来到了这个场景，等待对方回应）',
          playerDialogue: '',
          worldBooks,
          settings
        });

        const newBeat: OfflineBeat = {
          id: `beat_${Date.now()}`,
          timestamp: Date.now(),
          actionDesc: res.actionDesc,
          characterDialogue: res.characterDialogue,
          innerVoice: singleContact.enableInnerVoice ? res.innerVoice : undefined,
          senderId: singleContact.id,
          senderName: singleContact.remark || singleContact.name,
          senderAvatar: singleContact.avatar,
          voiceTimbre: singleContact.voiceTimbre
        };

        setBeats([newBeat]);
      }
    } catch (err: any) {
      console.error('Offline AI generation error:', err);
      const errBeat: OfflineBeat = {
        id: `beat_err_${Date.now()}`,
        timestamp: Date.now(),
        actionDesc: `[系统提示] 开场生成失败：${err.message || '网络或接口服务故障'}`,
        characterDialogue: '',
        senderId: 'system',
        senderName: '系统提示'
      };
      setBeats([errBeat]);
      showToast(`开场生成失败: ${err.message || '请重试'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, beatId: string, target: 'player' | 'character') => {
    e.preventDefault();
    setContextMenuBeatId(beatId);
    setContextMenuTarget(target);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleRegenerateOffline = async (beatId: string) => {
    const beatIndex = beats.findIndex(b => b.id === beatId);
    if (beatIndex === -1) return;
    
    const triggerBeat = beats[beatIndex];
    const playerAct = triggerBeat.playerAction;
    const playerDia = triggerBeat.playerDialogue;
    
    // Delete this beat and all subsequent beats
    setBeats(prev => prev.slice(0, beatIndex));
    
    // Trigger AI
    setTimeout(() => {
      handleSendInteraction(playerAct, playerDia);
    }, 250);
  };

  const handleEditBeat = (beatId: string, field: string, content: string) => {
    setBeats(prev => prev.map(b => b.id === beatId ? { ...b, [field]: content } : b));
  };

  const handleDeleteBeat = (beatId: string) => {
    setBeats(prev => prev.filter(b => b.id !== beatId));
  };

  const handleRecallBeat = (beatId: string) => {
    // 线下模式的撤回逻辑同删除
    handleDeleteBeat(beatId);
  };

  // Trigger interaction
  const handleSendInteraction = async (overrideAction?: string, overrideDialogue?: string) => {
    let act = overrideAction ?? '';
    let dia = overrideDialogue ?? '';

    if (!overrideAction && !overrideDialogue) {
      const trimmed = inputText.trim();
      if (trimmed) {
        // Check if wrapped in parentheses (full-width or half-width)
        const parenMatch = trimmed.match(/^[（\(]([\s\S]*)[）\)]$/);
        if (parenMatch) {
          act = parenMatch[1].trim();
        } else {
          dia = trimmed;
        }
      }
    }

    setInputText('');
    setIsGenerating(true);

    try {
      const groupMembers = members.length > 0 
        ? members 
        : allContacts.filter(c => (contact.groupMemberIds || []).includes(c.id) && !c.isGroup);

      if (contact.isGroup && groupMembers.length > 1) {
        const resList = await callGroupOfflineSceneAI({
          members: groupMembers,
          sceneDesc,
          history: beats.slice(-6).map(b => ({
            senderName: b.senderName,
            actionDesc: b.actionDesc,
            characterDialogue: b.characterDialogue,
            playerAction: b.playerAction,
            playerDialogue: b.playerDialogue
          })),
          playerAction: act || undefined,
          playerDialogue: dia || undefined,
          worldBooks,
          settings
        });

        const newBeats: OfflineBeat[] = resList.map((r, idx) => {
          const info = getMemberInfo(r.senderId);
          return {
            id: `beat_${Date.now()}_${idx}`,
            timestamp: Date.now() + idx,
            playerAction: idx === 0 ? (act || undefined) : undefined,
            playerDialogue: idx === 0 ? (dia || undefined) : undefined,
            actionDesc: r.actionDesc,
            characterDialogue: r.characterDialogue,
            innerVoice: r.innerVoice,
            barrages: r.barrages,
            senderId: r.senderId,
            senderName: info.name,
            senderAvatar: info.avatar,
            voiceTimbre: info.timbre
          };
        });

        setBeats(prev => [...prev, ...newBeats]);

        // Spawn barrages if enabled
        if (enableBarrage) {
          const firstWithBarrages = resList.find(r => r.barrages && r.barrages.length > 0);
          if (firstWithBarrages?.barrages) {
            spawnBarrages(firstWithBarrages.barrages);
          }
        }
      } else {
        const singleContact = groupMembers.length === 1 ? groupMembers[0] : contact;
        const res = await callOfflineSceneAI({
          contact: singleContact,
          sceneTitle: '自定义场景',
          sceneDesc,
          history: beats.slice(-6).map(b => ({
            actionDesc: b.actionDesc,
            characterDialogue: b.characterDialogue,
            playerAction: b.playerAction,
            playerDialogue: b.playerDialogue
          })),
          playerAction: act || undefined,
          playerDialogue: dia || undefined,
          worldBooks,
          settings
        });

        const newBeat: OfflineBeat = {
          id: `beat_${Date.now()}`,
          timestamp: Date.now(),
          playerAction: act || undefined,
          playerDialogue: dia || undefined,
          actionDesc: res.actionDesc,
          characterDialogue: res.characterDialogue,
          innerVoice: singleContact.enableInnerVoice ? res.innerVoice : undefined,
          barrages: res.barrages,
          senderId: singleContact.id,
          senderName: singleContact.remark || singleContact.name,
          senderAvatar: singleContact.avatar,
          voiceTimbre: singleContact.voiceTimbre
        };

        setBeats(prev => [...prev, newBeat]);
        
        // Spawn barrages if enabled
        if (enableBarrage && res.barrages && res.barrages.length > 0) {
          spawnBarrages(res.barrages);
        }
      }
    } catch (err: any) {
      console.error('Offline AI generation error:', err);
      const errBeat: OfflineBeat = {
        id: `beat_err_${Date.now()}`,
        timestamp: Date.now(),
        playerAction: act || undefined,
        playerDialogue: dia || undefined,
        actionDesc: `[系统提示] 线下互动生成失败：${err.message || '网络或接口服务故障'}`,
        characterDialogue: '',
        senderId: 'system',
        senderName: '系统提示'
      };
      setBeats(prev => [...prev, errBeat]);
      showToast(`互动推进失败: ${err.message || '请重试'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className={`theme-${currentTheme} absolute inset-0 z-40 flex flex-col select-none overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${className}`}
      style={{
        ...theaterResetStyle,
        background: 'var(--bg)',
        color: 'var(--ink)'
      }}
    >
      {/* 弹幕层 */}
      {enableBarrage && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {activeBarrages.map(b => (
            <div
              key={b.id}
              className="absolute whitespace-nowrap px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs text-white text-[11px] font-bold border border-white/10 shadow-lg animate-danmaku flex items-center gap-1.5"
              style={{
                top: `${b.top}%`,
                left: '100%',
                animationDuration: `${b.duration}s`
              }}
            >
              <span className="text-pink-400">✨</span>
              {b.content}
            </div>
          ))}
        </div>
      )}

      {/* 1. Header Bar */}
      <div 
        className="h-12 px-3 backdrop-blur-md border-b flex items-center justify-between shrink-0 z-20"
        style={{
          backgroundColor: 'var(--glass-bg)',
          borderColor: 'var(--line)',
          color: 'var(--ink)'
        }}
      >
        <button
          onClick={handleBackClick}
          className="flex items-center gap-0.5 px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
          style={{
            backgroundColor: 'var(--paper)',
            borderColor: 'var(--line)',
            color: 'var(--ink)'
          }}
          title="返回微信聊天"
        >
          <ArrowLeft className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>返回</span>
        </button>

        {/* Character Title & Status */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-[150px]">
          <Avatar
            src={contact.avatar}
            name={contact.name}
            className="w-6.5 h-6.5 rounded-full border shadow-xs shrink-0"
            size={13}
          />
          <div className="min-w-0 flex flex-col items-center">
            <span className="text-xs font-bold truncate block max-w-[100px]" style={{ color: 'var(--ink)' }}>
              {contact.remark || contact.name}
            </span>
            <span 
              className="px-1.5 py-0.2 border rounded-full text-[8.5px] font-medium flex items-center gap-1 shadow-2xs shrink-0"
              style={{
                backgroundColor: 'var(--paper)',
                borderColor: 'var(--line)',
                color: 'var(--ink)'
              }}
            >
              <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
              {isCurrentWedding ? <span className="inline-flex items-center gap-1"><WeddingChurchSVG className="w-3.5 h-3.5 text-rose-500" /> 婚礼仪式</span> : contact.isGroup ? '群聊线下' : '线下互动'}
            </span>
          </div>
        </div>

        {/* Right side controls: Memories & Reset/Finish Button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowMemoriesModal(true)}
            className="px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-xs"
            style={{
              backgroundColor: 'var(--paper)',
              borderColor: 'var(--line)',
              color: 'var(--ink)'
            }}
            title="查看线下模式过往回忆"
          >
            <History className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>回忆</span>
            {pastMemories.length > 0 && (
              <span 
                className="px-1 py-0.2 rounded-full text-[8.5px] font-bold"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: accentBtnTextColor
                }}
              >
                {pastMemories.length}
              </span>
            )}
          </button>

          {isCurrentWedding ? (
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-md bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:opacity-95"
              title="婚礼礼成并生成婚书与日记"
            >
              <span className="inline-flex items-center gap-1"><WeddingChurchSVG className="w-3.5 h-3.5" /> 婚礼礼成</span>
            </button>
          ) : sceneDesc ? (
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-xs"
              style={{
                backgroundColor: 'var(--paper)',
                borderColor: 'var(--line)',
                color: 'var(--ink)'
              }}
              title="重新设定场景"
            >
              <RefreshCw className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <span>重设场景</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div 
          className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full border text-[11px] shadow-xl flex items-center gap-1.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2"
          style={{
            backgroundColor: 'var(--paper)',
            borderColor: 'var(--line)',
            color: 'var(--ink)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <Info className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Save Scene / Wedding Completion Confirmation Modal */}
      {(showSaveModal || isSavingScene) && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div 
            className="w-full max-w-sm rounded-2xl border p-5 space-y-4 shadow-2xl"
            style={{
              backgroundColor: 'var(--paper)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg"
                style={{
                  backgroundColor: isCurrentWedding ? '#fff1f2' : 'var(--glass-bg)',
                  borderColor: isCurrentWedding ? '#fecdd3' : 'var(--line)',
                  color: isCurrentWedding ? '#e11d48' : 'var(--accent)',
                  borderRadius: 'var(--radius)'
                }}
              >
                {isCurrentWedding ? <WeddingChurchSVG className="w-5 h-5 text-rose-500" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                  {isCurrentWedding ? '婚礼仪式是否圆满礼成？' : '是否保存当前场景记忆？'}
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                  {isCurrentWedding ? '礼成后将结为夫妻，生成婚书并记录日记与记忆' : '重设场景前，可将本次见面归档'}
                </p>
              </div>
            </div>

            <p 
              className="text-xs leading-relaxed p-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--glass-bg)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
                borderRadius: 'var(--radius)'
              }}
            >
              {isSavingScene ? (
                <span className="flex items-center gap-2 font-medium" style={{ color: 'var(--accent)' }}>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {isCurrentWedding ? '正在见证礼成，生成婚书、私密日记与专属记忆...' : '正在为各位角色生成日记与关键事实记忆...'}
                </span>
              ) : isCurrentWedding ? (
                '选择礼成后，伴侣角色将写下一篇关于本次婚礼的深情私密日记，正式缔结婚书，并提炼关键事实记忆（与你结为夫妻）。'
              ) : (
                '如果选择保存，群聊/私聊角色将各自写下一篇关于本次见面的私密日记，保存到其日记本中，并将见面经历提炼成关键事实记忆。'
              )}
            </p>

            {!isSavingScene && (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleResetScene(true)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 text-white"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: accentBtnTextColor,
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <span>{isCurrentWedding ? '🎉 礼成结为夫妻（生成婚书与日记）' : '✨ 保存并归档日记与记忆'}</span>
                </button>
                <button
                  onClick={() => handleResetScene(false)}
                  className="w-full py-2 rounded-xl border font-medium text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  {isCurrentWedding ? '重设婚礼场景（不保存）' : '直接重设（不保存）'}
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="w-full py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    color: 'var(--ink-soft)'
                  }}
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog when clicking Back */}
      {showExitConfirmModal && !showSaveModal && !isSavingScene && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div 
            className="w-full max-w-sm rounded-2xl border p-5 space-y-4 shadow-2xl"
            style={{
              backgroundColor: 'var(--paper)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--line)',
                  color: 'var(--accent)',
                  borderRadius: 'var(--radius)'
                }}
              >
                {isCurrentWedding ? <WeddingChurchSVG className="w-5 h-5 text-rose-500" /> : <Info className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                  {isCurrentWedding ? '婚礼仪式尚未完成保存' : '是否保存本次相聚记忆？'}
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                  {isCurrentWedding ? '请选择如何处理当前的婚礼仪式' : '可选择保存生成日记或暂存退出'}
                </p>
              </div>
            </div>

            <p 
              className="text-xs leading-relaxed p-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--glass-bg)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
                borderRadius: 'var(--radius)'
              }}
            >
              {isCurrentWedding
                ? '礼成保存将正式结为夫妻、生成婚书并让伴侣写下婚礼专属日记与事实记忆；暂存退出则保留当前进度，下次进入可继续。'
                : '保存并归档将为参与角色提炼关键记忆并生成私密日记；暂存退出则保留当前场景进度。'}
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleResetScene(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 text-white"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: accentBtnTextColor,
                  borderRadius: 'var(--radius)'
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isCurrentWedding ? '礼成结为夫妻（生成婚书与日记）' : '保存并生成日记与记忆'}</span>
              </button>
              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  onBack();
                }}
                className="w-full py-2 rounded-xl border font-medium text-xs transition-all cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: 'var(--paper)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <Save className="w-3.5 h-3.5" />
                <span>暂存退出（保留进度，下次继续）</span>
              </button>
              <button
                onClick={() => handleResetScene(false)}
                className="w-full py-2 rounded-xl text-xs font-medium cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>结束场景（不保存）</span>
              </button>
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="w-full py-1 text-xs font-medium cursor-pointer transition-colors"
                style={{
                  color: 'var(--ink-soft)'
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* If scene is not yet started, show Custom Scene Prompt Input screen */}
      {!sceneDesc ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-5 animate-in fade-in">
          <div 
            className="w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: 'var(--paper)',
              borderColor: 'var(--line)',
              color: 'var(--accent)',
              borderRadius: 'var(--radius)'
            }}
          >
            <Compass className="w-8 h-8" />
          </div>
          <div className="text-center space-y-1.5 max-w-sm">
            <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
              {contact.isGroup ? '进入群聊线下多人群聚互动' : '进入线下面对面互动'}
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {contact.isGroup 
                ? '请输入群聊成员们当前所处的自定义场景、环境氛围或特殊前提，多位群成员将共同出场与你互动。'
                : '请输入你们当前所处的自定义场景、环境氛围或特殊前提，AI 将根据你的设定生成生动的开场。'}
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">
            <textarea
              value={scenePromptInput}
              onChange={(e) => setScenePromptInput(e.target.value)}
              placeholder="例如：周末的下午阳光正好，大家聚在温馨的客厅里喝茶聊天，气氛轻松愉快..."
              className="w-full h-36 p-3.5 rounded-2xl border text-xs resize-none shadow-inner transition-colors focus:outline-none focus:ring-1"
              style={{
                backgroundColor: 'var(--paper)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
                borderRadius: 'var(--radius)'
              }}
            />
            <button
              onClick={handleStartCustomScene}
              disabled={isGenerating || !scenePromptInput.trim()}
              className="w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              style={{
                backgroundColor: 'var(--accent)',
                color: accentBtnTextColor,
                borderRadius: 'var(--radius)'
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>正在生成场景开场...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>开始互动</span>
                </>
              )}
            </button>

            {/* 查看与载入过往线下回忆录入口 */}
            <div className="pt-2 border-t flex flex-col gap-2 mt-1" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={() => setShowMemoriesModal(true)}
                className="w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-xs"
                style={{
                  backgroundColor: 'var(--paper)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <History className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>查看过往线下模式回忆录 ({pastMemories.length})</span>
              </button>

              {pastMemories.length > 0 && (
                <div className="space-y-1.5 mt-0.5">
                  <div className="flex items-center justify-between text-[11px] px-1" style={{ color: 'var(--ink-soft)' }}>
                    <span>过往线下相聚：</span>
                    <button 
                      type="button" 
                      onClick={() => setShowMemoriesModal(true)}
                      className="text-[10px] underline hover:opacity-80 cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                    >
                      查看全部 {pastMemories.length} 篇
                    </button>
                  </div>
                  {pastMemories.slice(0, 2).map(mem => (
                    <div
                      key={mem.id}
                      className="p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-2xs"
                      style={{
                        backgroundColor: 'var(--glass-bg)',
                        borderColor: 'var(--line)'
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[11px] truncate" style={{ color: 'var(--ink)' }}>
                            {mem.title}
                          </span>
                          <span className="text-[9px] shrink-0 opacity-70">
                            ({mem.beats?.length || 0}轮)
                          </span>
                        </div>
                        <p className="text-[10px] truncate opacity-70" style={{ color: 'var(--ink-soft)' }}>
                          {mem.sceneDesc}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedMemory(mem)}
                          className="px-2 py-1 rounded-lg border text-[10px] font-medium cursor-pointer active:scale-95"
                          style={{
                            backgroundColor: 'var(--paper)',
                            borderColor: 'var(--line)',
                            color: 'var(--ink)'
                          }}
                        >
                          查看
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResumeMemory(mem)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5 cursor-pointer active:scale-95 shadow-xs"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: accentBtnTextColor
                          }}
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>载入</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Atmospheric Banner */}
          <div 
            className="px-3 py-2.5 border-b shrink-0 relative overflow-hidden backdrop-blur-md"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--line)'
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-7 h-7 rounded-xl border flex items-center justify-center shadow-xs shrink-0"
                style={{
                  backgroundColor: 'var(--paper)',
                  borderColor: 'var(--line)',
                  color: 'var(--accent)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                  <span>{contact.isGroup ? '群聊多人互动场景' : '自定义互动场景'}</span>
                  <span 
                    className="text-[9px] px-1.5 py-0.5 rounded-full border font-normal"
                    style={{
                      backgroundColor: 'var(--paper)',
                      borderColor: 'var(--line)',
                      color: 'var(--ink-soft)'
                    }}
                  >
                    面对面相处
                  </span>
                </h4>
                <p className="text-[11px] truncate mt-0.5 leading-snug" style={{ color: 'var(--ink-soft)' }}>
                  {sceneDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Story & Interaction Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {beats.map((beat) => {
              const isAudioPlaying = playingBeatId === beat.id;
              const memberInfo = getMemberInfo(beat.senderId);
              const sName = beat.senderName || memberInfo.name;
              const sAvatar = beat.senderAvatar || memberInfo.avatar;
              const sTimbre = beat.voiceTimbre || memberInfo.timbre;

              return (
                <div key={beat.id} className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {/* Player Action or Dialogue */}
                  {(beat.playerAction || beat.playerDialogue) && (
                    <div className="flex flex-col items-end gap-1.5 pl-6">
                      {beat.playerAction && (
                        <div 
                          onContextMenu={(e) => {
                            if (!isMultiSelectMode) handleContextMenu(e, beat.id, 'player');
                          }}
                          className={`px-3 py-1.5 rounded-2xl border text-xs max-w-[90%] text-right shadow-xs transition-all ${isMultiSelectMode ? 'cursor-pointer' : ''} ${selectedBeatIds.has(beat.id) ? 'ring-2 ring-emerald-500' : ''}`}
                          onClick={() => {
                            if (isMultiSelectMode) {
                              const newSelected = new Set(selectedBeatIds);
                              if (newSelected.has(beat.id)) newSelected.delete(beat.id);
                              else newSelected.add(beat.id);
                              setSelectedBeatIds(newSelected);
                            }
                          }}
                          style={{
                            backgroundColor: 'var(--paper)',
                            borderColor: 'var(--line)',
                            color: 'var(--ink)',
                            borderRadius: 'var(--radius)'
                          }}
                        >
                          <span className="font-medium mr-1" style={{ color: 'var(--accent)' }}>【你的动作】</span>
                          <span>{beat.playerAction}</span>
                        </div>
                      )}
                      {beat.playerDialogue && (
                        <div 
                          onContextMenu={(e) => {
                            if (!isMultiSelectMode) handleContextMenu(e, beat.id, 'player');
                          }}
                          className={`px-3.5 py-2 rounded-2xl text-xs font-medium max-w-[85%] shadow-md rounded-tr-xs transition-all ${isMultiSelectMode ? 'cursor-pointer' : ''} ${selectedBeatIds.has(beat.id) ? 'ring-2 ring-emerald-500' : ''}`}
                          onClick={() => {
                            if (isMultiSelectMode) {
                              const newSelected = new Set(selectedBeatIds);
                              if (newSelected.has(beat.id)) newSelected.delete(beat.id);
                              else newSelected.add(beat.id);
                              setSelectedBeatIds(newSelected);
                            }
                          }}
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-text, #ffffff)',
                            borderRadius: 'var(--radius)'
                          }}
                        >
                          “{beat.playerDialogue}”
                        </div>
                      )}
                    </div>
                  )}

                  {/* Character Response Block */}
                  <div className="pr-4 space-y-2">
                    {/* 1. Action Description */}
                    {beat.actionDesc && (
                      <div 
                        onContextMenu={(e) => {
                          if (!isMultiSelectMode) handleContextMenu(e, beat.id, 'character');
                        }}
                        className={`p-3 rounded-2xl border shadow-sm text-xs leading-relaxed relative overflow-hidden transition-all ${isMultiSelectMode ? 'cursor-pointer' : ''} ${selectedBeatIds.has(beat.id) ? 'ring-2 ring-emerald-500' : ''}`}
                        onClick={() => {
                          if (isMultiSelectMode) {
                            const newSelected = new Set(selectedBeatIds);
                            if (newSelected.has(beat.id)) newSelected.delete(beat.id);
                            else newSelected.add(beat.id);
                            setSelectedBeatIds(newSelected);
                          }
                        }}
                        style={{
                          backgroundColor: 'var(--paper)',
                          borderColor: 'var(--line)',
                          color: 'var(--ink)',
                          borderRadius: 'var(--radius)'
                        }}
                      >
                        {/* Left accent color bar */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1" 
                          style={{ backgroundColor: 'var(--accent)' }} 
                        />
                        <div 
                          className="flex items-center gap-1.5 text-[10px] font-bold mb-1 pl-1"
                          style={{ color: 'var(--accent)' }}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>【动作与神态】</span>
                        </div>
                        <p className="font-serif tracking-wide pl-1" style={{ color: 'var(--ink)' }}>
                          {beat.actionDesc}
                        </p>
                      </div>
                    )}

                    {/* 2. Character Dialogue & Avatar */}
                    {beat.characterDialogue && (
                      <div className="flex items-start gap-2.5">
                        <Avatar
                          src={sAvatar}
                          name={sName}
                          className="w-8 h-8 rounded-full border shrink-0 mt-1 shadow-xs"
                          size={16}
                        />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold" style={{ color: 'var(--ink)' }}>
                              {sName}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => handlePlayVoice(beat.id, beat.characterDialogue, sTimbre)}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                              style={{
                                backgroundColor: isAudioPlaying ? 'var(--accent-deep, var(--accent))' : 'var(--accent)',
                                color: 'var(--accent-text, #ffffff)',
                                borderRadius: 'var(--radius)'
                              }}
                              title="点击听TA说话 (播放角色语音)"
                            >
                              {isAudioPlaying ? (
                                <>
                                  <span className="flex items-center gap-0.5">
                                    <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-3.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </span>
                                  <span>播放中...</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>听TA说话</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Dialogue Bubble */}
                          <div 
                            onContextMenu={(e) => {
                              if (!isMultiSelectMode) handleContextMenu(e, beat.id, 'character');
                            }}
                            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-medium leading-relaxed rounded-tl-xs shadow-sm transition-all ${isMultiSelectMode ? 'cursor-pointer' : ''} ${selectedBeatIds.has(beat.id) ? 'ring-2 ring-emerald-500' : ''}`}
                            onClick={() => {
                              if (isMultiSelectMode) {
                                const newSelected = new Set(selectedBeatIds);
                                if (newSelected.has(beat.id)) newSelected.delete(beat.id);
                                else newSelected.add(beat.id);
                                setSelectedBeatIds(newSelected);
                              }
                            }}
                            style={{
                              backgroundColor: 'var(--paper)',
                              borderColor: 'var(--line)',
                              color: 'var(--ink)',
                              borderRadius: 'var(--radius)'
                            }}
                          >
                            “{beat.characterDialogue.replace(/^[“"「『]|["”」』]$/g, '')}”
                          </div>

                          {/* 3. Inner Voice */}
                          {beat.innerVoice && (
                            <div 
                              className="px-2.5 py-1 rounded-xl border text-[10px] flex items-center gap-1.5 shadow-xs"
                              style={{
                                backgroundColor: 'var(--glass-bg)',
                                borderColor: 'var(--line)',
                                color: 'var(--ink-soft)',
                                borderRadius: 'var(--radius)'
                              }}
                            >
                              <span className="shrink-0 font-medium" style={{ color: 'var(--accent)' }}>💭 心声:</span>
                              <span className="italic">{beat.innerVoice}</span>
                            </div>
                          )}

                          {/* 4. Barrage Commentary (Dedicated Narrator Box) */}
                          {enableBarrage && beat.barrages && beat.barrages.length > 0 && (
                            <div 
                              className="p-2.5 rounded-xl border border-dashed text-[10px] space-y-1.5 shadow-xs"
                              style={{
                                backgroundColor: 'rgba(232, 154, 171, 0.05)',
                                borderColor: 'rgba(232, 154, 171, 0.25)',
                                color: 'var(--ink-soft)',
                                borderRadius: 'var(--radius)'
                              }}
                            >
                              <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: '#e89aab' }}>
                                <Sparkles className="w-3 h-3" />
                                <span>次元外吐槽现场</span>
                                <span className="font-normal opacity-60 text-[8px] ml-auto">共{beat.barrages.length}条</span>
                              </div>
                              <div className="grid grid-cols-1 gap-1">
                                {beat.barrages.map((txt, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <span className="text-[9px] mt-0.5 opacity-50">💬</span>
                                    <span className="leading-relaxed opacity-90">{txt}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={scrollBottomRef} />
          </div>

          {/* Context Menu Overlay */}
          {contextMenuBeatId && (
            <div 
              className="fixed inset-0 z-[100]" 
              onClick={() => {
                setContextMenuBeatId(null);
                setContextMenuTarget(null);
              }}
              onContextMenu={(e) => { e.preventDefault(); setContextMenuBeatId(null); setContextMenuTarget(null); }}
            >
              {(() => {
                const beat = beats.find(b => b.id === contextMenuBeatId);
                if (!beat) return null;
                const isPlayer = contextMenuTarget === 'player';
                
                return (
                  <div 
                    className="absolute bg-gradient-to-b from-[#FFF9F5] to-[#FDF0E9] border border-[#EED7C5] text-[#5E3B20] rounded-xl shadow-lg text-[11px] flex p-1 animate-in zoom-in-95 duration-150 backdrop-blur-sm -translate-x-1/2"
                    style={{ 
                      left: Math.max(80, Math.min(contextMenuPos.x, 375 - 80)),
                      top: Math.max(20, contextMenuPos.y - 55)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center whitespace-nowrap overflow-x-auto no-scrollbar max-w-[85vw]">
                      <button 
                        className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer text-[#D48A8A] font-bold"
                        onClick={() => {
                          // Mock favorite for offline scene
                          showToast('已收藏该条线下记录');
                          setContextMenuBeatId(null);
                        }}
                      >
                        收藏
                      </button>
                      <button 
                        className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                        onClick={() => {
                          const content = isPlayer ? (beat.playerDialogue || beat.playerAction || '') : (beat.characterDialogue || beat.actionDesc || '');
                          setInputText(`引用: "${content}"\n`);
                          setContextMenuBeatId(null);
                        }}
                      >
                        引用
                      </button>
                      <button 
                        className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                        onClick={() => {
                          setIsMultiSelectMode(true);
                          setSelectedBeatIds(new Set([beat.id]));
                          setContextMenuBeatId(null);
                        }}
                      >
                        多选
                      </button>
                      <button 
                        className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                        onClick={() => {
                          handleDeleteBeat(beat.id);
                          setContextMenuBeatId(null);
                        }}
                      >
                        删除
                      </button>
                      <button 
                        className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                        onClick={() => {
                          setEditingBeatId(beat.id);
                          if (isPlayer) {
                            setEditingField(beat.playerDialogue ? 'playerDialogue' : 'playerAction');
                            setEditContent(beat.playerDialogue || beat.playerAction || '');
                          } else {
                            setEditingField(beat.characterDialogue ? 'characterDialogue' : 'actionDesc');
                            setEditContent(beat.characterDialogue || beat.actionDesc || '');
                          }
                          setContextMenuBeatId(null);
                        }}
                      >
                        编辑
                      </button>
                      {isPlayer && (
                        <button 
                          className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer text-emerald-600 font-bold"
                          onClick={() => {
                            handleRegenerateOffline(beat.id);
                            setContextMenuBeatId(null);
                          }}
                        >
                          重生
                        </button>
                      )}
                      <button 
                        className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                        onClick={() => {
                          handleRecallBeat(beat.id);
                          setContextMenuBeatId(null);
                        }}
                      >
                        撤回
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Edit Beat Modal */}
          {editingBeatId && editingField && (
            <div className="fixed inset-0 z-[110] bg-black/40 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-[300px] bg-white rounded-2xl p-4 shadow-xl animate-in zoom-in-95 duration-200">
                <h3 className="text-sm font-semibold text-stone-800 mb-3 text-center">编辑互动内容</h3>
                <textarea
                  autoFocus
                  className="w-full h-24 p-3 bg-stone-100 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none border-none"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div className="flex items-center gap-3 mt-4">
                  <button
                    className="flex-1 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl font-medium text-xs transition-colors"
                    onClick={() => {
                      setEditingBeatId(null);
                      setEditingField(null);
                    }}
                  >
                    取消
                  </button>
                  <button
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-xs transition-colors"
                    onClick={() => {
                      handleEditBeat(editingBeatId, editingField, editContent);
                      setEditingBeatId(null);
                      setEditingField(null);
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resume Session Dialog */}
          {showResumeDialog && (
            <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm">
              <div className="w-full max-w-[280px] bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <History className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-stone-800">发现未保存会话</h3>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      你有一个未保存的线下模式会话，是否继续上次的剧情？
                    </p>
                  </div>
                  <div className="w-full grid grid-cols-1 gap-2 mt-2">
                    <button
                      onClick={() => setShowResumeDialog(false)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-200"
                    >
                      继续上次会话
                    </button>
                    <button
                      onClick={() => {
                        handleResetScene(false);
                        setShowResumeDialog(false);
                      }}
                      className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl font-bold text-sm transition-all active:scale-95"
                    >
                      开始新会话
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multi-select Action Bar */}
          {isMultiSelectMode && (
            <div className="absolute bottom-16 left-0 right-0 p-3 bg-stone-900/95 border-t border-stone-800 flex items-center justify-between z-50 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-sm">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-emerald-400">已选中 {selectedBeatIds.size} 项</span>
                <span className="text-[9px] text-stone-500">点击内容进行切换选择</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsMultiSelectMode(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-400 text-xs font-medium"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (selectedBeatIds.size > 0) {
                      setBeats(prev => prev.filter(b => !selectedBeatIds.has(b.id)));
                      setSelectedBeatIds(new Set());
                      setIsMultiSelectMode(false);
                      showToast(`已删除 ${selectedBeatIds.size} 条记录`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </div>
          )}

          {/* Bottom Interactive Input Bar */}
          <div 
            className="p-2.5 border-t space-y-2 shrink-0 backdrop-blur-md"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--line)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: 'var(--ink-soft)' }}>
                  💡 正常输入为说话，加括号（如：(微笑着点头)）为动作
                </span>
                <div 
                  onClick={() => setEnableBarrage(!enableBarrage)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border cursor-pointer transition-all active:scale-95 ${
                    enableBarrage ? 'bg-pink-500/10 border-pink-500/30 text-pink-600' : 'bg-stone-100 border-stone-200 text-stone-400'
                  }`}
                >
                  <Sparkles className={`w-3 h-3 ${enableBarrage ? 'animate-pulse' : ''}`} />
                  <span className="text-[9.5px] font-bold">{enableBarrage ? '吐槽弹幕：开' : '吐槽弹幕：关'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendInteraction()}
                placeholder="说点什么，或加括号表示动作（例如：(微笑着看向大家)）..."
                className="flex-1 px-3 py-2 border rounded-xl text-xs placeholder:opacity-50 focus:outline-none focus:ring-1 shadow-inner"
                style={{
                  backgroundColor: 'var(--paper)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                  borderRadius: 'var(--radius)'
                }}
              />

              <button
                onClick={() => handleSendInteraction()}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-transform disabled:opacity-50 shadow-md"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: accentBtnTextColor,
                  borderRadius: 'var(--radius)'
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* 线下时光回忆录列表弹窗 */}
      {showMemoriesModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm h-[82%] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--paper)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
              borderRadius: 'var(--radius)'
            }}
          >
            {/* Modal Header */}
            <div 
              className="p-3.5 border-b flex items-center justify-between shrink-0"
              style={{
                backgroundColor: 'var(--glass-bg)',
                borderColor: 'var(--line)'
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl border flex items-center justify-center shadow-xs"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderColor: 'var(--line)',
                    color: 'var(--accent)'
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs" style={{ color: 'var(--ink)' }}>线下时光回忆录</h3>
                  <p className="text-[10px]" style={{ color: 'var(--ink-soft)' }}>
                    重温与 {contact.remark || contact.name} 在线下度过的时光
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMemoriesModal(false)}
                className="p-1.5 rounded-lg border cursor-pointer active:scale-95 transition-transform"
                style={{
                  backgroundColor: 'var(--paper)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)'
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub Header: Quick Save Current Scene Option */}
            <div 
              className="px-3.5 py-2 border-b flex items-center justify-between text-[11px] shrink-0"
              style={{
                backgroundColor: 'var(--glass-bg)',
                borderColor: 'var(--line)'
              }}
            >
              <span className="text-[10px]" style={{ color: 'var(--ink-soft)' }}>
                共 {pastMemories.length} 篇过往回忆
              </span>

              {beats.length > 0 && (
                <button
                  type="button"
                  onClick={handleManualArchiveCurrentScene}
                  className="px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-xs"
                  style={{
                    backgroundColor: 'var(--accent)',
                    borderColor: 'var(--accent)',
                    color: accentBtnTextColor
                  }}
                  title="将当前线下对话保存到回忆录"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>归档当前模式</span>
                </button>
              )}
            </div>

            {/* Memory List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {pastMemories.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div 
                    className="w-12 h-12 rounded-2xl border flex items-center justify-center opacity-60 shadow-xs"
                    style={{
                      backgroundColor: 'var(--glass-bg)',
                      borderColor: 'var(--line)',
                      color: 'var(--accent)'
                    }}
                  >
                    <History className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-xs" style={{ color: 'var(--ink)' }}>暂无过往线下回忆</p>
                  <p className="text-[11px] leading-relaxed max-w-[220px]" style={{ color: 'var(--ink-soft)' }}>
                    重设场景并选择保存，或在对话时点击“归档当前模式”，记录就会留存在这里。
                  </p>
                </div>
              ) : (
                pastMemories.map(mem => (
                  <div
                    key={mem.id}
                    className="p-3 rounded-xl border space-y-2 transition-all hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--glass-bg)',
                      borderColor: 'var(--line)'
                    }}
                  >
                    {/* Top Row: Title & Date */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                        <span className="font-bold text-xs truncate" style={{ color: 'var(--ink)' }}>
                          {mem.title || '线下相聚'}
                        </span>
                        {mem.isWedding && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[9px] bg-pink-500/20 text-pink-600 font-bold inline-flex items-center gap-0.5">
                            <WeddingChurchSVG className="w-3 h-3" />
                            <span>婚礼</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: 'var(--ink-soft)' }}>
                        {new Date(mem.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Scene desc snippet */}
                    {mem.sceneDesc && (
                      <p className="text-[11px] line-clamp-2 leading-relaxed italic opacity-85" style={{ color: 'var(--ink)' }}>
                        "{mem.sceneDesc}"
                      </p>
                    )}

                    {/* Stats & Actions */}
                    <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex items-center gap-2">
                        {/* Participants avatars */}
                        {mem.participants && mem.participants.length > 0 && (
                          <div className="flex -space-x-1.5 items-center">
                            {mem.participants.slice(0, 3).map(p => (
                              <Avatar key={p.id} src={p.avatar} name={p.name} className="w-5 h-5 rounded-full border border-white" size={10} />
                            ))}
                          </div>
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--ink-soft)' }}>
                          💬 {mem.beats?.length || 0} 轮互动
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResumeMemory(mem)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: accentBtnTextColor
                          }}
                          title="以此回忆场景继续线下互动"
                        >
                          <Play className="w-3 h-3" />
                          <span>载入互动</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMemory(mem)}
                          className="px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                          style={{
                            backgroundColor: 'var(--paper)',
                            borderColor: 'var(--line)',
                            color: 'var(--ink)'
                          }}
                        >
                          <Eye className="w-3 h-3 text-amber-500" />
                          <span>细节</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="p-1 rounded-lg text-[10px] text-red-500 hover:bg-red-500/10 cursor-pointer active:scale-95"
                          title="删除此记忆"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 细致重温单条线下回忆详情 Modal */}
      {selectedMemory && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm h-[88%] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--paper)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
              borderRadius: 'var(--radius)'
            }}
          >
            {/* Memory Detail Header */}
            <div 
              className="p-3 border-b flex items-center justify-between shrink-0"
              style={{
                backgroundColor: 'var(--glass-bg)',
                borderColor: 'var(--line)'
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemory(null)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer active:scale-95 transition-all shadow-xs"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)'
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>返回</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResumeMemory(selectedMemory)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer active:scale-95 shadow-xs transition-all"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: accentBtnTextColor
                  }}
                  title="载入此回忆的场景并继续互动"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>载入此回忆继续互动</span>
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold block truncate max-w-[100px]" style={{ color: 'var(--ink)' }}>
                  {selectedMemory.title}
                </span>
                <span className="text-[9px]" style={{ color: 'var(--ink-soft)' }}>
                  {new Date(selectedMemory.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Memory Detail Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Scene description header box */}
              {selectedMemory.sceneDesc && (
                <div 
                  className="p-3 rounded-xl border text-xs leading-relaxed space-y-1 shadow-inner"
                  style={{
                    backgroundColor: 'var(--glass-bg)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)'
                  }}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>场景记忆背景</span>
                  </div>
                  <p className="opacity-90">{selectedMemory.sceneDesc}</p>
                </div>
              )}

              {/* Beats list */}
              <div className="space-y-3">
                {selectedMemory.beats?.map((beat, index) => {
                  const sInfo = getMemberInfo(beat.senderId);
                  const sName = beat.senderName || sInfo.name;
                  const sAvatar = beat.senderAvatar || sInfo.avatar;
                  const sTimbre = beat.voiceTimbre || sInfo.timbre;

                  return (
                    <div 
                      key={beat.id || index}
                      className="p-3 rounded-xl border space-y-2 shadow-xs"
                      style={{
                        backgroundColor: 'var(--glass-bg)',
                        borderColor: 'var(--line)'
                      }}
                    >
                      {/* Player dialogue/action */}
                      {beat.playerDialogue && (
                        <div className="text-xs space-y-1 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          <span className="text-[10px] font-bold text-amber-600 block">【你】</span>
                          <p className="font-medium" style={{ color: 'var(--ink)' }}>{beat.playerDialogue}</p>
                          {beat.playerAction && (
                            <p className="text-[10px] italic opacity-75">动作: {beat.playerAction}</p>
                          )}
                        </div>
                      )}

                      {/* Action description */}
                      {beat.actionDesc && (
                        <div className="text-[11px] italic leading-relaxed p-2 rounded-lg border border-dashed" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
                          ✨ {beat.actionDesc}
                        </div>
                      )}

                      {/* Character dialogue */}
                      {beat.characterDialogue && (
                        <div className="flex items-start gap-2 pt-1">
                          <Avatar src={sAvatar} name={sName} className="w-7 h-7 rounded-full border shrink-0 mt-0.5" size={14} />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold" style={{ color: 'var(--ink)' }}>{sName}</span>
                              <button
                                type="button"
                                onClick={() => handlePlayVoice(beat.id, beat.characterDialogue, sTimbre)}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                style={{
                                  backgroundColor: 'var(--accent)',
                                  color: accentBtnTextColor
                                }}
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>语音</span>
                              </button>
                            </div>
                            <div className="p-2.5 rounded-xl border text-xs leading-relaxed" style={{ backgroundColor: 'var(--paper)', borderColor: 'var(--line)', color: 'var(--ink)' }}>
                              “{beat.characterDialogue}”
                            </div>
                            {beat.innerVoice && (
                              <div className="text-[10px] italic opacity-80 px-2 py-0.5 rounded bg-black/5">
                                💭 心声: {beat.innerVoice}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 结婚证书展示弹窗 */}
      {showMarriageCertificateModal && (
        <MarriageCertificateModal
          certificate={showMarriageCertificateModal}
          settings={settings}
          contact={contact}
          onClose={() => {
            setShowMarriageCertificateModal(null);
            onBack();
          }}
          actionText="收纳婚书并返回聊天"
          onAction={() => {
            setShowMarriageCertificateModal(null);
            onBack();
          }}
        />
      )}
    </div>
  );
};
