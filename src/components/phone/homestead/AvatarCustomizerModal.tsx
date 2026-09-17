import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  RotateCw, 
  Sparkles, 
  Check, 
  User, 
  Palette, 
  Scissors, 
  Sparkle,
  Smile,
  Eye,
  Heart,
  Users,
  Paintbrush,
  Eraser,
  Trash2,
  Grid
} from 'lucide-react';
import { Contact } from '../../../types/phone';
import { 
  AvatarCustomization, 
  CharacterState, 
  Direction, 
  HairstyleType, 
  AccessoryType, 
  SkinToneType 
} from './homesteadTypes';
import { drawCharacter } from './drawing';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: CharacterState;
  npcs: CharacterState[];
  customizations: Record<string, AvatarCustomization>;
  onSaveCustomization: (targetId: string, custom: AvatarCustomization) => void;
}

const HAIR_COLORS = [
  { name: '暖栗深棕', color: '#5c3d2e', highlight: '#8d6e5d' },
  { name: '曜石酷黑', color: '#1e242d', highlight: '#3f4756' },
  { name: '奶茶灰褐', color: '#8c7b70', highlight: '#b09f94' },
  { name: '蜜糖浅金', color: '#c89658', highlight: '#e8b87d' },
  { name: '银白冷霜', color: '#b8c2d1', highlight: '#e2e8f0' },
  { name: '优雅酒红', color: '#723340', highlight: '#a35364' },
  { name: '焦糖落叶', color: '#8f4e2c', highlight: '#ba7149' },
  { name: '樱花雾粉', color: '#c47a88', highlight: '#e5a4b0' },
];

const EYE_COLORS = [
  { name: '琥珀深棕', color: '#3d2817', highlight: '#7c5335', desc: '温柔深邃' },
  { name: '曜石夜黑', color: '#111827', highlight: '#374151', desc: '纯净清冷' },
  { name: '澄澈海蓝', color: '#2563eb', highlight: '#60a5fa', desc: '碧海星辰' },
  { name: '翡翠深绿', color: '#059669', highlight: '#34d399', desc: '灵动生机' },
  { name: '罗兰魅紫', color: '#7c3aed', highlight: '#a78bfa', desc: '神秘高贵' },
  { name: '绯红蔷薇', color: '#e11d48', highlight: '#fb7185', desc: '娇艳热烈' },
  { name: '暮光金眸', color: '#d97706', highlight: '#fbbf24', desc: '温暖闪耀' },
  { name: '冰晶银灰', color: '#64748b', highlight: '#94a3b8', desc: '高冷矜贵' },
  { name: '琉璃青碧', color: '#0891b2', highlight: '#22d3ee', desc: '清透水色' },
  { name: '樱花粉瞳', color: '#db2777', highlight: '#f472b6', desc: '甜美梦幻' },
];

const OUTFIT_COLORS = [
  { name: '柔粉', color: '#e8a5b8' },
  { name: '香槟金光', color: '#d4af37' },
  { name: '天鹅珍珠', color: '#f3e8d8' },
  { name: '暖摩卡棕', color: '#5c4d44' },
  { name: '温润驼色', color: '#8c7355' },
  { name: '质感冷灰', color: '#475569' },
  { name: '羊绒灰褐', color: '#938274' },
  { name: '鼠尾草绿', color: '#526055' },
  { name: '雅致粉蓝', color: '#a3c7f7' },
  { name: '纯净米白', color: '#fcfbf7' },
];

const SKIN_TONES: { id: SkinToneType; name: string; color: string }[] = [
  { id: 'fair', name: '凝脂冷白', color: '#fff2e8' },
  { id: 'natural', name: '自然暖白', color: '#fdeee2' },
  { id: 'warm', name: '温暖柔杏', color: '#f5dfcc' },
  { id: 'tanned', name: '健康小麦', color: '#e8cbb0' },
];

const ACCESSORIES: { id: AccessoryType; name: string; icon: string }[] = [
  { id: 'none', name: '无配饰', icon: '🚫' },
  { id: 'hairpin', name: '香槟金发夹', icon: '✨' },
  { id: 'cat_ears', name: '软萌猫耳', icon: '🐱' },
  { id: 'glasses', name: '斯文眼镜', icon: '👓' },
  { id: 'bow', name: '丝绒蝴蝶结', icon: '🎀' },
  { id: 'beret', name: '复古贝雷帽', icon: '👒' },
  { id: 'flower', name: '栀子花饰', icon: '🌸' },
];

// 自定义像素调色盘常用色
const PIXEL_PALETTE = [
  '#e8a5b8', '#d4af37', '#a3c7f7', '#c2e8dc', '#f3e8d8',
  '#5c3d2e', '#1f242d', '#ffffff', '#000000', '#f43f5e',
  '#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#3b82f6'
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  player,
  npcs,
  customizations,
  onSaveCustomization
}) => {
  const [targetId, setTargetId] = useState<string>('player');
  const [facing, setFacing] = useState<Direction>('down');
  const [category, setCategory] = useState<'hair' | 'body' | 'color' | 'eyes' | 'outfit' | 'skin' | 'accessory' | 'custom_draw'>('hair');

  const [currentCustom, setCurrentCustom] = useState<AvatarCustomization>({});

  // 像素自绘编辑器状态
  const [drawTool, setDrawTool] = useState<'paint' | 'erase'>('paint');
  const [activeColor, setActiveColor] = useState<string>('#e8a5b8');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentTarget = targetId === 'player' ? player : (npcs.find(n => n.id === targetId) || player);
  const currentGender = currentCustom.gender || currentTarget.gender || 'female';

  useEffect(() => {
    const saved = customizations[targetId] || {};
    const defaultBodyType = currentTarget.relationship === 'child' ? 'child' : 'adult';
    setCurrentCustom({
      gender: saved.gender || currentTarget.gender || 'female',
      bodyType: saved.bodyType || currentTarget.customization?.bodyType || defaultBodyType,
      hairstyle: saved.hairstyle || 'default',
      hairColor: saved.hairColor || (currentTarget.gender === 'female' ? '#5c3d2e' : '#1f242d'),
      eyeColor: saved.eyeColor || (currentTarget.gender === 'female' ? '#3d2817' : '#111827'),
      skinTone: saved.skinTone || 'fair',
      clothColor: saved.clothColor || currentTarget.clothColor || '#e8a5b8',
      pantsColor: saved.pantsColor || '#242a35',
      accessory: saved.accessory || (currentTarget.gender === 'female' ? 'hairpin' : 'none'),
      customPixels: saved.customPixels || {}
    });
  }, [targetId, customizations, currentTarget]);

  // 画布实时预览渲染
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 120, 140);

    ctx.save();
    ctx.scale(2.4, 2.4);
    
    const mockChar: CharacterState = {
      id: 'preview',
      name: targetId === 'player' ? '玩家形象' : currentTarget.name,
      isPlayer: targetId === 'player',
      gender: currentGender,
      x: 9,
      y: 12,
      facing: facing,
      clothColor: currentCustom.clothColor || '#e8a5b8',
      customization: currentCustom
    };

    drawCharacter(ctx, mockChar);
    ctx.restore();
  }, [currentCustom, facing, currentGender, targetId, currentTarget]);

  // 像素绘画编辑画布渲染 (32x48 像素网格)
  useEffect(() => {
    if (category !== 'custom_draw') return;
    const canvas = pixelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 256, 384);

    // 1. 绘制底层基础角色
    ctx.save();
    ctx.scale(8, 8); // 32x48 => 256x384
    const baseChar: CharacterState = {
      id: 'pixel_editor_base',
      name: 'Base',
      isPlayer: targetId === 'player',
      gender: currentGender,
      x: 0,
      y: 0,
      facing: facing,
      clothColor: currentCustom.clothColor || '#e8a5b8',
      customization: {
        ...currentCustom,
        customPixels: {} // 不含自定义画块的基础图
      }
    };
    drawCharacter(ctx, baseChar);
    ctx.restore();

    // 2. 绘制玩家自定义的像素点/抹除块
    const customPixels = currentCustom.customPixels || {};
    for (const [key, color] of Object.entries(customPixels)) {
      const [px, py] = key.split(',').map(Number);
      if (!isNaN(px) && !isNaN(py)) {
        if (color === 'transparent' || color === 'erase' || color === 'delete') {
          ctx.clearRect(px * 8, py * 8, 8, 8);
          // 擦除后画灰色棋盘网格底
          ctx.fillStyle = (px + py) % 2 === 0 ? '#f3f4f6' : '#e5e7eb';
          ctx.fillRect(px * 8, py * 8, 8, 8);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(px * 8, py * 8, 8, 8);
        }
      }
    }

    // 3. 绘制 32x48 辅助网格线
    if (showGrid) {
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'; // 洛可可金网格
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= 256; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 384);
        ctx.stroke();
      }
      for (let y = 0; y <= 384; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
    }
  }, [category, currentCustom, facing, currentGender, showGrid, targetId]);

  if (!isOpen) return null;

  const rotateFacing = () => {
    const dirs: Direction[] = ['down', 'left', 'up', 'right'];
    const nextIdx = (dirs.indexOf(facing) + 1) % dirs.length;
    setFacing(dirs[nextIdx]);
  };

  const handleSave = () => {
    onSaveCustomization(targetId, currentCustom);
    onClose();
  };

  // 像素格操作处理
  const handlePixelCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = pixelCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / 32));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / 48));

    if (x >= 0 && x < 32 && y >= 0 && y < 48) {
      const key = `${x},${y}`;
      const updated = { ...(currentCustom.customPixels || {}) };
      
      if (drawTool === 'erase') {
        updated[key] = 'transparent';
      } else {
        updated[key] = activeColor;
      }

      setCurrentCustom(prev => ({
        ...prev,
        customPixels: updated
      }));
    }
  };

  const clearAllCustomPixels = () => {
    setCurrentCustom(prev => ({
      ...prev,
      customPixels: {}
    }));
  };

  // 预设洛可可美学风格
  const applyPreset = (presetName: string) => {
    if (presetName === 'rococo_princess') {
      setCurrentCustom(prev => ({
        ...prev,
        gender: 'female',
        hairstyle: 'long_wavy',
        hairColor: '#e8b87d',
        eyeColor: '#db2777',
        accessory: 'bow',
        clothColor: '#e8a5b8',
        skinTone: 'fair'
      }));
    } else if (presetName === 'rococo_prince') {
      setCurrentCustom(prev => ({
        ...prev,
        gender: 'male',
        hairstyle: 'ponytail',
        hairColor: '#b8c2d1',
        eyeColor: '#2563eb',
        accessory: 'beret',
        clothColor: '#a3c7f7',
        skinTone: 'fair'
      }));
    }
  };

  const femaleHairstyles: { id: HairstyleType; name: string; desc: string }[] = [
    { id: 'default', name: '经典垂肩发', desc: '温润及肩自然碎发' },
    { id: 'long_wavy', name: '法式卷发', desc: '优雅及腰波浪秀发' },
    { id: 'twin_tails', name: '软萌双马尾', desc: '元气灵动双扎马尾' },
    { id: 'short_bob', name: '齐耳波波头', desc: '甜美清爽短发' },
    { id: 'ponytail', name: '活力高马尾', desc: '利落束发青春满满' }
  ];

  const maleHairstyles: { id: HairstyleType; name: string; desc: string }[] = [
    { id: 'default', name: '清爽偏分短发', desc: '经典帅气立体短发' },
    { id: 'anime_messy', name: '动感碎发狼尾', desc: '二次元层次感碎发' },
    { id: 'ponytail', name: '微卷后束', desc: '优雅艺术家微长后束' },
    { id: 'short_bob', name: '少年微长短发', desc: '温润邻家少年感' }
  ];

  const currentHairstyles = currentGender === 'female' ? femaleHairstyles : maleHairstyles;

  return (
    <div className="absolute inset-0 z-50 bg-[#FAF5EE] text-[#3D2A24] flex flex-col w-full h-full overflow-hidden select-none animate-in slide-in-from-bottom-4 duration-200">
      {/* 1. 全屏标题 Navigation Bar */}
      <div className="shrink-0 bg-[#FAF5EE] border-b-2 border-[#E5C378]/40 px-3.5 py-3 flex items-center justify-between shadow-xs z-20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-[#E5C378] to-[#C5A059] text-[#2C1D18] rounded-2xl shadow-md border border-[#FAF3E0] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#3D2A24] leading-tight font-serif flex items-center gap-1.5">
              <span>形象高定坊 · 造型与像素绘制</span>
            </h3>
            <p className="text-[11px] text-[#7A5C50] mt-0.5">
              定制专属形象、发型发色与全量 32x48 像素自绘
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-gradient-to-r from-[#E5C378] to-[#C5A059] hover:from-[#D4AF37] hover:to-[#B38F2D] text-[#2C1D18] font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1 border border-[#FAF3E0]"
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">保存装扮</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8C6B5E] hover:text-[#3D2A24] hover:bg-[#F3E8D8] rounded-xl cursor-pointer transition-all active:scale-90"
            title="关闭全屏装扮"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 2. 可滚动的主内容区 */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin scrollbar-thumb-[#E5C378]/50">
        
        {/* 2.1 装扮对象选择 Card */}
        <div className="bg-[#F5EAD9]/90 border border-[#E5C378]/50 rounded-2xl p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#5C4238] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#C5A059]" />
              <span>选择装扮角色对象：</span>
            </span>
            <span className="text-[11px] text-[#8C6B5E] font-medium bg-[#FCFBF7] px-2 py-0.5 rounded-full border border-[#E8D9C5]">
              共 {1 + npcs.length} 位角色
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 px-0.5 scrollbar-thin scrollbar-thumb-[#E5C378]/40">
            {/* 玩家卡片 */}
            <button
              onClick={() => setTargetId('player')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all shrink-0 cursor-pointer min-w-[135px] border shadow-xs ${
                targetId === 'player'
                  ? 'bg-gradient-to-r from-[#E5C378] to-[#C5A059] text-[#2C1D18] border-[#FAF3E0] shadow-md ring-2 ring-[#E5C378]/60 scale-[1.02]'
                  : 'bg-[#FCFBF7] border-[#E8D9C5] text-[#3D2A24] hover:bg-[#FAF3E0]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 border ${
                targetId === 'player' 
                  ? 'bg-[#FAF3E0] text-[#3D2A24] border-[#D4AF37]' 
                  : 'bg-[#F3E8D8] text-[#5C4238] border-[#E8D9C5]'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-xs leading-tight truncate max-w-[85px]">
                  我 (玩家)
                </div>
                <div className="text-[10px] mt-0.5 font-medium opacity-80">
                  ⭐ 主角本人
                </div>
              </div>
            </button>

            {/* AI 角色列表卡片 */}
            {npcs.map(npc => {
              const isSelected = targetId === npc.id;
              const isChild = npc.relationship === 'child' || npc.customization?.bodyType === 'child';
              const isMarried = npc.relationship === 'married';
              const isFamily = npc.relationship === 'family';

              return (
                <button
                  key={npc.id}
                  onClick={() => setTargetId(npc.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all shrink-0 cursor-pointer min-w-[145px] border shadow-xs ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#F4B8C7] to-[#E07A93] text-white border-rose-200 shadow-md ring-2 ring-pink-300/60 scale-[1.02]'
                      : 'bg-[#FCFBF7] border-[#E8D9C5] text-[#3D2A24] hover:bg-[#FAF3E0]'
                  }`}
                >
                  <img
                    src={npc.contact?.avatar || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=100'}
                    alt={npc.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                  />
                  <div className="text-left">
                    <div className="font-bold text-xs leading-tight truncate max-w-[85px]">
                      {npc.name}
                    </div>
                    <div className="text-[10px] mt-0.5 font-medium opacity-90">
                      {isChild ? '🧒 孩子' : isMarried ? '💕 伴侣' : isFamily ? '🏡 亲人' : '💖 AI 好友'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2.2 实时预览展台 + 快速预设 */}
        <div className="bg-gradient-to-b from-[#F9F0E1] to-[#F3E5D0] border border-[#E5C378]/50 rounded-2xl p-3 flex items-center justify-between shadow-sm gap-3">
          <div className="relative flex flex-col items-center justify-center bg-[#FAF5EE] rounded-2xl p-2 border-2 border-[#D4AF37]/60 shadow-md w-36 h-38 shrink-0">
            <canvas
              ref={previewCanvasRef}
              width={120}
              height={140}
              className="w-32 h-32 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <button
              onClick={rotateFacing}
              className="absolute bottom-1.5 right-1.5 p-1.5 bg-[#3D2A24]/80 hover:bg-[#3D2A24] text-amber-200 rounded-xl cursor-pointer transition-all active:scale-90 shadow-sm flex items-center gap-1 text-[10px]"
              title="点击旋转视角"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <span className="absolute top-1.5 left-2 text-[9px] font-bold text-[#5C4238] bg-[#E8D9C5]/90 px-2 py-0.5 rounded-md shadow-2xs">
              {facing === 'down' ? '正面' : facing === 'up' ? '背面' : facing === 'left' ? '左侧' : '右侧'}
            </span>
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3D2A24]">基础性别：</span>
              <div className="flex bg-[#FCFBF7] rounded-xl p-0.5 border border-[#E5C378]/50 shadow-2xs">
                <button
                  onClick={() => setCurrentCustom(prev => ({ ...prev, gender: 'female' }))}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    currentGender === 'female'
                      ? 'bg-[#E07A93] text-white shadow-xs'
                      : 'text-[#8C6B5E] hover:text-[#3D2A24]'
                  }`}
                >
                  ♀ 淑女
                </button>
                <button
                  onClick={() => setCurrentCustom(prev => ({ ...prev, gender: 'male' }))}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    currentGender === 'male'
                      ? 'bg-[#7EA8E6] text-white shadow-xs'
                      : 'text-[#8C6B5E] hover:text-[#3D2A24]'
                  }`}
                >
                  ♂ 绅士
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3D2A24]">角色体型：</span>
              <div className="flex bg-[#FCFBF7] rounded-xl p-0.5 border border-[#E5C378]/50 shadow-2xs">
                <button
                  onClick={() => setCurrentCustom(prev => ({ ...prev, bodyType: 'adult' }))}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    (currentCustom.bodyType || (currentTarget.relationship === 'child' ? 'child' : 'adult')) === 'adult'
                      ? 'bg-[#C5A059] text-white shadow-xs'
                      : 'text-[#8C6B5E] hover:text-[#3D2A24]'
                  }`}
                >
                  🧍 成人
                </button>
                <button
                  onClick={() => setCurrentCustom(prev => ({ ...prev, bodyType: 'child' }))}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    (currentCustom.bodyType || (currentTarget.relationship === 'child' ? 'child' : 'adult')) === 'child'
                      ? 'bg-[#F59E0B] text-white shadow-xs'
                      : 'text-[#8C6B5E] hover:text-[#3D2A24]'
                  }`}
                >
                  🧒 小孩
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-[#7A5C50] font-bold">✨ 精选预设推荐：</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => applyPreset('rococo_princess')}
                  className="px-2 py-1 bg-[#FCFBF7] hover:bg-[#FDF2F4] border border-[#F4B8C7] text-[#C44360] rounded-xl text-xs font-bold cursor-pointer truncate text-center shadow-2xs transition-all active:scale-95"
                >
                  👑 蓬蓬裙公主
                </button>
                <button
                  onClick={() => applyPreset('rococo_prince')}
                  className="px-2 py-1 bg-[#FCFBF7] hover:bg-[#F0F7FF] border border-[#A3C7F7] text-[#2B548F] rounded-xl text-xs font-bold cursor-pointer truncate text-center shadow-2xs transition-all active:scale-95"
                >
                  爵位贵公子
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2.3 分类 Tab 选项卡（横向滚动，极佳体验） */}
        <div className="sticky top-0 z-10 bg-[#FAF5EE] pt-1 pb-2 border-b border-[#E5C378]/40 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[#E5C378]/50">
          {[
            { id: 'hair', name: '发型', icon: Scissors },
            { id: 'body', name: '体型', icon: User },
            { id: 'color', name: '发色', icon: Palette },
            { id: 'eyes', name: '瞳色', icon: Eye },
            { id: 'outfit', name: '服装', icon: Smile },
            { id: 'skin', name: '肤色', icon: Sparkle },
            { id: 'accessory', name: '配饰', icon: Sparkles },
            { id: 'custom_draw', name: '🎨 像素自绘', icon: Paintbrush }
          ].map(tab => {
            const IconComp = tab.icon;
            const isSelected = category === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id as any)}
                className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#E5C378] to-[#C5A059] text-[#2C1D18] border-[#FAF3E0] shadow-md scale-[1.02]'
                    : 'bg-[#FCFBF7] border-[#E8D9C5] text-[#6C5348] hover:bg-[#F3E8D8]'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* 2.4 全开放无限制滚动选项内容区 */}
        <div className="pb-8 space-y-3">
          {/* 体型选择 */}
          {category === 'body' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'adult',
                  name: '🧍 标准成人体型',
                  desc: '标准像素比例，高挑挺拔，适合主角与成年角色'
                },
                {
                  id: 'child',
                  name: '🧒 Q萌小孩体型',
                  desc: '头部更精巧、身材更矮萌，专为儿童设计 (小头矮身材)'
                }
              ].map(b => {
                const isSelected = (currentCustom.bodyType || (currentTarget.relationship === 'child' ? 'child' : 'adult')) === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setCurrentCustom(prev => ({ ...prev, bodyType: b.id as 'adult' | 'child' }))}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF3E0] border-[#D4AF37] shadow-sm ring-2 ring-[#D4AF37]/60 scale-[1.01]'
                        : 'bg-[#FCFBF7] border-[#E8D9C5] hover:bg-[#FAF3E0]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-[#3D2A24] flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#C5A059]" />
                        <span>{b.name}</span>
                      </div>
                      <div className="text-[11px] text-[#7A5C50] mt-1">{b.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#C5A059] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 发型选择 */}
          {category === 'hair' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentHairstyles.map(h => {
                const isSelected = (currentCustom.hairstyle || 'default') === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setCurrentCustom(prev => ({ ...prev, hairstyle: h.id }))}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF3E0] border-[#D4AF37] shadow-sm ring-2 ring-[#D4AF37]/60'
                        : 'bg-[#FCFBF7] border-[#E8D9C5] hover:bg-[#FAF3E0]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-[#3D2A24] flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-[#C5A059]" />
                        <span>{h.name}</span>
                      </div>
                      <div className="text-[11px] text-[#7A5C50] mt-1">{h.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#C5A059] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 发色 */}
          {category === 'color' && (
            <div className="grid grid-cols-2 gap-2">
              {HAIR_COLORS.map(c => {
                const isSelected = (currentCustom.hairColor || '#5c3d2e') === c.color;
                return (
                  <button
                    key={c.color}
                    onClick={() => setCurrentCustom(prev => ({ ...prev, hairColor: c.color, hairHighlight: c.highlight }))}
                    className={`p-2 bg-[#FCFBF7] rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37] shadow-xs ring-2 ring-[#D4AF37]/50 bg-[#FAF3E0]'
                        : 'border-[#E8D9C5] hover:bg-[#FAF3E0]'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-black/20 shadow-inner shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-bold text-[#3D2A24] truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 瞳色 */}
          {category === 'eyes' && (
            <div className="grid grid-cols-2 gap-2">
              {EYE_COLORS.map(e => {
                const isSelected = (currentCustom.eyeColor || (currentGender === 'female' ? '#3d2817' : '#111827')) === e.color;
                return (
                  <button
                    key={e.color}
                    onClick={() => setCurrentCustom(prev => ({ ...prev, eyeColor: e.color }))}
                    className={`p-2.5 bg-[#FCFBF7] rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37] shadow-xs ring-2 ring-[#D4AF37]/50 bg-[#FAF3E0]'
                        : 'border-[#E8D9C5] hover:bg-[#FAF3E0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md shrink-0 flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: e.color }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 left-1 opacity-90" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-[#3D2A24] truncate">{e.name}</div>
                        <div className="text-[9px] text-[#8C6B5E] truncate">{e.desc}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A059] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 服装 */}
          {category === 'outfit' && (
            <div className="grid grid-cols-2 gap-2">
              {OUTFIT_COLORS.map(c => {
                const isSelected = (currentCustom.clothColor || '#e8a5b8') === c.color;
                return (
                  <button
                    key={c.color}
                    onClick={() => setCurrentCustom(prev => ({ ...prev, clothColor: c.color }))}
                    className={`p-2 bg-[#FCFBF7] rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37] shadow-xs ring-2 ring-[#D4AF37]/50 bg-[#FAF3E0]'
                        : 'border-[#E8D9C5] hover:bg-[#FAF3E0]'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-black/20 shadow-inner shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-bold text-[#3D2A24] truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 肤色 */}
          {category === 'skin' && (
            <div className="grid grid-cols-2 gap-2">
              {SKIN_TONES.map(s => {
                const isSelected = (currentCustom.skinTone || 'fair') === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentCustom(prev => ({ ...prev, skinTone: s.id }))}
                    className={`p-2.5 bg-[#FCFBF7] rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37] shadow-xs ring-2 ring-[#D4AF37]/50 bg-[#FAF3E0]'
                        : 'border-[#E8D9C5] hover:bg-[#FAF3E0]'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-amber-300 shadow-inner shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-xs font-bold text-[#3D2A24]">{s.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 配饰 */}
          {category === 'accessory' && (
            <div className="grid grid-cols-2 gap-2">
              {ACCESSORIES.map(a => {
                const isSelected = (currentCustom.accessory || 'none') === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setCurrentCustom(prev => ({ ...prev, accessory: a.id }))}
                    className={`p-2 bg-[#FCFBF7] rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37] shadow-xs ring-2 ring-[#D4AF37]/50 bg-[#FAF3E0]'
                        : 'border-[#E8D9C5] hover:bg-[#FAF3E0]'
                    }`}
                  >
                    <span className="text-lg">{a.icon}</span>
                    <span className="text-xs font-bold text-[#3D2A24] truncate">{a.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 🎨 玩家自由像素点图绘制 (在原本基础上上色、删减、添加像素块) */}
          {category === 'custom_draw' && (
            <div className="bg-[#FCFBF7] p-2.5 rounded-2xl border border-[#E8D9C5] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDrawTool('paint')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                      drawTool === 'paint'
                        ? 'bg-[#E5C378] text-[#2C1D18] shadow-xs'
                        : 'bg-[#F3E8D8] text-[#6C5348]'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>上色/新增像素</span>
                  </button>

                  <button
                    onClick={() => setDrawTool('erase')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                      drawTool === 'erase'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-[#F3E8D8] text-[#6C5348]'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>擦除像素块</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`p-1.5 rounded-xl border text-xs cursor-pointer ${
                      showGrid ? 'bg-[#FAF3E0] border-[#D4AF37] text-[#3D2A24]' : 'bg-[#F3E8D8] border-gray-300 text-gray-500'
                    }`}
                    title="切换像素网格显示"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={clearAllCustomPixels}
                    className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl border border-rose-200 text-xs cursor-pointer"
                    title="清空自绘像素"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 调色盘 */}
              {drawTool === 'paint' && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {PIXEL_PALETTE.map(c => (
                    <button
                      key={c}
                      onClick={() => setActiveColor(c)}
                      className={`w-6 h-6 rounded-full border border-black/20 shrink-0 cursor-pointer transition-all ${
                        activeColor === c ? 'ring-2 ring-[#D4AF37] scale-110 shadow-md' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => setActiveColor(e.target.value)}
                    className="w-6 h-6 rounded-full border-0 p-0 cursor-pointer shrink-0"
                    title="自定义 Hex 颜色"
                  />
                </div>
              )}

              {/* 像素绘图互动网格画布 */}
              <div className="flex flex-col items-center justify-center bg-[#F3E8D8] p-2 rounded-xl border border-[#E5C378]/40 shadow-inner">
                <p className="text-[10px] text-[#7A5C50] mb-1 font-medium">
                  💡 在 32x48 像素网格上点击或拖拽，可实时添加、擦除或修饰人物像素!
                </p>
                <canvas
                  ref={pixelCanvasRef}
                  width={256}
                  height={384}
                  className="w-48 h-72 rounded border-2 border-[#D4AF37] cursor-crosshair shadow-md bg-white touch-none"
                  style={{ imageRendering: 'pixelated' }}
                  onMouseDown={(e) => {
                    setIsMouseDown(true);
                    handlePixelCanvasInteraction(e);
                  }}
                  onMouseMove={(e) => {
                    if (isMouseDown) handlePixelCanvasInteraction(e);
                  }}
                  onMouseUp={() => setIsMouseDown(false)}
                  onMouseLeave={() => setIsMouseDown(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. 底部固定 Sticky 保存与应用控制栏 */}
      <div className="shrink-0 bg-[#FAF5EE]/95 backdrop-blur-md px-4 py-3 border-t-2 border-[#E5C378]/40 flex items-center gap-3 shadow-lg z-20">
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-[#F3E8D8] hover:bg-[#E8D9C5] text-[#3D2A24] font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer border border-[#E8D9C5]"
        >
          取消返回
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 bg-gradient-to-r from-[#E5C378] via-[#D4AF37] to-[#C5A059] hover:from-[#D4AF37] hover:to-[#B38F2D] text-[#2C1D18] font-bold text-xs sm:text-sm rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-[#FAF3E0]"
        >
          <Check className="w-4 h-4" />
          <span>保存全套装扮</span>
        </button>
      </div>
    </div>
  );
};
