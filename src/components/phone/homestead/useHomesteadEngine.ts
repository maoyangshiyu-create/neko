import { useState, useEffect, useRef, useCallback } from 'react';
import { Contact, PhoneSettings } from '../../../types/phone';
import { 
  CharacterState, 
  Direction, 
  Furniture, 
  HomeType, 
  InteractionPrompt, 
  AvatarCustomization, 
  IntimacyParticle, 
  IntimacyActionType 
} from './homesteadTypes';
import { CANVAS_WIDTH, CANVAS_HEIGHT, HOME_CONFIGS, MAP_COLS, MAP_ROWS, TILE_SIZE, isWallTile } from './furnitureData';
import { inferContactGender, inferUserGender } from '../../../utils/genderHelper';
import { getRecommendedContactsForHome } from './homesteadClassifier';

const PLAYER_HITBOX = {
  offsetX: 9,
  offsetY: 26,
  width: 14,
  height: 6
};

const CUSTOM_AVATARS_STORAGE_KEY = 'wephone_homestead_avatar_customizations_v1';

// 绝对安全无障碍的基础 Spawn 点 (分布在四大房间开阔地)
const DEFAULT_PLAYER_SPAWN = { x: 5 * TILE_SIZE, y: 4 * TILE_SIZE, facing: 'down' as Direction };

const DEFAULT_NPC_SPAWNS = [
  { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE, facing: 'down' as Direction },
  { x: 14 * TILE_SIZE, y: 3 * TILE_SIZE, facing: 'left' as Direction },
  { x: 4 * TILE_SIZE, y: 10 * TILE_SIZE, facing: 'right' as Direction },
  { x: 14 * TILE_SIZE, y: 10 * TILE_SIZE, facing: 'left' as Direction }
];

// 优雅大地色系与高级中性色库
const ELEGANT_PALETTES = [
  '#5c4d44', // 浓郁暖摩卡
  '#8c7355', // 经典温润驼色
  '#475569', // 质感冷灰岩
  '#78716c', // 柔和暖石灰
  '#6c584c', // 意式焦糖咖
  '#938274', // 羊绒灰褐
  '#3f3f46', // 沉稳深炭灰
  '#a89078', // 燕麦杏褐
  '#52525b', // 雅致雾灰
  '#716158', // 烤奶茶棕
];

export interface ChildNpcData {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
}

export function getAllEligibleChildren(): ChildNpcData[] {
  const children: ChildNpcData[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wephone_pet_list_v1_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            for (const item of list) {
              const age = item.age ?? (item.birthTimestamp ? Math.floor((Date.now() - item.birthTimestamp) / (86400000 * 30)) : 1);
              if (age >= 7) {
                children.push({
                  id: item.id || `child_${item.createdAt || Date.now()}`,
                  name: item.childName || '宝宝',
                  gender: item.gender === 'male' ? 'male' : 'female',
                  age: age
                });
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse child list for homestead:', e);
  }
  return children;
}

function getClothColorByRelationship(relationship?: string, contactId?: string, homeType?: HomeType): string {
  if (homeType === 'marital') {
    if (relationship === 'married') return '#8c7355';
    if (relationship === 'engaged') return '#938274';
    if (relationship === 'dating') return '#6c584c';
  }

  if (homeType === 'family') {
    return '#78716c';
  }

  if (contactId) {
    let hash = 0;
    for (let i = 0; i < contactId.length; i++) {
      hash = (hash << 5) - hash + contactId.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % ELEGANT_PALETTES.length;
    return ELEGANT_PALETTES[idx];
  }

  return '#5c4d44';
}

function checkCollision(
  x: number,
  y: number,
  furnitures: Furniture[]
): boolean {
  const boxLeft = x + PLAYER_HITBOX.offsetX;
  const boxRight = boxLeft + PLAYER_HITBOX.width;
  const boxTop = y + PLAYER_HITBOX.offsetY;
  const boxBottom = boxTop + PLAYER_HITBOX.height;

  // 1. 墙壁与房间内部分隔隔断墙碰撞检测
  const startCol = Math.floor(boxLeft / TILE_SIZE);
  const endCol = Math.floor(boxRight / TILE_SIZE);
  const startRow = Math.floor(boxTop / TILE_SIZE);
  const endRow = Math.floor(boxBottom / TILE_SIZE);

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (isWallTile(c, r)) return true;
    }
  }

  // 2. 家具碰撞检测
  for (const f of furnitures) {
    const fLeft = f.gx * TILE_SIZE;
    const fRight = fLeft + f.widthTiles * TILE_SIZE;
    const fTop = f.gy * TILE_SIZE;
    const fBottom = fTop + f.heightTiles * TILE_SIZE;

    if (
      boxRight > fLeft &&
      boxLeft < fRight &&
      boxBottom > fTop &&
      boxTop < fBottom
    ) {
      return true;
    }
  }

  return false;
}

export function useHomesteadEngine({
  homeType,
  contacts,
  settings,
  onInteractFurniture,
  onInteractNPC
}: {
  homeType: HomeType;
  contacts: Contact[];
  settings: PhoneSettings;
  onInteractFurniture: (furniture: Furniture) => void;
  onInteractNPC: (npc: CharacterState) => void;
}) {
  const currentHomeConfig = HOME_CONFIGS[homeType];
  const furnitures = currentHomeConfig.furnitures;

  const playerGender = inferUserGender(settings);

  // 装扮自定义状态字典 (id -> AvatarCustomization)
  const [customizations, setCustomizations] = useState<Record<string, AvatarCustomization>>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_AVATARS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const customizationsRef = useRef<Record<string, AvatarCustomization>>(customizations);
  customizationsRef.current = customizations;

  // 玩家状态 Ref
  const playerRef = useRef<CharacterState>({
    id: 'player',
    name: settings.userNickname || '我',
    isPlayer: true,
    gender: (customizations['player']?.gender) || (playerGender === 'female' ? 'female' : 'male'),
    x: 5 * TILE_SIZE,
    y: 7 * TILE_SIZE,
    facing: 'down',
    clothColor: customizations['player']?.clothColor || '#5c4d44',
    customization: customizations['player']
  });

  const npcsRef = useRef<CharacterState[]>([]);
  const particlesRef = useRef<IntimacyParticle[]>([]);
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const touchDirectionRef = useRef<Direction | null>(null);
  const playerTargetRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // 提示与常驻状态
  const [activePrompt, setActivePrompt] = useState<InteractionPrompt | null>(null);
  const [nearbyNpc, setNearbyNpc] = useState<CharacterState | null>(null);
  const [residentIds, setResidentIds] = useState<string[]>([]);

  const storageKey = `wephone_homestead_${homeType}_v2`;

  // 保存当前家园状态
  const saveState = useCallback(() => {
    try {
      const data = {
        version: 2,
        player: {
          x: playerRef.current.x,
          y: playerRef.current.y,
          facing: playerRef.current.facing
        },
        npcs: npcsRef.current.map(n => ({
          id: n.id,
          x: n.x,
          y: n.y,
          facing: n.facing
        })),
        customResidents: residentIds
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save homestead data:', e);
    }
  }, [storageKey, residentIds]);

  // 更新角色外观自定义
  const updateCustomization = useCallback((targetId: string, custom: AvatarCustomization) => {
    setCustomizations(prev => {
      const next = { ...prev, [targetId]: custom };
      try {
        localStorage.setItem(CUSTOM_AVATARS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save avatar customization:', e);
      }
      return next;
    });

    if (targetId === 'player') {
      playerRef.current.customization = custom;
      if (custom.gender) {
        playerRef.current.gender = custom.gender;
      }
      if (custom.clothColor) {
        playerRef.current.clothColor = custom.clothColor;
      }
    } else {
      const targetNpc = npcsRef.current.find(n => n.id === targetId);
      if (targetNpc) {
        targetNpc.customization = custom;
        if (custom.gender) {
          targetNpc.gender = custom.gender;
        }
        if (custom.clothColor) {
          targetNpc.clothColor = custom.clothColor;
        }
      }
    }
  }, []);

  // 触发亲密互动特效粒子 (亲亲、牵手、抱抱)
  const triggerIntimacyEffect = useCallback((targetNpc: CharacterState, action: IntimacyActionType) => {
    const player = playerRef.current;
    
    // 双方互相面向对方
    const dx = targetNpc.x - player.x;
    const dy = targetNpc.y - player.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx > 0 ? 'right' : 'left';
      targetNpc.facing = dx > 0 ? 'left' : 'right';
    } else {
      player.facing = dy > 0 ? 'down' : 'up';
      targetNpc.facing = dy > 0 ? 'up' : 'down';
    }

    const midX = (player.x + targetNpc.x) / 2 + 16;
    const midY = (player.y + targetNpc.y) / 2 + 12;

    const count = action === 'kiss' ? 16 : (action === 'hug' ? 14 : 10);
    const newParticles: IntimacyParticle[] = [];

    const heartColors = ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#e11d48'];
    const starColors = ['#fbbf24', '#fde047', '#f59e0b', '#38bdf8'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = Math.random() * 1.5 + 0.8;
      
      let pType: 'heart' | 'sparkle' | 'kiss' = 'heart';
      if (action === 'kiss') {
        pType = i % 3 === 0 ? 'kiss' : (i % 2 === 0 ? 'heart' : 'sparkle');
      } else if (action === 'hand') {
        pType = i % 2 === 0 ? 'sparkle' : 'heart';
      } else {
        pType = 'heart';
      }

      newParticles.push({
        id: `part_${Date.now()}_${i}_${Math.random()}`,
        x: midX + (Math.random() - 0.5) * 16,
        y: midY + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed * 0.7,
        vy: -Math.abs(Math.sin(angle) * speed) - 0.8, // 向上漂浮
        alpha: 1,
        size: Math.random() * 4 + (pType === 'kiss' ? 7 : 5),
        type: pType,
        color: pType === 'sparkle' ? starColors[i % starColors.length] : heartColors[i % heartColors.length]
      });
    }

    particlesRef.current.push(...newParticles);
  }, []);

  // 当切换家园或联系人变动时初始化
  useEffect(() => {
    let savedData: any = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) savedData = JSON.parse(raw);
    } catch {
      // ignore
    }

    const currentCustoms = customizationsRef.current;
    const playerCustom = currentCustoms['player'];

    if (savedData?.player) {
      playerRef.current.x = savedData.player.x ?? DEFAULT_PLAYER_SPAWN.x;
      playerRef.current.y = savedData.player.y ?? DEFAULT_PLAYER_SPAWN.y;
      playerRef.current.facing = savedData.player.facing ?? 'down';
    } else {
      playerRef.current.x = DEFAULT_PLAYER_SPAWN.x;
      playerRef.current.y = DEFAULT_PLAYER_SPAWN.y;
      playerRef.current.facing = 'down';
    }

    // 防卡墙自动纠错（如初始坐标踩在墙/家具上，强制归位到安全 Spawn）
    if (checkCollision(playerRef.current.x, playerRef.current.y, furnitures)) {
      playerRef.current.x = DEFAULT_PLAYER_SPAWN.x;
      playerRef.current.y = DEFAULT_PLAYER_SPAWN.y;
    }

    playerRef.current.name = settings.userNickname || '我';
    playerRef.current.gender = playerCustom?.gender || (playerGender === 'female' ? 'female' : 'male');
    playerRef.current.clothColor = playerCustom?.clothColor || '#5c4d44';
    playerRef.current.customization = playerCustom;

    // 1. 确定入驻的 NPC 列表
    let selectedContacts: Contact[] = [];
    if (savedData?.customResidents && Array.isArray(savedData.customResidents) && savedData.customResidents.length > 0) {
      selectedContacts = contacts.filter(c => savedData.customResidents.includes(c.id));
      setResidentIds(savedData.customResidents);
    } else {
      // 自动人设推荐入驻 (最多 3 个)
      const recommended = getRecommendedContactsForHome(contacts, homeType).slice(0, 3);
      selectedContacts = recommended;
      const autoIds = recommended.map(c => c.id);
      setResidentIds(autoIds);
    }

    const initialNpcs: CharacterState[] = selectedContacts.map((c, idx) => {
      const savedNpc = savedData?.npcs?.find((sn: any) => sn.id === c.id);
      const spawn = DEFAULT_NPC_SPAWNS[idx % DEFAULT_NPC_SPAWNS.length];
      const npcGender = inferContactGender(c);
      const npcCustom = currentCustoms[c.id];
      const baseCloth = getClothColorByRelationship(c.relationship, c.id, homeType);

      let spawnX = savedNpc?.x ?? spawn.x;
      let spawnY = savedNpc?.y ?? spawn.y;
      // NPC 防卡检测
      if (checkCollision(spawnX, spawnY, furnitures)) {
        spawnX = spawn.x;
        spawnY = spawn.y;
      }

      return {
        id: c.id,
        name: c.remark || c.name,
        isPlayer: false,
        gender: npcCustom?.gender || (npcGender === 'female' ? 'female' : 'male'),
        relationship: c.relationship,
        x: spawnX,
        y: spawnY,
        facing: savedNpc?.facing ?? spawn.facing,
        clothColor: npcCustom?.clothColor || baseCloth,
        contact: c,
        moveTimer: Math.random() * 2000 + 1000,
        customization: npcCustom
      };
    });

    npcsRef.current = initialNpcs;

    // 扫出所有满7岁的孩子，自动创建形象入驻家园！
    const eligibleChildren = getAllEligibleChildren();
    const childNpcs: CharacterState[] = eligibleChildren.map((ch, idx) => {
      const savedNpc = savedData?.npcs?.find((sn: any) => sn.id === ch.id);
      const spawnIndex = (selectedContacts.length + idx) % DEFAULT_NPC_SPAWNS.length;
      const spawn = DEFAULT_NPC_SPAWNS[spawnIndex];
      const childCustom = currentCustoms[ch.id] || {};

      let spawnX = savedNpc?.x ?? (spawn.x + (idx + 1) * 16);
      let spawnY = savedNpc?.y ?? spawn.y;
      if (checkCollision(spawnX, spawnY, furnitures)) {
        spawnX = spawn.x;
        spawnY = spawn.y;
      }

      const syntheticContact: Contact = {
        id: ch.id,
        name: ch.name,
        avatar: ch.gender === 'female' 
          ? 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=100'
          : 'https://images.unsplash.com/photo-1595454173874-56b9c927f872?w=100',
        relationship: 'child',
        persona: `你是玩家抚养长大的孩子，名字叫${ch.name}，今年${ch.age}岁。性格天真懂事，非常喜欢爸爸妈妈！`,
        gender: ch.gender === 'female' ? 'female' : 'male',
        group: '家庭',
        worldBookIds: [],
        replySpeed: 1000,
        replyStyle: 'balanced',
        unreadCount: 0,
        shortTermMemory: 10,
        longTermMemory: 50,
        voiceTimbre: 'child-joyful',
        enableInnerVoice: true,
        isOfflineMode: false
      };

      return {
        id: ch.id,
        name: `${ch.name} (${ch.age}岁)`,
        isPlayer: false,
        gender: childCustom.gender || ch.gender,
        relationship: 'child',
        x: spawnX,
        y: spawnY,
        facing: savedNpc?.facing ?? spawn.facing,
        clothColor: childCustom.clothColor || (ch.gender === 'female' ? '#f472b6' : '#38bdf8'),
        contact: syntheticContact,
        moveTimer: Math.random() * 2000 + 1000,
        customization: {
          bodyType: 'child',
          hairstyle: ch.gender === 'female' ? 'twin_tails' : 'short_bob',
          accessory: ch.gender === 'female' ? 'bow' : 'none',
          ...childCustom
        }
      };
    });

    npcsRef.current = [...initialNpcs, ...childNpcs];
  }, [homeType, contacts, settings.userNickname, playerGender, storageKey, furnitures]);

  // 更新当前家园入驻成员
  const updateResidents = useCallback((newResidentIds: string[]) => {
    setResidentIds(newResidentIds);

    const currentCustoms = customizationsRef.current;
    const updatedContacts = contacts.filter(c => newResidentIds.includes(c.id));
    const newNpcs: CharacterState[] = updatedContacts.map((c, idx) => {
      const existing = npcsRef.current.find(n => n.id === c.id);
      const spawn = DEFAULT_NPC_SPAWNS[idx % DEFAULT_NPC_SPAWNS.length];
      const npcGender = inferContactGender(c);
      const npcCustom = currentCustoms[c.id];
      const baseCloth = getClothColorByRelationship(c.relationship, c.id, homeType);

      let targetX = existing ? existing.x : spawn.x;
      let targetY = existing ? existing.y : spawn.y;
      if (checkCollision(targetX, targetY, furnitures)) {
        targetX = spawn.x;
        targetY = spawn.y;
      }

      return {
        id: c.id,
        name: c.remark || c.name,
        isPlayer: false,
        gender: npcCustom?.gender || (npcGender === 'female' ? 'female' : 'male'),
        relationship: c.relationship,
        x: targetX,
        y: targetY,
        facing: existing ? existing.facing : spawn.facing,
        clothColor: npcCustom?.clothColor || baseCloth,
        contact: c,
        moveTimer: Math.random() * 10000 + 20000,
        customization: npcCustom
      };
    });

    const eligibleChildren = getAllEligibleChildren();
    const childNpcs: CharacterState[] = eligibleChildren.map((ch, idx) => {
      const existing = npcsRef.current.find(n => n.id === ch.id);
      const spawnIndex = (updatedContacts.length + idx) % DEFAULT_NPC_SPAWNS.length;
      const spawn = DEFAULT_NPC_SPAWNS[spawnIndex];
      const childCustom = currentCustoms[ch.id] || {};

      let targetX = existing ? existing.x : (spawn.x + (idx + 1) * 16);
      let targetY = existing ? existing.y : spawn.y;
      if (checkCollision(targetX, targetY, furnitures)) {
        targetX = spawn.x;
        targetY = spawn.y;
      }

      const syntheticContact: Contact = {
        id: ch.id,
        name: ch.name,
        avatar: ch.gender === 'female' 
          ? 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=100'
          : 'https://images.unsplash.com/photo-1595454173874-56b9c927f872?w=100',
        relationship: 'child',
        persona: `你是玩家抚养长大的孩子，名字叫${ch.name}，今年${ch.age}岁。性格天真懂事，非常喜欢爸爸妈妈！`,
        gender: ch.gender === 'female' ? 'female' : 'male',
        group: '家庭',
        worldBookIds: [],
        replySpeed: 1000,
        replyStyle: 'balanced',
        unreadCount: 0,
        shortTermMemory: 10,
        longTermMemory: 50,
        voiceTimbre: 'child-joyful',
        enableInnerVoice: true,
        isOfflineMode: false
      };

      return {
        id: ch.id,
        name: `${ch.name} (${ch.age}岁)`,
        isPlayer: false,
        gender: childCustom.gender || ch.gender,
        relationship: 'child',
        x: targetX,
        y: targetY,
        facing: existing ? existing.facing : spawn.facing,
        clothColor: childCustom.clothColor || (ch.gender === 'female' ? '#f472b6' : '#38bdf8'),
        contact: syntheticContact,
        moveTimer: Math.random() * 10000 + 20000,
        customization: {
          bodyType: 'child',
          hairstyle: ch.gender === 'female' ? 'twin_tails' : 'short_bob',
          accessory: ch.gender === 'female' ? 'bow' : 'none',
          ...childCustom
        }
      };
    });

    npcsRef.current = [...newNpcs, ...childNpcs];

    // 即刻保存
    try {
      const data = {
        version: 2,
        player: {
          x: playerRef.current.x,
          y: playerRef.current.y,
          facing: playerRef.current.facing
        },
        npcs: newNpcs.map(n => ({
          id: n.id,
          x: n.x,
          y: n.y,
          facing: n.facing
        })),
        customResidents: newResidentIds
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [contacts, homeType, storageKey, furnitures]);

  // 重置位置
  const resetPositions = useCallback(() => {
    playerRef.current.x = DEFAULT_PLAYER_SPAWN.x;
    playerRef.current.y = DEFAULT_PLAYER_SPAWN.y;
    playerRef.current.facing = 'down';
    playerTargetRef.current = null;

    npcsRef.current.forEach((npc, idx) => {
      const spawn = DEFAULT_NPC_SPAWNS[idx % DEFAULT_NPC_SPAWNS.length];
      npc.x = spawn.x;
      npc.y = spawn.y;
      npc.facing = spawn.facing;
      npc.targetX = undefined;
      npc.targetY = undefined;
    });

    saveState();
  }, [saveState]);

  const setTouchDirection = useCallback((dir: Direction | null) => {
    touchDirectionRef.current = dir;
    if (dir !== null) {
      playerTargetRef.current = null;
    }
  }, []);

  const setPlayerTarget = useCallback((targetPixelX: number, targetPixelY: number) => {
    const clampedX = Math.max(TILE_SIZE, Math.min((MAP_COLS - 2) * TILE_SIZE, targetPixelX - 16));
    const clampedY = Math.max(TILE_SIZE, Math.min((MAP_ROWS - 2) * TILE_SIZE, targetPixelY - 24));
    playerTargetRef.current = { x: clampedX, y: clampedY };
  }, []);

  const triggerInteraction = useCallback(() => {
    if (!activePrompt) return;
    if (activePrompt.type === 'furniture') {
      const f = furnitures.find(item => item.id === activePrompt.id);
      if (f) onInteractFurniture(f);
    } else if (activePrompt.type === 'npc') {
      const n = npcsRef.current.find(item => item.id === activePrompt.id);
      if (n) onInteractNPC(n);
    }
  }, [activePrompt, furnitures, onInteractFurniture, onInteractNPC]);

  // 键盘与事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysPressedRef.current[k] = true;
        playerTargetRef.current = null;
      }
      if (k === 'e') {
        triggerInteraction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysPressedRef.current[k] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      saveState();
    };
  }, [saveState, triggerInteraction]);

  // 主循环
  useEffect(() => {
    let lastTime = performance.now();

    const tick = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      const player = playerRef.current;
      const speed = 2.5;
      let dx = 0;
      let dy = 0;

      const keys = keysPressedRef.current;
      const touchDir = touchDirectionRef.current;

      if (touchDir === 'up' || keys['w'] || keys['arrowup']) {
        dy -= speed;
        player.facing = 'up';
      } else if (touchDir === 'down' || keys['s'] || keys['arrowdown']) {
        dy += speed;
        player.facing = 'down';
      }

      if (touchDir === 'left' || keys['a'] || keys['arrowleft']) {
        dx -= speed;
        player.facing = 'left';
      } else if (touchDir === 'right' || keys['d'] || keys['arrowright']) {
        dx += speed;
        player.facing = 'right';
      }

      if (dx === 0 && dy === 0 && playerTargetRef.current) {
        const target = playerTargetRef.current;
        const distX = target.x - player.x;
        const distY = target.y - player.y;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist > 3) {
          const moveX = (distX / dist) * speed;
          const moveY = (distY / dist) * speed;

          if (Math.abs(distX) > Math.abs(distY)) {
            player.facing = distX > 0 ? 'right' : 'left';
          } else {
            player.facing = distY > 0 ? 'down' : 'up';
          }

          dx = moveX;
          dy = moveY;
        } else {
          playerTargetRef.current = null;
        }
      }

      if (dx !== 0) {
        player.isSleepingOnBed = false;
        const nextX = player.x + dx;
        if (!checkCollision(nextX, player.y, furnitures)) {
          player.x = nextX;
        } else if (playerTargetRef.current) {
          playerTargetRef.current = null;
        }
      }

      if (dy !== 0) {
        player.isSleepingOnBed = false;
        const nextY = player.y + dy;
        if (!checkCollision(player.x, nextY, furnitures)) {
          player.y = nextY;
        } else if (playerTargetRef.current) {
          playerTargetRef.current = null;
        }
      }

      // NPC 漫步
      npcsRef.current.forEach(npc => {
        if (npc.isOutside || npc.isSleepingOnBed) return;
        npc.moveTimer = (npc.moveTimer || 0) - dt;

        if (npc.moveTimer <= 0) {
          npc.moveTimer = Math.random() * 6000 + 27000;

          const targetGX = Math.floor(Math.random() * (MAP_COLS - 4)) + 2;
          const targetGY = Math.floor(Math.random() * (MAP_ROWS - 4)) + 2;
          const targetX = targetGX * TILE_SIZE;
          const targetY = targetGY * TILE_SIZE;

          if (!checkCollision(targetX, targetY, furnitures)) {
            npc.targetX = targetX;
            npc.targetY = targetY;
          }
        }

        if (npc.targetX !== undefined && npc.targetY !== undefined) {
          const distX = npc.targetX - npc.x;
          const distY = npc.targetY - npc.y;
          const dist = Math.sqrt(distX * distX + distY * distY);

          if (dist > 2) {
            const npcSpeed = 0.9;
            const moveX = (distX / dist) * npcSpeed;
            const moveY = (distY / dist) * npcSpeed;

            if (Math.abs(distX) > Math.abs(distY)) {
              npc.facing = distX > 0 ? 'right' : 'left';
            } else {
              npc.facing = distY > 0 ? 'down' : 'up';
            }

            const nextX = npc.x + moveX;
            const nextY = npc.y + moveY;

            if (!checkCollision(nextX, nextY, furnitures)) {
              npc.x = nextX;
              npc.y = nextY;
            } else {
              npc.targetX = undefined;
              npc.targetY = undefined;
            }
          } else {
            npc.targetX = undefined;
            npc.targetY = undefined;
          }
        }
      });

      // 粒子系统更新
      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.016;
        });
        particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);
      }

      // 交互检测
      let foundPrompt: InteractionPrompt | null = null;
      let closestNpc: CharacterState | null = null;
      const playerCenterX = player.x + 16;
      const playerCenterY = player.y + 24;

      for (const npc of npcsRef.current) {
        if (npc.isOutside) continue;
        const npcCenterX = npc.x + 16;
        const npcCenterY = npc.y + 24;
        const d = Math.hypot(playerCenterX - npcCenterX, playerCenterY - npcCenterY);

        if (d <= 52) {
          closestNpc = npc;
          foundPrompt = {
            type: 'npc',
            id: npc.id,
            name: npc.name,
            x: npc.x,
            y: npc.y - 12,
            label: `互动 (${npc.name})`
          };
          break;
        }
      }

      if (!foundPrompt) {
        for (const f of furnitures) {
          const fLeft = f.gx * TILE_SIZE;
          const fRight = fLeft + f.widthTiles * TILE_SIZE;
          const fTop = f.gy * TILE_SIZE;
          const fBottom = fTop + f.heightTiles * TILE_SIZE;

          const nearX = Math.max(fLeft, Math.min(playerCenterX, fRight));
          const nearY = Math.max(fTop, Math.min(playerCenterY, fBottom));
          const dist = Math.hypot(playerCenterX - nearX, playerCenterY - nearY);

          if (dist <= 44) {
            foundPrompt = {
              type: 'furniture',
              id: f.id,
              name: f.name,
              x: (fLeft + fRight) / 2 - 16,
              y: fTop - 12,
              label: f.interactLabel
            };
            break;
          }
        }
      }

      setActivePrompt(prev => {
        if (!prev && !foundPrompt) return null;
        if (prev && foundPrompt && prev.id === foundPrompt.id && prev.label === foundPrompt.label) {
          return prev;
        }
        return foundPrompt;
      });

      setNearbyNpc(prev => {
        if (!prev && !closestNpc) return null;
        if (prev && closestNpc && prev.id === closestNpc.id) return prev;
        return closestNpc;
      });

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [furnitures]);

  return {
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
    saveState,
    setTouchDirection,
    setPlayerTarget,
    triggerInteraction
  };
}
