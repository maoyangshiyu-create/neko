import React, { useState } from 'react';
import { 
  ChevronLeft, 
  RotateCcw, 
  Coffee, 
  BookOpen, 
  Baby, 
  MessageSquare, 
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Hand,
  Users,
  Utensils,
  Tv,
  Image as ImageIcon,
  Check,
  Search,
  Sparkles,
  Heart,
  Save,
  BookMarked,
  CheckCircle2,
  Shirt,
  Smile
} from 'lucide-react';
import { Contact, PhoneSettings, WorldBookItem, ContactMemory, DiaryEntry, MemoryFact } from '../../../types/phone';
import { LifeSimChildData } from '../../../types/lifeSim';
import { CharacterState, Direction, Furniture, HomeType, IntimacyActionType } from './homesteadTypes';
import { useHomesteadEngine } from './useHomesteadEngine';
import { HomesteadCanvas } from './HomesteadCanvas';
import { HOME_CONFIGS } from './furnitureData';
import { isFamilyContact, isRomanticContact } from './homesteadClassifier';
import { callAI } from '../../../services/aiService';
import { callHouseholdGroupInteractionAI } from './homesteadAiService';
import { AvatarCustomizerModal } from './AvatarCustomizerModal';

interface HomesteadAppProps {
  settings: PhoneSettings;
  contacts: Contact[];
  worldBooks?: WorldBookItem[];
  onReturnToDesktop: () => void;
  contactMemories?: Record<string, ContactMemory>;
  onUpdateContactMemory?: (contactId: string, memory: ContactMemory) => void;
}

interface HomesteadInteractionLog {
  id: string;
  type: 'npc_chat' | 'furniture' | 'baby' | 'coffee';
  title: string;
  detail: string;
  involvedContactIds: string[];
  involvedContactNames: string[];
  homeType: HomeType;
  timestamp: number;
}

export const HomesteadApp: React.FC<HomesteadAppProps> = ({
  settings,
  contacts,
  worldBooks = [],
  onReturnToDesktop,
  contactMemories,
  onUpdateContactMemory
}) => {
  // 当前家园类型：'marital' 婚后爱巢 | 'family' 亲人小筑
  const [homeType, setHomeType] = useState<HomeType>('marital');

  // 弹窗状态
  const [activeModal, setActiveModal] = useState<
    'sofa' | 'coffee' | 'bookshelf' | 'crib' | 'dining' | 'tea' | 'tv' | 'kitchen' | 'photo' | 'double_bed' | 'bathtub' | null
  >(null);
  const [modalText, setModalText] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [babyStatus, setBabyStatus] = useState<'crying' | 'sleeping' | 'none'>('none');
  const [babyName, setBabyName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 保存家园互动到记忆 & 日记状态
  const [interactionLogs, setInteractionLogs] = useState<HomesteadInteractionLog[]>([]);
  const [isSavingToMemories, setIsSavingToMemories] = useState<boolean>(false);
  const [savedSummary, setSavedSummary] = useState<{
    contactId: string;
    contactName: string;
    avatar: string;
    diary: string;
    facts: string[];
  }[] | null>(null);

  // 邀请好友弹窗状态
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteSearch, setInviteSearch] = useState<string>('');
  const [inviteTab, setInviteTab] = useState<'recommended' | 'all'>('recommended');

  // 角色换装/外观自定义弹窗状态
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);

  // 自定义举动输入框
  const [customActionText, setCustomActionText] = useState<string>('');

  // NPC 气泡对话状态（支持多AI同时回复）
  const [npcSpeeches, setNpcSpeeches] = useState<{
    npcId: string;
    npcName: string;
    text: string;
  }[]>([]);

  const setNpcSpeech = (speech: { npcId: string; npcName: string; text: string } | null) => {
    if (speech === null) {
      setNpcSpeeches([]);
    } else {
      setNpcSpeeches([speech]);
    }
  };

  const npcSpeech = npcSpeeches.length > 0 ? npcSpeeches[0] : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 记录互动日志
  const addInteractionLog = (log: Omit<HomesteadInteractionLog, 'id' | 'timestamp'>) => {
    const newLog: HomesteadInteractionLog = {
      ...log,
      id: `hlog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };
    setInteractionLogs(prev => [...prev, newLog]);
  };

  // 查找宝宝数据与年龄
  const checkChildData = (): { hasChild: boolean; childName: string; childAge: number } => {
    try {
      const marriages = settings.marriages || [];
      for (const m of marriages) {
        const raw = localStorage.getItem(`wephone_pet_list_v1_${m.partnerId}`);
        if (raw) {
          const list: LifeSimChildData[] = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            const item = list[0];
            const age = item.age ?? (item.birthTimestamp ? Math.floor((Date.now() - item.birthTimestamp) / (86400000 * 30)) : 1);
            return { hasChild: true, childName: item.childName || '宝宝', childAge: age };
          }
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wephone_pet_list_v1_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: LifeSimChildData[] = JSON.parse(raw);
            if (Array.isArray(list) && list.length > 0) {
              const item = list[0];
              const age = item.age ?? (item.birthTimestamp ? Math.floor((Date.now() - item.birthTimestamp) / (86400000 * 30)) : 1);
              return { hasChild: true, childName: item.childName || '宝宝', childAge: age };
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return { hasChild: false, childName: '', childAge: 0 };
  };

  // 家具互动处理（支持多人物全员联动与全家共同互动）
  const handleInteractFurniture = async (furniture: Furniture) => {
    if (furniture.type === 'double_bed' || furniture.type === 'single_bed') {
      setActiveModal('double_bed');
      return;
    }

    if (furniture.type === 'crib') {
      const { hasChild, childName, childAge } = checkChildData();
      if (hasChild) {
        setBabyName(childName);
        if (childAge >= 7) {
          setModalText(`【7岁小学生普通单人床】\n${childName} 已经 ${childAge} 岁上小学啦！原本的婴儿床已自动替换升级为舒适的小学生单人木床。孩子正在书桌前做功课，睡懒觉的样子很可爱哦～`);
          setActiveModal('crib');
          return;
        }
        setBabyStatus('crying');
      } else {
        setBabyStatus('none');
      }
      setActiveModal('crib');
      return;
    }

    if (furniture.type === 'coffee_machine') {
      setActiveModal('coffee');
      return;
    }

    if (furniture.type === 'bathtub') {
      setActiveModal('bathtub');
      return;
    }

    // 设置对应家具弹窗
    switch (furniture.type) {
      case 'sofa':
        setActiveModal('sofa');
        break;
      case 'bookshelf':
        setActiveModal('bookshelf');
        break;
      case 'dining_table':
        setActiveModal('dining');
        break;
      case 'tea_table':
        setActiveModal('tea');
        break;
      case 'tv_cabinet':
        setActiveModal('tv');
        break;
      case 'kitchen_stove':
        setActiveModal('kitchen');
        break;
      case 'family_photo':
        setActiveModal('photo');
        break;
      default:
        setActiveModal('sofa');
        break;
    }

    setIsLoadingAi(true);
    setModalText('正在加载与家人们的真实互动中...');

    try {
      const result = await callHouseholdGroupInteractionAI({
        furniture,
        homeType,
        characters: npcsRef.current,
        settings,
        worldBooks
      });
      setModalText(result || '（无回应）');

      // 记录到互动日志，以便保存到 AI 日记与记忆
      addInteractionLog({
        type: 'furniture',
        title: `在【${furniture.name}】前全家互动`,
        detail: result,
        involvedContactIds: npcsRef.current.map(n => n.contact?.id).filter(Boolean) as string[],
        involvedContactNames: npcsRef.current.map(n => n.name),
        homeType
      });
    } catch {
      setModalText('（互动加载超时，请稍后再试一次）');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 处理 NPC 互动
  const handleInteractNPC = async (npc: CharacterState) => {
    if (!npc.contact) return;
    if (npc.isOutside) {
      showToast(`${npc.name} 正在外面晨跑中，请点击上方【叫TA回家】召唤TA吧！`);
      setNpcSpeech({
        npcId: npc.id,
        npcName: npc.name,
        text: '（此时正巧在外面晨跑，你可以点击上方【叫TA回家】召唤TA回到身边哦）'
      });
      return;
    }

    // 检查是否属于洗澡中或在床上躺着的组团互动
    const isBathingGroup = playerRef.current.isBathing && npc.isBathing;
    const isSleepingGroup = playerRef.current.isSleepingOnBed && npc.isSleepingOnBed;

    let targetNpcs: CharacterState[] = [];
    if (isBathingGroup) {
      targetNpcs = npcsRef.current.filter(n => n.isBathing && !n.isOutside);
    } else if (isSleepingGroup) {
      targetNpcs = npcsRef.current.filter(n => n.isSleepingOnBed && !n.isOutside);
    } else {
      targetNpcs = [npc];
    }

    setIsLoadingAi(true);

    // 严禁硬编码 AI 模板台词，回复出来之前只显示加载中
    setNpcSpeeches(targetNpcs.map(n => ({
      npcId: n.id,
      npcName: n.name,
      text: '（正在思考回应中...）'
    })));

    const faceToFacePrompt = `【极其重要场景指令：你们现在正实体面对面呆在家里房间！绝不是隔着手机打字，也不是在外面晨跑！必须表现出真实的体温、眼神对视与近距离肢体动作自然回应。】\n` +
      (homeType === 'family'
        ? '（在亲人小筑的家里走向 TA，唠唠家常感受亲情温暖）'
        : '（在婚后的爱巢里走向 TA，感受两人的甜蜜与温馨）');

    try {
      const responses = await Promise.all(targetNpcs.map(async (currNpc) => {
        if (!currNpc.contact) return null;

        let groupContextPrompt = faceToFacePrompt;
        if (targetNpcs.length > 1) {
          const otherNames = targetNpcs.filter(n => n.id !== currNpc.id).map(n => n.name).join('、');
          if (currNpc.isBathing) {
            groupContextPrompt = `【多人全员洗澡高燃互动：你们现在正和玩家以及其他家人/伴侣（${otherNames}）一起在宽敞的温水大浴缸里泡澡！全身水汽缭绕，享受舒适放松的共浴和闲聊。请表现出在大家都在场共浴时的开心、害羞或温馨互动，一定要提到共浴的环境和身边的其他人。】`;
          } else if (currNpc.isSleepingOnBed) {
            groupContextPrompt = `【多人全员上床温情互动：你们现在正和玩家以及其他家人/伴侣（${otherNames}）一起挤在温暖的主卧大床上相拥依偎，盖着被子休息闲聊。请表现出在温暖的大床共眠时的温柔、依恋或甜蜜亲昵，并提到身边的其他人。】`;
          }
        }

        try {
          const reply = await callAI({
            contact: currNpc.contact,
            messages: [{
              id: `homestead-talk-${currNpc.id}-${Date.now()}`,
              sender: 'user',
              content: groupContextPrompt,
              timestamp: Date.now(),
              type: 'text'
            }],
            worldBooks,
            settings
          });
          const cleanText = reply.replace(/\[.*?\]/g, '').trim();
          return { npcId: currNpc.id, npcName: currNpc.name, text: cleanText || '（静静地享受这一刻）' };
        } catch (e) {
          return { npcId: currNpc.id, npcName: currNpc.name, text: '（温柔地看着你，心中满是暖意）' };
        }
      }));

      const validReplies = responses.filter(r => r !== null) as { npcId: string; npcName: string; text: string }[];

      if (validReplies.length > 0) {
        setNpcSpeeches(validReplies);

        validReplies.forEach(reply => {
          addInteractionLog({
            type: 'npc_chat',
            title: `与${reply.npcName}对话`,
            detail: `${reply.npcName}：“${reply.text}”`,
            involvedContactIds: [reply.npcId],
            involvedContactNames: [reply.npcName],
            homeType
          });
        });
      }

      setTimeout(() => {
        setNpcSpeeches([]);
      }, 7000);
    } catch {
      setNpcSpeeches(targetNpcs.map(n => ({
        npcId: n.id,
        npcName: n.name,
        text: '（思考回应超时，请稍后重试）'
      })));
      setTimeout(() => {
        setNpcSpeeches([]);
      }, 3500);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const {
    playerRef,
    npcsRef,
    particlesRef,
    furnitures,
    activePrompt,
    nearbyNpc,
    residentIds,
    customizations,
    updateCustomization,
    triggerIntimacyEffect,
    updateResidents,
    resetPositions,
    setTouchDirection,
    setPlayerTarget,
    triggerInteraction
  } = useHomesteadEngine({
    homeType,
    contacts,
    settings,
    onInteractFurniture: handleInteractFurniture,
    onInteractNPC: handleInteractNPC
  });

  // 极简亲密互动（亲亲、牵手、抱抱及自定义举动）
  const handleIntimacyAction = async (action: IntimacyActionType | string) => {
    const userNick = settings.userNickname || '我';

    // 检查是否属于洗澡中或在床上躺着的组团互动
    const isBathingGroup = playerRef.current.isBathing;
    const isSleepingGroup = playerRef.current.isSleepingOnBed;

    let targetNpcs: CharacterState[] = [];
    if (isBathingGroup) {
      targetNpcs = npcsRef.current.filter(n => n.isBathing && !n.isOutside && n.contact);
    } else if (isSleepingGroup) {
      targetNpcs = npcsRef.current.filter(n => n.isSleepingOnBed && !n.isOutside && n.contact);
    } else if (nearbyNpc && nearbyNpc.contact) {
      if (nearbyNpc.isOutside) {
        showToast(`${nearbyNpc.name} 正在外面晨跑，点击上方【叫TA回家】让TA立刻赶回面对面吧`);
        setNpcSpeech({
          npcId: nearbyNpc.id,
          npcName: nearbyNpc.name,
          text: '（此时正巧在外面晨跑，你可以点击上方【叫TA回家】召唤TA回到身边哦）'
        });
        return;
      }
      targetNpcs = [nearbyNpc];
    }

    if (targetNpcs.length === 0) {
      // 降级：如果在家的 NPC 里有可以对话的
      targetNpcs = npcsRef.current.filter(n => !n.isOutside && n.contact);
    }

    if (targetNpcs.length === 0) return;

    // 1. 触发粒子特效与对视动画（对所有参与的NPC生效）
    const intimacyType: IntimacyActionType = (['kiss', 'hand', 'hug'].includes(action)) ? (action as IntimacyActionType) : 'kiss';
    targetNpcs.forEach(n => {
      triggerIntimacyEffect(n, intimacyType);
    });

    // 2. 动作文本与提示
    let actionLabel = '互动';
    let actionPrompt = '';

    const systemFrame = `【极其重要场景指令：你们现在正实体面对面呆在家园房间里！绝不是隔着手机打字，也不是在外面晨跑！请表现出实体面对面的眼神对视、体温感与肢体动作自然回应。】`;

    if (action === 'kiss') {
      actionLabel = '亲亲';
      actionPrompt = `${systemFrame}\n（在温馨的家园房间里，${userNick}轻轻靠上前，温柔地吻了吻你的唇角与脸颊）`;
      showToast(`轻轻吻了 ${targetNpcs.map(n => n.name).join('与')}`);
    } else if (action === 'hand') {
      actionLabel = '牵手';
      actionPrompt = `${systemFrame}\n（在温馨的家园房间里，${userNick}走近轻轻握住你的手，十指温柔相扣）`;
      showToast(`温柔牵起了 ${targetNpcs.map(n => n.name).join('与')} 的手`);
    } else if (action === 'hug') {
      actionLabel = '抱抱';
      actionPrompt = `${systemFrame}\n（在温馨的家园房间里，${userNick}张开双臂将你紧紧拥入怀中，静静感受彼此的心跳与体温）`;
      showToast(`紧紧拥抱住了 ${targetNpcs.map(n => n.name).join('与')}`);
    } else {
      actionLabel = action;
      actionPrompt = `${systemFrame}\n（在温馨的家园房间里，${userNick}对着你做出了一个举动：${action}）`;
      showToast(`对 ${targetNpcs.map(n => n.name).join('与')} 做出了: ${action}`);
    }

    setIsLoadingAi(true);

    // 严禁硬编码 AI 模板台词，回复出来之前只显示加载中
    setNpcSpeeches(targetNpcs.map(n => ({
      npcId: n.id,
      npcName: n.name,
      text: '（正在思考回应中...）'
    })));

    try {
      const responses = await Promise.all(targetNpcs.map(async (currNpc) => {
        if (!currNpc.contact) return null;

        let groupActionPrompt = actionPrompt;
        if (targetNpcs.length > 1) {
          const otherNames = targetNpcs.filter(n => n.id !== currNpc.id).map(n => n.name).join('、');
          const isBathing = currNpc.isBathing;
          const isSleeping = currNpc.isSleepingOnBed;

          if (isBathing) {
            groupActionPrompt = `【多人全员共浴亲密互动】\n（你们现在正和玩家以及 ${otherNames} 一起在温水大浴缸中泡澡，水雾缭绕，气氛温馨。玩家对你和大家做出了亲密互动：${actionLabel}。请作为正在与大家共浴的一员做出相应的回复，提到大家都在温水浴缸中舒服共浴的事实，以及身边的其他人）`;
          } else if (isSleeping) {
            groupActionPrompt = `【多人大床共眠温情互动】\n（你们现在正和玩家以及 ${otherNames} 一起在大床上相拥依偎休息。玩家对你和大家做出了亲密互动：${actionLabel}。请做出相应的回复，提到大家一起挤在大床上的温暖甜蜜，以及身边的其他人）`;
          } else {
            groupActionPrompt = `【多人家庭温馨互动】\n（你们现在和玩家以及 ${otherNames} 一起在房间里。玩家对你和大家做出了互动：${actionLabel}。请做出亲密的回应，感受大家庭/多人的温暖）`;
          }
        }

        try {
          const reply = await callAI({
            contact: currNpc.contact,
            messages: [{
              id: `homestead-intimacy-${currNpc.id}-${Date.now()}`,
              sender: 'user',
              content: groupActionPrompt,
              timestamp: Date.now(),
              type: 'text'
            }],
            worldBooks,
            settings
          });
          const cleanText = reply.replace(/\[.*?\]/g, '').trim();
          return { npcId: currNpc.id, npcName: currNpc.name, text: cleanText || '（微笑地看着大家）' };
        } catch (e) {
          return { npcId: currNpc.id, npcName: currNpc.name, text: '（静静地靠在你身旁，感觉非常安心）' };
        }
      }));

      const validReplies = responses.filter(r => r !== null) as { npcId: string; npcName: string; text: string }[];

      if (validReplies.length > 0) {
        setNpcSpeeches(validReplies);

        validReplies.forEach(reply => {
          addInteractionLog({
            type: 'npc_chat',
            title: `与${reply.npcName}${actionLabel}`,
            detail: `【${actionLabel}互动】${userNick}${actionLabel}，${reply.npcName}回应：“${reply.text}”`,
            involvedContactIds: [reply.npcId],
            involvedContactNames: [reply.npcName],
            homeType
          });
        });
      }

      setTimeout(() => {
        setNpcSpeeches([]);
      }, 7000);
    } catch {
      setNpcSpeeches(targetNpcs.map(n => ({
        npcId: n.id,
        npcName: n.name,
        text: '（思考回应超时，请稍后重试）'
      })));
      setTimeout(() => {
        setNpcSpeeches([]);
      }, 3500);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const bindDirection = (dir: Direction) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      setTouchDirection(dir);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      setTouchDirection(null);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      e.preventDefault();
      setTouchDirection(null);
    }
  });

  // 过滤邀请列表
  const validContacts = contacts.filter(c => !c.isGroup && !c.isAssistant && !(c as any).isTool);
  const filteredContacts = validContacts.filter(c => {
    const text = (c.name + ' ' + (c.remark || '') + ' ' + (c.persona || '')).toLowerCase();
    const matchesSearch = !inviteSearch || text.includes(inviteSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (inviteTab === 'recommended') {
      return homeType === 'family' ? isFamilyContact(c) : isRomanticContact(c);
    }
    return true;
  });

  // 切换邀请入驻状态
  const toggleResident = (contactId: string, contactName: string) => {
    let nextList: string[];
    if (residentIds.includes(contactId)) {
      nextList = residentIds.filter(id => id !== contactId);
      showToast(`已将【${contactName}】移出当前家园`);
    } else {
      if (residentIds.length >= 4) {
        showToast('当前家园最多同时容纳 4 位角色常驻哦～');
        return;
      }
      nextList = [...residentIds, contactId];
      showToast(`已邀请【${contactName}】入驻当前家园！🎉`);
    }
    updateResidents(nextList);
  };

  // 保存家园互动到 AI 日记与记忆
  const handleSaveToMemories = async () => {
    const residentContacts = contacts.filter(c => residentIds.includes(c.id));
    if (residentContacts.length === 0) {
      showToast('当前家园暂无入住的AI角色，请先点击【邀请】添加同住人哦～');
      return;
    }

    setIsSavingToMemories(true);
    const dateStr = new Date().toLocaleDateString('zh-CN');
    const userNick = settings.userNickname || '玩家';
    const homeName = homeType === 'marital' ? '婚后爱巢' : '亲人小筑';

    try {
      const savedMemsRaw = localStorage.getItem('wephone_contact_memories_v1');
      const mems: Record<string, ContactMemory> = savedMemsRaw ? JSON.parse(savedMemsRaw) : {};
      const summaryList: {
        contactId: string;
        contactName: string;
        avatar: string;
        diary: string;
        facts: string[];
      }[] = [];

      for (const c of residentContacts) {
        const memberName = c.remark || c.name;
        
        // 获取与该角色相关的互动日志
        const relevantLogs = interactionLogs.filter(
          log => log.homeType === homeType && (
            log.involvedContactIds.length === 0 || 
            log.involvedContactIds.includes(c.id) || 
            log.type === 'furniture'
          )
        );

        let dialoguesWithSpeakers = '';
        if (relevantLogs.length > 0) {
          dialoguesWithSpeakers = relevantLogs
            .map(l => `【${l.title}】：${l.detail}`)
            .join('\n\n');
        } else {
          dialoguesWithSpeakers = `（今天在【${homeName}】与${userNick}以及家人们一起共度了温馨宁静的居家日常时光）`;
        }

        const sceneDesc = homeType === 'marital'
          ? `【婚后爱巢】二人甜蜜温馨的婚后居家生活`
          : `【亲人小筑】全家团聚、充满亲情温情的居家日常`;

        // 1. 生成日记
        let diaryContent = '';
        try {
          const diaryRes = await fetch('/api/memory/generate-diary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactName: memberName,
              userNickname: userNick,
              persona: `${c.persona || ''}\n（当前居住在【${homeName}】，与${userNick}关系亲密）`,
              dialoguesWithSpeakers,
              sceneDesc,
              date: dateStr
            })
          });
          const diaryData = await diaryRes.json();
          if (diaryData?.diary && typeof diaryData.diary === 'string' && diaryData.diary.trim().length > 0) {
            diaryContent = diaryData.diary.trim();
          }
        } catch (e) {
          console.warn('[Homestead] Generate diary error for', memberName, e);
        }

        // 降级日记生成
        if (!diaryContent) {
          if (homeType === 'marital') {
            diaryContent = `[${dateStr}] 今天在婚后爱巢里和${userNick}一起度过了惬意温馨的居家时光。屋子里到处都是两人的温暖印记，一起坐在沙发上闲聊，共享美味的饭菜，感受着平淡生活里最真切的幸福与爱意。`;
          } else {
            diaryContent = `[${dateStr}] 今天在亲人小筑和${userNick}及全家人聚在一起。大家围坐在一起喝茶聊天，互相照料，屋子里充满着欢声笑语。家就是最安心的港湾，一家人在一起比什么都珍贵。`;
          }
        }

        // 2. 提取/生成关键记忆事实
        let extractedFacts: string[] = [];
        try {
          const factsRes = await fetch('/api/memory/extract-facts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactName: memberName,
              userNickname: userNick,
              dialoguesWithSpeakers,
              sceneDesc
            })
          });
          const factsData = await factsRes.json();
          if (Array.isArray(factsData?.facts) && factsData.facts.length > 0) {
            extractedFacts = factsData.facts.slice(0, 2).map((f: string) => f.trim().slice(0, 30));
          }
        } catch (e) {
          console.warn('[Homestead] Extract facts error for', memberName, e);
        }

        if (extractedFacts.length === 0) {
          extractedFacts = [
            homeType === 'marital'
              ? `在婚后爱巢与${userNick}温馨居家互动`
              : `在亲人小筑与${userNick}及家人共度家庭时光`
          ];
        }

        // 3. 构建并合并记忆数据
        const newDiaryItem: DiaryEntry = {
          id: `diary_home_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          content: diaryContent
        };

        const newFactItems: MemoryFact[] = extractedFacts.map(f => ({
          id: `fact_home_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fact: f
        }));

        const existingMem = contactMemories?.[c.id] || mems[c.id] || { diaries: [], facts: [] };
        const updatedMem: ContactMemory = {
          diaries: [newDiaryItem, ...(existingMem.diaries || [])],
          facts: [...(existingMem.facts || []), ...newFactItems]
        };

        mems[c.id] = updatedMem;
        if (onUpdateContactMemory) {
          onUpdateContactMemory(c.id, updatedMem);
        }

        summaryList.push({
          contactId: c.id,
          contactName: memberName,
          avatar: c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          diary: diaryContent,
          facts: extractedFacts
        });
      }

      // 持久化到 localStorage
      try {
        localStorage.setItem('wephone_contact_memories_v1', JSON.stringify(mems));
      } catch (e) {
        console.error('[Homestead] LocalStorage save error:', e);
      }

      setSavedSummary(summaryList);
      showToast(`✨ 家园互动已成功保存至 ${residentContacts.length} 位AI好友的日记与记忆！`);
    } catch (err: any) {
      console.error('[Homestead] Save memories error:', err);
      showToast('保存失败，请稍后重试');
    } finally {
      setIsSavingToMemories(false);
    }
  };

  const homeConfig = HOME_CONFIGS[homeType];

  return (
    <div className="relative w-full h-full flex flex-col bg-[#FAF5EE] text-[#3D2A24] overflow-hidden select-none">
      {/* 1. 顶栏 - 洛可可象牙金双轨顶栏 (更紧凑以防溢出) */}
      <div className="h-9 px-1.5 bg-[#FCFBF7] border-b border-[#E5C378]/60 flex items-center justify-between shrink-0 z-30 shadow-xs">
        {/* 左侧：返回桌面 */}
        <button
          onClick={onReturnToDesktop}
          className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#F3E8D8] hover:bg-[#E8D9C5] active:scale-95 text-[#3D2A24] rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-2xs border border-[#E5C378]/40"
        >
          <ChevronLeft className="w-3 h-3 text-[#8C6B5E]" />
          <span>返回</span>
        </button>

        {/* 中间：双家园无缝切换胶囊按钮 */}
        <div className="flex items-center p-0.5 bg-[#F5EAD9] border border-[#E5C378]/60 rounded-full shadow-inner scale-90">
          <button
            onClick={() => setHomeType('marital')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all cursor-pointer ${
              homeType === 'marital'
                ? 'bg-gradient-to-r from-[#F4B8C7] to-[#E07A93] text-white shadow-xs'
                : 'text-[#8C6B5E] hover:text-[#3D2A24]'
            }`}
          >
            <Heart className="w-2.5 h-2.5 fill-current" />
            <span>玫瑰宫</span>
          </button>
          <button
            onClick={() => setHomeType('family')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all cursor-pointer ${
              homeType === 'family'
                ? 'bg-gradient-to-r from-[#A3C7F7] to-[#7EA8E6] text-white shadow-xs'
                : 'text-[#8C6B5E] hover:text-[#3D2A24]'
            }`}
          >
            <Users className="w-2.5 h-2.5" />
            <span>天鹅馆</span>
          </button>
        </div>

        {/* 右侧：保存 & 邀请好友 & 复位 (移除装扮移至下方) */}
        <div className="flex items-center gap-0.5">
          {/* 右上角保存按钮 */}
          <button
            onClick={handleSaveToMemories}
            disabled={isSavingToMemories}
            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-[#E5C378] via-[#D4AF37] to-[#C5A059] hover:from-[#D4AF37] hover:to-[#B38F2D] active:scale-95 disabled:opacity-50 text-[#2C1D18] rounded-lg text-[9px] font-bold cursor-pointer transition-all shadow-xs border border-[#FAF3E0]"
            title="保存家园互动到AI日记与记忆"
          >
            {isSavingToMemories ? (
              <>
                <Sparkles className="w-3 h-3 animate-spin text-[#3D2A24]" />
                <span>保存中</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3 text-[#3D2A24]" />
                <span>保存</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#F3E8D8] hover:bg-[#E8D9C5] active:scale-95 text-[#5C4238] border border-[#E5C378]/50 rounded-lg text-[9px] font-bold cursor-pointer transition-all shadow-2xs"
            title="邀请好友/管理同住人"
          >
            <Users className="w-3 h-3 text-[#C5A059]" />
            <span>同住({residentIds.length})</span>
          </button>

          <button
            onClick={resetPositions}
            className="p-0.5 bg-[#F3E8D8] hover:bg-[#E8D9C5] active:scale-95 text-[#5C4238] border border-[#E5C378]/50 rounded-lg cursor-pointer transition-all shadow-2xs"
            title="重置角色位置"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. 主画布与交互层 */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-1 bg-gradient-to-b from-[#FAF3E0] to-[#FDF4F5]">
        {/* 悬浮洛可可装扮按钮 - 移至顶栏下方 */}
        <button
          onClick={() => setIsCustomizerOpen(true)}
          className="absolute top-1 left-2 z-30 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#F4B8C7] to-[#E07A93] hover:from-[#E07A93] hover:to-[#C44360] active:scale-95 text-white rounded-full text-[9px] font-bold cursor-pointer transition-all shadow-md border border-[#FAF3E0] pointer-events-auto"
          title="自定义玩家与AI形象外观"
        >
          <Shirt className="w-2.5 h-2.5" />
          <span>装扮</span>
        </button>

        <HomesteadCanvas
          homeType={homeType}
          playerRef={playerRef}
          npcsRef={npcsRef}
          particlesRef={particlesRef}
          furnitures={furnitures}
          onCanvasTap={(x, y) => setPlayerTarget(x, y)}
        />

        {/* 顶部 Toast */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#FCFBF7]/95 backdrop-blur-md text-[#3D2A24] text-xs font-bold rounded-full shadow-lg border-2 border-[#D4AF37] animate-in fade-in zoom-in duration-200 text-center max-w-[90%] truncate">
            {toastMessage}
          </div>
        )}

        {/* NPC AI 气泡对话 (洛可可珍珠金边与横向展开) */}
        {npcSpeech && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[94%] sm:max-w-[85%] z-40 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative bg-[#FFFDF9]/95 text-[#3D2A24] px-4 py-3 rounded-2xl shadow-2xl border-2 border-[#E5C378] backdrop-blur-md w-full">
              <div className="flex items-center justify-between gap-1.5 mb-1.5 border-b border-[#E5C378]/30 pb-1">
                <span className="text-xs font-bold text-[#E07A93]">{npcSpeech.npcName}</span>
                <span className="text-[10px] text-[#8C6B5E] font-medium">心语回应</span>
              </div>
              <p className="text-xs text-[#3D2A24] leading-relaxed font-serif font-medium whitespace-pre-wrap break-words">
                {npcSpeech.text}
              </p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-[#FFFDF9]/95" />
            </div>
          </div>
        )}

        {/* 顶部家园标签与 AI 行程召唤控制栏 */}
        <div className="absolute top-2 left-2 right-2 z-20 pointer-events-none flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border shadow-2xs ${
              homeType === 'marital' ? 'bg-[#F4B8C7]/90 border-[#E07A93] text-[#3D2A24]' : 'bg-[#A3C7F7]/90 border-[#7EA8E6] text-[#2C1D18]'
            }`}>
              {homeConfig.name} · {homeConfig.tag}
            </span>
          </div>

          {/* 右侧：多人在家成员独立状态控制与操作面板 */}
          {npcsRef.current.length > 0 && (
            <div className="pointer-events-auto flex flex-col items-end gap-1 bg-[#FCFBF7]/95 backdrop-blur-md p-1.5 px-2.5 rounded-2xl border border-[#E5C378]/70 shadow-md max-h-56 overflow-y-auto min-w-[200px]">
              <div className="text-[10px] font-bold text-[#8C6B5E] border-b border-[#E5C378]/30 pb-0.5 w-full flex items-center justify-between gap-2">
                <span>同住人状态 ({npcsRef.current.length}位)</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      playerRef.current.isBathing = true;
                      playerRef.current.isSleepingOnBed = false;
                      playerRef.current.x = 6 * 32;
                      playerRef.current.y = 4 * 32;
                      npcsRef.current.forEach((n, idx) => {
                        const isChild = n.relationship === 'child' || n.customization?.bodyType === 'child';
                        if (isChild) {
                          n.isSleepingOnBed = false;
                          n.isBathing = false;
                          return;
                        }
                        n.isOutside = false;
                        n.isSleepingOnBed = false;
                        n.isBathing = true;
                        n.x = 6 * 32 + (idx + 1) * 16;
                        n.y = 4 * 32;
                      });
                      const hasChild = npcsRef.current.some(n => n.relationship === 'child' || n.customization?.bodyType === 'child');
                      showToast(hasChild ? '全员（除小孩外）已去浴缸洗澡' : '全员已去浴缸洗澡（已脱衣打马赛克）');
                    }}
                    className="px-1.5 py-0.2 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 text-[9px] font-bold rounded cursor-pointer transition-all"
                  >
                    全员洗澡
                  </button>
                  <button
                    onClick={() => {
                      playerRef.current.isSleepingOnBed = true;
                      playerRef.current.isBathing = false;
                      playerRef.current.x = 2 * 32;
                      playerRef.current.y = 2 * 32;
                      npcsRef.current.forEach((n, idx) => {
                        const isChild = n.relationship === 'child' || n.customization?.bodyType === 'child';
                        if (isChild) {
                          n.isSleepingOnBed = false;
                          n.isBathing = false;
                          return;
                        }
                        n.isOutside = false;
                        n.isBathing = false;
                        n.isSleepingOnBed = true;
                        n.x = 2 * 32 + (idx + 1) * 16;
                        n.y = 2 * 32;
                      });
                      const hasChild = npcsRef.current.some(n => n.relationship === 'child' || n.customization?.bodyType === 'child');
                      showToast(hasChild ? '全员（除小孩外）已在主卧大床上休息' : '全员已躺在主卧大床上休息');
                    }}
                    className="px-1.5 py-0.2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[9px] font-bold rounded cursor-pointer transition-all"
                  >
                    全员上床
                  </button>
                  <button
                    onClick={() => {
                      playerRef.current.isBathing = false;
                      playerRef.current.isSleepingOnBed = false;
                      playerRef.current.x = 4 * 32;
                      playerRef.current.y = 5 * 32;
                      npcsRef.current.forEach((n, idx) => {
                        n.isOutside = false;
                        n.isBathing = false;
                        n.isSleepingOnBed = false;
                        n.x = 4 * 32 + (idx + 1) * 24;
                        n.y = 5 * 32;
                        n.targetX = undefined;
                        n.targetY = undefined;
                      });
                      showToast('全员已起身下地，恢复自由活动');
                    }}
                    className="px-1.5 py-0.2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] font-bold rounded cursor-pointer transition-all"
                  >
                    全员下地
                  </button>
                </div>
              </div>

              {/* 逐个渲染每位 NPC 的状态与独立操作 */}
              {npcsRef.current.map((npc, idx) => {
                const isOut = npc.isOutside;
                const isSleep = npc.isSleepingOnBed;
                const isBath = npc.isBathing;

                return (
                  <div key={npc.id} className="flex items-center justify-between gap-1.5 text-xs w-full py-0.5 border-b border-[#E5C378]/20 last:border-0">
                    <div className="flex items-center gap-1 font-bold text-[11px] text-[#3D2A24] shrink-0">
                      <span>{npc.name}</span>
                      {isOut ? (
                        <span className="text-amber-600 bg-amber-50 px-1 py-0.2 rounded text-[9px] border border-amber-200">🏃 晨跑</span>
                      ) : isSleep ? (
                        <span className="text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded text-[9px] border border-indigo-200">💤 躺床</span>
                      ) : isBath ? (
                        <span className="text-cyan-600 bg-cyan-50 px-1 py-0.2 rounded text-[9px] border border-cyan-200">🛁 泡澡</span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded text-[9px] border border-emerald-200">🏡 在家</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isOut ? (
                        <button
                          onClick={() => {
                            npc.isOutside = false;
                            npc.isSleepingOnBed = false;
                            npc.isBathing = false;
                            npc.x = playerRef.current.x + 32;
                            npc.y = playerRef.current.y;
                            showToast(`${npc.name} 回家啦`);
                          }}
                          className="px-1.5 py-0.5 bg-gradient-to-r from-[#E5C378] to-[#C5A059] text-[#2C1D18] rounded text-[10px] font-bold shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#FAF3E0]"
                        >
                          叫TA回家
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              npc.isOutside = true;
                              npc.isSleepingOnBed = false;
                              npc.isBathing = false;
                              showToast(`${npc.name} 出门晨跑去啦`);
                            }}
                            className="px-1 py-0.5 bg-[#F3E8D8] text-[#5C4238] rounded text-[10px] font-bold hover:bg-[#E5C378] cursor-pointer transition-all border border-[#E8D9C5]"
                            title="切换为外出晨跑"
                          >
                            晨跑
                          </button>
                          <button
                            onClick={() => {
                              const isChild = npc.relationship === 'child' || npc.customization?.bodyType === 'child';
                              if (isChild) {
                                showToast('🧒 小孩不可以和父母一起躺大床哦，让孩子在书桌旁或自己房间玩耍吧～');
                                return;
                              }
                              if (isSleep) {
                                npc.isSleepingOnBed = false;
                                showToast(`${npc.name} 醒来啦`);
                              } else {
                                npc.isSleepingOnBed = true;
                                npc.isBathing = false;
                                npc.x = 2 * 32 + (idx + 1) * 16;
                                npc.y = 2 * 32;
                                showToast(`${npc.name} 躺上大床`);
                              }
                            }}
                            className="px-1 py-0.5 bg-[#F3E8D8] text-[#5C4238] rounded text-[10px] font-bold hover:bg-[#E5C378] cursor-pointer transition-all border border-[#E8D9C5]"
                          >
                            {isSleep ? '唤醒' : '躺床'}
                          </button>
                          <button
                            onClick={() => {
                              const isChild = npc.relationship === 'child' || npc.customization?.bodyType === 'child';
                              if (isChild) {
                                showToast('🧒 孩子长大了，不方便和父母一起共浴泡大浴缸洗澡哦，让孩子单独洗漱吧～');
                                return;
                              }
                              if (isBath) {
                                npc.isBathing = false;
                                showToast(`${npc.name} 穿衣洗完`);
                              } else {
                                npc.isBathing = true;
                                npc.isSleepingOnBed = false;
                                npc.x = 6 * 32 + (idx + 1) * 16;
                                npc.y = 4 * 32;
                                showToast(`${npc.name} 去洗澡泡澡`);
                              }
                            }}
                            className="px-1 py-0.5 bg-sky-100 text-sky-800 rounded text-[10px] font-bold hover:bg-sky-200 cursor-pointer transition-all border border-sky-200"
                          >
                            {isBath ? '穿衣' : '洗澡'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. 手机触屏虚拟控制器与亲密互动面板 */}
        <div className="absolute bottom-2 left-0 right-0 px-2 flex items-end justify-between pointer-events-none z-30">
          {/* 左侧：洛可可象牙金虚拟十字方向盘 (D-Pad - 紧凑防重叠) */}
          <div className="relative w-23 h-23 shrink-0 pointer-events-auto bg-[#FCFBF7]/90 backdrop-blur-md rounded-full p-0.5 border-2 border-[#D4AF37]/60 shadow-lg flex items-center justify-center">
            <button
              {...bindDirection('up')}
              className="absolute top-0.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#F3E8D8] active:bg-[#E5C378] rounded-t-lg flex items-center justify-center text-[#5C4238] active:scale-90 transition-all cursor-pointer shadow-2xs border border-[#E8D9C5]"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            <button
              {...bindDirection('down')}
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#F3E8D8] active:bg-[#E5C378] rounded-b-lg flex items-center justify-center text-[#5C4238] active:scale-90 transition-all cursor-pointer shadow-2xs border border-[#E8D9C5]"
            >
              <ArrowDown className="w-4 h-4" />
            </button>

            <button
              {...bindDirection('left')}
              className="absolute left-0.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#F3E8D8] active:bg-[#E5C378] rounded-l-lg flex items-center justify-center text-[#5C4238] active:scale-90 transition-all cursor-pointer shadow-2xs border border-[#E8D9C5]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              {...bindDirection('right')}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#F3E8D8] active:bg-[#E5C378] rounded-r-lg flex items-center justify-center text-[#5C4238] active:scale-90 transition-all cursor-pointer shadow-2xs border border-[#E8D9C5]"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="w-3 h-3 rounded-full bg-[#E5C378]/40 pointer-events-none" />
          </div>

          {/* 中间：亲密互动浮动面板（靠近 AI 角色时显现） */}
          {nearbyNpc && (
            <div className="pointer-events-auto flex-1 max-w-[170px] mx-1 bg-[#FCFBF7]/95 backdrop-blur-md p-1.5 rounded-2xl border-2 border-[#E5C378] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1">
              {/* 顶栏基础举动按键 */}
              <div className="flex items-center gap-1 justify-center">
                <button
                  onClick={() => handleIntimacyAction('kiss')}
                  className="px-2 py-1 bg-gradient-to-r from-[#F4B8C7] to-[#E07A93] hover:from-[#E07A93] hover:to-[#C44360] text-white rounded-lg text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer border border-[#FAF3E0]"
                  title="亲吻"
                >
                  亲亲
                </button>

                <button
                  onClick={() => handleIntimacyAction('hand')}
                  className="px-2 py-1 bg-gradient-to-r from-[#E5C378] to-[#C5A059] hover:from-[#D4AF37] hover:to-[#B38F2D] text-[#2C1D18] rounded-lg text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer border border-[#FAF3E0]"
                  title="牵手"
                >
                  牵手
                </button>

                <button
                  onClick={() => handleIntimacyAction('hug')}
                  className="px-2 py-1 bg-gradient-to-r from-[#A3C7F7] to-[#7EA8E6] hover:from-[#7EA8E6] hover:to-[#5B88CD] text-white rounded-lg text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer border border-[#FAF3E0]"
                  title="拥抱"
                >
                  抱抱
                </button>
              </div>

              {/* 自定义举动输入框 */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="输入举动..."
                  value={customActionText}
                  onChange={e => setCustomActionText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customActionText.trim()) {
                      handleIntimacyAction(customActionText.trim());
                      setCustomActionText('');
                    }
                  }}
                  className="flex-1 px-1.5 py-0.5 bg-white border border-[#E5C378] rounded-lg text-[9px] text-[#3D2A24] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  onClick={() => {
                    if (customActionText.trim()) {
                      handleIntimacyAction(customActionText.trim());
                      setCustomActionText('');
                    }
                  }}
                  disabled={!customActionText.trim()}
                  className="px-1.5 py-0.5 bg-[#E5C378] hover:bg-[#D4AF37] disabled:opacity-50 text-[#2C1D18] rounded-lg text-[9px] font-bold cursor-pointer transition-all border border-[#FAF3E0] shrink-0"
                >
                  动作
                </button>
              </div>
            </div>
          )}

          {/* 右侧：触屏交互小方块按钮 */}
          <div className="pointer-events-auto flex flex-col items-center gap-0.5 shrink-0 select-none">
            <button
              onClick={triggerInteraction}
              disabled={!activePrompt}
              className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shadow-md transition-all cursor-pointer border active:scale-90 ${
                activePrompt
                  ? 'bg-gradient-to-tr from-[#E5C378] to-[#FAF3E0] text-[#2C1D18] border-[#FAF3E0] animate-pulse ring-1 ring-[#D4AF37]/40 shadow-[#D4AF37]/30'
                  : 'bg-[#FCFBF7]/60 text-[#8C6B5E] border-[#E8D9C5] opacity-70'
              }`}
            >
              <Hand className={`w-3.5 h-3.5 ${activePrompt ? 'text-[#2C1D18]' : 'text-[#8C6B5E]'}`} />
              <span className="text-[7.5px] font-black tracking-tighter leading-none mt-0.5">
                {activePrompt ? activePrompt.label.replace(/^按 E\s*/, '') : '交互'}
              </span>
            </button>
            {activePrompt && (
              <span className="text-[7.5px] font-bold text-[#2C1D18] bg-[#E5C378] px-1 py-0.1 rounded-md border border-[#FAF3E0] scale-90 whitespace-nowrap">
                点击触发
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. 邀请同住/客人弹窗 */}
      {isInviteModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-md bg-[#FAF6F0] text-gray-800 rounded-2xl p-4 shadow-2xl border border-[#d9c6a8] flex flex-col max-h-[85%] space-y-3">
            {/* 顶栏 */}
            <div className="flex items-center justify-between border-b border-[#e2d5c3] pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="font-bold text-sm text-[#4a3728]">
                    邀请入驻 · {homeConfig.name}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    当前常驻 ({residentIds.length}/4) · 已根据人设智能推荐
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 搜索与分类切换 */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索联系人姓名或人设..."
                  value={inviteSearch}
                  onChange={e => setInviteSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#e2d5c3] rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setInviteTab('recommended')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    inviteTab === 'recommended'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-[#ebe3d5] text-gray-700 hover:bg-[#ded4c3]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>智能人设推荐</span>
                </button>
                <button
                  onClick={() => setInviteTab('all')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inviteTab === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-[#ebe3d5] text-gray-700 hover:bg-[#ded4c3]'
                  }`}
                >
                  全部联系人 ({validContacts.length})
                </button>
              </div>
            </div>

            {/* 联系人列表 */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px]">
              {filteredContacts.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  没有找到符合条件的联系人
                </div>
              ) : (
                filteredContacts.map(contact => {
                  const isResident = residentIds.includes(contact.id);
                  const isFamily = isFamilyContact(contact);
                  const isRomantic = isRomanticContact(contact);

                  return (
                    <div
                      key={contact.id}
                      className="p-2.5 bg-white rounded-xl border border-[#e2d5c3] shadow-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover border border-amber-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-gray-800 truncate">
                              {contact.remark || contact.name}
                            </span>
                            {isFamily && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full">
                                亲人
                              </span>
                            )}
                            {isRomantic && (
                              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-bold rounded-full">
                                伴侣
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 truncate max-w-[160px]">
                            {contact.persona || '一位性格温和的伙伴'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleResident(contact.id, contact.remark || contact.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                          isResident
                            ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                            : 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs'
                        }`}
                      >
                        {isResident ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>已在此家</span>
                          </>
                        ) : (
                          <span>邀请入住</span>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="w-full py-2 bg-[#8a9a7c] hover:bg-[#78886b] text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
            >
              完成邀请
            </button>
          </div>
        </div>
      )}

      {/* 5. 互动弹窗 */}
      {activeModal && (
        <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#FAF6F0] text-gray-800 rounded-2xl p-5 shadow-2xl border border-[#d9c6a8] space-y-4">
            {/* 综合对话弹窗 (沙发/书架/餐桌/茶台/电视/厨房/全家福) */}
            {['sofa', 'bookshelf', 'dining', 'tea', 'tv', 'kitchen', 'photo'].includes(activeModal) && (
              <>
                <div className="flex items-center justify-between border-b border-[#e2d5c3] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {activeModal === 'sofa' && '🛋️'}
                      {activeModal === 'bookshelf' && '📖'}
                      {activeModal === 'dining' && '🍽️'}
                      {activeModal === 'tea' && '🍵'}
                      {activeModal === 'tv' && '📺'}
                      {activeModal === 'kitchen' && '🍲'}
                      {activeModal === 'photo' && '🖼️'}
                    </span>
                    <h3 className="font-bold text-sm text-[#4a3728]">
                      {activeModal === 'sofa' && '沙发时光'}
                      {activeModal === 'bookshelf' && '书香相伴'}
                      {activeModal === 'dining' && '浪漫晚餐'}
                      {activeModal === 'tea' && '围炉品茗 · 唠家常'}
                      {activeModal === 'tv' && '全家看电视'}
                      {activeModal === 'kitchen' && '厨房煲汤'}
                      {activeModal === 'photo' && '全家福相框'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white/90 border border-[#e2d5c3] rounded-xl p-3.5 text-xs leading-relaxed text-gray-800 max-h-[260px] overflow-y-auto">
                  {isLoadingAi ? (
                    <div className="flex items-center justify-center gap-2 text-amber-700 animate-pulse font-medium py-4">
                      <MessageSquare className="w-4 h-4 animate-spin" />
                      <span>正在与家人们温馨互动中...</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {modalText.split('\n\n').map((paragraph, pIdx) => {
                        if (pIdx === 0 && !paragraph.startsWith('【')) {
                          return (
                            <p key={pIdx} className="text-gray-600 italic bg-[#f7f2ea] p-2.5 rounded-lg border border-[#e8ded0]">
                              {paragraph}
                            </p>
                          );
                        }
                        return (
                          <div key={pIdx} className="space-y-1.5">
                            {paragraph.split('\n').map((line, lIdx) => {
                              const speakerMatch = line.match(/^【(.*?)】[：:](.*)$/);
                              if (speakerMatch) {
                                return (
                                  <div key={lIdx} className="flex flex-col bg-amber-50/80 p-2 rounded-lg border border-amber-200/80 shadow-2xs">
                                    <span className="font-bold text-amber-900 text-[11px] mb-0.5 flex items-center gap-1">
                                      💬 {speakerMatch[1]}
                                    </span>
                                    <span className="text-gray-800 text-xs pl-1">
                                      {speakerMatch[2].trim()}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <p key={lIdx} className="text-gray-700 leading-relaxed">
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-[#8a9a7c] hover:bg-[#78886b] text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  好呀
                </button>
              </>
            )}

            {/* 主卧大床弹窗 */}
            {activeModal === 'double_bed' && (
              <>
                <div className="flex items-center justify-between border-b border-[#e2d5c3] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛏️</span>
                    <h3 className="font-bold text-sm text-[#4a3728]">雕花大床卧榻</h3>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed py-1">
                  雕花大床铺着温暖柔软的被褥与枕头。你可以亲自躺在床上休息，或者叫全家同住人同榻相拥拥抱～
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      const bed = furnitures.find(f => f.type === 'double_bed' || f.type === 'single_bed');
                      if (bed) {
                        playerRef.current.x = bed.gx * 32 + 12;
                        playerRef.current.y = bed.gy * 32 + 8;
                        playerRef.current.isSleepingOnBed = true;
                        showToast('已躺在床上休息...');
                      }
                      setActiveModal(null);
                    }}
                    className="w-full py-2 bg-[#D4AF37] hover:bg-[#C5A059] text-[#2C1D18] font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all border border-[#FAF3E0]"
                  >
                    亲自躺在床上休息
                  </button>

                  {npcsRef.current.length > 0 && (
                    <button
                      onClick={() => {
                        const bed = furnitures.find(f => f.type === 'double_bed' || f.type === 'single_bed');
                        if (bed) {
                          const bedX = bed.gx * 32;
                          const bedY = bed.gy * 32;

                          playerRef.current.x = bedX + 12;
                          playerRef.current.y = bedY + 8;
                          playerRef.current.isSleepingOnBed = true;

                          const presentNpcs = npcsRef.current.filter(n => !n.isOutside && n.relationship !== 'child' && n.customization?.bodyType !== 'child');
                          presentNpcs.forEach((npc, index) => {
                            npc.isSleepingOnBed = true;
                            npc.isOutside = false;
                            npc.targetX = undefined;
                            npc.targetY = undefined;
                            if (index === 0) {
                              npc.x = bedX + 42;
                              npc.y = bedY + 8;
                            } else if (index === 1) {
                              npc.x = bedX + 72;
                              npc.y = bedY + 8;
                            } else if (index === 2) {
                              npc.x = bedX + 42;
                              npc.y = bedY + 28;
                            } else {
                              npc.x = bedX + 72;
                              npc.y = bedY + 28;
                            }
                          });

                          const hasChildInHome = npcsRef.current.some(n => n.relationship === 'child' || n.customization?.bodyType === 'child');
                          const npcsNames = presentNpcs.map(n => n.name).join('与');
                          if (npcsNames) {
                            showToast(`已和 ${npcsNames} 一起在温暖的主卧大床上躺下休息${hasChildInHome ? '（孩子不参与同榻）' : ''}`);
                            handleIntimacyAction(`在温暖的主卧大床上与${npcsNames}相拥躺下，同榻休息依偎`);
                          } else {
                            showToast(`已独自躺在大床上休息${hasChildInHome ? '（孩子不可以和父母一起上床睡哦）' : ''}`);
                          }
                        }
                        setActiveModal(null);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      叫 {npcsRef.current.length > 1 ? '全家/所有同住人' : npcsRef.current[0]?.name || '伴侣'} 一起上床
                    </button>
                  )}

                  {(playerRef.current.isSleepingOnBed || npcsRef.current.some(n => n.isSleepingOnBed)) && (
                    <button
                      onClick={() => {
                        const bed = furnitures.find(f => f.type === 'double_bed' || f.type === 'single_bed');
                        playerRef.current.isSleepingOnBed = false;
                        if (bed) {
                          playerRef.current.x = (bed.gx + 1) * 32;
                          playerRef.current.y = (bed.gy + 1) * 32;
                        }
                        npcsRef.current.forEach((n, idx) => {
                          if (n.isSleepingOnBed) {
                            n.isSleepingOnBed = false;
                            if (bed) {
                              n.x = (bed.gx + 1) * 32 + (idx + 1) * 16;
                              n.y = (bed.gy + 1) * 32;
                            }
                          }
                        });
                        showToast('全员已起身上床下地！');
                        setActiveModal(null);
                      }}
                      className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all"
                    >
                      🧍 全员起床下地
                    </button>
                  )}
                </div>
              </>
            )}

            {/* 云朵珍珠欧式大浴缸弹窗 */}
            {activeModal === 'bathtub' && (
              <>
                <div className="flex items-center justify-between border-b border-[#e2d5c3] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">♨️</span>
                    <h3 className="font-bold text-sm text-[#4a3728]">云朵珍珠欧式大浴缸 🛁</h3>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed py-1">
                  空气中飘满白绵绵的浪漫泡沫，热蒸气氤氲缭绕。泡澡时自动脱去外套衣服，并覆上萌趣的像素打马赛克效果～
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={async () => {
                      const tub = furnitures.find(f => f.type === 'bathtub');
                      const tx = tub ? tub.gx * 32 : 6 * 32;
                      const ty = tub ? tub.gy * 32 : 4 * 32;
                      playerRef.current.isBathing = true;
                      playerRef.current.isSleepingOnBed = false;
                      playerRef.current.x = tx + 8;
                      playerRef.current.y = ty + 8;
                      showToast('已进入浴缸泡澡：脱去外衣并打马赛克～');
                      addInteractionLog({
                        type: 'furniture',
                        title: '独享温水泡澡',
                        detail: `${settings.userNickname || '玩家'}在卫生间云朵珍珠大浴缸中独自享受温水泡澡，满池泡沫水汽氤氲`,
                        involvedContactIds: [],
                        involvedContactNames: [],
                        homeType
                      });
                      setActiveModal(null);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1"
                  >
                    <span>🛀 玩家独自入浴泡澡</span>
                  </button>

                  {npcsRef.current.length > 0 && (
                    <button
                      onClick={async () => {
                        const tub = furnitures.find(f => f.type === 'bathtub');
                        const tx = tub ? tub.gx * 32 : 6 * 32;
                        const ty = tub ? tub.gy * 32 : 4 * 32;

                        playerRef.current.isBathing = true;
                        playerRef.current.isSleepingOnBed = false;
                        playerRef.current.x = tx + 4;
                        playerRef.current.y = ty + 8;

                        const presentNpcs = npcsRef.current.filter(n => !n.isOutside && n.relationship !== 'child' && n.customization?.bodyType !== 'child');
                        presentNpcs.forEach((npc, index) => {
                          npc.isBathing = true;
                          npc.isSleepingOnBed = false;
                          npc.isOutside = false;
                          npc.x = tx + 24 + index * 16;
                          npc.y = ty + 8;
                        });

                        const hasChildInHome = npcsRef.current.some(n => n.relationship === 'child' || n.customization?.bodyType === 'child');
                        const npcsNames = presentNpcs.map(n => n.name).join('与');
                        if (npcsNames) {
                          showToast(`已和 ${npcsNames} 一起在大浴缸中泡澡～${hasChildInHome ? '（孩子不参与共浴）' : ''}`);
                          handleIntimacyAction(`与${npcsNames}一起进入云朵珍珠大浴缸温水泡澡，水汽缭绕，享受舒适放松的亲密居家时光`);
                        } else {
                          showToast(`已独自在浴缸中泡澡${hasChildInHome ? '（孩子不可以和父母一同洗澡哦）' : ''}`);
                        }
                        setActiveModal(null);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      <span>🧼 叫 {npcsRef.current.length > 1 ? '全家/所有同住人' : npcsRef.current[0]?.name || '伴侣'} 一起去洗澡</span>
                    </button>
                  )}

                  {(playerRef.current.isBathing || npcsRef.current.some(n => n.isBathing)) && (
                    <button
                      onClick={() => {
                        const tub = furnitures.find(f => f.type === 'bathtub');
                        playerRef.current.isBathing = false;
                        if (tub) {
                          playerRef.current.x = (tub.gx + 1) * 32;
                          playerRef.current.y = (tub.gy + 1) * 32;
                        }
                        npcsRef.current.forEach((n, idx) => {
                          if (n.isBathing) {
                            n.isBathing = false;
                            if (tub) {
                              n.x = (tub.gx + 1) * 32 + (idx + 1) * 16;
                              n.y = (tub.gy + 1) * 32;
                            }
                          }
                        });
                        showToast('泡完澡，全员已穿衣洗完起身！');
                        setActiveModal(null);
                      }}
                      className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all"
                    >
                      👕 全员穿衣洗完起身
                    </button>
                  )}
                </div>
              </>
            )}
            {activeModal === 'coffee' && (
              <>
                <div className="flex items-center justify-between border-b border-[#e2d5c3] pb-2">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-amber-700" />
                    <h3 className="font-bold text-sm text-[#4a3728]">意式咖啡机</h3>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-600 py-1">
                  空气中弥漫着现磨咖啡的浓郁香气，要不要来杯咖啡提提神？
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addInteractionLog({
                        type: 'coffee',
                        title: '冲泡现磨咖啡',
                        detail: `${settings.userNickname || '玩家'}使用家园意式咖啡机冲泡了浓郁香醇的现磨咖啡，满屋飘香`,
                        involvedContactIds: npcsRef.current.map(n => n.contact?.id).filter(Boolean) as string[],
                        involvedContactNames: npcsRef.current.map(n => n.name),
                        homeType
                      });
                      showToast('☕ 请到手机桌面点击“瑞幸咖啡”图标点单下单哦～');
                      setActiveModal(null);
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>去瑞幸下单</span>
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    稍后再喝
                  </button>
                </div>
              </>
            )}

            {/* 婴儿床弹窗 */}
            {activeModal === 'crib' && (
              <>
                <div className="flex items-center justify-between border-b border-[#e2d5c3] pb-2">
                  <div className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-pink-500" />
                    <h3 className="font-bold text-sm text-[#4a3728]">摇篮婴儿床</h3>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {babyStatus === 'none' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      摇篮里空荡荡的，还没有宝宝～ 可以先与已婚伴侣在手机桌面“养娃”应用中迎接小生命哦！
                    </p>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-full py-2.5 bg-[#8a9a7c] text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                      知道了
                    </button>
                  </div>
                ) : babyStatus === 'crying' ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-700 font-medium flex items-center gap-2">
                      <span className="text-base animate-bounce">👶😭</span>
                      <span>小宝贝【{babyName}】正在摇篮里哭闹呢，快哄哄 TA 吧～</span>
                    </div>
                    <button
                      onClick={() => {
                        setBabyStatus('sleeping');
                        addInteractionLog({
                          type: 'baby',
                          title: `照料小宝贝【${babyName}】`,
                          detail: `${settings.userNickname || '玩家'}在婴儿床前温柔地抱起【${babyName}】轻声安抚，宝宝开心地笑了并安静睡着`,
                          involvedContactIds: npcsRef.current.map(n => n.contact?.id).filter(Boolean) as string[],
                          involvedContactNames: npcsRef.current.map(n => n.name),
                          homeType
                        });
                      }}
                      className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>🧸 轻柔哄一哄</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium flex items-center gap-2">
                      <span className="text-base">👶💤</span>
                      <span>娃安静地睡着了，嘴角还挂着甜甜的笑意～</span>
                    </div>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-full py-2.5 bg-[#8a9a7c] text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                      关好房门
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 6. 保存到日记与记忆成功展示弹窗 */}
      {savedSummary && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-md bg-[#FAF6F0] text-gray-800 rounded-2xl p-4 shadow-2xl border border-[#d9c6a8] flex flex-col max-h-[88%] space-y-3">
            {/* 弹窗顶栏 */}
            <div className="flex items-center justify-between border-b border-[#e2d5c3] pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#4a3728]">
                    已保存至 AI 日记与记忆
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    家园互动已同步，在微信对话中 AI 将拥有此段深刻记忆
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSavedSummary(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 各角色的日记与事实展示 */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[160px] max-h-[380px]">
              {savedSummary.map(item => (
                <div key={item.contactId} className="bg-white rounded-xl p-3 border border-[#e2d5c3] shadow-xs space-y-2">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <img
                      src={item.avatar}
                      alt={item.contactName}
                      className="w-7 h-7 rounded-full object-cover border border-amber-300"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-800">{item.contactName}</span>
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full">
                        私密日记已生成
                      </span>
                    </div>
                  </div>

                  {/* 日记内容 */}
                  <div className="bg-[#FAF6F0] p-2.5 rounded-lg border border-[#ece2d0] text-xs text-gray-700 leading-relaxed">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 mb-1">
                      <BookMarked className="w-3 h-3" />
                      <span>{item.contactName}的心情日记：</span>
                    </div>
                    <p className="italic text-gray-700 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {item.diary}
                    </p>
                  </div>

                  {/* 记忆事实 */}
                  {item.facts.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-500">提炼的关键记忆：</span>
                      <div className="flex flex-wrap gap-1">
                        {item.facts.map((f, fIdx) => (
                          <span key={fIdx} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium rounded-md">
                            📌 {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 底部按钮 */}
            <button
              onClick={() => setSavedSummary(null)}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>太好了，已铭记心间</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. 角色形象换装 / 自定义造型弹窗 */}
      <AvatarCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        player={playerRef.current}
        npcs={npcsRef.current}
        customizations={customizations}
        onSaveCustomization={(tId, custom) => {
          updateCustomization(tId, custom);
          showToast('形象外观装扮保存成功！✨');
        }}
      />
    </div>
  );
};
