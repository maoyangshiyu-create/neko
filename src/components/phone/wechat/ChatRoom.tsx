import React, { useState, useRef, useEffect } from 'react';
import { Contact, ChatMessage, WorldBookItem, PhoneSettings, FavoriteItem, StickerItem, DiaryEntry, MemoryFact, ContactMemory, MarriageRecord } from '../../../types/phone';
import { getWeddingRoles, inferContactGender, inferUserGender } from '../../../utils/genderHelper';
import { callAI, playVoice, parseAiResponse, isTtsConfigured, stopAllActiveAudio, sanitizeBubbleContent, extractAndStripInnerVoice, generatePatResponse, getContactPatSuffix, generatePatSuffixViaAi } from '../../../services/aiService';
import { compressImage } from '../../../utils/image';
import { Avatar } from '../Avatar';
import { OfflineSceneView } from './OfflineSceneView';
import { VoiceCallModal, CallLogItem } from './VoiceCallModal';
import { MarriageCertificateModal } from '../MarriageCertificateModal';
import { ScheduleModal } from './ScheduleModal';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Bot, 
  Send, 
  Plus, 
  Volume2, 
  VolumeX,
  Mic,
  Clock,
  Info,
  Camera, 
  Image as ImageIcon, 
  Coins, 
  MapPin, 
  PhoneCall, 
  Compass, 
  X, 
  Check, 
  Sliders, 
  Trash2,
  Sparkles,
  Heart,
  LogOut,
  MessageCircle,
  PhoneForwarded,
  Upload,
  Smile,
  BookOpen,
  Brain,
  Calendar,
  Edit2,
  PlusCircle,
  FileText,
  Coffee
} from 'lucide-react';
import { getBubbleStyle, getBubbleContainerStyle, getBubbleBgStyle } from '../../../utils/bubbleStyle';
import { UnifiedBubble } from './UnifiedBubble';
import { LuckinOrderPreviewCard, LuckinPaymentCard, LuckinTreatCard } from './LuckinCards';
import { LuckinPaymentModal } from './LuckinPaymentModal';
import { quickOrder, confirmOrder, completeOrderPayment, getInCharacterCoffeeMessage, LUCKIN_DRINKS } from '../../../services/luckinService';
import { LuckinOrderData } from '../../../types/luckin';

const CustomHeartSVG = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const RingSVG = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2l2.5 3.5H9.5L12 2z" fill="currentColor" fillOpacity="0.3" />
    <circle cx="12" cy="14" r="6.5" />
    <path d="M10 11.5a3 3 0 0 1 3-3" />
  </svg>
);

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


interface ChatRoomProps {
  contact: Contact;
  allContacts?: Contact[];
  messages: ChatMessage[];
  worldBooks: WorldBookItem[];
  settings: PhoneSettings;
  onBack: () => void;
  onSendMessage: (msg: Partial<ChatMessage>) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onUpdateMessage?: (messageId: string, updates: Partial<ChatMessage>) => void;
  onRecallMessage?: (messageId: string) => void;
  onUpdateContact: (contactId: string, updates: Partial<Contact>) => void;
  onDeleteContact: (contactId: string) => void;
  favorites?: FavoriteItem[];
  stickers?: StickerItem[];
  onToggleFavorite?: (msg: ChatMessage, senderName: string, senderAvatar: string) => void;
  contactMemories?: Record<string, ContactMemory>;
  onUpdateContactMemory?: (contactId: string, memory: ContactMemory) => void;
  onUpdateSettings: (settings: Partial<PhoneSettings>) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  contact,
  allContacts = [],
  messages = [],
  worldBooks = [],
  settings,
  onBack,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onUpdateMessage,
  onRecallMessage,
  onUpdateContact,
  onDeleteContact,
  favorites = [],
  stickers = [],
  onToggleFavorite,
  contactMemories = {},
  onUpdateContactMemory,
  onUpdateSettings
}) => {
  const [inputText, setInputText] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [customGroups, setCustomGroups] = useState<string[]>([]);
  const [activeStickerGroup, setActiveStickerGroup] = useState<string>('全部');

  useEffect(() => {
    if (showStickerMenu) {
      try {
        const saved = localStorage.getItem('wechat_sticker_custom_groups');
        const parsed = saved ? JSON.parse(saved) : [];
        setCustomGroups(parsed);
      } catch {
        setCustomGroups([]);
      }
    }
  }, [showStickerMenu]);

  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [selectedFriendToAdd, setSelectedFriendToAdd] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const aiCancelRef = useRef(false);
  const [messageCount, setMessageCount] = useState(0);

  const activeTheme = settings.activeDIYThemeId && settings.diyThemes
    ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
    : undefined;

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (contact && !contact.patSuffix && contact.id !== 'assistant' && contact.persona && contact.persona.trim()) {
      generatePatSuffixViaAi({ contact, settings }).then(suffix => {
        if (suffix) {
          onUpdateContact(contact.id, { patSuffix: suffix });
        }
      });
    }
  }, [contact.id, contact.persona]);

  const rawMemory = contactMemories[contact.id];
  const memory = {
    diaries: Array.isArray(rawMemory?.diaries) ? rawMemory.diaries : [],
    facts: Array.isArray(rawMemory?.facts) ? rawMemory.facts : []
  };

  // Memory & Diary management modal states
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [newDiaryContent, setNewDiaryContent] = useState('');
  const [editingDiaryId, setEditingDiaryId] = useState<string | null>(null);
  const [editingDiaryContent, setEditingDiaryContent] = useState('');

  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [newFactContent, setNewFactContent] = useState('');

  // 查看行程弹窗
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleUpdateMemory = (newMemory: ContactMemory) => {
    onUpdateContactMemory?.(contact.id, newMemory);
  };

  const handleAddDiary = (content: string) => {
    if (!content.trim()) return;
    const newDiary: DiaryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content: content.trim().slice(0, 500)
    };
    handleUpdateMemory({
      ...memory,
      diaries: [newDiary, ...memory.diaries]
    });
    setNewDiaryContent('');
  };

  const handleDeleteDiary = (id: string) => {
    handleUpdateMemory({
      ...memory,
      diaries: memory.diaries.filter(d => d.id !== id)
    });
  };

  const handleSaveEditDiary = (id: string) => {
    if (!editingDiaryContent.trim()) return;
    handleUpdateMemory({
      ...memory,
      diaries: memory.diaries.map(d => d.id === id ? { ...d, content: editingDiaryContent.trim() } : d)
    });
    setEditingDiaryId(null);
    setEditingDiaryContent('');
  };

  const handleAddFact = (fact: string) => {
    if (!fact.trim()) return;
    const newFact: MemoryFact = {
      id: Date.now().toString(),
      fact: fact.trim().slice(0, 30)
    };
    handleUpdateMemory({
      ...memory,
      facts: [...memory.facts, newFact]
    });
    setNewFactContent('');
  };

  const handleDeleteFact = (id: string) => {
    handleUpdateMemory({
      ...memory,
      facts: memory.facts.filter(f => f.id !== id)
    });
  };


  const handleSendSticker = (stickerUrl: string) => {
    onSendMessage({
      sender: 'user',
      content: stickerUrl,
      timestamp: Date.now(),
      type: 'sticker'
    });
    setShowStickerMenu(false);
    setMessageCount(prev => prev + 1);

    // AI automatically replies after natural delay
    setTimeout(() => {
      handleTriggerAi();
    }, 750);
  };

  // Message Context Menu & Edit State
  const [contextMenuMsgId, setContextMenuMsgId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [quoteMsg, setQuoteMsg] = useState<ChatMessage | null>(null);

  // Multi-select State
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());

  // Safe confirm modal state
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Toast banner for feedback (e.g., TTS not configured warning)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Voice message states (Realistic WeChat voice handling)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [showTranscriptIds, setShowTranscriptIds] = useState<Set<string>>(new Set());

  // Player-initiated voice message state (玩家自己发语音)
  const [showPlayerVoiceModal, setShowPlayerVoiceModal] = useState(false);
  const [playerVoiceContent, setPlayerVoiceContent] = useState('');
  const [playerVoiceDuration, setPlayerVoiceDuration] = useState(4);
  const [durationManuallySet, setDurationManuallySet] = useState(false);

  // Modals inside chat
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoDesc, setPhotoDesc] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('50');
  const [transferNote, setTransferNote] = useState('');
  const [transferStep, setTransferStep] = useState<'select_target' | 'enter_details'>('enter_details');
  const [transferTargetId, setTransferTargetId] = useState<string>('');

  // Custom Location Modal
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customLocationName, setCustomLocationName] = useState('');
  const [customLocationDetail, setCustomLocationDetail] = useState('');
  
  // Voice Call Modal state (outgoing: 玩家打给对方, incoming: 对方打给玩家)
  const [showCallModal, setShowCallModal] = useState(false);
  const [callDirection, setCallDirection] = useState<'outgoing' | 'incoming'>('outgoing');

  // Luckin Coffee Modal & Sheet States
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<LuckinOrderData | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showLuckinOrderSheet, setShowLuckinOrderSheet] = useState(false);
  const [luckinCustomDrinkNote, setLuckinCustomDrinkNote] = useState('');

  // Pat (拍一拍) state & refs
  const lastAvatarTapRef = useRef<Record<string, number>>({});
  const lastPatTimeRef = useRef<Record<string, number>>({});
  const [pattingAvatarId, setPattingAvatarId] = useState<string | null>(null);

  const handleAvatarClickOrDoubleTap = (targetContact?: Contact, isSelf?: boolean) => {
    const targetId = isSelf ? 'user_self' : (targetContact?.id || contact.id);
    const now = Date.now();
    const lastTap = lastAvatarTapRef.current[targetId] || 0;

    if (now - lastTap < 350) {
      lastAvatarTapRef.current[targetId] = 0;
      handleTriggerPat(targetContact, isSelf);
    } else {
      lastAvatarTapRef.current[targetId] = now;
    }
  };

  const handleTriggerPat = (targetContact?: Contact, isSelf?: boolean) => {
    const targetId = isSelf ? 'user_self' : (targetContact?.id || contact.id);
    const now = Date.now();
    const lastPatTime = lastPatTimeRef.current[targetId] || 0;

    if (now - lastPatTime < 5000) {
      showToast('拍得太快啦，歇一会儿吧~');
      return;
    }
    lastPatTimeRef.current[targetId] = now;

    // Trigger visual shake feedback
    setPattingAvatarId(targetId);
    setTimeout(() => setPattingAvatarId(null), 600);

    if (isSelf) {
      const selfSuffix = settings.userPatSuffix || '';
      const patSelfMsg: ChatMessage = {
        id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'system',
        type: 'pat',
        content: `你拍了拍自己${selfSuffix}`,
        timestamp: Date.now()
      };
      onSendMessage(patSelfMsg);
      return;
    }

    const activeTarget = targetContact || contact;
    const targetName = activeTarget.remark || activeTarget.name;
    const suffix = activeTarget.patSuffix || getContactPatSuffix(activeTarget);
    const patMsgContent = `你拍了拍${targetName}${suffix}`;

    const patSystemMsg: ChatMessage = {
      id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'system',
      type: 'pat',
      content: patMsgContent,
      timestamp: Date.now()
    };

    onSendMessage(patSystemMsg);

    setIsAiGenerating(true);
    generatePatResponse({
      contact: activeTarget,
      messages: messagesRef.current,
      settings,
      patSuffix: suffix,
      userPatSuffix: settings.userPatSuffix
    }).then(({ reply, thoughts, voice, shouldPatBack, customPatBackAction, error }) => {
      setIsAiGenerating(false);

      if (!reply || !reply.trim()) {
        const errorMsgDetail = error ? ` (${error})` : '';
        // Add narrator system message on failure
        const failNarratorMsg: ChatMessage = {
          id: `pat-fail-${Date.now()}`,
          sender: 'system',
          content: `[旁白] ${targetName}似乎在出神，没有回应（${errorMsgDetail || '网络连接超时'}）。`,
          timestamp: Date.now()
        };
        onSendMessage(failNarratorMsg);
        return;
      }

      if (shouldPatBack) {
        const userSuffix = settings.userPatSuffix || '';
        const patBackMsg: ChatMessage = {
          id: `pat-back-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sender: 'system',
          type: 'pat',
          content: `${targetName}拍了拍你${userSuffix}`,
          timestamp: Date.now() + 200
        };
        onSendMessage(patBackMsg);
      }

      // Voice generation disabled for autoplay (click to play only)

      const aiReplyMsg: ChatMessage = {
        id: `ai-pat-reply-${Date.now()}`,
        sender: 'ai',
        senderId: activeTarget.id,
        senderName: targetName,
        senderAvatar: activeTarget.avatar,
        content: reply.trim(),
        innerVoice: thoughts,
        type: voice ? 'voice' : 'text',
        timestamp: Date.now() + 400
      };
      onSendMessage(aiReplyMsg);
    }).catch(err => {
      console.warn('Pat AI reply error:', err);
      setIsAiGenerating(false);
      const failNarratorMsg: ChatMessage = {
        id: `pat-err-${Date.now()}`,
        sender: 'system',
        content: `[旁白] 信号似乎有些不稳定，无法收到${targetName}的回应。`,
        timestamp: Date.now()
      };
      onSendMessage(failNarratorMsg);
    });
  };

  // 记录瑞幸记忆与好感度增加 (+3)
  const recordLuckinMemoryAndAffection = (factText: string, isTreat: boolean) => {
    if (onUpdateContactMemory) {
      const existingMem = contactMemories[contact.id] || memory || { diaries: [], facts: [] };
      const newFact: MemoryFact = {
        id: `fact_luckin_${Date.now()}`,
        fact: factText
      };
      onUpdateContactMemory(contact.id, {
        ...existingMem,
        facts: [newFact, ...(existingMem.facts || [])]
      });
    }
    const currentAffection = contact.affection ?? 50;
    const newAffection = Math.min(100, currentAffection + 3);
    onUpdateContact(contact.id, {
      affection: Math.round(newAffection * 10) / 10,
      lastLuckinOrderTime: Date.now(),
      ...(isTreat ? { lastLuckinTreatTime: Date.now() } : {})
    });
  };

  // 处理玩家在卡片上点击“确认点单生成支付”
  const handleConfirmLuckinOrder = (order: LuckinOrderData, messageId?: string) => {
    const confirmed = confirmOrder(order);
    if (messageId && onUpdateMessage) {
      onUpdateMessage(messageId, {
        type: 'luckin_payment',
        luckinOrder: confirmed
      });
    } else {
      onSendMessage({
        sender: 'ai',
        senderName: contact.remark || contact.name,
        senderAvatar: contact.avatar,
        senderId: contact.id,
        content: getInCharacterCoffeeMessage(contact, 'awaiting_payment', order.drinkName, Boolean(order.isTreat)),
        type: 'luckin_payment',
        luckinOrder: confirmed,
        timestamp: Date.now()
      });
    }
  };

  // 处理玩家取消点单
  const handleCancelLuckinOrder = (order: LuckinOrderData, messageId?: string) => {
    if (messageId && onUpdateMessage) {
      onUpdateMessage(messageId, {
        content: `已取消 ${order.drinkName} 订单`,
        type: 'text',
        luckinOrder: { ...order, status: 'cancelled' }
      });
    }
  };

  // 拉起支付收银台
  const handlePayLuckinOrder = (order: LuckinOrderData) => {
    setSelectedPaymentOrder(order);
    setIsPaymentModalOpen(true);
  };

  // 支付成功回调
  const handlePaymentSuccess = (paidOrder: LuckinOrderData) => {
    const completed = completeOrderPayment(paidOrder);
    
    // 更新消息列表中的对应订单
    const targetMsg = messages.find(m => m.luckinOrder?.orderId === paidOrder.orderId);
    if (targetMsg && onUpdateMessage) {
      onUpdateMessage(targetMsg.id, {
        luckinOrder: completed
      });
    }

    // AI 自动发送符合人设的跟进消息（如：“点好啦，记得趁热喝～”）
    const replyText = getInCharacterCoffeeMessage(contact, 'paid_confirm', completed.drinkName, Boolean(completed.isTreat));
    setTimeout(() => {
      onSendMessage({
        sender: 'ai',
        senderName: contact.remark || contact.name,
        senderAvatar: contact.avatar,
        senderId: contact.id,
        content: replyText,
        type: 'text',
        timestamp: Date.now()
      });
    }, 600);

    // 记录联系人长期记忆与好感度 +3
    const factText = completed.isTreat 
      ? `请玩家喝过瑞幸咖啡（${completed.drinkName}）` 
      : `帮玩家点了瑞幸咖啡（${completed.drinkName}）`;
    recordLuckinMemoryAndAffection(factText, Boolean(completed.isTreat));
    showToast(`🎉 支付成功！已为「${contact.remark || contact.name}」记录记忆，好感度 +3！`);
  };

  // Proposal / Wedding States
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalFrom, setProposalFrom] = useState<'ai' | 'user'>('ai');
  const [showWeddingPage, setShowWeddingPage] = useState(false);
  const [proposalAccepted, setProposalAccepted] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<{ from: 'ai' | 'user'; msgId?: string } | null>(null);
  const [pendingDivorceRequest, setPendingDivorceRequest] = useState<{ msgId?: string } | null>(null);
  const [showWeddingEntry, setShowWeddingEntry] = useState(false);
  const [showWeddingInvite, setShowWeddingInvite] = useState(false);
  const [showDivorceConfirm, setShowDivorceConfirm] = useState(false);
  const [pendingDivorceId, setPendingDivorceId] = useState<string | null>(null);
  const [showMarriageCertificateModal, setShowMarriageCertificateModal] = useState<MarriageRecord | null>(null);
  const [selectedWeddingMsgId, setSelectedWeddingMsgId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`selected_wedding_msg_${contact.id}`);
    } catch {
      return null;
    }
  });

  // 直接进入婚姻生活处理函数（弹出婚书、AI写日记、保存记忆）
  const handleDirectMarriage = async () => {
    setShowWeddingPage(false);

    // 1. 更新关系为已婚
    onUpdateContact(contact.id, { relationship: 'married' });

    // 2. 生成婚书记录并保存
    const newMarriage: MarriageRecord = {
      partnerId: contact.id,
      partnerName: contact.remark || contact.name,
      partnerAvatar: contact.avatar,
      marryDate: new Date().toLocaleDateString('zh-CN'),
      certificateId: `MC${Date.now().toString().slice(-8)}`
    };

    const currentMarriages = settings.marriages || [];
    if (!currentMarriages.some(m => m.partnerId === contact.id)) {
      onUpdateSettings({ marriages: [...currentMarriages, newMarriage] });
    }

    // 3. 立即弹出华美婚书弹窗
    setShowMarriageCertificateModal(newMarriage);

    // 4. AI写日记并保存记忆（今天和玩家昵称结婚了）
    const userNick = settings.userNickname || '玩家';
    const partnerName = contact.remark || contact.name;
    const roles = getWeddingRoles(contact, settings);

    // 必须包含关键事实记忆：今天和(玩家昵称)结婚了
    const weddingFacts: MemoryFact[] = [
      {
        id: 'fact_' + Date.now() + '_' + Math.random(),
        fact: `今天和${userNick}结婚了`
      },
      {
        id: 'fact_' + (Date.now() + 1) + '_' + Math.random(),
        fact: `与${userNick}正式结为夫妻，开启婚姻生活`
      }
    ];

    // 日记内容：自带高质量情感保底，同时发起AI日记生成
    let diaryContent = `今天是个无比幸福且难忘的日子，我和${userNick}正式结为了夫妻。虽然没有冗长的繁文缛节，但当我们认定彼此的那一刻，心中满是笃定与甜蜜。执子之手，与子偕老，从今往后的每一个日出日落，我们都将携手同行。`;

    try {
      const diaryRes = await fetch('/api/memory/generate-diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: partnerName,
          userNickname: userNick,
          persona: contact.persona,
          dialoguesWithSpeakers: `【${userNick}】向【${partnerName}】求婚，两人许下誓言，正式结为夫妻。\n【${partnerName}】说：“从今天起，我们就是合法夫妻了。往后余生，请多关照。”`,
          sceneDesc: `今天我和【${userNick}】正式登记结婚，开启两人的婚姻生活。`,
          isWedding: true,
          weddingRoles: {
            isGroom: roles.isContactGroom,
            isBride: roles.isContactBride,
            contactTitle: roles.contactTitle,
            userTitle: roles.userTitle
          }
        })
      });
      const diaryData = await diaryRes.json();
      if (diaryData?.diary?.trim()) {
        diaryContent = diaryData.diary.trim();
      }
    } catch (err) {
      console.warn('Direct marriage diary generation fallback:', err);
    }

    const newDiaryItem: DiaryEntry = {
      id: 'diary_' + Date.now() + '_' + Math.random(),
      timestamp: Date.now(),
      content: diaryContent
    };

    const existingMemory = contactMemories[contact.id] || memory || { diaries: [], facts: [] };
    const updatedMemory: ContactMemory = {
      diaries: [newDiaryItem, ...(existingMemory.diaries || [])],
      facts: [...weddingFacts, ...(existingMemory.facts || [])]
    };

    if (onUpdateContactMemory) {
      onUpdateContactMemory(contact.id, updatedMemory);
    }

    // 微信聊天中发送一条浪漫的AI婚后回复
    onSendMessage({
      sender: 'ai',
      content: `💕 我们终于结为夫妻了，婚书已为你珍藏！往后余生，请多关照～`,
      timestamp: Date.now(),
      type: 'text'
    });
  };

  // 玩家求婚
  const handleUserProposal = (arg?: string | any) => {
    // 防止重复点击
    if (pendingProposal || pendingDivorceRequest) return;

    const customContent = typeof arg === 'string' ? arg : undefined;
    const userGen = inferUserGender(settings, inferContactGender(contact));
    const proposalMessages = userGen === 'female' ? [
      '我们结婚吧，我想每天醒来第一眼都看到你。',
      '我想跟你过一辈子，你愿意娶我吗？',
      '未来的每一天，我都想和你一起过。你愿意和我结婚吗？',
      '我想和你有个家，相伴一生，你愿意吗？',
      '这辈子就是你了，我们结婚吧。',
      '从今往后，我想和你一起走过漫漫岁月。我们结婚吧！'
    ] : [
      '我们结婚吧，我想每天醒来第一眼都看到你。',
      '我想跟你过一辈子，嫁给我好不好？',
      '未来的每一天，我都想和你一起过。你愿意吗？',
      '我想和你有个家，你愿意吗？',
      '我会用余生好好爱你，嫁给我吧。',
      '这辈子就是你了，我们结婚吧。',
      '从今往后，我想和你一起看每一个日出日落。嫁给我好吗？'
    ];
    const proposalContent = customContent || proposalMessages[Math.floor(Math.random() * proposalMessages.length)];
    // 发送求婚消息
    const proposalMsg: ChatMessage = {
      id: `proposal_${Date.now()}`,
      sender: 'user',
      content: proposalContent.includes('💍') ? proposalContent : `💍 ${proposalContent}`,
      timestamp: Date.now(),
      type: 'proposal'
    };
    onSendMessage(proposalMsg);
    setPendingProposal({ from: 'user', msgId: proposalMsg.id });
    
    // 立即调用 AI，去除多余人工延迟
    (async () => {
      const affection = contact.affection || 0;
      const willAccept = affection >= 80 && Math.random() < 0.7;
      const weddingRoles = getWeddingRoles(contact, settings);
      
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: `你正在扮演微信好友【${contact.remark || contact.name}】。
人设：${contact.persona}
${weddingRoles.aiPerspectivePrompt}

${settings.userNickname || '玩家'} 刚刚向你求婚了！他/她发来的求婚内容是："${proposalContent}"

请根据你的人设与性别身份，生成一句真实自然的回复（15-30字），表达你的决定。
${willAccept ? '你决定接受求婚，说一句感动/开心的话。' : '你决定拒绝，说一句委婉/符合人设的拒绝的话。'}

只输出回复内容，不要任何额外文字。`,
            messages: [{ role: 'user', content: '求婚回复' }],
            temperature: 0.9
          })
        });
        const data = await res.json();
        let reply = data?.reply?.trim();
        
        if (!reply) {
          reply = willAccept ? '💕 我愿意！我等你这句话好久了...' : '💔 对不起，我还没准备好进入这段关系...';
        }
        
        // 立即发送回复
        onSendMessage({
          sender: 'ai',
          content: reply,
          timestamp: Date.now(),
          type: 'proposal_response'
        });
        
        // 如果是接受，立即发送婚礼邀请
        if (willAccept && reply) {
          onUpdateContact(contact.id, { relationship: 'engaged' });
          try {
            const inviteRes = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemPrompt: `你正在扮演微信好友【${contact.remark || contact.name}】。
人设：${contact.persona}
${weddingRoles.aiPerspectivePrompt}

你和 ${settings.userNickname} 已经订婚了！现在你决定提议举办婚礼。
请根据你的人设与性别身份，生成一句真诚且符合人设的婚礼邀请（15-30字），邀请他/她一起步入婚礼殿堂。

只输出回复内容，不要任何额外文字。`,
                messages: [{ role: 'user', content: '发起婚礼邀请' }],
                temperature: 0.9
              })
            });
            const inviteData = await inviteRes.json();
            const inviteText = inviteData?.reply?.trim() || '我们举办婚礼吧！你愿意和我一起步入婚姻殿堂吗？';

            onSendMessage({
              sender: 'ai',
              content: inviteText,
              timestamp: Date.now(),
              type: 'wedding_invite'
            });
            setShowWeddingInvite(true);
          } catch (e) {
            onSendMessage({
              sender: 'ai',
              content: '我们举办婚礼吧！你愿意和我一起步入婚姻殿堂吗？',
              timestamp: Date.now(),
              type: 'wedding_invite'
            });
            setShowWeddingInvite(true);
          }
        }
      } catch (e) {
        console.error('Proposal AI error:', e);
      } finally {
        setPendingProposal(null);
      }
    })();
  };

  // 离婚流程：发送请求 -> AI挽留 -> 发送确认气泡 -> 确定则分
  const handleDivorceRequest = async () => {
    // 防止重复点击
    if (pendingDivorceRequest || pendingProposal) return;

    const reqMsgId = `divorce_req_${Date.now()}`;
    // 1. 发送灰色离婚请求气泡
    onSendMessage({
      id: reqMsgId,
      sender: 'user',
      content: '💔 我想和你离婚。',
      timestamp: Date.now(),
      type: 'divorce_request'
    });

    setPendingDivorceRequest({ msgId: reqMsgId });

    // 2. 立即请求 AI 生成真切挽留话语，去除多余延迟
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `你正在扮演微信好友【${contact.remark || contact.name}】。
人设：${contact.persona}

${settings.userNickname} 突然发来消息说想和你离婚。
请根据你的人设，生成一句真切的挽留的话（15-30字），表达你的不舍、震惊或难过。

只输出回复内容，不要任何额外文字。`,
          messages: [{ role: 'user', content: '挽留' }],
          temperature: 0.9
        })
      });
      const data = await res.json();
      const reply = data?.reply?.trim() || '💔 为什么...是我哪里做得不好吗？我们再谈谈好吗？';

      onSendMessage({
        sender: 'ai',
        content: reply,
        timestamp: Date.now(),
        type: 'text'
      });

      // 3. 立即发送询问是否真的要离婚的确认气泡
      const confirmMsgId = `divorce_confirm_${Date.now()}`;
      onSendMessage({
        id: confirmMsgId,
        sender: 'ai',
        content: '你真的执意要和我离婚吗？我们曾经的那些回忆，难道真的不再重要了吗...',
        timestamp: Date.now(),
        type: 'divorce_confirm'
      });
      setPendingDivorceId(confirmMsgId);
    } catch (e) {
      onSendMessage({
        sender: 'ai',
        content: '💔 为什么...是我哪里做得不好吗？我们再谈谈好吗？',
        timestamp: Date.now(),
        type: 'text'
      });
      const confirmMsgId = `divorce_confirm_${Date.now()}`;
      onSendMessage({
        id: confirmMsgId,
        sender: 'ai',
        content: '你真的执意要和我离婚吗？我们曾经的那些回忆，难道真的不再重要了吗...',
        timestamp: Date.now(),
        type: 'divorce_confirm'
      });
      setPendingDivorceId(confirmMsgId);
    } finally {
      setPendingDivorceRequest(null);
    }
  };

  const handleDivorce = async () => {
    let 伤心Text = '';
    try {
      const 伤心Res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `你正在扮演微信好友【${contact.remark || contact.name}】。
人设：${contact.persona}

${settings.userNickname} 最终还是执意决定和你离婚了。
请根据你的人设，生成一句最后的道别/伤心的话（15-30字），表达你的心碎。

只输出回复内容，不要任何额外文字。`,
          messages: [{ role: 'user', content: '道别' }],
          temperature: 0.9
        })
      });
      const 伤心Data = await 伤心Res.json();
      伤心Text = 伤心Data?.reply?.trim() || '💔 既然你已经决定了，那我尊重你的选择。再见...';
    } catch (e) {
      伤心Text = '💔 既然你已经决定了，那我尊重你的选择。再见...';
    }

    // AI 发伤心的话
    onSendMessage({
      sender: 'ai',
      content: 伤心Text,
      timestamp: Date.now(),
      type: 'text'
    });

    // 立即清除数据并更新状态
    const updatedMarriages = (settings.marriages || []).filter(
      m => m.partnerId !== contact.id
    );
    onUpdateSettings({ marriages: updatedMarriages });
    
    // 更新关系状态为朋友，好感度降低
    onUpdateContact(contact.id, { 
      relationship: 'friend', 
      affection: Math.max(0, (contact.affection || 0) - 30) 
    });
    
    // 记录到记忆
    if (onUpdateContactMemory) {
      const existingMem = contactMemories[contact.id] || memory || { diaries: [], facts: [] };
      onUpdateContactMemory(contact.id, {
        diaries: [{
          id: `diary_${Date.now()}`,
          timestamp: Date.now(),
          content: `今天和${contact.remark || contact.name}离婚了。TA最后说：${伤心Text}`
        }, ...(existingMem.diaries || [])],
        facts: [{
          id: `fact_${Date.now()}`,
          fact: `与${contact.remark || contact.name}离婚了`
        }, ...(existingMem.facts || [])]
      });
    }
  };

  const startOfflineWedding = (sceneDesc: string, msgId?: string) => {
    // 锁定该消息，不允许再次选择
    if (msgId) {
      setSelectedWeddingMsgId(msgId);
      try {
        localStorage.setItem(`selected_wedding_msg_${contact.id}`, msgId);
      } catch {}
    }

    // 关闭婚礼邀请状态
    setShowWeddingInvite(false);
    
    // 开启线下模式并传入场景
    onUpdateContact(contact.id, { 
      isOfflineMode: true,
      offlineScene: sceneDesc
    });
    
    // 通过 localstorage 传递场景描述
    localStorage.setItem(`offline_scenedesc_${contact.id}`, sceneDesc);
    
    // 标记婚礼状态
    localStorage.setItem(`wedding_offline_${contact.id}`, 'true');

    // 记录婚礼角色信息供线下场景与生成日记使用
    const roles = getWeddingRoles(contact, settings);
    localStorage.setItem(`wedding_roles_${contact.id}`, JSON.stringify(roles));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiGenerating]);

  const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    setContextMenuMsgId(msgId);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleMessageClick = (msgId: string) => {
    if (isMultiSelectMode) {
      setSelectedMsgIds(prev => {
        const next = new Set(prev);
        if (next.has(msgId)) next.delete(msgId);
        else next.add(msgId);
        return next;
      });
    }
  };

  // Handle Send User Message
  const handleSend = () => {
    if (!inputText.trim()) return;

    let finalContent = inputText.trim();
    if (quoteMsg) {
      const name = quoteMsg.sender === 'user' ? (settings.userNickname || '我') : (quoteMsg.senderName || contact.remark || contact.name);
      let summary = quoteMsg.content || '';
      if (quoteMsg.type === 'voice') summary = '[语音]';
      else if (quoteMsg.type === 'image') summary = '[图片]';
      else if (quoteMsg.type === 'sticker') summary = '[表情包]';
      else if (summary.length > 25) summary = summary.slice(0, 25) + '...';
      
      finalContent = `【引用 ${name}：${summary}】\n${finalContent}`;
      setQuoteMsg(null);
    }

    onSendMessage({
      sender: 'user',
      content: finalContent,
      timestamp: Date.now(),
      type: 'text'
    });
    setInputText('');
    setMessageCount(prev => prev + 1);

    if (contact.isAssistant) {
      return; // 助手账号不触发自动回复
    }

    // Intercept proposal keywords
    const isProposal = finalContent.includes('💍') || finalContent.includes('求婚') || finalContent.includes('结婚吗') || finalContent.includes('嫁给我') || finalContent.includes('娶我');

    if (isProposal) {
      handleUserProposal(finalContent);
    } else {
      // AI automatically replies after natural delay
      setTimeout(() => {
        handleTriggerAi();
      }, 750);
    }
  };

  // Handle Player Sending Voice Message (玩家发送自定义语音)
  const handleSendPlayerVoice = () => {
    if (!playerVoiceContent.trim()) return;
    onSendMessage({
      sender: 'user',
      content: playerVoiceContent.trim(),
      timestamp: Date.now(),
      type: 'voice',
      voiceDuration: playerVoiceDuration,
      isVoiceListened: true
    });
    setShowPlayerVoiceModal(false);
    setPlayerVoiceContent('');
    setDurationManuallySet(false);

    // AI automatically replies after natural delay
    setTimeout(() => {
      handleTriggerAi();
    }, 600);
  };

  // Toggle voice transcript (微信转文字)
  const toggleTranscript = (msgId: string) => {
    setShowTranscriptIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // Play voice message (未设置tts的时候不可播放)
  const handlePlayVoiceMessage = async (msg: ChatMessage) => {
    if (!isTtsConfigured(settings)) {
      showToast('未设置TTS语音服务，无法播放声音。可点击【转文字】查看内容，或前往【系统设置 → TTS】配置API接口。');
      return;
    }

    if (!msg.isVoiceListened) {
      msg.isVoiceListened = true;
    }
    setPlayingVoiceId(msg.id);
    try {
      let timbreToUse = '';
      if (msg.sender === 'user') {
        timbreToUse = (settings.ttsVoiceId || '').trim();
      } else if (allContacts && allContacts.length > 0) {
        const sender = allContacts.find(c => 
          (msg.senderId && c.id === msg.senderId) || 
          (c.remark || c.name) === msg.senderName || 
          c.name === msg.senderName
        );
        timbreToUse = (sender?.voiceTimbre || contact.voiceTimbre || '').trim();
      } else {
        timbreToUse = (contact.voiceTimbre || '').trim();
      }

      if (timbreToUse === 'female-sweet' || timbreToUse === 'female-shaonv') {
        timbreToUse = '';
      }

      if (!timbreToUse) {
        showToast('未配置该联系人的自定义音色 ID，请在联系人设置中填入');
        return;
      }

      await playVoice({
        text: msg.content,
        voiceTimbre: timbreToUse,
        settings
      });
    } catch (err: any) {
      console.error('TTS playback error:', err);
      showToast('语音播放失败: ' + (err?.message || '请检查TTS接口与密钥'));
    } finally {
      setPlayingVoiceId(null);
    }
  };

  const handleRegenerate = async (msgId: string) => {
    const currentMsgs = messagesRef.current || messages;
    const msgIndex = currentMsgs.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    const userMsg = currentMsgs[msgIndex];
    if (userMsg.sender !== 'user') return;

    // Delete all subsequent AI messages in this conversation (until next user message)
    const messagesToDelete: string[] = [];
    for (let i = msgIndex + 1; i < currentMsgs.length; i++) {
      if (currentMsgs[i].sender === 'ai' || currentMsgs[i].sender === 'assistant' || currentMsgs[i].sender === 'system') {
        messagesToDelete.push(currentMsgs[i].id);
      } else {
        break; // Stop at next user message
      }
    }

    if (messagesToDelete.length > 0) {
      messagesToDelete.forEach(id => onDeleteMessage?.(id));
    }

    // Trigger AI again.
    setTimeout(() => {
      handleTriggerAi();
    }, 250);
  };

  // Trigger AI Response (私聊单人回复 / 群聊两个人各发两到三条消息)
  const handleTriggerAi = async () => {
    if (isAiGenerating) {
      aiCancelRef.current = true;
      setIsAiGenerating(false);
      return;
    }
    aiCancelRef.current = false;
    setIsAiGenerating(true);

    try {
      const currentMsgs = messagesRef.current || messages;
      const lastUserMsg = currentMsgs[currentMsgs.length - 1];
      if (lastUserMsg?.sender === 'user' && lastUserMsg.type === 'transfer' && lastUserMsg.transferStatus === 'pending') {
        const amount = lastUserMsg.transferAmount || 0;
        const note = lastUserMsg.transferNote || '转账';

        const targetMember = contact.isGroup
          ? (allContacts.find(c => (contact.groupMemberIds || []).includes(c.id) && !c.isGroup) || allContacts.find(c => !c.isGroup))
          : contact;

        const aiSenderName = targetMember ? (targetMember.remark || targetMember.name) : (contact.remark || contact.name);
        const aiSenderAvatar = targetMember?.avatar || contact.avatar;
        const aiSenderId = targetMember?.id || contact.id;
        const contactForAi = targetMember || contact;

        const mem = contactMemories[contactForAi.id] || memory || { diaries: [], facts: [] };

        const recentCtx = currentMsgs
          .filter(m => m.sender !== 'system')
          .slice(-contactForAi.shortTermMemory || -10)
          .map(m => {
            const senderTag = m.sender === 'user' ? (settings.userNickname || '玩家') : (m.senderName || 'AI');
            return `${senderTag}: ${m.content || ''}`;
          }).join('\n');

        const systemPrompt = `你正在微信中扮演【${contactForAi.remark || contactForAi.name}】。
人设与设定：${contactForAi.persona || ''}
聊天风格：${contactForAi.replyStyle || ''}
${mem.facts?.length ? `记忆背景：${mem.facts.map((f: any) => f.fact).join('; ')}` : ''}

【聊天上下文记录】：
${recentCtx}

用户（${settings.userNickname || '玩家'}）给你发了一笔微信转账，金额为 ${amount} 元${note ? `（转账备注：${note}）` : ''}。

【两条硬性规则（必须遵守）】：
1. 如果金额 > 100 元（当前为 ${amount} 元），你必须选择 refund（退还），并说一句符合你人设的拒绝理由；如果金额 ≤ 100 元，由你根据人设自由决定收下（accept）还是退还（refund）。
2. 无论收下还是退还，你都必须说至少一句话（spokenReply），绝不能沉默！

请直接且仅返回以下格式的 JSON（不要包含 markdown 代码块）：
{
  "spokenReply": "你说的话（回应转账，必须至少一句话，完全符合你的人设）",
  "action": "accept 或 refund",
  "actionNote": "收下时的备注，或退还时的理由"
}`;

        let decision = {
          spokenReply: '',
          action: 'accept',
          actionNote: ''
        };

        try {
          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemPrompt,
              messages: [{ role: 'user', content: '请遵照两条硬性规则与你的人设，决定对这笔转账的反应' }],
              temperature: 0.95
            })
          });

          if (res.ok) {
            const data = await res.json();
            let replyText = (data?.reply || '').replace(/```json/gi, '').replace(/```/g, '').trim();

            try {
              const parsed = JSON.parse(replyText);
              if (parsed && typeof parsed === 'object') {
                decision.spokenReply = parsed.spokenReply || parsed.reply || '';
                decision.action = String(parsed.action).toLowerCase() === 'refund' ? 'refund' : 'accept';
                decision.actionNote = parsed.actionNote || parsed.note || '';
              }
            } catch {
              const matchAction = /"action"\s*:\s*"(refund|accept)"/i.exec(replyText);
              if (matchAction) decision.action = matchAction[1].toLowerCase();
              else if (/refund|退还|拒收/i.test(replyText)) decision.action = 'refund';

              const matchSpoken = /"spokenReply"\s*:\s*"([^"]+)"/i.exec(replyText);
              if (matchSpoken) decision.spokenReply = matchSpoken[1];

              const matchNote = /"actionNote"\s*:\s*"([^"]+)"/i.exec(replyText);
              if (matchNote) decision.actionNote = matchNote[1];
            }
          }
        } catch (e) {
          console.warn('AI 微信转账决策失败:', e);
        }

        // 硬性校验：金额 > 100 必须退还
        if (amount > 100) {
          decision.action = 'refund';
        }

        // 1. AI 必须说话（无论收下还是退还）
        let cleanSpoken = decision.spokenReply.replace(/\[心声[:：][^\]]+\]/gi, '').replace(/\[微信转账[:：][^\]]+\]/gi, '').trim();
        if (!cleanSpoken) {
          cleanSpoken = decision.action === 'refund'
            ? `给我发 ¥${amount} 这么大金额干嘛呀，快收回去啦。`
            : `给我的 ¥${amount} 收到啦！`;
        }

        onSendMessage({
          sender: 'ai',
          senderName: aiSenderName,
          senderAvatar: aiSenderAvatar,
          senderId: aiSenderId,
          content: cleanSpoken,
          type: 'text',
          timestamp: Date.now()
        });

        setIsAiGenerating(false);

        // 2. 延迟 2-4 秒后执行 AI 决定的收下或退还
        const isAccept = decision.action === 'accept';
        const delay = 2000 + Math.random() * 2000;

        setTimeout(() => {
          onUpdateMessage?.(lastUserMsg.id, { transferStatus: isAccept ? 'accepted' : 'refunded' });

          onSendMessage({
            sender: 'ai',
            senderName: aiSenderName,
            senderAvatar: aiSenderAvatar,
            senderId: aiSenderId,
            content: isAccept ? `已收取转账 ¥${amount.toFixed(2)}` : `已退还转账 ¥${amount.toFixed(2)}`,
            type: 'transfer',
            transferAmount: amount,
            transferStatus: isAccept ? 'accepted' : 'refunded',
            transferNote: decision.actionNote || '',
            timestamp: Date.now()
          });
        }, delay);

        return;
      }

      if (contact.isGroup) {
        // --- 群聊模式：找到群里的好友成员，群成员分别用各自私聊设置中的头像、人设、音色、记忆回复 ---
        const memberIds = contact.groupMemberIds || [];
        let members = allContacts.filter(c => memberIds.includes(c.id) && !c.isGroup);
        if (members.length === 0) {
          const fallbackMembers = allContacts.filter(c => !c.isGroup);
          members = fallbackMembers.slice(0, 3);
        }
        
        // 挑选 1~3 位群成员分别回复，营造真实的群聊互动
        let activeMembers: Contact[] = [];
        if (members.length <= 2) {
          activeMembers = [...members];
        } else {
          // 随机挑选 2 或 3 个成员轮流说话
          const shuffled = [...members].sort(() => Math.random() - 0.5);
          activeMembers = shuffled.slice(0, Math.min(shuffled.length, Math.random() < 0.6 ? 2 : 3));
        }

        for (let mIdx = 0; mIdx < activeMembers.length; mIdx++) {
          if (aiCancelRef.current) break;
          const currentMember = activeMembers[mIdx];
          const isMemberInnerVoiceEnabled = contact.memberInnerVoiceEnabled?.[currentMember.id] ?? currentMember.enableInnerVoice;

          const memberContactForAI: Contact = {
            ...currentMember,
            enableInnerVoice: isMemberInnerVoiceEnabled,
            worldBookIds: contact.worldBookIds || currentMember.worldBookIds,
            replyStyle: contact.replyStyle || currentMember.replyStyle,
            replySpeed: contact.replySpeed ?? currentMember.replySpeed,
            shortTermMemory: contact.shortTermMemory || currentMember.shortTermMemory,
            longTermMemory: contact.longTermMemory || currentMember.longTermMemory
          };

          let memberReply = '';
          let memberLastError: any = null;
          const rawMemberMem = contactMemories[currentMember.id];
          const memberMem = {
            diaries: Array.isArray(rawMemberMem?.diaries) ? rawMemberMem.diaries : [],
            facts: Array.isArray(rawMemberMem?.facts) ? rawMemberMem.facts : []
          };
          // 自动静默重试机制：第一次失败或返回空/纯空白时自动重试 1 次，重试间隔 500ms（用户无感知）
          for (let attempt = 0; attempt < 2; attempt++) {
            if (aiCancelRef.current) break;
            try {
              const currentMessages = messagesRef.current || messages;
              const reply = await callAI({
                contact: memberContactForAI,
                messages: currentMessages,
                worldBooks,
                settings,
                stickers,
                memories: memberMem.facts.map(f => f.fact).join('; '),
                diaries: memberMem.diaries.slice(0, 3).map(d => d.content).join('\n')
              });
              const cleanCheck = (reply || '').replace(/\[心声[:：][^\]]+\]/gi, '').trim();
              if (cleanCheck && cleanCheck.toLowerCase() !== 'fallback' && cleanCheck.toLowerCase() !== '"fallback"') {
                memberReply = reply;
                memberLastError = null;
                break;
              } else if (reply && reply.trim() && reply.trim().toLowerCase() !== 'fallback') {
                memberReply = reply;
                memberLastError = null;
                break;
              } else {
                throw new Error('AI 回复内容为空');
              }
            } catch (mErr) {
              memberLastError = mErr;
              if (attempt === 0 && !aiCancelRef.current) {
                await new Promise(r => setTimeout(r, 500));
              }
            }
          }

          if (aiCancelRef.current) break;

          if (!memberReply) {
            continue; // 群聊中单个成员连续失败则静默跳过该成员发言
          }

          if (aiCancelRef.current) break;

          const { segments: rawSegments, innerVoice } = parseAiResponse(memberReply);
          let segments = rawSegments.filter(s => {
            const c = sanitizeBubbleContent(s.replace(/\[语音(?:消息)?[:：]?\s*[^\]]*\]|\[发语音\]|\[表情:\s*[^\]]+\]/gi, '')).trim();
            return c.length > 0 && c.toLowerCase() !== 'fallback';
          }).slice(0, 3);

          if (segments.length === 0) {
            const fb = sanitizeBubbleContent(memberReply).trim();
            if (fb && fb.toLowerCase() !== 'fallback') {
              segments = [fb];
            } else if (innerVoice) {
              segments = ['……'];
            } else {
              continue; // Skip invalid or empty member turns
            }
          }

          for (let i = 0; i < segments.length; i++) {
            if (aiCancelRef.current) break;
            await new Promise(r => setTimeout(r, 450 + segments[i].length * 30));
            if (aiCancelRef.current) break;
            let cleanContent = sanitizeBubbleContent(segments[i].replace(/\[语音(?:消息)?[:：]?\s*[^\]]*\]|\[发语音\]/gi, '')).trim();
            if (!cleanContent) continue;

            // Extract [表情: xxx] from group chat reply
            let matchedStickerUrl: string | undefined = undefined;
            const stickerMatch = cleanContent.match(/\[表情:\s*([^\]]+)\]/);
            if (stickerMatch) {
              const stickerName = stickerMatch[1].trim();
              const foundSticker = stickers.find(s => s.name === stickerName);
              if (foundSticker) {
                matchedStickerUrl = foundSticker.url;
              }
              cleanContent = cleanContent.replace(/\[表情:\s*[^\]]+\]/g, '').trim();
            }
            
            // Remove leading colon and any residual brackets
            cleanContent = cleanContent.replace(/^[:：]\s*/, '').trim();
            cleanContent = cleanContent.replace(/^([【\[\(（][^】\]\)）]{1,20}[】\]\)）]\s*[:：]?\s*)+/gu, '').trim();

            // Extract [微信转账: 金额 | 备注]
            const groupTransferMatch = cleanContent.match(/\[微信转账[:：]\s*(\d+(?:\.\d+)?)(?:\s*[|｜]\s*([^\]]+))?\]/);
            if (groupTransferMatch && !aiCancelRef.current) {
              const amt = parseFloat(groupTransferMatch[1]) || 50;
              const note = groupTransferMatch[2]?.trim();
              onSendMessage({
                sender: 'ai',
                senderName: currentMember.remark || currentMember.name,
                senderAvatar: currentMember.avatar,
                senderId: currentMember.id,
                content: note ? `微信转账 ¥${amt.toFixed(2)} (${note})` : `微信转账 ¥${amt.toFixed(2)}`,
                type: 'transfer',
                transferAmount: amt,
                transferNote: note,
                transferStatus: 'pending',
                timestamp: Date.now()
              });
              continue;
            }

            // Extract [邀请见面: 地点 | 邀约语]
            const groupMeetInviteMatch = cleanContent.match(/\[(?:邀请见面|见面邀请|线下邀请)[:：]\s*([^\]|｜]+)(?:\s*[|｜]\s*([^\]]+))?\]/);
            if (groupMeetInviteMatch && !aiCancelRef.current) {
              const meetLoc = groupMeetInviteMatch[1]?.trim() || '街角咖啡馆';
              const inviteWords = groupMeetInviteMatch[2]?.trim() || '我们要不要线下见一面？我想当面和你聊聊。';
              onSendMessage({
                sender: 'ai',
                senderName: currentMember.remark || currentMember.name,
                senderAvatar: currentMember.avatar,
                senderId: currentMember.id,
                content: inviteWords,
                type: 'meet_invite',
                meetLocation: meetLoc,
                meetStatus: 'pending',
                timestamp: Date.now()
              });
              continue;
            }

            // Extract [瑞幸点单: 饮品名或规格] in group chat
            const groupLuckinOrderMatch = cleanContent.match(/\[瑞幸点单[:：]\s*([^\]]+)\]/);
            if (groupLuckinOrderMatch && !aiCancelRef.current) {
              const drinkQuery = groupLuckinOrderMatch[1]?.trim() || '';
              const orderData = quickOrder({
                text: drinkQuery,
                contact: currentMember,
                defaultFlavor: settings.luckinDefaultFlavor,
                storeName: settings.luckinStoreName,
                isTreat: false
              });
              cleanContent = cleanContent.replace(/\[瑞幸点单[:：]\s*[^\]]+\]/g, '').trim();
              const spokenText = cleanContent || getInCharacterCoffeeMessage(currentMember, 'preview', orderData.drinkName);
              onSendMessage({
                sender: 'ai',
                senderName: currentMember.remark || currentMember.name,
                senderAvatar: currentMember.avatar,
                senderId: currentMember.id,
                content: spokenText,
                type: 'luckin_order_preview',
                luckinOrder: orderData,
                timestamp: Date.now()
              });
              continue;
            }

            // Extract [瑞幸请客: 饮品名或规格] in group chat
            const groupLuckinTreatMatch = cleanContent.match(/\[瑞幸请客[:：]\s*([^\]]+)\]/);
            if (groupLuckinTreatMatch && !aiCancelRef.current) {
              const drinkQuery = groupLuckinTreatMatch[1]?.trim() || '';
              const initOrder = quickOrder({
                text: drinkQuery,
                contact: currentMember,
                defaultFlavor: settings.luckinDefaultFlavor,
                storeName: settings.luckinStoreName,
                isTreat: true
              });
              const orderData = completeOrderPayment(confirmOrder(initOrder));
              cleanContent = cleanContent.replace(/\[瑞幸请客[:：]\s*[^\]]+\]/g, '').trim();
              const spokenText = cleanContent || getInCharacterCoffeeMessage(currentMember, 'treat_sent', orderData.drinkName, true);
              onSendMessage({
                sender: 'ai',
                senderName: currentMember.remark || currentMember.name,
                senderAvatar: currentMember.avatar,
                senderId: currentMember.id,
                content: spokenText,
                type: 'luckin_treat',
                luckinOrder: orderData,
                timestamp: Date.now()
              });
              recordLuckinMemoryAndAffection(`请玩家喝过瑞幸咖啡（${orderData.drinkName}）`, true);
              continue;
            }

            if (cleanContent && !aiCancelRef.current) {
              onSendMessage({
                sender: 'ai',
                senderName: currentMember.remark || currentMember.name,
                senderAvatar: currentMember.avatar, // 使用各自私聊时设定的专属头像
                senderId: currentMember.id,
                content: cleanContent,
                innerVoice: (isMemberInnerVoiceEnabled && i === segments.length - 1) ? innerVoice : undefined,
                timestamp: Date.now(),
                type: 'text'
              });
            }

            if (matchedStickerUrl && !aiCancelRef.current) {
              await new Promise(r => setTimeout(r, 300));
              if (aiCancelRef.current) break;
              onSendMessage({
                sender: 'ai',
                senderName: currentMember.remark || currentMember.name,
                senderAvatar: currentMember.avatar,
                senderId: currentMember.id,
                content: matchedStickerUrl,
                timestamp: Date.now(),
                type: 'sticker'
              });
            }
          }

          if (aiCancelRef.current) break;

          if (mIdx < activeMembers.length - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      } else {
        // --- 私聊单人模式 ---
        let fullReply = '';
        let lastError: any = null;

        // 自动静默重试机制：如果第一次调用失败或内容为空/纯空白，自动重试 1 次（间隔 500ms，用户无感知）
        for (let attempt = 0; attempt < 2; attempt++) {
          if (aiCancelRef.current) return;
          try {
            const currentMessages = messagesRef.current || messages;
            const reply = await callAI({
              contact,
              messages: currentMessages,
              worldBooks,
              settings,
              stickers,
              memories: memory.facts.map(f => f.fact).join('; '),
              diaries: memory.diaries.slice(0, 3).map(d => d.content).join('\n')
            });

            const cleanText = (reply || '').replace(/\[心声[:：][^\]]+\]/gi, '').trim();
            // 不因短回复（如“好的”、“嗯嗯”、“好”）而判定无效；仅拦截空内容、纯空白或 fallback 标记
            if (cleanText && cleanText.toLowerCase() !== 'fallback' && cleanText.toLowerCase() !== '"fallback"') {
              fullReply = reply;
              lastError = null;
              break;
            } else if (reply && reply.trim() && reply.trim().toLowerCase() !== 'fallback') {
              // 即使过滤心声后为空（如回复全为心声），也视为有效回复
              fullReply = reply;
              lastError = null;
              break;
            } else {
              throw new Error('AI 回复内容为空');
            }
          } catch (callErr: any) {
            lastError = callErr;
            // 第一次失败，自动静默重试 1 次，间隔 500ms（用户无感知）
            if (attempt === 0 && !aiCancelRef.current) {
              await new Promise(r => setTimeout(r, 500));
            }
          }
        }

        if (aiCancelRef.current) return;

        if (!fullReply) {
          throw lastError || new Error('AI 未能生成有效回复');
        }

        const { segments, innerVoice } = parseAiResponse(fullReply);

        // Filter out empty, meaningless fragments, or fallback
        const validSegments = segments.filter(s => {
          const c = sanitizeBubbleContent(s.replace(/\[语音(?:消息)?[:：]?\s*[^\]]*\]|\[发语音\]|\[表情:\s*[^\]]+\]/gi, '')).trim();
          return c.length > 0 && c.toLowerCase() !== 'fallback';
        });

        if (validSegments.length === 0) {
          const fallbackContent = sanitizeBubbleContent(fullReply).trim();
          if (fallbackContent && fallbackContent.toLowerCase() !== 'fallback') {
            validSegments.push(fallbackContent);
          } else if (innerVoice && innerVoice.toLowerCase() !== 'fallback') {
            validSegments.push('……');
          } else {
            throw new Error('AI 回复无法解析或为空');
          }
        }

        const hasExplicitVoiceTag = fullReply.includes('[语音]') || fullReply.includes('[发语音]');
        const roundWillHaveVoice = hasExplicitVoiceTag || (Math.random() < 0.25);

        let voiceSegmentIndex = -1;
        if (roundWillHaveVoice && validSegments.length > 0) {
          const taggedIdx = validSegments.findIndex(s => /\[语音(?:消息)?\]|\[发语音\]/i.test(s));
          if (taggedIdx !== -1) {
            voiceSegmentIndex = taggedIdx;
          } else {
            voiceSegmentIndex = validSegments.length > 1 ? validSegments.length - 1 : 0;
          }
        }

        for (let i = 0; i < validSegments.length; i++) {
          if (aiCancelRef.current) break;
          await new Promise(r => setTimeout(r, 420 + validSegments[i].length * 35));
          if (aiCancelRef.current) break;
          
          let cleanContent = sanitizeBubbleContent(validSegments[i].replace(/\[语音(?:消息)?[:：]?\s*[^\]]*\]|\[发语音\]/gi, '')).trim();
          if (!cleanContent) continue;

          // Extract [表情: xxx] from private chat reply
          let matchedStickerUrl: string | undefined = undefined;
          const stickerMatch = cleanContent.match(/\[表情:\s*([^\]]+)\]/);
          if (stickerMatch) {
            const stickerName = stickerMatch[1].trim();
            const foundSticker = stickers.find(s => s.name === stickerName);
            if (foundSticker) {
              matchedStickerUrl = foundSticker.url;
            }
            cleanContent = cleanContent.replace(/\[表情:\s*[^\]]+\]/g, '').trim();
          }

          // Remove leading colon and any residual bracketed speaker tags
          cleanContent = cleanContent.replace(/^[:：]\s*/, '').trim();
          cleanContent = cleanContent.replace(/^([【\[\(（][^】\]\)）]{1,20}[】\]\)）]\s*[:：]?\s*)+/gu, '').trim();

          // Extract [微信转账: 金额 | 备注]
          const singleTransferMatch = cleanContent.match(/\[微信转账[:：]\s*(\d+(?:\.\d+)?)(?:\s*[|｜]\s*([^\]]+))?\]/);
          if (singleTransferMatch && !aiCancelRef.current) {
            const amt = parseFloat(singleTransferMatch[1]) || 50;
            const note = singleTransferMatch[2]?.trim();
            onSendMessage({
              sender: 'ai',
              senderName: contact.remark || contact.name,
              senderAvatar: contact.avatar,
              senderId: contact.id,
              content: note ? `微信转账 ¥${amt.toFixed(2)} (${note})` : `微信转账 ¥${amt.toFixed(2)}`,
              type: 'transfer',
              transferAmount: amt,
              transferNote: note,
              transferStatus: 'pending',
              timestamp: Date.now()
            });
            continue;
          }

          // Extract [邀请见面: 地点 | 邀约语]
          const meetInviteMatch = cleanContent.match(/\[(?:邀请见面|见面邀请|线下邀请)[:：]\s*([^\]|｜]+)(?:\s*[|｜]\s*([^\]]+))?\]/);
          if (meetInviteMatch && !aiCancelRef.current) {
            const meetLoc = meetInviteMatch[1]?.trim() || '常去的那家咖啡馆';
            const inviteWords = meetInviteMatch[2]?.trim() || '我们要不要线下见一面？我想当面和你聊聊。';
            onSendMessage({
              sender: 'ai',
              senderName: contact.remark || contact.name,
              senderAvatar: contact.avatar,
              senderId: contact.id,
              content: inviteWords,
              type: 'meet_invite',
              meetLocation: meetLoc,
              meetStatus: 'pending',
              timestamp: Date.now()
            });
            continue;
          }

          // Extract [瑞幸点单: 饮品名或规格]
          const luckinOrderMatch = cleanContent.match(/\[瑞幸点单[:：]\s*([^\]]+)\]/);
          if (luckinOrderMatch && !aiCancelRef.current) {
            const drinkQuery = luckinOrderMatch[1]?.trim() || '';
            const orderData = quickOrder({
              text: drinkQuery,
              contact,
              defaultFlavor: settings.luckinDefaultFlavor,
              storeName: settings.luckinStoreName,
              isTreat: false
            });
            cleanContent = cleanContent.replace(/\[瑞幸点单[:：]\s*[^\]]+\]/g, '').trim();
            const spokenText = cleanContent || getInCharacterCoffeeMessage(contact, 'preview', orderData.drinkName);
            onSendMessage({
              sender: 'ai',
              senderName: contact.remark || contact.name,
              senderAvatar: contact.avatar,
              senderId: contact.id,
              content: spokenText,
              type: 'luckin_order_preview',
              luckinOrder: orderData,
              timestamp: Date.now()
            });
            continue;
          }

          // Extract [瑞幸请客: 饮品名或规格]
          const luckinTreatMatch = cleanContent.match(/\[瑞幸请客[:：]\s*([^\]]+)\]/);
          if (luckinTreatMatch && !aiCancelRef.current) {
            const drinkQuery = luckinTreatMatch[1]?.trim() || '';
            const initOrder = quickOrder({
              text: drinkQuery,
              contact,
              defaultFlavor: settings.luckinDefaultFlavor,
              storeName: settings.luckinStoreName,
              isTreat: true
            });
            const orderData = completeOrderPayment(confirmOrder(initOrder));
            cleanContent = cleanContent.replace(/\[瑞幸请客[:：]\s*[^\]]+\]/g, '').trim();
            const spokenText = cleanContent || getInCharacterCoffeeMessage(contact, 'treat_sent', orderData.drinkName, true);
            onSendMessage({
              sender: 'ai',
              senderName: contact.remark || contact.name,
              senderAvatar: contact.avatar,
              senderId: contact.id,
              content: spokenText,
              type: 'luckin_treat',
              luckinOrder: orderData,
              timestamp: Date.now()
            });
            recordLuckinMemoryAndAffection(`请玩家喝过瑞幸咖啡（${orderData.drinkName}）`, true);
            continue;
          }

          const isVoiceMsg = (i === voiceSegmentIndex);
          const voiceSec = Math.min(60, Math.max(2, Math.round(cleanContent.length / 3.2)));

          if (cleanContent && !aiCancelRef.current) {
            if (isVoiceMsg) {
              // 语音消息：调用 TTS 生成音频后再发送
              const voiceText = cleanContent;

              // 先发送语音消息（显示语音气泡，不显示文字）
              onSendMessage({
                sender: 'ai',
                senderName: contact.remark || contact.name,
                senderAvatar: contact.avatar,
                innerVoice: (contact.enableInnerVoice && i === validSegments.length - 1) ? innerVoice : undefined,
                content: voiceText,          // 语音转文字内容
                type: 'voice',               // 标记为语音
                voiceDuration: voiceSec,
                isVoiceListened: false,
                timestamp: Date.now()
              });

              // 语音消息已发送，不自动播放，等待用户点击气泡播放
            } else {
              // 普通文字消息
              onSendMessage({
                sender: 'ai',
                senderName: contact.remark || contact.name,
                senderAvatar: contact.avatar,
                innerVoice: (contact.enableInnerVoice && i === validSegments.length - 1) ? innerVoice : undefined,
                content: cleanContent,
                type: 'text',
                timestamp: Date.now()
              });
            }
          }

          if (matchedStickerUrl && !aiCancelRef.current) {
            await new Promise(r => setTimeout(r, 300));
            if (aiCancelRef.current) break;
            onSendMessage({
              sender: 'ai',
              content: matchedStickerUrl,
              senderName: contact.remark || contact.name,
              senderAvatar: contact.avatar,
              timestamp: Date.now(),
              type: 'sticker'
            });
          }
        }
        // Auto-generation for Diary (daily, 1 entry per day) & Memory Facts (every 30 messages)
        if (!aiCancelRef.current && !contact.isGroup) {
          // 1. 日记生成：检测当天是否已有日记，如果没有则自动生成一篇
          const todayStr = new Date().toDateString();
          const hasDiaryToday = memory.diaries.some(d => new Date(d.timestamp).toDateString() === todayStr);
          if (!hasDiaryToday && (messages.length >= 2 || segments.length > 0)) {
            try {
              const recentDialogues = [...messages.slice(-15), { sender: 'ai', content: fullReply }]
                .map(m => `${m.sender === 'user' ? (settings.userNickname || '我') : (contact.remark || contact.name)}: ${m.content}`)
                .join('\n');

              const diaryResp = await fetch('/api/memory/generate-diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contactName: contact.remark || contact.name,
                  userNickname: settings.userNickname || '我',
                  persona: contact.persona,
                  dialogues: recentDialogues,
                  date: new Date().toLocaleDateString('zh-CN')
                })
              });
              const diaryData = await diaryResp.json();
              if (diaryData?.diary) {
                handleAddDiary(diaryData.diary);
              }
            } catch (dErr) {
              console.warn('Auto diary generation failed:', dErr);
            }
          }

          // 2. 记忆总结：每当消息条数达到 30 的倍数时（30、60、90...），AI 从最近 30 条对话提取关键事实
          const currentTotalMsgs = messages.length + 1;
          if (currentTotalMsgs > 0 && currentTotalMsgs % 30 === 0) {
            try {
              const last30 = [...messages.slice(-29), { sender: 'ai', content: fullReply }]
                .map(m => `${m.sender === 'user' ? (settings.userNickname || '用户') : (contact.remark || contact.name)}: ${m.content}`)
                .join('\n');

              const factsResp = await fetch('/api/memory/extract-facts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contactName: contact.remark || contact.name,
                  userNickname: settings.userNickname || '用户',
                  dialogues: last30
                })
              });
              const factsData = await factsResp.json();
              if (Array.isArray(factsData?.facts)) {
                factsData.facts.forEach((f: string) => {
                  if (f && f.trim()) {
                    handleAddFact(f.trim().slice(0, 30));
                  }
                });
              }
            } catch (fErr) {
              console.warn('Auto memory facts extraction failed:', fErr);
            }
          }

          // 检查是否触发主动电话
          const shouldCall = (() => {
            // 冷却检查：5分钟内不重复打电话
            const lastCallTime = parseInt(localStorage.getItem(`phone_call_last_${contact.id}`) || '0');
            if (Date.now() - lastCallTime < 300000) { // 5分钟冷却
              return false;
            }
            
            // 1. 长时间未回复（超过5分钟）
            const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
            const lastAiMsg = [...messages].reverse().find(m => m.sender === 'ai');
            if (lastUserMsg && lastAiMsg) {
              const timeSinceLastUser = Date.now() - lastUserMsg.timestamp;
              if (timeSinceLastUser > 300000 && lastAiMsg.timestamp > lastUserMsg.timestamp) {
                return true;
              }
            }
            
            // 2. 情绪关键词（降低概率到30%）
            const recentText = messages.slice(-10).map(m => m.content).join('');
            const emotionKeywords = /生气|吃醋|嫉妒|气死|烦|想你了|想见你|好想你|吃醋了|生气了|不开心|难受|委屈/;
            if (emotionKeywords.test(recentText) && Math.random() < 0.3) {
              return true;
            }
            
            // 3. 随机想念（降低到2%，每天最多1次）
            const todayCalls = parseInt(localStorage.getItem(`phone_calls_${contact.id}_${new Date().toDateString()}`) || '0');
            if (todayCalls < 1 && Math.random() < 0.02) {
              return true;
            }
            
            return false;
          })();

          if (shouldCall && !contact.isGroup && !contact.isAssistant) {
            const key = `phone_calls_${contact.id}_${new Date().toDateString()}`;
            localStorage.setItem(key, String((parseInt(localStorage.getItem(key) || '0')) + 1));
            localStorage.setItem(`phone_call_last_${contact.id}`, String(Date.now())); // 记录本次通话时间
            
            setTimeout(() => {
              setCallDirection('incoming');
              setShowCallModal(true);
            }, 1000 + Math.random() * 2000);
          }

          // 好感度递增（仅私聊，非群聊）
          if (!contact.isGroup && !contact.isAssistant) {
            const currentAffection = contact.affection || 0;
            // 每次回复增加 0.5-1.5，不要太快
            const increment = 0.5 + Math.random() * 1.0;
            const newAffection = Math.min(100, currentAffection + increment);
            
            // 更新联系人好感度
            onUpdateContact(contact.id, { affection: Math.round(newAffection * 10) / 10 });
            
            // 检查是否达到求婚条件（好感度 >= 100）
            if (newAffection >= 100 && contact.relationship !== 'married' && contact.relationship !== 'engaged') {
              setTimeout(async () => {
                // AI 主动求婚，根据人设生成
                try {
                  const proposalRes = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      systemPrompt: `你正在扮演微信好友【${contact.remark || contact.name}】。
人设：${contact.persona}

你对 ${settings.userNickname} 已经好感度满值了，你决定向他/她求婚。
请根据你的人设，生成一句真诚的求婚语（15-30字），口语化。

只输出求婚内容，不要任何额外文字。`,
                      messages: [{ role: 'user', content: '求婚' }],
                      temperature: 0.9
                    })
                  });
                  const proposalData = await proposalRes.json();
                  const proposalText = proposalData?.reply?.trim() || '💍 我真的非常喜欢你，我们结婚吧。你愿意吗？';

                  // AI 主动求婚 → 在聊天界面发送求婚气泡
                  const proposalMsg: ChatMessage = {
                    id: `proposal_${Date.now()}`,
                    sender: 'ai',
                    content: proposalText,
                    timestamp: Date.now(),
                    type: 'proposal'
                  };
                  onSendMessage(proposalMsg);
                  setPendingProposal({ from: 'ai', msgId: proposalMsg.id });
                } catch (e) {
                  const proposalMsg: ChatMessage = {
                    id: `proposal_${Date.now()}`,
                    sender: 'ai',
                    content: '💍 我真的非常喜欢你，我们结婚吧。你愿意吗？',
                    timestamp: Date.now(),
                    type: 'proposal'
                  };
                  onSendMessage(proposalMsg);
                  setPendingProposal({ from: 'ai', msgId: proposalMsg.id });
                }
              }, 2000);
            }
          }
        }
      }
    } catch (err: any) {
      if (aiCancelRef.current) {
        console.log('AI response generation cancelled');
        return;
      }
      console.error('AI generation catch error:', err);
      const errDetail = err?.message || '网络连接或接口服务异常';
      onSendMessage({
        sender: 'system',
        content: `系统提示：AI回复生成失败（${errDetail}）`,
        timestamp: Date.now(),
        type: 'text'
      });
    } finally {
      setIsAiGenerating(false);
      aiCancelRef.current = false;
    }
  };

  // Add memory instructions to callAI prompt within handleTriggerAi
  // (Need to pass memory and diary context to callAI)

  // NOTE: I need to update callAI call itself to include memory context.

  // Avatar upload for contact
  const handleAvatarClick = () => {
    console.log('[Avatar] 点击联系人/群头像，触发文件选择');
    avatarInputRef.current?.click();
  };

  const handleContactAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[Avatar] 选择联系人/群头像文件:', file.name, file.size);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImage(raw, 160, 160, 0.8);
        onUpdateContact(contact.id, { avatar: compressed });
        console.log('[Avatar] 联系人/群头像更新成功并已保存:', contact.id);
      } catch (err) {
        console.error('[Avatar] 联系人头像压缩或保存失败:', err);
        onUpdateContact(contact.id, { avatar: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Direct image upload by user to chat
  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 400, 400, 0.7);
      onSendMessage({
        sender: 'user',
        content: '[图片]',
        type: 'image',
        imageUrl: compressed,
        timestamp: Date.now()
      });
      setShowPlusMenu(false);

      // AI automatically replies after natural delay
      setTimeout(() => {
        handleTriggerAi();
      }, 750);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsFileProcessing(true);
    
    // 1. 发送用户发送文件的消息
    onSendMessage({
      sender: 'user',
      content: file.name,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      type: 'file',
      timestamp: Date.now()
    });
    
    try {
      // 2. 智能读取与解析文件内容
      let fileContent = '';
      const fileType = file.type || '';
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      
      const isTextLike = 
        fileType.startsWith('text/') || 
        ['txt', 'json', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'go', 'rs', 'md', 'csv', 'xml', 'html', 'css', 'sql', 'yaml', 'yml', 'log', 'sh', 'env', 'ini'].includes(ext);

      if (isTextLike) {
        try {
          fileContent = await file.text();
        } catch {
          fileContent = `[文本文件: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
        }
      } else if (fileType.startsWith('image/')) {
        fileContent = `[图片文件: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
      } else if (fileType.startsWith('audio/') || fileType.startsWith('video/')) {
        fileContent = `[音视频文件: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
      } else if (fileType.includes('pdf') || ext === 'pdf') {
        fileContent = `[PDF文档: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
      } else if (fileType.includes('word') || ['doc', 'docx'].includes(ext)) {
        fileContent = `[Word文档: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
      } else {
        fileContent = `[文件: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
      }
      
      // 内容截断预览
      let previewSnippet = fileContent;
      if (previewSnippet.length > 2000) {
        previewSnippet = previewSnippet.slice(0, 2000) + '\n... (内容已截断)';
      }
      
      // 发送系统消息显示文件已成功接收
      const systemMsg = `📎 已接收文件【${file.name}】${fileContent.length > 50 && isTextLike ? ` (${fileContent.length}字)` : ''}`;
      onSendMessage({
        sender: 'system',
        content: systemMsg,
        timestamp: Date.now(),
        type: 'text'
      });
      
      // 3. 构建 AI 提示并请求 AI 回应
      const aiPrompt = `用户（${settings.userNickname || '我'}）给你发送了一个文件【${file.name}】。
文件内容摘要如下：
---
${previewSnippet}
---
请根据文件内容与你的人设，给出自然、真切且有价值的回应（20-60字）。`;

      let reply = '';
      try {
        if (settings.apiKey && settings.apiKey.trim().length > 0) {
          reply = await callAI({
            contact,
            messages: [{
              id: 'file_' + Date.now(),
              sender: 'user',
              content: aiPrompt,
              timestamp: Date.now(),
              type: 'text'
            }],
            worldBooks,
            settings
          });
        } else {
          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemPrompt: `${contact.persona}
人设回复规则：
1. 确认收到文件【${file.name}】，并给出自然、符合人设的回应
2. 表现出认真查阅的态度
3. 语气生动，符合你与用户的关系`,
              messages: [{ role: 'user', content: aiPrompt }],
              temperature: 0.7
            })
          });

          if (res.ok) {
            const data = await res.json();
            reply = data?.reply?.trim() || '';
          }
        }
      } catch (aiErr: any) {
        console.warn('AI call for file processing failed:', aiErr);
        onSendMessage({
          sender: 'system',
          content: `系统提示：文件【${file.name}】处理失败（${aiErr?.message || 'AI响应异常'}）`,
          timestamp: Date.now(),
          type: 'text'
        });
        return;
      }

      if (!reply) {
        onSendMessage({
          sender: 'system',
          content: `系统提示：文件【${file.name}】处理未获取到 AI 回复`,
          timestamp: Date.now(),
          type: 'text'
        });
        return;
      }
      
      const parsedReply = parseAiResponse(reply);
      const cleanFileContent = sanitizeBubbleContent(parsedReply.segments.join(' ')).trim() || '收到文件了';

      // 发送 AI 回复
      setTimeout(() => {
        onSendMessage({
          sender: 'ai',
          content: cleanFileContent,
          innerVoice: parsedReply.innerVoice,
          timestamp: Date.now(),
          type: 'text'
        });
      }, 400);

    } catch (err: any) {
      console.warn('文件处理异常:', err);
      onSendMessage({
        sender: 'system',
        content: `系统提示：文件处理发生错误（${err?.message || '无法处理该文件'}）`,
        timestamp: Date.now(),
        type: 'text'
      });
    } finally {
      setIsFileProcessing(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Handle User Accepting AI Transfer
  const handleAcceptTransfer = (transferMsg: ChatMessage) => {
    if (onUpdateMessage) {
      onUpdateMessage(transferMsg.id, { transferStatus: 'accepted' });
    } else {
      transferMsg.transferStatus = 'accepted';
    }

    const amtStr = transferMsg.transferAmount ? transferMsg.transferAmount.toFixed(2) : '0.00';
    const senderName = transferMsg.senderName || contact.remark || contact.name;

    onSendMessage({
      sender: 'user',
      content: `[收下了 ${senderName} 的 ¥${amtStr} 转账]`,
      type: 'transfer',
      transferAmount: transferMsg.transferAmount,
      transferStatus: 'accepted',
      transferNote: transferMsg.transferNote ? `已收下: ${transferMsg.transferNote}` : '已收下转账',
      timestamp: Date.now()
    });

    setTimeout(() => {
      handleTriggerAi();
    }, 750);
  };

  // Handle User Refunding AI Transfer
  const handleRefundTransfer = (transferMsg: ChatMessage) => {
    if (onUpdateMessage) {
      onUpdateMessage(transferMsg.id, { transferStatus: 'refunded' });
    } else {
      transferMsg.transferStatus = 'refunded';
    }

    const amtStr = transferMsg.transferAmount ? transferMsg.transferAmount.toFixed(2) : '0.00';
    const senderName = transferMsg.senderName || contact.remark || contact.name;

    onSendMessage({
      sender: 'user',
      content: `[退还了 ${senderName} 的 ¥${amtStr} 转账]`,
      type: 'transfer',
      transferAmount: transferMsg.transferAmount,
      transferStatus: 'refunded',
      transferNote: transferMsg.transferNote ? `已退还: ${transferMsg.transferNote}` : '已退还转账',
      timestamp: Date.now()
    });

    setTimeout(() => {
      handleTriggerAi();
    }, 750);
  };

  // Handle User Accepting AI Offline Meeting Invite -> Enter Offline Mode!
  const handleAcceptMeetInvite = (inviteMsg: ChatMessage) => {
    if (onUpdateMessage) {
      onUpdateMessage(inviteMsg.id, { meetStatus: 'accepted' });
    } else {
      inviteMsg.meetStatus = 'accepted';
    }

    const loc = inviteMsg.meetLocation || '常去的那家店';
    const partnerName = inviteMsg.senderName || contact.remark || contact.name;

    // Send confirmation message
    onSendMessage({
      sender: 'user',
      content: `好啊，我同意赴约！这就去「${loc}」找你。`,
      timestamp: Date.now()
    });

    // Enter offline mode with scene
    setTimeout(() => {
      const scene = `【线下相见】与${partnerName}相约在「${loc}」。${inviteMsg.content ? `关于这次见面，TA曾说：“${inviteMsg.content}”` : ''}`;
      onUpdateContact(contact.id, {
        isOfflineMode: true,
        offlineScene: scene
      });
    }, 400);
  };

  // Handle User Declining AI Offline Meeting Invite
  const handleDeclineMeetInvite = (inviteMsg: ChatMessage) => {
    if (onUpdateMessage) {
      onUpdateMessage(inviteMsg.id, { meetStatus: 'declined' });
    } else {
      inviteMsg.meetStatus = 'declined';
    }

    onSendMessage({
      sender: 'user',
      content: `今天手头有点事走不开，我们下次再约吧~`,
      timestamp: Date.now()
    });

    setTimeout(() => {
      handleTriggerAi();
    }, 750);
  };

  // Group member list for separate inner voice control
  const groupMembers = contact.isGroup 
    ? allContacts.filter(c => (contact.groupMemberIds || []).includes(c.id) && !c.isGroup)
    : [];
  const displayGroupMembers = groupMembers.length > 0 
    ? groupMembers 
    : allContacts.filter(c => !c.isGroup).slice(0, 3);

  // Open Transfer Modal
  const handleOpenTransferModal = () => {
    setShowPlusMenu(false);
    setTransferAmount('50');
    setTransferNote('');
    if (contact.isGroup) {
      if (displayGroupMembers.length === 1) {
        setTransferTargetId(displayGroupMembers[0].id);
        setTransferStep('enter_details');
      } else {
        setTransferStep('select_target');
        setTransferTargetId('');
      }
    } else {
      setTransferStep('enter_details');
      setTransferTargetId(contact.id);
    }
    setShowTransferModal(true);
  };

  if (contact.isOfflineMode) {
    return (
      <OfflineSceneView
        className="theater-rococo-locked"
        contact={contact}
        settings={settings}
        worldBooks={worldBooks}
        members={displayGroupMembers}
        allContacts={allContacts}
        onBack={() => onUpdateContact(contact.id, { isOfflineMode: false })}
        onUpdateContact={onUpdateContact}
        onUpdateSettings={onUpdateSettings}
        contactMemories={contactMemories}
        onUpdateContactMemory={onUpdateContactMemory}
        themeStyle={settings.themeStyle}
      />
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col select-none relative overflow-hidden"
      style={{
        backgroundColor: 'var(--gg-page-bg, #ededed)'
      }}
    >
      {/* Hidden file input for chat image upload */}
      <input
        type="file"
        ref={imageUploadInputRef}
        onChange={handleUserImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 在 hidden file input 区域添加 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header Bar */}
      <div
        className={`h-11 px-3 ${activeTheme?.assets?.headerBg ? 'border-b-0' : 'border-b border-stone-300/70'} flex items-center justify-between shrink-0 z-10 relative overflow-hidden`}
        style={{
          backgroundColor: activeTheme?.assets?.headerBg ? 'transparent' : 'var(--gg-header-bg, var(--gg-page-bg, #ededed))',
          color: 'var(--gg-header-text, var(--gg-text-primary, #111827))',
          borderBottom: activeTheme?.assets?.headerBg ? 'none' : undefined
        }}
      >
        {activeTheme?.assets?.headerBg && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={getBubbleBgStyle({
              isUser: false,
              prefix: 'header',
              editingTheme: activeTheme,
              bubbleBgUrl: activeTheme.assets.headerBg,
              isDot9: activeTheme?.css?.['--gg-is-dot9-headerBg'] !== 'false',
            })}
          />
        )}
        <div className="relative z-10 flex items-center justify-between w-full h-full">
          <button
            onClick={onBack}
            className="flex items-center gap-0.5 text-xs font-medium cursor-pointer active:scale-95 transition-transform"
            style={{ color: 'inherit' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>微信</span>
          </button>

          <div className="text-center">
            <div
              className="text-xs font-bold flex items-center justify-center gap-1"
              style={{ color: 'var(--gg-text-primary, #111827)' }}
            >
              <span>{contact.remark || contact.name}</span>
              {/* 私聊顶栏：对方名称右边添加“查看行程”按钮 */}
              {!contact.isGroup && !contact.isAssistant && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowScheduleModal(true);
                  }}
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium flex items-center gap-0.5 cursor-pointer active:scale-95 transition-transform shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: activeTheme?.css?.['--gg-schedule-btn-bg'] || 'rgba(0, 0, 0, 0.06)',
                    color: activeTheme?.css?.['--gg-schedule-btn-text'] || 'inherit',
                    border: activeTheme?.css?.['--gg-schedule-btn-border'] || '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: activeTheme?.css?.['--gg-schedule-btn-radius'] || '9999px',
                  }}
                  title="查看TA的今日行程"
                >
                  {activeTheme?.assets?.scheduleBtnIcon ? (
                    <img src={activeTheme.assets.scheduleBtnIcon} className="w-2.5 h-2.5 object-contain" />
                  ) : (
                    <Calendar className="w-2.5 h-2.5 text-amber-600" />
                  )}
                  <span>行程</span>
                </button>
              )}
              {contact.isGroup && (
                <span className="text-[10px] text-stone-500 font-normal">
                  ({contact.groupMemberIds?.length || 2})
                </span>
              )}
              {contact.isOfflineMode && (
                <span className="text-[9px] px-1 bg-amber-200 text-amber-900 rounded font-normal">
                  线下模式
                </span>
              )}
              {contact.isAssistant && (
                <span className="text-[9px] px-1 bg-purple-100 text-purple-700 rounded font-normal">
                  通道
                </span>
              )}
            </div>
            {isAiGenerating && (
              <button
                onClick={handleTriggerAi}
                className="text-[10px] text-rose-500 hover:text-rose-600 font-medium animate-pulse cursor-pointer flex items-center justify-center gap-1 mx-auto"
                title="点击中止生成"
              >
                <span>{contact.isGroup ? '群成员正在输入... (点击中止)' : '对方正在输入... (点击中止)'}</span>
              </button>
            )}
          </div>

          {!contact.isAssistant && (
            <button
              onClick={() => setShowSettingsDrawer(true)}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-800 cursor-pointer active:scale-90 transition-transform"
              title={contact.isGroup ? '群聊设置' : '聊天设置'}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Toast Notification Banner */}
      {toastMessage && (() => {
        const isError = /暂时没有回应|错误|异常|失败|余额|限流|欠费|额度/.test(toastMessage);
        return (
          <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md pointer-events-none animate-in fade-in slide-in-from-top-2 max-w-[90%] text-left border ${
            isError 
              ? 'bg-rose-950/95 text-rose-100 border-rose-500/30' 
              : 'bg-stone-950/95 text-stone-100 border-stone-800/50'
          }`}>
            <Info className={`w-4 h-4 shrink-0 ${isError ? 'text-rose-400' : 'text-amber-400'}`} />
            <span className="leading-normal font-medium">{toastMessage}</span>
          </div>
        );
      })()}

      {/* Messages Scroll Area */}
      <div 
        className="flex-1 overflow-y-auto p-3 bg-cover bg-center relative"
        style={
          contact.backgroundUrl 
            ? { backgroundImage: `url(${contact.backgroundUrl})` } 
            : (activeTheme?.assets?.chatBg || activeTheme?.assets?.chatWallpaper)
            ? { backgroundImage: `url(${activeTheme.assets.chatBg || activeTheme.assets.chatWallpaper})` }
            : {}
        }
      >
        <div className="relative z-10 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 text-stone-400 select-none">
            <div className="p-3.5 rounded-full bg-stone-200/50 mb-2.5 text-stone-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-stone-500 font-medium">{contact.isAssistant ? '这是开发者与玩家之间的消息通道' : '暂无聊天记录'}</p>
            <p className="text-[11px] text-stone-400 mt-1">{contact.isAssistant ? '消息会同步到两端' : `向 ${contact.remark || contact.name} 打个招呼开启对话吧`}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem || msg.type === 'pat') {
              return (
                <div key={msg.id} className="flex justify-center my-2 select-none">
                  <span className="px-2.5 py-0.5 rounded-full bg-stone-300/40 text-stone-500 text-[11px] font-normal leading-normal">
                    {msg.content}
                  </span>
                </div>
              );
            }

            let msgAvatar = '';
            let matchingContact: Contact | undefined = undefined;
            if (isUser) {
              msgAvatar = settings.userAvatar || '';
            } else if (!contact.isGroup) {
              // 单聊模式下，对方的头像实时跟随当前联系人的最新私聊头像
              msgAvatar = contact.avatar || '';
            } else {
              // 群聊模式下：对面几个人分别用自己私聊设置中的头像回复，绝对不用群聊头像
              matchingContact = allContacts?.find(
                c => !c.isGroup && (
                  (msg.senderId && c.id === msg.senderId) ||
                  (msg.senderName && (c.remark === msg.senderName || c.name === msg.senderName))
                )
              );
              // 如果通讯录匹配到该好友，使用该好友私聊的实时头像；否则使用消息记录的 senderAvatar（绝不使用 contact.avatar 群头像）
              if (matchingContact) {
                msgAvatar = matchingContact.avatar || '';
              } else {
                msgAvatar = msg.senderAvatar || '';
              }
            }

            const senderDisplayName = matchingContact ? (matchingContact.remark || matchingContact.name) : (msg.senderName || '群友');
            const showSenderName = contact.isGroup && !isUser && senderDisplayName;
            const isSelected = selectedMsgIds.has(msg.id);
            const activeTheme = settings.activeDIYThemeId && settings.diyThemes
              ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
              : null;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start ${isMultiSelectMode ? 'cursor-pointer' : ''}`}
                onClick={() => handleMessageClick(msg.id)}
                onContextMenu={(e) => {
                  if (!isMultiSelectMode) handleContextMenu(e, msg.id);
                }}
              >
                {/* Multi Select Checkbox */}
                {isMultiSelectMode && (
                  <div className={`mt-2 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-green-500 border-green-500' : 'border-stone-300 bg-white'}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                )}

                {/* Avatar: 个人私聊头像或默认头像，群聊中决不用群头像 */}
                <div
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleTriggerPat(isUser ? undefined : (matchingContact || contact), isUser);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvatarClickOrDoubleTap(isUser ? undefined : (matchingContact || contact), isUser);
                  }}
                  className={`relative shrink-0 cursor-pointer transition-all ${
                    pattingAvatarId === (isUser ? 'user_self' : (matchingContact?.id || contact.id))
                      ? 'animate-bounce scale-110'
                      : 'active:scale-95'
                  }`}
                  title={isUser ? "双击拍拍自己" : `双击拍一拍 ${senderDisplayName}`}
                >
                  <Avatar
                    src={msgAvatar}
                    className="w-9 h-9 rounded-md shrink-0 shadow-xs"
                    size={18}
                  />
                </div>

                {/* Message Bubble Column */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {/* Sender Name in Group Chat */}
                  {showSenderName && (
                    <span className="text-[10px] text-stone-400 mb-0.5 px-0.5 font-medium">
                      {senderDisplayName}
                    </span>
                  )}

                  {/* Regular text bubble */}
                  {(msg.type === 'text' || msg.type === 'proposal_response') && (() => {
                    const quoteMatch = msg.content.match(/^【引用\s+([^：]+)：([^】]+)】\n([\s\S]*)$/);
                    const activeTheme = settings.activeDIYThemeId && settings.diyThemes
                      ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
                      : null;
                    const bubbleBgSelf = activeTheme?.assets?.bubbleBgSelf;
                    const bubbleBgOther = activeTheme?.assets?.bubbleBgOther;
                    const bubbleDecorSelf = activeTheme?.assets?.bubbleDecorSelf;
                    const bubbleDecorOther = activeTheme?.assets?.bubbleDecorOther;

                    const bubbleBgImg = isUser ? bubbleBgSelf : bubbleBgOther;
                    const decorUrl = isUser ? bubbleDecorSelf : bubbleDecorOther;

                    const defaultBg = isUser ? '#95ec69' : '#ffffff';
                    const defaultText = '#1c1917';
                    const defaultBorder = isUser ? '#7ec952' : '#e5e7eb';
                    const defaultRadius = '20px';

                    const customBg = isUser ? activeTheme?.css?.['--gg-bubble-self'] : activeTheme?.css?.['--gg-bubble-other'];
                    const customText = isUser ? activeTheme?.css?.['--gg-bubble-self-text'] : activeTheme?.css?.['--gg-bubble-other-text'];
                    const customRadius = isUser ? activeTheme?.css?.['--gg-bubble-radius-self'] : activeTheme?.css?.['--gg-bubble-radius-other'];
                    const customShadow = isUser ? activeTheme?.css?.['--gg-bubble-shadow-self'] : activeTheme?.css?.['--gg-bubble-shadow-other'];
                    const customBorder = isUser ? activeTheme?.css?.['--gg-bubble-border-self'] : activeTheme?.css?.['--gg-bubble-border-other'];

                    let borderStyleObj: React.CSSProperties = {
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: defaultBorder,
                    };

                    if (customBorder) {
                      if (customBorder === 'none' || customBorder === '0' || customBorder === '0px') {
                        borderStyleObj = { border: 'none' };
                      } else if (customBorder.includes(' ')) {
                        borderStyleObj = { border: customBorder };
                      } else if (customBorder.startsWith('#') || customBorder.startsWith('rgb') || customBorder.startsWith('hsl')) {
                        borderStyleObj = { border: `1px solid ${customBorder}` };
                      } else {
                        borderStyleObj = { border: customBorder };
                      }
                    }

                    return (
                      <div
                        className={`${bubbleBgImg ? '' : 'px-3 py-2'} text-xs leading-relaxed break-words shadow-xs relative overflow-visible`}
                        style={(() => {
                          const parseVal = (val: string | undefined | null) => {
                            if (!val) return 30;
                            const num = parseFloat(val);
                            return isNaN(num) ? 30 : num;
                          };
                          const stretchTop = parseVal(isUser ? activeTheme?.css?.['--gg-slice-top-self'] : activeTheme?.css?.['--gg-slice-top-other']);
                          const stretchBottom = parseVal(isUser ? activeTheme?.css?.['--gg-slice-bottom-self'] : activeTheme?.css?.['--gg-slice-bottom-other']);
                          const stretchLeft = parseVal(isUser ? activeTheme?.css?.['--gg-slice-left-self'] : activeTheme?.css?.['--gg-slice-left-other']);
                          const stretchRight = parseVal(isUser ? activeTheme?.css?.['--gg-slice-right-self'] : activeTheme?.css?.['--gg-slice-right-other']);

                          const contentTop = parseVal(isUser ? activeTheme?.css?.['--gg-padding-top-self'] : activeTheme?.css?.['--gg-padding-top-other']);
                          const contentBottom = parseVal(isUser ? activeTheme?.css?.['--gg-padding-bottom-self'] : activeTheme?.css?.['--gg-padding-bottom-other']);
                          const contentLeft = parseVal(isUser ? activeTheme?.css?.['--gg-padding-left-self'] : activeTheme?.css?.['--gg-padding-left-other']);
                          const contentRight = parseVal(isUser ? activeTheme?.css?.['--gg-padding-right-self'] : activeTheme?.css?.['--gg-padding-right-other']);

                          const isDot9 = activeTheme?.css?.[`--gg-is-dot9-${isUser ? 'bubbleBgSelf' : 'bubbleBgOther'}`] === 'true';

                          const bubbleParams = {
                            isUser,
                            editingTheme: activeTheme,
                            bubbleBgUrl: bubbleBgImg,
                            customText,
                            defaultText,
                            isDot9,
                            stretchTop,
                            stretchRight,
                            stretchBottom,
                            stretchLeft,
                            contentTop,
                            contentRight,
                            contentBottom,
                            contentLeft,
                          };

                          if (bubbleBgImg) {
                            return getBubbleContainerStyle(bubbleParams);
                          }
                          return {
                            backgroundColor: customBg || defaultBg,
                            color: customText || defaultText,
                            borderRadius: customRadius || defaultRadius,
                            boxShadow: customShadow || undefined,
                            ...borderStyleObj,
                          };
                        })()}
                      >
                        {/* 独立点九图背景层：不挤压文字，文字紧贴黄色内容安全区边缘！ */}
                        {bubbleBgImg && (() => {
                          const parseVal = (val: string | undefined | null) => {
                            if (!val) return 30;
                            const num = parseFloat(val);
                            return isNaN(num) ? 30 : num;
                          };
                          const stretchTop = parseVal(isUser ? activeTheme?.css?.['--gg-slice-top-self'] : activeTheme?.css?.['--gg-slice-top-other']);
                          const stretchBottom = parseVal(isUser ? activeTheme?.css?.['--gg-slice-bottom-self'] : activeTheme?.css?.['--gg-slice-bottom-other']);
                          const stretchLeft = parseVal(isUser ? activeTheme?.css?.['--gg-slice-left-self'] : activeTheme?.css?.['--gg-slice-left-other']);
                          const stretchRight = parseVal(isUser ? activeTheme?.css?.['--gg-slice-right-self'] : activeTheme?.css?.['--gg-slice-right-other']);

                          const contentTop = parseVal(isUser ? activeTheme?.css?.['--gg-padding-top-self'] : activeTheme?.css?.['--gg-padding-top-other']);
                          const contentBottom = parseVal(isUser ? activeTheme?.css?.['--gg-padding-bottom-self'] : activeTheme?.css?.['--gg-padding-bottom-other']);
                          const contentLeft = parseVal(isUser ? activeTheme?.css?.['--gg-padding-left-self'] : activeTheme?.css?.['--gg-padding-left-other']);
                          const contentRight = parseVal(isUser ? activeTheme?.css?.['--gg-padding-right-self'] : activeTheme?.css?.['--gg-padding-right-other']);
                          const isDot9 = activeTheme?.css?.[`--gg-is-dot9-${isUser ? 'bubbleBgSelf' : 'bubbleBgOther'}`] === 'true';

                          return (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={getBubbleBgStyle({
                                isUser,
                                editingTheme: activeTheme,
                                bubbleBgUrl: bubbleBgImg,
                                customText,
                                defaultText,
                                isDot9,
                                stretchTop,
                                stretchRight,
                                stretchBottom,
                                stretchLeft,
                                contentTop,
                                contentRight,
                                contentBottom,
                                contentLeft,
                              })}
                            />
                          );
                        })()}

                        {/* 角落贴图：我的气泡在右上角，对方气泡在左上角，支持自定义 X/Y 偏移及尺寸 */}
                        {decorUrl && (() => {
                          const offsetX = isUser
                            ? (activeTheme?.css?.['--gg-decor-offset-x-self'] || '-8px')
                            : (activeTheme?.css?.['--gg-decor-offset-x-other'] || '-8px');
                          const offsetY = isUser
                            ? (activeTheme?.css?.['--gg-decor-offset-y-self'] || '-8px')
                            : (activeTheme?.css?.['--gg-decor-offset-y-other'] || '-8px');
                          const decorSize = isUser
                            ? (activeTheme?.css?.['--gg-decor-size-self'] || '20px')
                            : (activeTheme?.css?.['--gg-decor-size-other'] || '20px');

                          const positionStyle: React.CSSProperties = isUser
                            ? { top: offsetY, right: offsetX, width: decorSize, height: decorSize }
                            : { top: offsetY, left: offsetX, width: decorSize, height: decorSize };

                          return (
                            <div
                              className="absolute pointer-events-none z-30 bg-contain bg-no-repeat"
                              style={{
                                backgroundImage: `url(${decorUrl})`,
                                ...positionStyle
                              }}
                            />
                          );
                        })()}

                        <div className="relative z-10">
                          {quoteMatch ? (
                            <>
                              <div className="mb-1.5 px-2 py-1 rounded bg-black/5 dark:bg-white/10 border-l-2 border-stone-400 text-[11px] text-stone-500 leading-tight">
                                <span className="font-semibold">{quoteMatch[1]}</span>: {quoteMatch[2]}
                              </div>
                              <div>{quoteMatch[3]}</div>
                            </>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Proposal & Wedding & Divorce Request & Divorce Confirm & Wedding Offline Invite Bubble */}
                  {(msg.type === 'proposal' || msg.type === 'wedding_invite' || msg.type === 'divorce_request' || msg.type === 'divorce_confirm' || msg.type === 'wedding_offline_invite') && (() => {
                    const bType = msg.type === 'proposal' ? 'proposal' : (msg.type === 'wedding_invite' || msg.type === 'wedding_offline_invite') ? 'wedding' : 'divorce';
                    const defaultIcon = msg.type === 'proposal' ? <RingSVG className="w-4 h-4 text-rose-500" /> : (msg.type === 'wedding_invite' || msg.type === 'wedding_offline_invite') ? <WeddingChurchSVG className="w-4 h-4 text-pink-500" /> : <LogOut className="w-4 h-4 text-stone-500" />;
                    const defaultTitle = msg.type === 'proposal' ? '浪漫求婚' : (msg.type === 'wedding_invite' || msg.type === 'wedding_offline_invite') ? '婚礼殿堂' : '婚姻协议';

                    // 婚姻操作按钮通用渲染方法
                    const renderMarriageBtn = ({
                      btnKey,
                      defaultBg,
                      defaultText,
                      label,
                      onClick,
                      disabled = false,
                      className = '',
                    }: {
                      btnKey: string;
                      defaultBg: string;
                      defaultText: string;
                      label: string;
                      onClick: () => void;
                      disabled?: boolean;
                      className?: string;
                    }) => {
                      const bg = activeTheme?.css?.[`--gg-${btnKey}-bg`] || defaultBg;
                      const textColor = activeTheme?.css?.[`--gg-${btnKey}-text`] || defaultText;
                      const borderStyle = activeTheme?.css?.[`--gg-${btnKey}-border`] || '';

                      return (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={onClick}
                          className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs transition-transform ${
                            disabled
                              ? 'bg-stone-400 grayscale cursor-not-allowed opacity-70'
                              : 'cursor-pointer active:scale-95'
                          } ${className}`}
                          style={{
                            backgroundColor: disabled ? undefined : bg,
                            color: textColor,
                            border: borderStyle ? (borderStyle === 'none' ? 'none' : borderStyle) : undefined,
                          }}
                        >
                          <span>{label}</span>
                        </button>
                      );
                    };

                    return (
                      <UnifiedBubble
                        bubbleType={bType}
                        isUser={isUser}
                        activeTheme={activeTheme}
                        defaultIcon={defaultIcon}
                        defaultTitle={defaultTitle}
                        actions={
                          <>
                            {/* 求婚气泡：对方发来时显示按钮 */}
                            {msg.type === 'proposal' && msg.sender === 'ai' && pendingProposal?.from === 'ai' && pendingProposal.msgId === msg.id && (
                              <div className="flex gap-2 w-full mt-1">
                                {renderMarriageBtn({
                                  btnKey: 'proposal-btn-yes',
                                  defaultBg: '#f43f5e',
                                  defaultText: '#ffffff',
                                  
                                  label: '我愿意',
                                  onClick: async () => {
                                    setPendingProposal(null);
                                    onUpdateContact(contact.id, { relationship: 'engaged' });
                                    onSendMessage({
                                      sender: 'user',
                                      content: '💕 我愿意！',
                                      timestamp: Date.now(),
                                      type: 'proposal_response'
                                    });
                                    try {
                                      const res = await fetch('/api/ai/chat', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          systemPrompt: `你正在扮演微信好友【${contact.remark || contact.name}】。\n人设：${contact.persona}\n\n${settings.userNickname} 接受了你的求婚（或者你向他/她求婚被接受了）！\n请根据你的人设，生成一句真实自然的感动/开心的回复（15-30字）。\n\n只输出回复内容，不要任何额外文字。`,
                                          messages: [{ role: 'user', content: '求婚被接受' }],
                                          temperature: 0.9
                                        })
                                      });
                                      const data = await res.json();
                                      const reply = data?.reply?.trim() || '💕 我愿意！我也等这一刻好久了...';
                                      onSendMessage({
                                        sender: 'ai',
                                        content: reply,
                                        timestamp: Date.now(),
                                        type: 'text'
                                      });
                                    } catch (e) {
                                      onSendMessage({
                                        sender: 'ai',
                                        content: '💕 我愿意！我也等这一刻好久了...',
                                        timestamp: Date.now(),
                                        type: 'text'
                                      });
                                    }
                                    try {
                                      const inviteRes = await fetch('/api/ai/chat', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          systemPrompt: `你正在扮演微信好友【${contact.remark || contact.name}】。\n人设：${contact.persona}\n\n你和 ${settings.userNickname} 刚刚确认了婚约！现在你决定提议举办婚礼。\n请根据你的人设，生成一句真诚且符合人设的婚礼邀请（15-30字），邀请他/她一起步入婚礼殿堂。\n\n只输出回复内容，不要任何额外文字。`,
                                          messages: [{ role: 'user', content: '发起婚礼邀请' }],
                                          temperature: 0.9
                                        })
                                      });
                                      const inviteData = await inviteRes.json();
                                      const inviteText = inviteData?.reply?.trim() || '那我们现在就举办婚礼吧！你愿意和我一起步入婚姻殿堂吗？';
                                      onSendMessage({
                                        sender: 'ai',
                                        content: inviteText,
                                        timestamp: Date.now(),
                                        type: 'wedding_invite'
                                      });
                                      setShowWeddingInvite(true);
                                    } catch (e) {
                                      onSendMessage({
                                        sender: 'ai',
                                        content: '那我们现在就举办婚礼吧！你愿意和我一起步入婚姻殿堂吗？',
                                        timestamp: Date.now(),
                                        type: 'wedding_invite'
                                      });
                                      setShowWeddingInvite(true);
                                    }
                                  }
                                })}

                                {renderMarriageBtn({
                                  btnKey: 'proposal-btn-no',
                                  defaultBg: '#e7e5e4',
                                  defaultText: '#44403c',
                                  
                                  label: '再想想',
                                  onClick: () => {
                                    setPendingProposal(null);
                                    onSendMessage({
                                      sender: 'user',
                                      content: '💔 抱歉，我想再考虑一下...',
                                      timestamp: Date.now(),
                                      type: 'text'
                                    });
                                  }
                                })}
                              </div>
                            )}

                            {/* 离婚确认气泡：显示确定/取消按钮 */}
                            {msg.type === 'divorce_confirm' && msg.sender === 'ai' && pendingDivorceId === msg.id && (
                              <div className="flex gap-2 w-full mt-1">
                                {renderMarriageBtn({
                                  btnKey: 'divorce-btn-yes',
                                  defaultBg: '#ef4444',
                                  defaultText: '#ffffff',
                                  
                                  label: '确定离婚',
                                  onClick: () => {
                                    setPendingDivorceId(null);
                                    handleDivorce();
                                  }
                                })}

                                {renderMarriageBtn({
                                  btnKey: 'divorce-btn-no',
                                  defaultBg: '#ffffff',
                                  defaultText: '#374151',
                                  
                                  label: '不离了',
                                  className: 'border border-stone-200',
                                  onClick: () => {
                                    setPendingDivorceId(null);
                                    onSendMessage({
                                      sender: 'user',
                                      content: '💕 不离了，我们好好的。',
                                      timestamp: Date.now(),
                                      type: 'text'
                                    });
                                  }
                                })}
                              </div>
                            )}
                            
                            {/* 婚礼邀请气泡：显示进入婚礼仪式按钮 */}
                            {msg.type === 'wedding_invite' && (
                              renderMarriageBtn({
                                btnKey: 'wedding-btn-enter',
                                defaultBg: '#ec4899',
                                defaultText: '#ffffff',
                                disabled: contact.relationship === 'married',
                                label: contact.relationship === 'married' ? '已完成婚礼' : '我愿意！进入婚礼仪式',
                                className: 'w-full mt-1',
                                onClick: () => {
                                  if (contact.relationship !== 'married') {
                                    setShowWeddingPage(true);
                                  }
                                }
                              })
                            )}

                            {/* 线下婚礼邀请：显示中/西式选项按钮 */}
                            {msg.type === 'wedding_offline_invite' && msg.sender === 'ai' && (
                              <div className="flex gap-2 w-full mt-1">
                                {renderMarriageBtn({
                                  btnKey: 'wedding-btn-chinese',
                                  defaultBg: '#dc2626',
                                  defaultText: '#ffffff',
                                  
                                  label: selectedWeddingMsgId === msg.id || contact.relationship === 'married' ? '已选择' : '中式',
                                  disabled: selectedWeddingMsgId === msg.id || contact.relationship === 'married',
                                  onClick: () => {
                                    const roles = getWeddingRoles(contact, settings);
                                    const sceneDesc = `【中式婚礼场景】红烛高照，喜字贴窗，满堂红绸飘扬。\n新郎是【${roles.groomName}】，新娘是【${roles.brideName}】。\n两位新人身着大红锦袍与凤冠霞帔，步入喜堂。\n主婚人立于堂前，高声道：\n"良辰吉日，天地人和。今日诸位亲朋齐聚于此，共证新郎（${roles.groomName}）与新娘（${roles.brideName}）缔结良缘，情投意合，缘定三生。此刻，中式婚礼仪式正式开始——"`;
                                    startOfflineWedding(sceneDesc, msg.id);
                                  }
                                })}

                                {renderMarriageBtn({
                                  btnKey: 'wedding-btn-western',
                                  defaultBg: '#2563eb',
                                  defaultText: '#ffffff',
                                  
                                  label: selectedWeddingMsgId === msg.id || contact.relationship === 'married' ? '已选择' : '西式',
                                  disabled: selectedWeddingMsgId === msg.id || contact.relationship === 'married',
                                  onClick: () => {
                                    const roles = getWeddingRoles(contact, settings);
                                    const sceneDesc = `【西式婚礼场景】圣洁的白色教堂，鲜花拱门，阳光透过彩绘玻璃洒在红毯上。\n新郎是【${roles.groomName}】，新娘是【${roles.brideName}】。\n两位新人并肩立于圣坛前。\n主婚人站在圣坛前，微笑而庄严地宣布：\n"Dearly beloved, we are gathered here today to witness the union of ${roles.groomName} and ${roles.brideName} in holy matrimony.\n各位亲爱的来宾，今天我们齐聚于此，共同见证新郎（${roles.groomName}）与新娘（${roles.brideName}）在爱与誓言中结为夫妻。婚姻是承诺，是陪伴，是无论顺境逆境都紧握的双手。此刻，婚礼仪式正式开始——"`;
                                    startOfflineWedding(sceneDesc, msg.id);
                                  }
                                })}
                              </div>
                            )}
                          </>
                        }
                      >
                        <p className="text-xs leading-relaxed font-medium">
                          {sanitizeBubbleContent(msg.content)}
                        </p>

                        {/* 玩家发起的求婚，等待对方回应 */}
                        {msg.type === 'proposal' && isUser && pendingProposal?.from === 'user' && (pendingProposal.msgId === msg.id || !pendingProposal.msgId) && (
                          <div className="text-center mt-1.5 text-[10px] text-rose-400 animate-pulse">
                            💭 等待对方回应...
                          </div>
                        )}

                        {/* 玩家发起的离婚请求，等待对方回应 */}
                        {msg.type === 'divorce_request' && isUser && pendingDivorceRequest && (pendingDivorceRequest.msgId === msg.id || !pendingDivorceRequest.msgId) && (
                          <div className="text-center mt-1.5 text-[10px] text-stone-400 animate-pulse">
                            💭 等待对方回应...
                          </div>
                        )}
                      </UnifiedBubble>
                    );
                  })()}

                  {/* Image Bubble */}
                  {msg.type === 'image' && msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden shadow-xs border border-stone-200/80 max-w-[200px] bg-white">
                      <img
                        src={msg.imageUrl}
                        alt="聊天图片"
                        className="w-full h-auto object-cover max-h-60 rounded-xl"
                      />
                    </div>
                  )}

                  {/* Sticker/Emoji Bubble */}
                  {msg.type === 'sticker' && msg.content && (
                    <div className="max-w-[120px] rounded-lg overflow-hidden select-none active:scale-95 transition-transform" title="表情包">
                      <img
                        src={msg.content}
                        alt="表情"
                        className="w-full h-auto object-contain max-h-[100px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Forwarded Tweet Bubble */}
                  {msg.type === 'forwarded_tweet' && (
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-xs border ${
                      isUser ? 'bg-[#95ec69] text-stone-900 border-[#85dc59] rounded-tr-xs' : 'bg-white text-stone-900 border-stone-200 rounded-tl-xs'
                    } max-w-[240px]`}>
                      <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-black/10 font-bold text-[11px] text-stone-600">
                        <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px] font-mono">X</span>
                        <span>转发的推特帖子</span>
                      </div>
                      <div className="text-[12px] font-medium text-stone-900 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                      <div className="text-[9px] text-stone-400 mt-2 text-right font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}

                  {/* WeChat Voice Message Bubble */}
                  {msg.type === 'voice' && (() => {
                    const isPlaying = playingVoiceId === msg.id;
                    const voiceIconNode = isPlaying ? (
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-3.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    ) : !isTtsConfigured(settings) && !isUser ? (
                      <VolumeX className="w-4 h-4 opacity-60" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    );

                    return (
                      <div className="flex flex-col select-none">
                        <div className="relative">
                          <UnifiedBubble
                            bubbleType="voice"
                            isUser={isUser}
                            activeTheme={activeTheme}
                            onClick={() => handlePlayVoiceMessage(msg)}
                            isPlaying={isPlaying}
                            defaultIcon={voiceIconNode}
                            amount={`${msg.voiceDuration || 3}"`}
                            style={{
                              minWidth: '80px',
                              width: `${Math.min(200, Math.max(80, 80 + (msg.voiceDuration || 3) * 6))}px`,
                            }}
                          />
                          {!isUser && !isTtsConfigured(settings) && (
                            <span className="absolute -bottom-4 left-0 text-[9px] text-stone-400 border border-stone-200 bg-white rounded px-1 scale-90">
                              未配TTS
                            </span>
                          )}
                          {!isUser && !msg.isVoiceListened && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full shadow-xs border border-white" style={{ backgroundColor: 'var(--gg-danger-color, #f87171)' }} />
                          )}
                        </div>

                        {/* WeChat '转文字' */}
                        <div className="flex items-center gap-1.5 mt-0.5 px-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTranscript(msg.id);
                            }}
                            className="text-[10px] text-stone-400 hover:text-stone-600 cursor-pointer active:scale-95 transition-transform"
                          >
                            {showTranscriptIds.has(msg.id) ? '收起文字' : '转文字'}
                          </button>
                        </div>

                        {showTranscriptIds.has(msg.id) && (
                          <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-white/90 border border-stone-200 text-[11px] text-stone-700 leading-normal shadow-2xs">
                            <span className="text-[9px] text-stone-400 block mb-0.5">文字转换：</span>
                            {msg.content}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Photo Description Card */}
                  {msg.type === 'photo_desc' && (
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200 text-xs shadow-xs space-y-1">
                      <div className="flex items-center gap-1 text-stone-500 text-[10px]">
                        <Camera className="w-3 h-3 text-stone-400" />
                        <span>拍照场景描述</span>
                      </div>
                      <p className="text-stone-800 italic">“{msg.content}”</p>
                    </div>
                  )}

                  {/* Transfer Card */}
                  {msg.type === 'transfer' && (
                    <UnifiedBubble
                      bubbleType="transfer"
                      isUser={isUser}
                      activeTheme={activeTheme}
                      defaultIcon={<Coins className="w-4 h-4 text-amber-800" />}
                      defaultTitle="微信转账"
                      extra={
                        <div className="flex justify-between items-center text-[10px]">
                          <span>微信安全支付</span>
                          {msg.transferStatus === 'accepted' && <span>✅ 已收钱</span>}
                          {msg.transferStatus === 'refunded' && <span>↩️ 已退还</span>}
                        </div>
                      }
                      actions={
                        (msg.transferStatus === 'pending' || !msg.transferStatus) && msg.sender === 'ai' ? (
                          <div className="flex gap-2 w-full">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleAcceptTransfer(msg); }}
                              className="flex-1 py-1 rounded-lg text-white text-[10px] font-semibold cursor-pointer active:scale-95 transition-transform shadow-xs"
                              style={{ backgroundColor: activeTheme?.css?.['--gg-transfer-btn-bg'] || '#D97A2B' }}
                            >
                              收下
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRefundTransfer(msg); }}
                              className="flex-1 py-1 rounded-lg text-[10px] font-semibold cursor-pointer active:scale-95 transition-transform shadow-xs"
                              style={{ backgroundColor: activeTheme?.css?.['--gg-transfer-refund-bg'] || '#F6C453', color: '#6B3A1E' }}
                            >
                              退还
                            </button>
                          </div>
                        ) : undefined
                      }
                    >
                      <div className="text-lg font-bold font-mono py-0.5">
                        ¥{msg.transferAmount?.toFixed(2) || '0.00'}
                      </div>
                      {msg.transferNote && (
                        <div className="text-[11px] opacity-90 pb-0.5">
                          “{msg.transferNote}”
                        </div>
                      )}
                    </UnifiedBubble>
                  )}

                  {/* Location Card */}
                  {msg.type === 'location' && (
                    <UnifiedBubble
                      bubbleType="location"
                      isUser={isUser}
                      activeTheme={activeTheme}
                      defaultTitle="位置分享"
                    >
                      <p className="text-[11px] font-medium">{msg.content}</p>
                    </UnifiedBubble>
                  )}

                  {/* File Card */}
                  {msg.type === 'file' && (
                    <UnifiedBubble
                      bubbleType="file"
                      isUser={isUser}
                      activeTheme={activeTheme}
                      defaultTitle="文件传送"
                      extra={
                        <div className="flex justify-between items-center text-[10px] opacity-75"><span>{msg.fileSize || "文档"}</span></div>
                      }
                    >
                      <p className="text-[11px] font-medium truncate">{msg.fileName || msg.content || '未命名文件'}</p>
                    </UnifiedBubble>
                  )}

                  {/* Meet Invite Card / 线下见面邀请气泡 */}
                  {msg.type === 'meet_invite' && (
                    <UnifiedBubble
                      bubbleType="meet_invite"
                      isUser={isUser}
                      activeTheme={activeTheme}
                      defaultTitle="线下见面邀请"
                      amount={msg.meetLocation}
                      extra={
                        <div className="flex justify-between items-center text-[9.5px] opacity-80 w-full">
                          <span>线下赴约</span>
                          {msg.meetStatus === 'accepted' && (
                            <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                              <span>✅ 已同意赴约</span>
                            </span>
                          )}
                          {msg.meetStatus === 'declined' && (
                            <span className="opacity-70">已婉拒</span>
                          )}
                          {(!msg.meetStatus || msg.meetStatus === 'pending') && (
                            <span className="text-amber-600 font-medium">⏳ 待回应</span>
                          )}
                        </div>
                      }
                      actions={
                        (!msg.meetStatus || msg.meetStatus === 'pending') && msg.sender === 'ai' ? (
                          <div className="flex gap-2 w-full mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptMeetInvite(msg);
                              }}
                              className="flex-1 py-1.5 rounded-lg text-white text-[10.5px] font-bold cursor-pointer active:scale-95 transition-transform shadow-xs flex items-center justify-center gap-1"
                              style={{
                                backgroundColor: activeTheme?.css?.['--gg-meet-invite-btn-accept-bg'] || '#f59e0b',
                                color: activeTheme?.css?.['--gg-meet-invite-btn-accept-text'] || '#ffffff',
                              }}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>同意赴约</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeclineMeetInvite(msg);
                              }}
                              className="flex-1 py-1.5 rounded-lg text-[10.5px] font-semibold cursor-pointer active:scale-95 transition-transform shadow-xs flex items-center justify-center"
                              style={{
                                backgroundColor: activeTheme?.css?.['--gg-meet-invite-btn-decline-bg'] || 'rgba(0, 0, 0, 0.08)',
                                color: activeTheme?.css?.['--gg-meet-invite-btn-decline-text'] || 'inherit',
                              }}
                            >
                              <span>稍后再说</span>
                            </button>
                          </div>
                        ) : msg.meetStatus === 'accepted' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateContact(contact.id, {
                                isOfflineMode: true,
                                offlineScene: msg.meetLocation
                                  ? `【线下相见】与${contact.remark || contact.name}相约在「${msg.meetLocation}」。${msg.content || ''}`
                                  : contact.offlineScene
                              });
                            }}
                            className="w-full py-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer active:scale-95 transition-transform shadow-xs flex items-center justify-center gap-1"
                            style={{
                              backgroundColor: activeTheme?.css?.['--gg-meet-invite-btn-accept-bg'] || '#f59e0b',
                              color: '#ffffff'
                            }}
                          >
                            <span>进入线下模式 &gt;</span>
                          </button>
                        ) : undefined
                      }
                    >
                      <p className="text-[11.5px] leading-relaxed break-words font-medium my-0.5">
                        {sanitizeBubbleContent(msg.content)}
                      </p>
                    </UnifiedBubble>
                  )}

                  {/* 瑞幸咖啡点单预览卡片 */}
                  {msg.type === 'luckin_order_preview' && (
                    <div className="space-y-1.5 w-full max-w-[280px]">
                      {msg.content && (
                        <div
                          className="p-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs inline-block bg-white text-stone-800 border border-stone-200/80"
                        >
                          {msg.content}
                        </div>
                      )}
                      <LuckinOrderPreviewCard
                        order={msg.luckinOrder || quickOrder({ text: msg.content, contact, defaultFlavor: settings.luckinDefaultFlavor, storeName: settings.luckinStoreName })}
                        onConfirm={(order) => handleConfirmLuckinOrder(order, msg.id)}
                        onCancel={(order) => handleCancelLuckinOrder(order, msg.id)}
                      />
                    </div>
                  )}

                  {/* 瑞幸咖啡待支付卡片 */}
                  {msg.type === 'luckin_payment' && (
                    <div className="space-y-1.5 w-full max-w-[280px]">
                      {msg.content && (
                        <div
                          className="p-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs inline-block bg-white text-stone-800 border border-stone-200/80"
                        >
                          {msg.content}
                        </div>
                      )}
                      {msg.luckinOrder && (
                        <LuckinPaymentCard
                          order={msg.luckinOrder}
                          onPay={(order) => handlePayLuckinOrder(order)}
                        />
                      )}
                    </div>
                  )}

                  {/* 瑞幸咖啡请客送达卡片 */}
                  {msg.type === 'luckin_treat' && (
                    <div className="space-y-1.5 w-full max-w-[280px]">
                      {msg.content && (
                        <div
                          className="p-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs inline-block bg-white text-stone-800 border border-stone-200/80"
                        >
                          {msg.content}
                        </div>
                      )}
                      {msg.luckinOrder && (
                        <LuckinTreatCard
                          order={msg.luckinOrder}
                        />
                      )}
                    </div>
                  )}

                  {/* Inner Voice / 心声 */}
                  {msg.innerVoice && (
                    <div className="mt-1.5 p-2 rounded-lg bg-white/95 border border-stone-200 text-xs shadow-2xs max-w-[260px] animate-in fade-in">
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium mb-0.5">
                        <span className="px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/80 font-semibold text-[9px]">
                          心声
                        </span>
                        <span>内心潜台词</span>
                      </div>
                      <p className="text-stone-700 italic text-[11px] leading-relaxed break-words">
                        “{msg.innerVoice}”
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div 
        className={`flex flex-col ${activeTheme?.assets?.inputBg ? 'border-t-0' : 'border-t border-stone-300/80'} shrink-0 relative overflow-hidden`}
        style={{
          backgroundColor: activeTheme?.assets?.inputBg ? 'transparent' : 'var(--gg-toolbar-bg, #f7f7f7)',
          borderTop: activeTheme?.assets?.inputBg ? 'none' : undefined
        }}
      >
        {activeTheme?.assets?.inputBg && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={getBubbleBgStyle({
              isUser: false,
              prefix: 'input',
              editingTheme: activeTheme,
              bubbleBgUrl: activeTheme.assets.inputBg,
              isDot9: activeTheme?.css?.['--gg-is-dot9-inputBg'] !== 'false',
            })}
          />
        )}
        <div className="relative z-10 flex flex-col w-full h-full">
        {quoteMsg && (
          <div className="px-3 pt-2 pb-1 text-[11px]">
            <div className="bg-stone-200/90 border border-stone-300/60 rounded px-2.5 py-1.5 text-stone-600 flex justify-between items-center max-w-full shadow-2xs">
              <span className="truncate flex-1">
                引用 <span className="font-medium text-stone-800">{quoteMsg.sender === 'user' ? (settings.userNickname || '我') : (quoteMsg.senderName || contact.remark || contact.name)}</span>: {quoteMsg.type === 'text' ? (quoteMsg.content.length > 25 ? quoteMsg.content.slice(0, 25) + '...' : quoteMsg.content) : (quoteMsg.type === 'voice' ? '[语音消息]' : quoteMsg.type === 'image' ? '[图片]' : '[表情包]')}
              </span>
              <button 
                className="p-1 hover:bg-stone-300/80 rounded-full cursor-pointer shrink-0 ml-2 text-stone-500 hover:text-stone-800" 
                onClick={() => setQuoteMsg(null)}
                title="取消引用"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        
        <div className="p-2 flex items-center gap-1.5">
          {!contact.isAssistant && (
            <>
              {/* 🍥 AI Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  if (pendingProposal || pendingDivorceRequest) return;
                  handleTriggerAi();
                }}
                disabled={!!pendingProposal || !!pendingDivorceRequest}
                className={`cursor-pointer active:scale-90 transition-all shrink-0 flex items-center justify-center ${
                  activeTheme?.assets?.aiBtn
                    ? 'p-0 bg-transparent border-none'
                    : `p-1.5 w-8 h-8 rounded-lg shadow-2xs text-base ${
                        isAiGenerating || pendingProposal || pendingDivorceRequest
                          ? 'bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-600'
                          : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80'
                      }`
                }`}
                title={
                  pendingProposal
                    ? '求婚等待对方回应中...'
                    : pendingDivorceRequest
                    ? '离婚请求等待回应中...'
                    : isAiGenerating
                    ? '点击中止生成'
                    : (contact.isGroup ? '促使群聊AI成员发言' : '让对方立即回复')
                }
              >
                {activeTheme?.assets?.aiBtn ? (
                  <img
                    src={activeTheme.assets.aiBtn}
                    alt="AI"
                    className="h-8 w-auto max-w-[44px] object-contain select-none"
                  />
                ) : isAiGenerating || pendingProposal || pendingDivorceRequest ? (
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs animate-pulse" />
                ) : (
                  <span className="inline-block select-none leading-none hover:scale-110 transition-transform">
                    🍥
                  </span>
                )}
              </button>

              {/* 🎙️ Player Voice Button */}
              <button
                onClick={() => setShowPlayerVoiceModal(true)}
                className={`cursor-pointer active:scale-90 transition-all shrink-0 flex items-center justify-center ${
                  activeTheme?.assets?.voiceBtn
                    ? 'p-0 bg-transparent border-none'
                    : 'p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 shadow-2xs'
                }`}
                title="发语音（玩家自己发送）"
              >
                {activeTheme?.assets?.voiceBtn ? (
                  <img
                    src={activeTheme.assets.voiceBtn}
                    alt="语音"
                    className="h-8 w-auto max-w-[44px] object-contain select-none"
                  />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </>
          )}

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="发消息..."
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white border border-stone-300/80 text-xs text-stone-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
        />

        {!contact.isAssistant && (
          <button
            onClick={() => {
              setShowStickerMenu(!showStickerMenu);
              setShowPlusMenu(false);
            }}
            className={`cursor-pointer active:scale-90 transition-all shrink-0 flex items-center justify-center ${
              activeTheme?.assets?.emojiBtn
                ? 'p-0 bg-transparent border-none'
                : `p-1 rounded-full hover:bg-stone-200 text-stone-700 ${showStickerMenu ? 'text-[#a8b39c]' : ''}`
            }`}
            title="自定义表情"
          >
            {activeTheme?.assets?.emojiBtn ? (
              <img
                src={activeTheme.assets.emojiBtn}
                alt="表情"
                className="h-8 w-auto max-w-[44px] object-contain pointer-events-none select-none"
              />
            ) : (
              <Smile className="w-5 h-5" />
            )}
          </button>
        )}

        {/* '+' Toggle button for more features */}
        {!contact.isAssistant && (
          <button
            onClick={() => {
              setShowPlusMenu(!showPlusMenu);
              setShowStickerMenu(false);
            }}
            className={`cursor-pointer active:scale-90 transition-all shrink-0 flex items-center justify-center ${
              activeTheme?.assets?.plusBtn
                ? 'p-0 bg-transparent border-none'
                : 'p-1 rounded-full hover:bg-stone-200 text-stone-700'
            }`}
            title="更多功能"
          >
            {activeTheme?.assets?.plusBtn ? (
              <img
                src={activeTheme.assets.plusBtn}
                alt="加号"
                className={`h-8 w-auto max-w-[44px] object-contain pointer-events-none select-none transition-transform ${
                  showPlusMenu ? 'rotate-45' : ''
                }`}
              />
            ) : (
              <Plus className={`w-5 h-5 transition-transform ${showPlusMenu ? 'rotate-45' : ''}`} />
            )}
          </button>
        )}

        {/* Send Button - Always visible on the far right */}
        <button
          onClick={() => {
            if (!inputText.trim() && !contact.isAssistant) {
              inputRef.current?.focus();
              return;
            }
            handleSend();
          }}
          className={`cursor-pointer active:scale-95 transition-all shrink-0 flex items-center justify-center ${
            activeTheme?.assets?.sendBtn
              ? 'p-0 bg-transparent border-none'
              : 'px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-2xs'
          } ${
            inputText.trim() || contact.isAssistant
              ? 'opacity-100'
              : 'opacity-50 hover:opacity-75'
          }`}
          style={
            activeTheme?.assets?.sendBtn
              ? undefined
              : {
                  backgroundColor: 'var(--gg-send-btn-bg, var(--gg-accent-color, #a8b39c))',
                  color: 'var(--gg-send-btn-text, #ffffff)'
                }
          }
          title={inputText.trim() || contact.isAssistant ? "发送消息" : "输入内容后发送"}
        >
          {activeTheme?.assets?.sendBtn ? (
            <img
              src={activeTheme.assets.sendBtn}
              alt="发送"
              className="h-8 w-auto max-w-[64px] object-contain select-none"
            />
          ) : (
            <span>发送</span>
          )}
        </button>
        </div>
        </div>
      </div>

      {/* 😊 Sticker Selection Drawer Menu */}
      {showStickerMenu && (() => {
        const stickerAssignedGroups = (stickers || [])
          .map(s => s.group)
          .filter((g): g is string => Boolean(g && g.trim() !== ''));
        const existingGroups = Array.from(
          new Set([...stickerAssignedGroups, ...customGroups])
        );
        const allGroups = ['全部', '未分组', ...existingGroups];

        const filteredStickers = (stickers || []).filter((st) => {
          if (activeStickerGroup === '全部') {
            return true;
          }
          if (activeStickerGroup === '未分组') {
            return !st.group || st.group.trim() === '' || st.group === '未分组';
          }
          return st.group === activeStickerGroup;
        });

        return (
          <div className="flex flex-col bg-[#f7f7f7] border-t border-stone-200 h-60 animate-in slide-in-from-bottom duration-200 shrink-0 select-none">
            {stickers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-stone-400 text-xs mb-1">还没有导入任何自定义表情包</span>
                <span className="text-[10px] text-stone-400/80">
                  请前往微信底部的 <span className="font-semibold text-emerald-600">{"我 -> 表情包管理"}</span> 批量导入表情
                </span>
              </div>
            ) : (
              <>
                {/* Horizontal Group Selection Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 border-b border-stone-200/60 bg-[#eaeaea]/30 scrollbar-none flex-none">
                  {allGroups.map((grp) => {
                    const isActive = activeStickerGroup === grp;
                    return (
                      <button
                        key={grp}
                        onClick={() => setActiveStickerGroup(grp)}
                        className={`px-3 py-1 rounded-full text-[10px] font-medium shrink-0 transition-all cursor-pointer ${
                          isActive
                            ? 'text-white shadow-xs'
                            : 'bg-stone-200/60 text-stone-600 hover:bg-stone-200 hover:text-stone-800'
                        }`}
                        style={isActive ? { backgroundColor: 'var(--gg-group-btn-color, #a8b39c)' } : undefined}
                      >
                        {grp}
                      </button>
                    );
                  })}
                </div>

                {/* Stickers Grid */}
                <div className="flex-1 overflow-y-auto p-3">
                  {filteredStickers.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center">
                      <span className="text-stone-400 text-[11px]">该分组下暂无表情包</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {filteredStickers.map((sticker) => (
                        <div
                          key={sticker.id}
                          onClick={() => handleSendSticker(sticker.url)}
                          className="aspect-square bg-white border border-stone-200/60 rounded-lg hover:border-stone-300 p-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs"
                          title={sticker.name}
                        >
                          {sticker.url ? (
                            <img
                              src={sticker.url}
                              alt={sticker.name}
                              className="w-full h-[70%] object-contain rounded"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-[70%] bg-stone-100 rounded flex items-center justify-center text-[10px] text-stone-400">
                              无图
                            </div>
                          )}
                          <span className="text-[9px] text-stone-500 mt-1 truncate w-full text-center px-0.5 select-none">
                            {sticker.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* '+' Action Drawer Menu */}
      {showPlusMenu && (
        <div 
          className="p-3 bg-[#f7f7f7] border-t border-stone-200 grid grid-cols-4 gap-2 text-center text-xs animate-in slide-in-from-bottom duration-200 shrink-0"
          style={activeTheme?.assets?.plusPanelBg ? { backgroundImage: `url('${activeTheme.assets.plusPanelBg}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : (activeTheme?.css?.['--gg-toolbar-bg'] ? { backgroundColor: activeTheme.css['--gg-toolbar-bg'] } : undefined)}
        >
          {/* 发语音 (玩家发送自定义语音) */}
          <div
            onClick={() => {
              setShowPlayerVoiceModal(true);
              setShowPlusMenu(false);
            }}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
          >
            <div 
              className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-xs"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
              }}
            >
              {activeTheme?.assets?.plusVoiceIcon ? (
                <img src={activeTheme.assets.plusVoiceIcon} alt="发语音" className="w-6 h-6 object-contain" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </div>
            <span 
              className="text-[10px] text-stone-600"
              style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
            >
              发语音
            </span>
          </div>

          {/* 拍照 */}
          <div
            onClick={() => { setShowPhotoModal(true); setShowPlusMenu(false); }}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
          >
            <div 
              className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-xs"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
              }}
            >
              {activeTheme?.assets?.plusCameraIcon ? (
                <img src={activeTheme.assets.plusCameraIcon} alt="拍照" className="w-6 h-6 object-contain" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </div>
            <span 
              className="text-[10px] text-stone-600"
              style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
            >
              拍照
            </span>
          </div>

          {/* 图片 (本地文件上传) */}
          <div
            onClick={() => {
              imageUploadInputRef.current?.click();
            }}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
          >
            <div 
              className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-xs"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
              }}
            >
              {activeTheme?.assets?.plusAlbumIcon ? (
                <img src={activeTheme.assets.plusAlbumIcon} alt="图片" className="w-6 h-6 object-contain" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </div>
            <span 
              className="text-[10px] text-stone-600"
              style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
            >
              图片
            </span>
          </div>

          {/* 发文件 */}
          <div
            onClick={() => {
              fileInputRef.current?.click();
              setShowPlusMenu(false);
            }}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
          >
            <div 
              className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-xs"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
              }}
            >
              {activeTheme?.assets?.plusFileIcon ? (
                <img src={activeTheme.assets.plusFileIcon} alt="文件" className="w-6 h-6 object-contain" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <span 
              className="text-[10px] text-stone-600"
              style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
            >
              文件
            </span>
          </div>

          {/* 转账 */}
          <div
            onClick={handleOpenTransferModal}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
          >
            <div 
              className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-orange-500 shadow-xs"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
              }}
            >
              {activeTheme?.assets?.plusTransferIcon ? (
                <img src={activeTheme.assets.plusTransferIcon} alt="转账" className="w-6 h-6 object-contain" />
              ) : (
                <Coins className="w-5 h-5" />
              )}
            </div>
            <span 
              className="text-[10px] text-stone-600"
              style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
            >
              转账
            </span>
          </div>

          {/* 发定位 (支持自己输入位置) */}
          <div
            onClick={() => {
              setShowLocationModal(true);
              setShowPlusMenu(false);
            }}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
          >
            <div 
              className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-emerald-600 shadow-xs"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
              }}
            >
              {activeTheme?.assets?.plusLocationIcon ? (
                <img src={activeTheme.assets.plusLocationIcon} alt="发定位" className="w-6 h-6 object-contain" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </div>
            <span 
              className="text-[10px] text-stone-600"
              style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
            >
              发定位
            </span>
          </div>

          {/* 语音通话 (私聊) */}
          {!contact.isGroup && (
            <div
              onClick={() => { 
                setCallDirection('outgoing');
                setShowCallModal(true); 
                setShowPlusMenu(false); 
              }}
              className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
            >
              <div 
                className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-sky-600 shadow-xs"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
                }}
              >
                {activeTheme?.assets?.plusCallIcon ? (
                  <img src={activeTheme.assets.plusCallIcon} alt="语音通话" className="w-6 h-6 object-contain" />
                ) : (
                  <PhoneCall className="w-5 h-5" />
                )}
              </div>
              <span 
                className="text-[10px] text-stone-600"
                style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
              >
                语音通话
              </span>
            </div>
          )}

          {/* 线下模式 (只保留在菜单中的线下模式按钮) */}
          <div
            onClick={() => {
              onUpdateContact(contact.id, { isOfflineMode: !contact.isOfflineMode });
              setShowPlusMenu(false);
            }}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
          >
            <div 
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-xs ${
                contact.isOfflineMode ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-stone-200 text-stone-600'
              }`}
              style={{
                backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
              }}
            >
              {activeTheme?.assets?.plusOfflineIcon ? (
                <img src={activeTheme.assets.plusOfflineIcon} alt="线下模式" className="w-6 h-6 object-contain" />
              ) : (
                <Compass className="w-5 h-5" />
              )}
            </div>
            <span 
              className="text-[10px] text-stone-600"
              style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
            >
              {contact.isOfflineMode ? '切回线上' : '线下模式'}
            </span>
          </div>

          {/* 瑞幸点单 (AI 帮点咖啡) */}
          <div
            onClick={() => {
              setShowLuckinOrderSheet(true);
              setShowPlusMenu(false);
            }}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
          >
            <div 
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0b2d64] to-[#1e4e8c] border border-blue-600/30 flex items-center justify-center text-white shadow-xs"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-plus-icon-bg'] || undefined,
                color: activeTheme?.css?.['--gg-plus-icon-color'] || undefined
              }}
            >
              <Coffee className="w-5 h-5 text-amber-300" />
            </div>
            <span 
              className="text-[10px] text-stone-600"
              style={{ color: activeTheme?.css?.['--gg-plus-item-text'] || undefined }}
            >
              瑞幸点单
            </span>
          </div>
        </div>
      )}

      {/* 玩家自定义发送语音弹窗 */}
      {showPlayerVoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div 
            className="w-full max-w-xs rounded-2xl p-4 shadow-2xl space-y-3 border border-stone-200 animate-in zoom-in-95 duration-150 text-xs relative overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: activeTheme?.assets?.voiceModalBg ? `url('${activeTheme.assets.voiceModalBg}')` : undefined,
              backgroundColor: activeTheme?.css?.['--gg-voice-panel-bg'] || '#ffffff',
              color: activeTheme?.css?.['--gg-voice-panel-text'] || undefined,
            }}
          >
            <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100/80 pb-2">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                  style={{
                    backgroundColor: activeTheme?.css?.['--gg-voice-mic-bg'] || '#f0f3eb',
                    color: activeTheme?.css?.['--gg-voice-mic-icon-color'] || '#a8b39c'
                  }}
                >
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <h4 
                  className="font-bold text-xs text-stone-900"
                  style={{ color: activeTheme?.css?.['--gg-voice-panel-text'] || undefined }}
                >
                  发送微信语音
                </h4>
              </div>
              <button
                onClick={() => setShowPlayerVoiceModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
                style={{ color: activeTheme?.css?.['--gg-voice-panel-text'] ? `${activeTheme.css['--gg-voice-panel-text']}99` : undefined }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-stone-600" style={{ color: activeTheme?.css?.['--gg-voice-panel-text'] || undefined }}>语音文字内容</label>
                <span className="text-[10px] text-stone-400" style={{ color: activeTheme?.css?.['--gg-voice-panel-text'] ? `${activeTheme.css['--gg-voice-panel-text']}99` : undefined }}>{playerVoiceContent.length} 字</span>
              </div>
              <textarea
                value={playerVoiceContent}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlayerVoiceContent(val);
                  if (!durationManuallySet) {
                    setPlayerVoiceDuration(Math.min(60, Math.max(2, Math.round(val.length / 3.2))));
                  }
                }}
                placeholder="输入你想以语音发送的内容（点击转文字时将显示此内容）..."
                rows={3}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white resize-none"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-voice-field-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-voice-field-text'] || activeTheme?.css?.['--gg-voice-panel-text'] || undefined
                }}
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {[
                  '行，等会儿见！',
                  '收到，马上到！',
                  '哈哈哈哈笑死我了',
                  '今天加班，改天约~'
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setPlayerVoiceContent(preset);
                      if (!durationManuallySet) {
                        setPlayerVoiceDuration(Math.min(60, Math.max(2, Math.round(preset.length / 3.2))));
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] cursor-pointer active:scale-95 transition-transform"
                    style={{
                      backgroundColor: activeTheme?.css?.['--gg-voice-field-bg'] ? `${activeTheme.css['--gg-voice-field-bg']}` : undefined,
                      color: activeTheme?.css?.['--gg-voice-panel-text'] || undefined
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-stone-600 flex items-center gap-1" style={{ color: activeTheme?.css?.['--gg-voice-panel-text'] || undefined }}>
                  <Clock className="w-3 h-3 opacity-70" />
                  <span>语音时长</span>
                </label>
                <span className="font-mono text-xs font-bold text-[#a8b39c]" style={{ color: activeTheme?.css?.['--gg-voice-slider-color'] || undefined }}>
                  {playerVoiceDuration}" 秒
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={playerVoiceDuration}
                  onChange={(e) => {
                    setDurationManuallySet(true);
                    setPlayerVoiceDuration(Number(e.target.value));
                  }}
                  className="flex-1 accent-[#a8b39c] cursor-pointer"
                  style={{ accentColor: activeTheme?.css?.['--gg-voice-slider-color'] || undefined }}
                />
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={playerVoiceDuration}
                  onChange={(e) => {
                    setDurationManuallySet(true);
                    setPlayerVoiceDuration(Math.max(1, Math.min(60, Number(e.target.value) || 1)));
                  }}
                  className="w-12 p-1 text-center font-mono text-xs border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                  style={{
                    backgroundColor: activeTheme?.css?.['--gg-voice-field-bg'] || undefined,
                    color: activeTheme?.css?.['--gg-voice-field-text'] || activeTheme?.css?.['--gg-voice-panel-text'] || undefined
                  }}
                />
              </div>
              <div className="flex gap-1 mt-1.5">
                {[2, 4, 8, 15, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setDurationManuallySet(true);
                      setPlayerVoiceDuration(sec);
                    }}
                    className={`flex-1 py-1 rounded text-[10px] font-mono font-medium border cursor-pointer ${
                      playerVoiceDuration === sec
                        ? 'bg-[#f0f3eb] text-[#a8b39c] border-[#a8b39c]'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                    style={playerVoiceDuration === sec && activeTheme?.css?.['--gg-voice-slider-color'] ? {
                      color: activeTheme.css['--gg-voice-slider-color'],
                      borderColor: activeTheme.css['--gg-voice-slider-color'],
                      backgroundColor: `${activeTheme.css['--gg-voice-slider-color']}18`
                    } : undefined}
                  >
                    {sec}"
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1 items-stretch">
              <button
                type="button"
                onClick={() => setShowPlayerVoiceModal(false)}
                className="relative flex-1 py-2 px-3 rounded-xl border border-stone-200 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[38px]"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-voice-cancel-bg'] || undefined,
                }}
              >
                <span
                  className="relative z-10 font-medium text-xs text-center select-none"
                  style={{ color: activeTheme?.css?.['--gg-voice-cancel-text'] || '#57534e' }}
                >
                  取消
                </span>
              </button>

              <button
                type="button"
                onClick={handleSendPlayerVoice}
                disabled={!playerVoiceContent.trim()}
                className="relative flex-1 py-2 px-3 rounded-xl bg-[#a8b39c] hover:bg-[#96a18a] flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[38px] disabled:opacity-50 shadow-xs"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-voice-submit-bg'] || '#a8b39c',
                }}
              >
                <span
                  className="relative z-10 font-semibold text-xs flex items-center justify-center gap-1 select-none"
                  style={{ color: activeTheme?.css?.['--gg-voice-submit-text'] || '#ffffff' }}
                >
                  <Send className="w-3.5 h-3.5" style={{ color: activeTheme?.css?.['--gg-voice-submit-text'] || '#ffffff' }} />
                  <span>发送语音</span>
                </span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 自定义发定位弹窗 */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="w-80 rounded-2xl p-4 shadow-2xl text-xs space-y-3 border border-stone-200 relative overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: activeTheme?.assets?.locationModalBg ? `url('${activeTheme.assets.locationModalBg}')` : undefined,
              backgroundColor: activeTheme?.css?.['--gg-location-panel-bg'] || '#ffffff',
              color: activeTheme?.css?.['--gg-location-panel-text'] || undefined
            }}
          >
            <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" style={{ color: activeTheme?.css?.['--gg-location-panel-icon-color'] || activeTheme?.css?.['--gg-location-icon-color'] || undefined }} />
                <h4 className="font-bold text-sm text-stone-800" style={{ color: activeTheme?.css?.['--gg-location-panel-text'] || undefined }}>
                  发送自定义位置
                </h4>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
                style={{ color: activeTheme?.css?.['--gg-location-panel-text'] ? `${activeTheme.css['--gg-location-panel-text']}99` : undefined }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-stone-500 mb-1" style={{ color: activeTheme?.css?.['--gg-location-panel-text'] || undefined }}>
                地点名称 / 建筑名称
              </label>
              <input
                type="text"
                placeholder="例如: 星巴克咖啡(高新南店) / 腾讯大厦"
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                className="w-full p-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-location-field-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-location-field-text'] || activeTheme?.css?.['--gg-location-panel-text'] || undefined
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-500 mb-1" style={{ color: activeTheme?.css?.['--gg-location-panel-text'] || undefined }}>
                详细地址 (可选)
              </label>
              <input
                type="text"
                placeholder="例如: 深圳市南山区高新南九道与深南大道交汇处"
                value={customLocationDetail}
                onChange={(e) => setCustomLocationDetail(e.target.value)}
                className="w-full p-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-location-field-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-location-field-text'] || activeTheme?.css?.['--gg-location-panel-text'] || undefined
                }}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-stone-400" style={{ color: activeTheme?.css?.['--gg-location-panel-text'] ? `${activeTheme.css['--gg-location-panel-text']}99` : undefined }}>
                快捷推荐：
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  '深圳市南山区科技园高新南九道',
                  '三里屯太古里南区',
                  '上海市徐汇区安福路街角咖啡厅',
                  '广州市天河区花城汇广场',
                  '成都市锦江区春熙路IFS'
                ].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setCustomLocationName(loc);
                      setCustomLocationDetail('');
                    }}
                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] cursor-pointer"
                    style={{
                      backgroundColor: activeTheme?.css?.['--gg-location-chip-bg'] || undefined,
                      color: activeTheme?.css?.['--gg-location-chip-text'] || activeTheme?.css?.['--gg-location-panel-text'] || undefined
                    }}
                  >
                    {loc.slice(0, 10)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-1.5 rounded-lg border border-stone-200 text-stone-600 cursor-pointer"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-location-cancel-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-location-cancel-text'] || undefined
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  const finalLoc = customLocationName.trim() 
                    ? (customLocationDetail.trim() ? `${customLocationName.trim()} (${customLocationDetail.trim()})` : customLocationName.trim())
                    : '深圳市南山区科技园高新南九道';
                  
                  onSendMessage({
                    sender: 'user',
                    content: finalLoc,
                    type: 'location',
                    timestamp: Date.now()
                  });
                  setCustomLocationName('');
                  setCustomLocationDetail('');
                  setShowLocationModal(false);

                  // AI automatically replies after natural delay
                  setTimeout(() => {
                    handleTriggerAi();
                  }, 750);
                }}
                className="flex-1 py-1.5 rounded-lg bg-[#a8b39c] text-white font-semibold cursor-pointer shadow-xs"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-location-submit-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-location-submit-text'] || undefined
                }}
              >
                发送定位
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 拍照描述弹窗 */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div 
            className="w-72 rounded-2xl p-4 shadow-2xl text-xs space-y-3 relative overflow-hidden bg-cover bg-center border border-stone-200"
            style={{
              backgroundImage: activeTheme?.assets?.photoModalBg ? `url('${activeTheme.assets.photoModalBg}')` : undefined,
              backgroundColor: activeTheme?.css?.['--gg-photo-panel-bg'] || '#ffffff',
              color: activeTheme?.css?.['--gg-photo-panel-text'] || undefined
            }}
          >
            <div className="relative z-10 space-y-3">
            <h4 className="font-bold text-sm text-stone-800 flex items-center gap-1.5" style={{ color: activeTheme?.css?.['--gg-photo-panel-text'] || undefined }}>
              <Camera className="w-4 h-4 text-emerald-600" style={{ color: activeTheme?.css?.['--gg-photo-icon-color'] || undefined }} />
              <span>拍照描述发送给 AI</span>
            </h4>
            <p className="text-[11px] text-stone-500" style={{ color: activeTheme?.css?.['--gg-photo-panel-text'] ? `${activeTheme.css['--gg-photo-panel-text']}cc` : undefined }}>
              输入你眼前的画面描述，AI 好友将像看到真实照片一样进行互动：
            </p>
            <textarea
              placeholder="例如: 我正在一家街角咖啡店，窗外正在下雨，桌上放着一杯热拿铁..."
              value={photoDesc}
              onChange={(e) => setPhotoDesc(e.target.value)}
              className="w-full p-2 border border-stone-200 rounded-lg h-20 resize-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-photo-field-bg'] || undefined,
                color: activeTheme?.css?.['--gg-photo-field-text'] || activeTheme?.css?.['--gg-photo-panel-text'] || undefined
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="flex-1 py-1.5 rounded-lg border border-stone-200 text-stone-600 cursor-pointer"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-photo-cancel-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-photo-cancel-text'] || undefined
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (photoDesc.trim()) {
                    onSendMessage({
                      sender: 'user',
                      content: photoDesc.trim(),
                      type: 'photo_desc',
                      timestamp: Date.now()
                    });
                    setPhotoDesc('');
                    setShowPhotoModal(false);

                    // AI automatically replies after natural delay
                    setTimeout(() => {
                      handleTriggerAi();
                    }, 750);
                  }
                }}
                className="flex-1 py-1.5 rounded-lg bg-[#a8b39c] text-white font-semibold cursor-pointer shadow-xs"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-photo-submit-bg'] || undefined,
                  color: activeTheme?.css?.['--gg-photo-submit-text'] || undefined
                }}
              >
                发送
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 升级版微信转账弹窗 */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="w-80 rounded-2xl p-5 shadow-2xl text-xs space-y-4 border border-stone-100 dark:border-stone-800 relative overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: activeTheme?.assets?.transferModalBg ? `url('${activeTheme.assets.transferModalBg}')` : undefined,
              backgroundColor: activeTheme?.css?.['--gg-transfer-panel-bg'] || '#ffffff',
              color: activeTheme?.css?.['--gg-transfer-panel-text'] || undefined
            }}
          >
            <div className="relative z-10 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0"
                  style={{
                    backgroundColor: activeTheme?.css?.['--gg-transfer-icon-bg'] || '#fef3c7',
                    color: activeTheme?.css?.['--gg-transfer-icon-color'] || '#b45309'
                  }}
                >
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-800 dark:text-stone-100" style={{ color: activeTheme?.css?.['--gg-transfer-panel-text'] || undefined }}>
                    {contact.isGroup && transferStep === 'select_target' ? '选择转账群成员' : '微信转账'}
                  </h4>
                  {contact.isGroup && transferStep === 'enter_details' && (
                    <p className="text-[10px] text-amber-600 font-medium" style={{ color: activeTheme?.css?.['--gg-transfer-icon-color'] || undefined }}>
                      转账给：@{allContacts.find(c => c.id === transferTargetId)?.remark || allContacts.find(c => c.id === transferTargetId)?.name || '群成员'}
                    </p>
                  )}
                  {!contact.isGroup && (
                    <p className="text-[10px] text-stone-500" style={{ color: activeTheme?.css?.['--gg-transfer-panel-text'] ? `${activeTheme.css['--gg-transfer-panel-text']}aa` : undefined }}>
                      向 {contact.remark || contact.name} 转账
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full cursor-pointer"
                style={{ color: activeTheme?.css?.['--gg-transfer-panel-text'] ? `${activeTheme.css['--gg-transfer-panel-text']}99` : undefined }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Select Group Member (Group Chat Only) */}
            {contact.isGroup && transferStep === 'select_target' ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="text-[11px] text-stone-500 mb-1 font-medium" style={{ color: activeTheme?.css?.['--gg-transfer-panel-text'] || undefined }}>
                  请选择要给谁转账：
                </p>
                {displayGroupMembers.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setTransferTargetId(m.id);
                      setTransferStep('enter_details');
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-3 transition-colors cursor-pointer text-left"
                    style={{
                      backgroundColor: activeTheme?.css?.['--gg-transfer-field-bg'] || undefined,
                      color: activeTheme?.css?.['--gg-transfer-panel-text'] || undefined
                    }}
                  >
                    <Avatar src={m.avatar} name={m.name} size={14} className="w-7 h-7 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-800 dark:text-stone-100 text-xs truncate" style={{ color: activeTheme?.css?.['--gg-transfer-panel-text'] || undefined }}>
                        {m.remark || m.name}
                      </div>
                      {m.bio && <div className="text-[10px] text-stone-400 truncate">{m.bio}</div>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Step 2: Input Amount and Custom Note */
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1 font-medium" style={{ color: activeTheme?.css?.['--gg-transfer-panel-text'] || undefined }}>
                    转账金额 (元):
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-lg font-bold text-amber-600" style={{ color: activeTheme?.css?.['--gg-transfer-icon-color'] || undefined }}>¥</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-lg font-bold font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                      placeholder="0.00"
                      style={{
                        backgroundColor: activeTheme?.css?.['--gg-transfer-field-bg'] || undefined,
                        color: activeTheme?.css?.['--gg-transfer-field-text'] || activeTheme?.css?.['--gg-transfer-panel-text'] || undefined
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1 font-medium" style={{ color: activeTheme?.css?.['--gg-transfer-panel-text'] || undefined }}>
                    添加备注 (自定义):
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    placeholder="输入转账说明/备注（如：拿去买奶茶）"
                    style={{
                      backgroundColor: activeTheme?.css?.['--gg-transfer-field-bg'] || undefined,
                      color: activeTheme?.css?.['--gg-transfer-field-text'] || activeTheme?.css?.['--gg-transfer-panel-text'] || undefined
                    }}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {contact.isGroup && (
                    <button
                      type="button"
                      onClick={() => setTransferStep('select_target')}
                      className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 font-semibold cursor-pointer active:scale-95 transition-all"
                    >
                      重新选择
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold cursor-pointer active:scale-95 transition-all"
                    style={{
                      backgroundColor: activeTheme?.css?.['--gg-transfer-cancel-bg'] || undefined,
                      color: activeTheme?.css?.['--gg-transfer-cancel-text'] || undefined
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const amountVal = Math.max(0.01, parseFloat(transferAmount) || 0);
                      const noteVal = transferNote.trim();
                      const targetMember = contact.isGroup ? allContacts.find(c => c.id === transferTargetId) : undefined;
                      const targetName = targetMember ? (targetMember.remark || targetMember.name) : undefined;

                      onSendMessage({
                        sender: 'user',
                        content: targetName
                          ? `向 @${targetName} 转账 ¥${amountVal.toFixed(2)}${noteVal ? ` (备注: ${noteVal})` : ''}`
                          : `向对方转账 ¥${amountVal.toFixed(2)}${noteVal ? ` (备注: ${noteVal})` : ''}`,
                        type: 'transfer',
                        transferAmount: amountVal,
                        transferNote: noteVal || undefined,
                        transferTo: targetName,
                        transferStatus: 'pending',
                        timestamp: Date.now()
                      });

                      setShowTransferModal(false);
                      setTransferNote('');
                      setTransferAmount('50');

                      // AI automatically replies after natural delay
                      setTimeout(() => {
                        handleTriggerAi();
                      }, 750);
                    }}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer active:scale-95 transition-all shadow-md"
                    style={{
                      backgroundColor: activeTheme?.css?.['--gg-transfer-submit-bg'] || undefined,
                      color: activeTheme?.css?.['--gg-transfer-submit-text'] || undefined
                    }}
                  >
                    确认转账
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* 全屏实时语音通话界面 */}
      {showCallModal && (
        <VoiceCallModal
          contact={contact}
          settings={settings}
          worldBooks={worldBooks}
          direction={callDirection}
          recentMessages={messages.slice(-20)}
          onClose={(callLogs) => {
            setShowCallModal(false);
            stopAllActiveAudio();
            if (callLogs.length > 0) {
              const summaryText = `[语音通话结束，共 ${callLogs.length} 条对话记录]`;
              onSendMessage({
                sender: 'system',
                content: summaryText,
                timestamp: Date.now(),
                type: 'text'
              });
            }
          }}
        />
      )}

      {/* 求婚弹窗 */}
      {showProposalModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-6 shadow-2xl border-2 border-rose-300 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shadow-inner">
              <RingSVG className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-rose-700 mb-2">
              {proposalFrom === 'ai' ? `${contact.remark || contact.name} 向你求婚了！` : `你向 ${contact.remark || contact.name} 求婚了！`}
            </h3>
            <p className="text-sm text-rose-600 mb-6 leading-relaxed">
              {proposalFrom === 'ai' 
                ? `经过这么久的相处，${contact.remark || contact.name} 深深爱上了你。TA单膝跪地，递上戒指，问你愿意吗？`
                : `${contact.remark || contact.name} 被你打动了，TA红着脸等你开口...`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setProposalAccepted(true);
                  setShowProposalModal(false);
                  setShowWeddingPage(true);
                  onUpdateContact(contact.id, { relationship: 'engaged' });
                }}
                className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                我愿意 ❤️
              </button>
              <button
                onClick={() => {
                  setShowProposalModal(false);
                  // 拒绝后好感度降低
                  onUpdateContact(contact.id, { affection: Math.max(0, (contact.affection || 0) - 20) });
                }}
                className="flex-1 py-3 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-sm cursor-pointer"
              >
                再想想
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 结婚仪式页面 */}
      {showWeddingPage && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-100 via-pink-100 to-red-100 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
          {/* 花瓣装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="absolute text-2xl animate-fall" style={{ left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${4 + Math.random() * 4}s`, fontSize: `${16 + Math.random() * 24}px` }}>🌸</div>
            ))}
          </div>
          
          <style>{`
            @keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
            .animate-fall { animation: fall linear infinite; }
          `}</style>
          
          <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-rose-300 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 shadow-inner">
              <WeddingChurchSVG className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-rose-700 mb-1">🎊 婚礼仪式 🎊</h2>
            <div className="h-0.5 w-20 mx-auto bg-rose-300 my-3"></div>
            
            <div className="flex items-center justify-center gap-4 my-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-rose-200 mx-auto flex items-center justify-center text-3xl shadow-md">
                  <Avatar src={settings.userAvatar} className="w-14 h-14 rounded-full" size={28} />
                </div>
                <p className="text-xs font-bold text-stone-700 mt-1">{settings.userNickname}</p>
              </div>
              <span className="text-2xl text-rose-400">❤️</span>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-rose-200 mx-auto flex items-center justify-center text-3xl shadow-md">
                  <Avatar src={contact.avatar} className="w-14 h-14 rounded-full" size={28} />
                </div>
                <p className="text-xs font-bold text-stone-700 mt-1">{contact.remark || contact.name}</p>
              </div>
            </div>
            
            <p className="text-sm text-stone-600 leading-relaxed my-3">
              在亲朋好友的见证下，你们即将许下永恒的誓言。💕
            </p>
            
            {/* 两个选项 */}
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={handleDirectMarriage}
                className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md cursor-pointer active:scale-95 transition-transform"
              >
                💕 直接进入婚姻生活
              </button>
              <button
                onClick={() => {
                  setShowWeddingPage(false);
                  // 触发 AI 发起线下婚礼仪式请求
                  setTimeout(() => {
                    onSendMessage({
                      sender: 'ai',
                      content: '我想和你在线下举办一场真正的婚礼仪式，你愿意吗？选择你喜欢的风格吧！',
                      timestamp: Date.now(),
                      type: 'wedding_offline_invite'
                    });
                  }, 500);
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md cursor-pointer active:scale-95 transition-transform"
              >
                🎎 进入线下模式体验婚礼仪式
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右上角 ⋯ 聊天设置新页面 */}
      {showSettingsDrawer && (
        <div 
          className="absolute inset-0 z-50 bg-[#f2efeb] flex flex-col animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between h-12 px-4 border-b border-[#dfdad2] bg-[#e6deda]/95 backdrop-blur-md shrink-0">
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="p-1 text-[#736c64] hover:text-[#4a453f] cursor-pointer active:scale-95 transition-transform shrink-0"
              title="返回"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-[#4a453f] flex-1 text-center pr-6">
              {contact.isGroup ? '群聊设置' : '聊天信息与人设'}
            </span>
          </div>

          {/* Content List Container */}
          <div className="flex-1 overflow-y-auto p-4 text-xs">
            {contact.isGroup ? (
              /* ================= 群聊专属设置 (仅保留 7 项) ================= */
              <div className="space-y-4 py-3">
                {/* 1. 群聊头像 */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#5c554e]">群聊头像</span>
                  <div className="flex items-center gap-2">
                    <div
                      onClick={handleAvatarClick}
                      className="cursor-pointer active:scale-95 transition-transform shrink-0"
                      title="点击更换群聊头像"
                    >
                      <Avatar
                        src={contact.avatar}
                        name={contact.name}
                        className="w-10 h-10 rounded-lg border border-[#dfdad2]"
                        size={20}
                      />
                    </div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleContactAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="px-2.5 py-1 rounded bg-[#e6deda] hover:bg-[#dbd3ce] text-[11px] text-[#5c554e] cursor-pointer font-medium transition-colors"
                    >
                      更换头像
                    </button>
                  </div>
                </div>

                {/* 2. 群聊名称 */}
                <div>
                  <label className="block text-[11px] text-[#736c64] mb-1">群聊名称</label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => onUpdateContact(contact.id, { name: e.target.value })}
                    className="w-full p-1.5 border border-[#dfdad2] rounded text-xs bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    placeholder="输入群聊名称..."
                  />
                </div>

                {/* 3. 聊天背景 */}
                <div>
                  <label className="block text-[11px] text-[#736c64] mb-1">聊天背景</label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-12 h-12 rounded-lg border border-[#dfdad2] bg-cover bg-center shrink-0 bg-[#e6deda]/40"
                      style={contact.backgroundUrl ? { backgroundImage: `url(${contact.backgroundUrl})` } : {}}
                    />
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          onUpdateContact(contact.id, { backgroundUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }}
                      accept="image/*"
                      className="text-xs text-[#736c64] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[#e6deda] file:text-[11px] file:text-[#5c554e] file:hover:bg-[#dbd3ce] cursor-pointer"
                    />
                  </div>
                </div>

                {/* 4. 世界书绑定 */}
                <div>
                  <label className="block text-[11px] text-[#736c64] mb-1">
                    世界书绑定 (背景设定)
                  </label>
                  <div className="space-y-1 max-h-28 overflow-y-auto p-1.5 bg-[#fcfbfa] rounded-lg border border-[#dfdad2]">
                    {worldBooks.map((wb) => {
                      const isChecked = (contact.worldBookIds || []).includes(wb.id);
                      return (
                        <label
                          key={wb.id}
                          className="flex items-center gap-2 text-[11px] text-[#5c554e] cursor-pointer p-1 hover:bg-white rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...(contact.worldBookIds || []), wb.id]
                                : (contact.worldBookIds || []).filter(id => id !== wb.id);
                              onUpdateContact(contact.id, { worldBookIds: newIds });
                            }}
                            className="w-3.5 h-3.5 accent-[#8a9a86] cursor-pointer"
                          />
                          <span>{wb.name}</span>
                          <span className="text-[10px] text-[#8c8275]">({wb.scope})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 5. 群成员心声开关 */}
                <div className="space-y-2 pt-2 border-t border-[#dfdad2]">
                  <label className="block text-[11px] font-medium text-[#5c554e]">群成员心声开关</label>
                  <p className="text-[10px] text-[#8c8275]">分别控制群内各好友发言末尾是否展现潜台词心声：</p>
                  <div className="space-y-2 bg-[#fcfbfa] p-2.5 rounded-xl border border-[#dfdad2] max-h-36 overflow-y-auto">
                    {displayGroupMembers.map((member) => {
                      const isEnabled = contact.memberInnerVoiceEnabled?.[member.id] ?? member.enableInnerVoice;
                      return (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={member.avatar}
                              className="w-7 h-7 rounded-full border border-[#dfdad2]"
                              size={14}
                            />
                            <div>
                              <div className="text-xs font-medium text-[#4a453f]">
                                {member.remark || member.name}
                              </div>
                              <div className="text-[10px] text-[#8c8275]">
                                {member.group || '好友'}
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              const newInnerVoiceMap = {
                                ...(contact.memberInnerVoiceEnabled || {}),
                                [member.id]: e.target.checked
                              };
                              onUpdateContact(contact.id, { memberInnerVoiceEnabled: newInnerVoiceMap });
                            }}
                            className="w-4 h-4 accent-[#8a9a86] cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 6. 添加/删除群用户 */}
                <div className="space-y-2 pt-2 border-t border-[#dfdad2]">
                  <label className="block text-[11px] font-medium text-[#5c554e]">添加 / 移除群成员</label>
                  <div className="flex gap-1.5 items-center">
                    <select
                      value={selectedFriendToAdd}
                      onChange={(e) => setSelectedFriendToAdd(e.target.value)}
                      className="flex-1 p-1.5 border border-[#dfdad2] rounded-lg bg-[#faf9f7] text-xs text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="">选择好友加入群聊...</option>
                      {allContacts
                        .filter(c => !c.isGroup && c.group !== '群聊' && !c.id.startsWith('group_') && !(contact.groupMemberIds || []).includes(c.id))
                        .map(f => (
                          <option key={f.id} value={f.id}>
                            {f.remark || f.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedFriendToAdd}
                      onClick={() => {
                        if (selectedFriendToAdd) {
                          const updatedIds = Array.from(new Set([...(contact.groupMemberIds || []), selectedFriendToAdd]));
                          onUpdateContact(contact.id, { groupMemberIds: updatedIds });
                          setSelectedFriendToAdd('');
                        }
                      }}
                      className="px-3 py-1.5 bg-[#8a9a86] hover:bg-[#7c8b78] text-white rounded-lg font-medium text-xs disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      添加
                    </button>
                  </div>

                  <div className="space-y-1.5 bg-[#fcfbfa] p-2 rounded-lg border border-[#dfdad2] max-h-36 overflow-y-auto">
                    {allContacts
                      .filter(c => !c.isGroup && (contact.groupMemberIds || []).includes(c.id))
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-1 hover:bg-white rounded">
                          <div className="flex items-center gap-2">
                            <Avatar src={member.avatar} className="w-6 h-6 rounded-full border border-[#dfdad2]" size={12} />
                            <span className="text-xs text-[#4a453f]">{member.remark || member.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if ((contact.groupMemberIds || []).length <= 1) {
                                alert('群聊至少需保留 1 位成员！');
                                return;
                              }
                              const updatedIds = (contact.groupMemberIds || []).filter(id => id !== member.id);
                              onUpdateContact(contact.id, { groupMemberIds: updatedIds });
                            }}
                            className="text-[11px] text-[#c39797] hover:text-[#b08080] cursor-pointer px-1.5 py-0.5 rounded border border-[#eedada] bg-white hover:bg-[#faf4f4] transition-colors"
                          >
                            移除
                          </button>
                        </div>
                      ))}
                    {allContacts.filter(c => !c.isGroup && (contact.groupMemberIds || []).includes(c.id)).length === 0 && (
                      <div className="text-[11px] text-[#8c8275] py-1 text-center">暂无群成员</div>
                    )}
                  </div>
                </div>

                {/* 7. 删除群聊 */}
                <div className="pt-3 border-t border-[#dfdad2]">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingConfirm({
                        title: '删除群聊',
                        message: `确定要删除群聊【${contact.name}】吗？此操作不可恢复。`,
                        onConfirm: () => {
                          setShowSettingsDrawer(false);
                          onDeleteContact(contact.id);
                        }
                      });
                    }}
                    className="w-full py-2 rounded-lg bg-[#eedada]/40 hover:bg-[#eedada]/80 text-[#b06a6a] border border-[#eedada]/80 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>删除群聊</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ================= 私聊设置面板 (保留备注、人设、分组等) ================= */
              <div className="space-y-4 py-3">
                {/* 更换头像 */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#5c554e]">联系人头像</span>
                  <div className="flex items-center gap-2">
                    <div
                      onClick={handleAvatarClick}
                      className="cursor-pointer active:scale-95 transition-transform shrink-0"
                      title="点击更换联系人头像"
                    >
                      <Avatar
                        src={contact.avatar}
                        name={contact.name}
                        className="w-10 h-10 rounded-lg border border-[#dfdad2]"
                        size={20}
                      />
                    </div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleContactAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="px-2 py-1 rounded bg-[#e6deda] hover:bg-[#dbd3ce] text-[11px] text-[#5c554e] cursor-pointer font-medium transition-colors"
                    >
                      更换头像
                    </button>
                  </div>
                </div>

                {/* 名字 & 备注名 */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-[#736c64]">名字</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => onUpdateContact(contact.id, { name: e.target.value })}
                      className="w-full p-1.5 border border-[#dfdad2] rounded mt-0.5 bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#736c64]">备注名</label>
                    <input
                      type="text"
                      value={contact.remark || ''}
                      onChange={(e) => onUpdateContact(contact.id, { remark: e.target.value })}
                      className="w-full p-1.5 border border-[#dfdad2] rounded mt-0.5 bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#736c64]">TA的拍一拍后缀 (如: 的小脑袋)</label>
                    <input
                      type="text"
                      value={contact.patSuffix || ''}
                      placeholder="留空则只显示名字"
                      onChange={(e) => onUpdateContact(contact.id, { patSuffix: e.target.value })}
                      className="w-full p-1.5 border border-[#dfdad2] rounded mt-0.5 text-xs bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#736c64]">我的拍一拍后缀 (如: 的肩膀)</label>
                    <input
                      type="text"
                      value={settings.userPatSuffix || ''}
                      placeholder="留空则只显示我的名字"
                      onChange={(e) => onUpdateSettings({ userPatSuffix: e.target.value })}
                      className="w-full p-1.5 border border-[#dfdad2] rounded mt-0.5 text-xs bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#736c64]">所属分组</label>
                    <input
                      type="text"
                      value={contact.group}
                      onChange={(e) => onUpdateContact(contact.id, { group: e.target.value })}
                      className="w-full p-1.5 border border-[#dfdad2] rounded mt-0.5 bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* 好感度显示 + 手动调整 + 求婚按钮 */}
                {!contact.isAssistant && (
                  <div className="py-2 border-b border-[#dfdad2]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#5c554e]">好感度</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#dfdad2] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#c39797] rounded-full transition-all duration-500" 
                            style={{ width: `${Math.round(contact.affection || 0)}%` }} 
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const newVal = Math.max(0, (contact.affection || 0) - 5);
                              onUpdateContact(contact.id, { affection: newVal });
                            }}
                            className="w-6 h-6 rounded-full bg-[#e6deda] hover:bg-[#dbd3ce] text-[#5c554e] text-xs font-bold cursor-pointer transition-colors"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold text-[#b06a6a] w-8 text-center">
                            {Math.round(contact.affection || 0)}
                          </span>
                          <button
                            onClick={() => {
                              const newVal = Math.min(100, (contact.affection || 0) + 5);
                              onUpdateContact(contact.id, { affection: newVal });
                            }}
                            className="w-6 h-6 rounded-full bg-[#e6deda] hover:bg-[#dbd3ce] text-[#5c554e] text-xs font-bold cursor-pointer transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* 关系状态 + 求婚按钮 */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-[#8c8275] inline-flex items-center gap-1">
                        关系：{contact.relationship === 'married' ? <><CustomHeartSVG className="w-3.5 h-3.5 text-[#b06a6a]" /> 已婚</> : contact.relationship === 'engaged' ? <><RingSVG className="w-3.5 h-3.5 text-[#b06a6a]" /> 已订婚</> : contact.relationship === 'dating' ? <><CustomHeartSVG className="w-3.5 h-3.5 text-[#c39797]" /> 恋爱中</> : '朋友'}
                      </span>
                      {/* 求婚按钮：好感度 >= 80 且未结婚/订婚时显示 */}
                      {(contact.affection || 0) >= 80 && contact.relationship !== 'married' && contact.relationship !== 'engaged' && (
                        pendingProposal ? (
                          <button
                            disabled
                            className="px-3 py-1 rounded-full bg-[#e6deda] text-[#8c8275] text-[10px] font-semibold cursor-not-allowed animate-pulse shadow-2xs"
                          >
                            ⏳ 等待回应...
                          </button>
                        ) : (
                          <button
                            onClick={handleUserProposal}
                            disabled={!!pendingDivorceRequest}
                            className="px-3 py-1 rounded-full bg-[#c39797] hover:bg-[#b58686] text-white text-[10px] font-semibold cursor-pointer shadow-2xs active:scale-95 transition-all inline-flex items-center gap-1"
                          >
                            <RingSVG className="w-3.5 h-3.5" />
                            <span>求婚</span>
                          </button>
                        )
                      )}
                      {contact.relationship === 'engaged' && (
                        <span className="text-[10px] text-[#b06a6a] font-semibold inline-flex items-center gap-1">
                          <RingSVG className="w-3 h-3" /> 已订婚，等待举行婚礼
                        </span>
                      )}
                      {contact.relationship === 'married' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const existingRecord = (settings.marriages || []).find(m => m.partnerId === contact.id) || {
                                partnerId: contact.id,
                                partnerName: contact.remark || contact.name,
                                partnerAvatar: contact.avatar,
                                marryDate: new Date().toLocaleDateString('zh-CN'),
                                certificateId: `MC${contact.id.slice(-6)}`
                              };
                              setShowMarriageCertificateModal(existingRecord);
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#eedada]/40 hover:bg-[#eedada]/70 text-[#b06a6a] border border-[#eedada]/80 text-[10px] font-semibold cursor-pointer shadow-3xs transition-colors"
                          >
                            📜 查看婚书
                          </button>
                          {pendingDivorceRequest ? (
                            <button
                              disabled
                              className="px-2.5 py-1 rounded-full bg-[#e6deda] text-[#8c8275] text-[10px] font-semibold cursor-not-allowed animate-pulse shadow-3xs"
                            >
                              ⏳ 等待回应...
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleDivorceRequest}
                              disabled={!!pendingProposal}
                              className="px-2.5 py-1 rounded-full bg-[#b8aba0] hover:bg-[#a5988d] text-white text-[10px] font-semibold cursor-pointer shadow-3xs active:scale-95 transition-all"
                            >
                              💔 离婚
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 已经不再需要弹窗，改为气泡交互 */}
                {false && showDivorceConfirm && (
                  <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-[#f2efeb] rounded-2xl p-6 shadow-2xl text-center border border-[#dfdad2]">
                      <div className="text-5xl mb-3">💔</div>
                      <h3 className="text-xl font-bold text-[#4a453f] mb-2">确定要离婚吗？</h3>
                      <p className="text-sm text-[#736c64] mb-6">
                        离婚后，婚书将被清除，你们的关系将回到朋友。
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDivorceConfirm(false);
                            onSendMessage({
                              sender: 'user',
                              content: '💕 不离了，我们好好的。',
                              timestamp: Date.now(),
                              type: 'text'
                            });
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#e6deda] text-[#4a453f] font-bold text-sm cursor-pointer hover:bg-[#dbd3ce] transition-colors"
                        >
                          不离了
                        </button>
                        <button
                          onClick={() => {
                            setShowDivorceConfirm(false);
                            handleDivorce();
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#c39797] text-white font-bold text-sm cursor-pointer hover:bg-[#b58686] transition-colors"
                        >
                          确定离婚
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 角色性别设定 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-[#736c64] font-medium">角色性别设定</label>
                    <span className="text-[10px] text-[#8c8275]">
                      系统推断：{inferContactGender(contact) === 'male' ? '♂ 男 (男友/男性)' : inferContactGender(contact) === 'female' ? '♀ 女 (女友/女性)' : '其它/未指定'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: undefined, label: '智能推断' },
                      { id: 'male', label: '♂ 男角色' },
                      { id: 'female', label: '♀ 女角色' }
                    ].map((item) => (
                      <button
                        key={String(item.id)}
                        type="button"
                        onClick={() => onUpdateContact(contact.id, { gender: item.id as any })}
                        className={`py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer transition-all ${
                          contact.gender === item.id || (!contact.gender && item.id === undefined)
                            ? 'bg-[#ebd9d9] text-[#9c5c5c] border-[#d4b2b2] font-semibold'
                            : 'bg-[#faf9f7] text-[#736c64] border-[#dfdad2] hover:bg-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI 人设 */}
                <div>
                  <label className="block text-[11px] text-[#736c64] mb-1">
                    AI 人设 (性格、说话方式)
                  </label>
                  <textarea
                    value={contact.persona}
                    onChange={(e) => onUpdateContact(contact.id, { persona: e.target.value })}
                    className="w-full p-2 border border-[#dfdad2] rounded-lg h-24 resize-none leading-relaxed bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                  />
                </div>

                {/* 世界书绑定 */}
                <div>
                  <label className="block text-[11px] text-[#736c64] mb-1">
                    绑定世界书 (背景设定)
                  </label>
                  <div className="space-y-1 max-h-28 overflow-y-auto p-1.5 bg-[#fcfbfa] rounded-lg border border-[#dfdad2]">
                    {worldBooks.map((wb) => {
                      const isChecked = (contact.worldBookIds || []).includes(wb.id);
                      return (
                        <label
                          key={wb.id}
                          className="flex items-center gap-2 text-[11px] text-[#5c554e] cursor-pointer p-1 hover:bg-white rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...(contact.worldBookIds || []), wb.id]
                                : (contact.worldBookIds || []).filter(id => id !== wb.id);
                              onUpdateContact(contact.id, { worldBookIds: newIds });
                            }}
                            className="w-3.5 h-3.5 accent-[#8a9a86]"
                          />
                          <span>{wb.name}</span>
                          <span className="text-[10px] text-[#8c8275]">({wb.scope})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 回复风格 (发散 / 中等 / 严谨) */}
                <div>
                  <label className="block text-[11px] text-[#736c64] mb-1">回复风格</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'creative', label: '发散' },
                      { id: 'balanced', label: '中等' },
                      { id: 'precise', label: '严谨' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onUpdateContact(contact.id, { replyStyle: item.id as any })}
                        className={`py-1.5 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                          contact.replyStyle === item.id
                            ? 'bg-[#f0ece9] text-[#8a9a86] border-[#8a9a86] font-semibold'
                            : 'bg-white text-[#736c64] border-[#dfdad2]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 回复速度滑块 */}
                <div>
                  <div className="flex justify-between text-[11px] text-[#736c64] mb-1">
                    <span>回复速度 (延迟手感)</span>
                    <span>{contact.replySpeed}ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={contact.replySpeed}
                    onChange={(e) => onUpdateContact(contact.id, { replySpeed: parseInt(e.target.value) })}
                    className="w-full accent-[#8a9a86]"
                  />
                </div>

                {/* AI 记忆与日记管理 */}
                <div className="pt-2 border-t border-[#dfdad2]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-[#5c554e] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#8a9a86]" />
                      <span>AI 记忆与日记管理</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDiaryModal(true)}
                      className="p-2.5 bg-[#f2e6db] hover:bg-[#ebdccc] border border-[#dfcdbe] rounded-xl text-left transition-colors cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 text-[#7c5b3c] font-semibold text-xs mb-1">
                        <BookOpen className="w-3.5 h-3.5 text-[#916b47] group-hover:scale-110 transition-transform" />
                        <span>管理日记</span>
                      </div>
                      <p className="text-[10px] text-[#916b47]/95 font-medium">
                        {memory.diaries.length > 0 ? `已记录 ${memory.diaries.length} 篇日记` : '每天自动生成一篇'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMemoryModal(true)}
                      className="p-2.5 bg-[#eae2f0] hover:bg-[#dfd4e6] border border-[#d2c2dc] rounded-xl text-left transition-colors cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 text-[#674482] font-semibold text-xs mb-1">
                        <Brain className="w-3.5 h-3.5 text-[#7d569c] group-hover:scale-110 transition-transform" />
                        <span>管理记忆</span>
                      </div>
                      <p className="text-[10px] text-[#7d569c]/95 font-medium">
                        {memory.facts.length > 0 ? `已提炼 ${memory.facts.length} 条事实` : '每30条消息总结一次'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* 记忆条数 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#736c64]">短期记忆 (条)</label>
                    <input
                      type="number"
                      value={contact.shortTermMemory}
                      onChange={(e) => onUpdateContact(contact.id, { shortTermMemory: parseInt(e.target.value) || 5 })}
                      className="w-full p-1.5 border border-[#dfdad2] rounded mt-0.5 bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#736c64]">长期记忆 (条)</label>
                    <input
                      type="number"
                      value={contact.longTermMemory}
                      onChange={(e) => onUpdateContact(contact.id, { longTermMemory: parseInt(e.target.value) || 20 })}
                      className="w-full p-1.5 border border-[#dfdad2] rounded mt-0.5 bg-[#faf9f7] text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* 语音音色 (Voice ID) */}
                <div>
                  <label className="block text-[11px] text-[#736c64] mb-1">语音音色 (Voice ID) <span className="text-red-500 font-bold">*</span></label>
                  <input
                    type="text"
                    value={contact.voiceTimbre || ''}
                    onChange={(e) => onUpdateContact(contact.id, { voiceTimbre: e.target.value })}
                    placeholder="请输入该联系人的自定义音色 ID"
                    className="w-full p-1.5 border border-[#dfdad2] rounded bg-[#faf9f7] text-xs font-mono text-[#4a453f] focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
                  />
                </div>

                {/* 语音通话快捷操作 */}
                <div className="space-y-1.5 pt-1 border-t border-[#dfdad2]">
                  <label className="block text-[11px] text-[#736c64] font-medium">语音通话测试</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsDrawer(false);
                        setCallDirection('outgoing');
                        setShowCallModal(true);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#dae3eb] hover:bg-[#cbd6e0] text-[#4e6a80] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>给对方打电话</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsDrawer(false);
                        setCallDirection('incoming');
                        setShowCallModal(true);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#daebe0] hover:bg-[#cbdccf] text-[#4e805c] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5" />
                      <span>模拟对方来电</span>
                    </button>
                  </div>
                </div>

                {/* 聊天背景 */}
                <div className="pt-2 border-t border-[#dfdad2]">
                  <label className="block text-[11px] text-[#736c64] mb-1">聊天背景</label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-12 h-12 rounded-lg border border-[#dfdad2] bg-cover bg-center bg-[#e6deda]"
                      style={contact.backgroundUrl ? { backgroundImage: `url(${contact.backgroundUrl})` } : {}}
                    />
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          onUpdateContact(contact.id, { backgroundUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }}
                      accept="image/*"
                      className="text-xs text-[#736c64] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[#e6deda] file:text-[11px] file:text-[#5c554e] cursor-pointer"
                    />
                  </div>
                </div>

                {/* 心声开关 */}
                <div className="space-y-2 pt-1 border-t border-[#dfdad2]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5c554e]">心声开关 [心声: xxx]</span>
                    <input
                      type="checkbox"
                      checked={contact.enableInnerVoice}
                      onChange={(e) => onUpdateContact(contact.id, { enableInnerVoice: e.target.checked })}
                      className="w-4 h-4 accent-[#8a9a86] cursor-pointer"
                    />
                  </div>
                </div>

                {/* 删除联系人 */}
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setPendingConfirm({
                        title: '删除联系人',
                        message: `确定要删除联系人 ${contact.remark || contact.name} 吗？`,
                        onConfirm: () => {
                          setShowSettingsDrawer(false);
                          onDeleteContact(contact.id);
                        }
                      });
                    }}
                    className="w-full py-2 rounded-lg bg-[#eedada]/40 hover:bg-[#eedada]/80 text-[#b06a6a] border border-[#eedada]/80 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>删除联系人</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multi-Select Bottom Bar */}
      {isMultiSelectMode && (
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#f5f5f5] border-t border-stone-200 z-30 flex items-center justify-between px-6 pb-2 animate-in slide-in-from-bottom-full duration-200">
          <button 
            className="text-stone-500 font-medium text-xs cursor-pointer active:scale-95 transition-transform p-2"
            onClick={() => {
              setIsMultiSelectMode(false);
              setSelectedMsgIds(new Set());
            }}
          >
            取消
          </button>
          <button 
            className={`text-red-500 font-medium text-xs cursor-pointer active:scale-95 transition-transform p-2 ${selectedMsgIds.size === 0 ? 'opacity-50' : ''}`}
            disabled={selectedMsgIds.size === 0}
            onClick={() => {
              if (selectedMsgIds.size > 0) {
                setPendingConfirm({
                  title: '批量删除消息',
                  message: `确定删除这 ${selectedMsgIds.size} 条消息吗？`,
                  onConfirm: () => {
                    Array.from(selectedMsgIds).forEach(id => onDeleteMessage?.(id));
                    setIsMultiSelectMode(false);
                    setSelectedMsgIds(new Set());
                  }
                });
              }
            }}
          >
            <Trash2 className="w-5 h-5 mx-auto mb-0.5" />
            删除
          </button>
        </div>
      )}

      {/* Context Menu Overlay */}
      {contextMenuMsgId && (
        <div 
          className="fixed inset-0 z-[60]" 
          onClick={() => setContextMenuMsgId(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenuMsgId(null); }}
        >
          {(() => {
            const msg = messages.find(m => m.id === contextMenuMsgId);
            if (!msg) return null;
            const isUser = msg.sender === 'user';
            
            return (
              <div 
                className="absolute bg-gradient-to-b from-[#FFF9F5] to-[#FDF0E9] border border-[#EED7C5] text-[#5E3B20] rounded-xl shadow-lg text-[11px] flex p-1 animate-in zoom-in-95 duration-150 backdrop-blur-sm -translate-x-1/2"
                style={{ 
                  left: Math.max(80, Math.min(contextMenuPos.x, window.innerWidth - 80)),
                  top: Math.max(20, contextMenuPos.y - 55)
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center whitespace-nowrap overflow-x-auto no-scrollbar max-w-[85vw]">
                  {onToggleFavorite && (
                    <button 
                      className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer text-[#D48A8A] font-bold"
                      onClick={() => {
                        const sName = msg.sender === 'user' ? (settings.userNickname || '我') : (msg.senderName || contact.remark || contact.name);
                        const sAvatar = msg.sender === 'user' ? settings.userAvatar : (msg.senderAvatar || contact.avatar);
                        onToggleFavorite(msg, sName, sAvatar);
                        setContextMenuMsgId(null);
                      }}
                    >
                      {favorites.some(f => f.id === msg.id) ? '取消收藏' : '收藏'}
                    </button>
                  )}
                  <button 
                    className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                    onClick={() => {
                      setQuoteMsg(msg);
                      setContextMenuMsgId(null);
                    }}
                  >
                    引用
                  </button>
                  <button 
                    className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                    onClick={() => {
                      setIsMultiSelectMode(true);
                      setSelectedMsgIds(new Set([msg.id]));
                      setContextMenuMsgId(null);
                    }}
                  >
                    多选
                  </button>
                  <button 
                    className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                    onClick={() => {
                      onDeleteMessage?.(msg.id);
                      setContextMenuMsgId(null);
                    }}
                  >
                    删除
                  </button>
                  {msg.type === 'text' && (
                    <button 
                      className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                      onClick={() => {
                        setEditingMsgId(msg.id);
                        setEditContent(msg.content);
                        setContextMenuMsgId(null);
                      }}
                    >
                      编辑
                    </button>
                  )}
                  {isUser && (
                    <button 
                      className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer text-emerald-600 font-bold"
                      onClick={() => {
                        handleRegenerate(msg.id);
                        setContextMenuMsgId(null);
                      }}
                    >
                      重生
                    </button>
                  )}
                  <button 
                    className="px-2.5 py-1.5 hover:bg-[#FBE8DE] rounded-md cursor-pointer"
                    onClick={() => {
                      onRecallMessage?.(msg.id);
                      setContextMenuMsgId(null);
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

      {/* Edit Message Modal */}
      {editingMsgId && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[300px] bg-white rounded-2xl p-4 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-semibold text-stone-800 mb-3 text-center">编辑文字内容</h3>
            <textarea
              autoFocus
              className="w-full h-24 p-3 bg-stone-100 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#a8b39c]/50 resize-none border-none"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                className="flex-1 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl font-medium text-xs transition-colors"
                onClick={() => setEditingMsgId(null)}
              >
                取消
              </button>
              <button
                className="flex-1 py-2 bg-[#a8b39c] hover:bg-[#96a18a] text-white rounded-xl font-medium text-xs transition-colors"
                onClick={() => {
                  onEditMessage?.(editingMsgId, editContent);
                  setEditingMsgId(null);
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Custom Confirm Modal */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[280px] bg-white rounded-2xl p-4 shadow-xl text-center animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-stone-900 mb-2">{pendingConfirm.title}</h3>
            <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">{pendingConfirm.message}</p>
            <div className="flex items-center gap-2.5">
              <button
                className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => setPendingConfirm(null)}
              >
                取消
              </button>
              <button
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => {
                  pendingConfirm.onConfirm();
                  setPendingConfirm(null);
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Diary Management Modal */}
      {showDiaryModal && (
        <div className="fixed inset-0 z-[75] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <h3 className="font-bold text-sm">AI 日记管理</h3>
              </div>
              <button
                onClick={() => {
                  setShowDiaryModal(false);
                  setEditingDiaryId(null);
                }}
                className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-header info */}
            <div className="px-4 py-2 bg-amber-50/60 border-b border-amber-100 text-[11px] text-amber-900 leading-snug">
              每天基于对话自动记录一篇总结，包含话题、心情与关键摘要，亦可手动增删改。
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Add new diary */}
              <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <label className="block text-[11px] font-semibold text-stone-700">手动添加日记</label>
                <textarea
                  value={newDiaryContent}
                  onChange={(e) => setNewDiaryContent(e.target.value)}
                  placeholder={`格式示例：[${new Date().toLocaleDateString('zh-CN')}] 今天和${settings.userNickname || '用户'}聊了：...`}
                  className="w-full h-20 p-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (newDiaryContent.trim()) {
                        handleAddDiary(newDiaryContent);
                      }
                    }}
                    disabled={!newDiaryContent.trim()}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>添加日记</span>
                  </button>
                </div>
              </div>

              {/* Diary entries list */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 px-0.5">
                  <span>历史日记列表 ({memory.diaries.length})</span>
                </div>

                {memory.diaries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p>暂无日记记录</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">每日与该好友对话后，AI 将自动总结生成</p>
                  </div>
                ) : (
                  memory.diaries
                    .slice()
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((diary) => {
                      const isEditing = editingDiaryId === diary.id;
                      const dateStr = new Date(diary.timestamp).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <div
                          key={diary.id}
                          className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3 space-y-2 text-xs text-stone-800"
                        >
                          <div className="flex items-center justify-between text-[11px] text-amber-800/80 pb-1 border-b border-amber-100 font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              {dateStr}
                            </span>
                            <div className="flex items-center gap-1">
                              {!isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingDiaryId(diary.id);
                                      setEditingDiaryContent(diary.content);
                                    }}
                                    className="p-1 hover:bg-amber-100 rounded text-amber-700 cursor-pointer"
                                    title="编辑"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDiary(diary.id)}
                                    className="p-1 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                                    title="删除"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleSaveEditDiary(diary.id)}
                                    className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-medium cursor-pointer"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={() => setEditingDiaryId(null)}
                                    className="px-2 py-0.5 bg-stone-200 text-stone-600 rounded text-[10px] cursor-pointer"
                                  >
                                    取消
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <textarea
                              value={editingDiaryContent}
                              onChange={(e) => setEditingDiaryContent(e.target.value)}
                              className="w-full h-20 p-2 text-xs bg-white rounded border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
                            />
                          ) : (
                            <p className="leading-relaxed whitespace-pre-wrap text-stone-700">
                              {diary.content}
                            </p>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDiaryModal(false);
                  setEditingDiaryId(null);
                }}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Memory Facts Management Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-[75] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <h3 className="font-bold text-sm">AI 关键记忆管理</h3>
              </div>
              <button
                onClick={() => setShowMemoryModal(false)}
                className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-header info */}
            <div className="px-4 py-2 bg-purple-50/60 border-b border-purple-100 text-[11px] text-purple-900 leading-snug">
              每 30 条消息自动总结提炼用户个人信息、喜好偏好、重要事件等（单条限 30 字内）。
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Add new fact */}
              <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                  <span>手动添加记忆事实</span>
                  <span className={`text-[10px] ${newFactContent.length >= 30 ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                    {newFactContent.length}/30 字
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={30}
                  value={newFactContent}
                  onChange={(e) => setNewFactContent(e.target.value)}
                  placeholder="例如：用户最喜欢草莓，不喜欢吃香菜"
                  className="w-full p-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (newFactContent.trim()) {
                        handleAddFact(newFactContent);
                      }
                    }}
                    disabled={!newFactContent.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>添加事实</span>
                  </button>
                </div>
              </div>

              {/* Facts list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 px-0.5">
                  <span>提炼的关键事实 ({memory.facts.length})</span>
                </div>

                {memory.facts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p>暂无关键事实记忆</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">每达到 30 条消息时，AI 将自动分析提取</p>
                  </div>
                ) : (
                  memory.facts.map((f) => (
                    <div
                      key={f.id}
                      className="bg-purple-50/50 border border-purple-200/60 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs text-stone-800 group"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <span className="leading-snug break-words text-stone-700">{f.fact}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteFact(f.id)}
                        className="p-1 hover:bg-red-100 rounded text-stone-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowMemoryModal(false)}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 华美喜庆婚书弹窗 */}
      {showMarriageCertificateModal && (
        <MarriageCertificateModal
          certificate={showMarriageCertificateModal}
          settings={settings}
          contact={contact}
          onClose={() => setShowMarriageCertificateModal(null)}
          actionText="收纳婚书并开启婚姻生活"
        />
      )}

      {/* TA的今日行程弹窗 */}
      {showScheduleModal && (
        <ScheduleModal
          contact={contact}
          settings={settings}
          activeTheme={activeTheme}
          onClose={() => setShowScheduleModal(false)}
          onUpdateContact={onUpdateContact}
        />
      )}

      {/* 瑞幸咖啡收银台支付弹窗 */}
      {isPaymentModalOpen && selectedPaymentOrder && (
        <LuckinPaymentModal
          order={selectedPaymentOrder}
          contact={contact}
          settings={settings}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* 瑞幸点单快捷选择抽屉 / 弹窗 */}
      {showLuckinOrderSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header with Luckin Brand styling */}
            <div className="p-3.5 bg-gradient-to-r from-[#0b2d64] to-[#1e4e8c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Coffee className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-wide">让 TA 帮我点瑞幸咖啡</h3>
                  <p className="text-[9px] text-blue-200">根据人设与好感度为您生成专属点单</p>
                </div>
              </div>
              <button
                onClick={() => setShowLuckinOrderSheet(false)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick choices list */}
            <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className="text-[11px] text-stone-600">
                告诉 <span className="font-semibold text-blue-900">「{contact.remark || contact.name}」</span> 你想喝什么：
              </div>

              {/* Popular choices chips */}
              <div className="grid grid-cols-2 gap-2">
                {LUCKIN_DRINKS.slice(0, 8).map((drink) => (
                  <button
                    key={drink.id}
                    onClick={() => {
                      setShowLuckinOrderSheet(false);
                      const userContent = `帮我点杯${drink.name}吧～（${drink.defaultSpecs.temperature}、${drink.defaultSpecs.sweetness}）`;
                      onSendMessage({
                        sender: 'user',
                        content: userContent,
                        type: 'text',
                        timestamp: Date.now()
                      });
                      setTimeout(() => {
                        handleTriggerAi();
                      }, 600);
                    }}
                    className="p-2 bg-stone-50 hover:bg-blue-50/60 border border-stone-200 hover:border-blue-300 rounded-xl flex items-center gap-2 text-left transition-all active:scale-95 group"
                  >
                    <img
                      src={drink.image}
                      alt={drink.name}
                      className="w-8 h-8 rounded-lg object-cover bg-white border border-stone-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[11px] text-stone-800 group-hover:text-blue-900 truncate">
                        {drink.name}
                      </div>
                      <div className="text-[9.5px] text-stone-400">¥{drink.price} · {drink.category}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <label className="text-[11px] font-medium text-stone-700">自定义点单需求与口味：</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={luckinCustomDrinkNote}
                    onChange={(e) => setLuckinCustomDrinkNote(e.target.value)}
                    placeholder="如：帮我点杯冰美式不加糖 / 生椰拿铁微冰..."
                    className="flex-1 p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                  />
                  <button
                    onClick={() => {
                      if (!luckinCustomDrinkNote.trim()) return;
                      const text = luckinCustomDrinkNote.trim();
                      setLuckinCustomDrinkNote('');
                      setShowLuckinOrderSheet(false);
                      onSendMessage({
                        sender: 'user',
                        content: text.startsWith('帮我点') || text.includes('咖啡') ? text : `帮我点杯咖啡：${text}`,
                        type: 'text',
                        timestamp: Date.now()
                      });
                      setTimeout(() => {
                        handleTriggerAi();
                      }, 600);
                    }}
                    className="px-3.5 py-2 bg-[#0b2d64] hover:bg-[#1e4e8c] text-white text-xs font-semibold rounded-xl active:scale-95 transition-all shrink-0"
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
