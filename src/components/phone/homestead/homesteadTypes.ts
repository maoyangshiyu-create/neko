import { Contact } from '../../../types/phone';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type HomeType = 'marital' | 'family';

export interface Position {
  x: number; // 像素坐标 X
  y: number; // 像素坐标 Y
}

export interface GridCoord {
  gx: number; // 瓦片网格 X (0..19)
  gy: number; // 瓦片网格 Y (0..13)
}

export type FurnitureType =
  | 'sofa'
  | 'coffee_machine'
  | 'bookshelf'
  | 'crib'
  | 'double_bed'
  | 'single_bed'
  | 'dining_table'
  | 'tea_table'
  | 'tv_cabinet'
  | 'kitchen_stove'
  | 'family_photo'
  | 'bathtub';

export interface Furniture {
  id: string;
  type: FurnitureType;
  name: string;
  gx: number;
  gy: number;
  widthTiles: number;
  heightTiles: number;
  color: string;
  interactLabel: string;
}

export type HairstyleType =
  | 'default'
  | 'long_wavy'
  | 'twin_tails'
  | 'short_bob'
  | 'ponytail'
  | 'clean_short'
  | 'anime_messy';

export type AccessoryType =
  | 'none'
  | 'hairpin'
  | 'cat_ears'
  | 'glasses'
  | 'bow'
  | 'beret'
  | 'flower';

export type SkinToneType = 'fair' | 'natural' | 'warm' | 'tanned';

export interface AvatarCustomization {
  gender?: 'male' | 'female';
  bodyType?: 'adult' | 'child';
  hairstyle?: HairstyleType;
  hairColor?: string;
  hairHighlight?: string;
  eyeColor?: string;
  skinTone?: SkinToneType;
  clothColor?: string;
  pantsColor?: string;
  accessory?: AccessoryType;
  blush?: boolean;
  /** 玩家自定义 32x32 像素画块 ("x,y" => hex色值或 "transparent") */
  customPixels?: Record<string, string>;
}

export type IntimacyActionType = 'kiss' | 'hand' | 'hug' | 'talk';

export interface IntimacyParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  type: 'heart' | 'sparkle' | 'kiss';
  color: string;
}

export type NpcActivityStatus = 'home' | 'sleeping' | 'outside';

export interface CharacterState {
  id: string;
  name: string;
  isPlayer: boolean;
  gender: 'male' | 'female';
  relationship?: string;
  x: number; // 像素坐标
  y: number; // 像素坐标
  targetX?: number;
  targetY?: number;
  facing: Direction;
  clothColor: string;
  contact?: Contact;
  moveTimer?: number;
  customization?: AvatarCustomization;
  // AI 行程与动态状态
  activityStatus?: NpcActivityStatus;
  isOutside?: boolean;       // 是否在外面活动/出差/晨跑
  isSleepingOnBed?: boolean; // 是否躺在床上面睡觉
  isBathing?: boolean;       // 是否在洗澡/泡澡中（脱衣打马赛克）
}

export interface HomesteadSaveData {
  player: {
    x: number;
    y: number;
    facing: Direction;
  };
  npcs: {
    id: string;
    x: number;
    y: number;
    facing: Direction;
  }[];
  customResidents?: string[]; // 自定义入驻的联系人 ID 列表
  version: number;
}

export interface InteractionPrompt {
  type: 'furniture' | 'npc';
  id: string;
  name: string;
  x: number;
  y: number;
  label: string;
  data?: any;
}
