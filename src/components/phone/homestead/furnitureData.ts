import { Furniture, HomeType } from './homesteadTypes';

export const MAP_COLS = 20;
export const MAP_ROWS = 14;
export const TILE_SIZE = 32;
export const CANVAS_WIDTH = MAP_COLS * TILE_SIZE; // 640
export const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE; // 448

/**
 * 墙壁与内墙隔断碰撞检测
 * 地图尺寸 20 x 14 瓦片
 * 4 个功能房间区：
 * 1. 🛏️ 卧室 (Top-Left: c: 1..9, r: 1..6)
 * 2. 📖 书房 (Top-Right: c: 11..18, r: 1..6)
 * 3. 🍳 厨房与餐厅 (Bottom-Left: c: 1..9, r: 8..12)
 * 4. 🛋️ 客厅 (Bottom-Right: c: 11..18, r: 8..12)
 */
export function isWallTile(c: number, r: number): boolean {
  // 1. 最外围四壁
  if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
    return true;
  }

  // 2. 垂直中分隔墙 (c = 10)，留 r = 5, 6, 7, 8 作为宽敞的中廊拱门
  if (c === 10 && (r < 5 || r > 8)) {
    return true;
  }

  // 3. 水平中分隔墙 (r = 7)，留 c = 4..6 (卧室-厨房门), c = 9..11 (中廊通关), c = 13..15 (书房-客厅门) 作为宽大走廊过道
  if (r === 7) {
    const isDoorPass = (c >= 4 && c <= 6) || (c >= 9 && c <= 11) || (c >= 13 && c <= 15);
    if (!isDoorPass) return true;
  }

  return false;
}

// 婚后小家的家具布局 (带四大隔离功能房间)
export const MARITAL_FURNITURES: Furniture[] = [
  // 1. 卧室 (Master Bedroom)
  {
    id: 'double_bed_1',
    type: 'double_bed',
    name: '珍珠雕花双人大床',
    gx: 2,
    gy: 2,
    widthTiles: 3,
    heightTiles: 2,
    color: '#FAF3E0',
    interactLabel: '主卧大床休息'
  },
  {
    id: 'crib_1',
    type: 'crib',
    name: '摇篮婴儿床',
    gx: 6,
    gy: 2,
    widthTiles: 2,
    heightTiles: 2,
    color: '#d9a8b8',
    interactLabel: '查看宝宝床'
  },
  {
    id: 'bathtub_1',
    type: 'bathtub',
    name: '云朵珍珠欧式大浴缸',
    gx: 6,
    gy: 4,
    widthTiles: 2,
    heightTiles: 2,
    color: '#e0f2fe',
    interactLabel: '一起去洗澡'
  },
  // 2. 书房 (Study)
  {
    id: 'bookshelf_1',
    type: 'bookshelf',
    name: '原木实木书架',
    gx: 12,
    gy: 1,
    widthTiles: 2,
    heightTiles: 1,
    color: '#8a6b4a',
    interactLabel: '翻阅书籍'
  },
  {
    id: 'family_photo_1',
    type: 'family_photo',
    name: '甜蜜全家福相框',
    gx: 16,
    gy: 1,
    widthTiles: 2,
    heightTiles: 1,
    color: '#d4af37',
    interactLabel: '瞻看相框'
  },
  {
    id: 'coffee_machine_1',
    type: 'coffee_machine',
    name: '意式咖啡机书桌',
    gx: 15,
    gy: 3,
    widthTiles: 2,
    heightTiles: 2,
    color: '#5c5450',
    interactLabel: '煮咖啡品茗'
  },
  // 3. 厨房与餐厅 (Kitchen & Dining)
  {
    id: 'kitchen_stove_1',
    type: 'kitchen_stove',
    name: '温馨厨房灶台',
    gx: 1,
    gy: 8,
    widthTiles: 2,
    heightTiles: 2,
    color: '#718096',
    interactLabel: '做家常美味'
  },
  {
    id: 'dining_table_1',
    type: 'dining_table',
    name: '浪漫双人餐桌',
    gx: 5,
    gy: 9,
    widthTiles: 2,
    heightTiles: 2,
    color: '#a37057',
    interactLabel: '共进晚餐'
  },
  // 4. 客厅 (Living Room)
  {
    id: 'sofa_1',
    type: 'sofa',
    name: '温馨布艺沙发',
    gx: 12,
    gy: 9,
    widthTiles: 3,
    heightTiles: 2,
    color: '#b28684',
    interactLabel: '坐下相拥'
  },
  {
    id: 'tv_cabinet_1',
    type: 'tv_cabinet',
    name: '复古彩色电视机',
    gx: 12,
    gy: 11,
    widthTiles: 3,
    heightTiles: 1,
    color: '#4a5568',
    interactLabel: '看电视'
  }
];

// 亲人小筑的家具布局
export const FAMILY_FURNITURES: Furniture[] = [
  // 卧室
  {
    id: 'double_bed_family',
    type: 'double_bed',
    name: '温馨大双人床',
    gx: 2,
    gy: 2,
    widthTiles: 3,
    heightTiles: 2,
    color: '#e2d5c3',
    interactLabel: '大床休息'
  },
  {
    id: 'single_bed_family',
    type: 'single_bed',
    name: '舒适单人木床',
    gx: 6,
    gy: 2,
    widthTiles: 2,
    heightTiles: 2,
    color: '#7ea8e6',
    interactLabel: '单人床休息'
  },
  {
    id: 'bathtub_family',
    type: 'bathtub',
    name: '云朵珍珠欧式大浴缸',
    gx: 6,
    gy: 4,
    widthTiles: 2,
    heightTiles: 2,
    color: '#e0f2fe',
    interactLabel: '一起去洗澡'
  },
  // 书房
  {
    id: 'bookshelf_family',
    type: 'bookshelf',
    name: '古朴实木书柜',
    gx: 12,
    gy: 1,
    widthTiles: 2,
    heightTiles: 2,
    color: '#654321',
    interactLabel: '翻阅老相册'
  },
  {
    id: 'family_photo_1',
    type: 'family_photo',
    name: '温馨全家福相框',
    gx: 16,
    gy: 1,
    widthTiles: 2,
    heightTiles: 1,
    color: '#d4af37',
    interactLabel: '瞻看全家福'
  },
  // 厨房与餐桌
  {
    id: 'kitchen_stove_1',
    type: 'kitchen_stove',
    name: '温馨厨房灶台',
    gx: 1,
    gy: 8,
    widthTiles: 2,
    heightTiles: 2,
    color: '#718096',
    interactLabel: '煲靓汤做家常菜'
  },
  {
    id: 'tea_table_1',
    type: 'tea_table',
    name: '实木八仙大圆桌',
    gx: 5,
    gy: 9,
    widthTiles: 3,
    heightTiles: 3,
    color: '#8b5a2b',
    interactLabel: '喝茶唠家常'
  },
  // 客厅
  {
    id: 'sofa_family',
    type: 'sofa',
    name: '舒适三人沙发',
    gx: 12,
    gy: 9,
    widthTiles: 3,
    heightTiles: 2,
    color: '#8c7355',
    interactLabel: '沙发聊天'
  },
  {
    id: 'tv_cabinet_1',
    type: 'tv_cabinet',
    name: '复古彩色电视机',
    gx: 12,
    gy: 11,
    widthTiles: 3,
    heightTiles: 1,
    color: '#4a5568',
    interactLabel: '全家看电视'
  }
];

export const HOME_CONFIGS: Record<HomeType, {
  name: string;
  tag: string;
  floorColor: string;
  wallColor: string;
  furnitures: Furniture[];
}> = {
  marital: {
    name: '婚后爱巢',
    tag: '玫瑰爱巢',
    floorColor: '#F3E8D8',
    wallColor: '#E8A5B8',
    furnitures: MARITAL_FURNITURES
  },
  family: {
    name: '亲人小筑',
    tag: '粉蓝天鹅小馆',
    floorColor: '#EFE4D3',
    wallColor: '#A3C7F7',
    furnitures: FAMILY_FURNITURES
  }
};
