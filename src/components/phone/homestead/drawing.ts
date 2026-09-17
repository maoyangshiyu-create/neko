import { Direction, Furniture, CharacterState, AvatarCustomization, IntimacyParticle, SkinToneType } from './homesteadTypes';
import { TILE_SIZE } from './furnitureData';

/**
 * 绘制单个地图瓦片
 */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  color: string,
  isWall: boolean = false
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, tileSize, tileSize);

  if (isWall) {
    // 墙壁顶部柔和高光与底部沉淀
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x, y, tileSize, 4);

    // 洛可可金箔踢脚线 / 雕花压条
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(x, y + tileSize - 4, tileSize, 3);
    ctx.fillStyle = '#FAF3E0';
    ctx.fillRect(x, y + tileSize - 1, tileSize, 1);

    // 墙面欧式壁纸纹理
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
  } else {
    // 洛可可象牙拼花地板缝线
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
  }
}

/**
 * 绘制 4 个独立房间的水印地标
 */
export function drawRoomWatermarks(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. 🛏️ 卧室 (Top-Left)
  ctx.fillStyle = 'rgba(196, 67, 96, 0.35)';
  ctx.fillText('🛏️ 卧室 (Bedroom)', 5 * TILE_SIZE, 5.5 * TILE_SIZE);

  // 2. 📖 书房 (Top-Right)
  ctx.fillStyle = 'rgba(43, 84, 143, 0.35)';
  ctx.fillText('📖 书房 (Study)', 15 * TILE_SIZE, 5.5 * TILE_SIZE);

  // 3. 🍳 厨房与餐厅 (Bottom-Left)
  ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
  ctx.fillText('🍳 厨房餐厅', 5 * TILE_SIZE, 12.2 * TILE_SIZE);

  // 4. 🛋️ 休闲客厅 (Bottom-Right)
  ctx.fillStyle = 'rgba(140, 107, 94, 0.35)';
  ctx.fillText('🛋️ 休闲客厅', 15 * TILE_SIZE, 12.2 * TILE_SIZE);

  ctx.restore();
}

/**
 * 获取肤色 Hex
 */
function getSkinTone(tone?: SkinToneType): string {
  switch (tone) {
    case 'fair':
      return '#fff2e8'; // 凝脂冷白
    case 'natural':
      return '#fdeee2'; // 自然暖白
    case 'warm':
      return '#f5dfcc'; // 温暖柔杏
    case 'tanned':
      return '#e8cbb0'; // 健康小麦
    default:
      return '#fff2e8';
  }
}

/**
 * 计算发色高光辅助色
 */
function getHairHighlight(hairColor: string, customHighlight?: string): string {
  if (customHighlight) return customHighlight;
  // 简易高光提亮
  if (hairColor.startsWith('#') && hairColor.length === 7) {
    const r = Math.min(255, parseInt(hairColor.slice(1, 3), 16) + 45);
    const g = Math.min(255, parseInt(hairColor.slice(3, 5), 16) + 45);
    const b = Math.min(255, parseInt(hairColor.slice(5, 7), 16) + 45);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return 'rgba(255, 255, 255, 0.25)';
}

/**
 * 计算瞳色高光/虹膜反光辅助色
 */
function getEyeHighlight(eyeColor?: string): string {
  if (!eyeColor) return '#a88d80';
  if (eyeColor.startsWith('#') && eyeColor.length === 7) {
    const r = Math.min(255, parseInt(eyeColor.slice(1, 3), 16) + 70);
    const g = Math.min(255, parseInt(eyeColor.slice(3, 5), 16) + 70);
    const b = Math.min(255, parseInt(eyeColor.slice(5, 7), 16) + 70);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return 'rgba(255, 255, 255, 0.4)';
}

/**
 * 绘制配饰 (发饰、猫耳、眼镜、蝴蝶结、贝雷帽、花朵)
 */
function drawAccessory(
  ctx: CanvasRenderingContext2D,
  facing: Direction,
  customization?: AvatarCustomization,
  gender: 'male' | 'female' = 'female'
): void {
  const acc = customization?.accessory;
  if (!acc || acc === 'none') return;

  ctx.save();

  if (acc === 'hairpin') {
    // 珍珠香槟金发夹
    ctx.fillStyle = '#d4af37';
    if (facing === 'down') {
      ctx.fillRect(5, 5, 5, 4);
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(6, 6, 2, 2);
    } else if (facing === 'up') {
      ctx.fillRect(13, 8, 6, 4);
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(15, 9, 2, 2);
    } else if (facing === 'left') {
      ctx.fillRect(13, 6, 4, 4);
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(14, 7, 2, 2);
    } else if (facing === 'right') {
      ctx.fillRect(12, 6, 4, 4);
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(13, 7, 2, 2);
    }
  } else if (acc === 'cat_ears') {
    // 萌系猫耳
    const earColor = customization?.hairColor || (gender === 'female' ? '#5c3d2e' : '#1f242d');
    const innerEar = '#f472b6';
    if (facing === 'down' || facing === 'up') {
      // 左耳
      ctx.fillStyle = earColor;
      ctx.beginPath();
      ctx.moveTo(5, 4);
      ctx.lineTo(8, -4);
      ctx.lineTo(12, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.moveTo(6.5, 3);
      ctx.lineTo(8, -1.5);
      ctx.lineTo(10.5, 3);
      ctx.closePath();
      ctx.fill();

      // 右耳
      ctx.fillStyle = earColor;
      ctx.beginPath();
      ctx.moveTo(20, 4);
      ctx.lineTo(24, -4);
      ctx.lineTo(27, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.moveTo(21.5, 3);
      ctx.lineTo(24, -1.5);
      ctx.lineTo(25.5, 3);
      ctx.closePath();
      ctx.fill();
    } else if (facing === 'left') {
      ctx.fillStyle = earColor;
      ctx.beginPath();
      ctx.moveTo(8, 4);
      ctx.lineTo(12, -4);
      ctx.lineTo(16, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.moveTo(9.5, 3);
      ctx.lineTo(12, -1.5);
      ctx.lineTo(14.5, 3);
      ctx.closePath();
      ctx.fill();
    } else if (facing === 'right') {
      ctx.fillStyle = earColor;
      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.lineTo(20, -4);
      ctx.lineTo(24, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.moveTo(17.5, 3);
      ctx.lineTo(20, -1.5);
      ctx.lineTo(22.5, 3);
      ctx.closePath();
      ctx.fill();
    }
  } else if (acc === 'glasses') {
    // 斯文镜框
    if (facing === 'down') {
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.2;
      // 左镜框
      ctx.strokeRect(8, 12, 6, 5);
      // 右镜框
      ctx.strokeRect(18, 12, 6, 5);
      // 中间鼻梁
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(18, 14);
      ctx.stroke();
      // 镜片微光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(9, 13, 2, 2);
      ctx.fillRect(19, 13, 2, 2);
    } else if (facing === 'left') {
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(6, 12, 5, 5);
      ctx.beginPath();
      ctx.moveTo(11, 14);
      ctx.lineTo(15, 13);
      ctx.stroke();
    } else if (facing === 'right') {
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(21, 12, 5, 5);
      ctx.beginPath();
      ctx.moveTo(21, 14);
      ctx.lineTo(17, 13);
      ctx.stroke();
    }
  } else if (acc === 'bow') {
    // 丝绒缎带大蝴蝶结
    const bowColor = '#e11d48';
    if (facing === 'down' || facing === 'up') {
      ctx.fillStyle = bowColor;
      ctx.fillRect(14, 2, 4, 4); // 结心
      ctx.fillRect(9, 1, 5, 5);  // 左翼
      ctx.fillRect(18, 1, 5, 5); // 右翼
      ctx.fillStyle = '#be123c';
      ctx.fillRect(11, 6, 3, 4); // 飘带
      ctx.fillRect(18, 6, 3, 4);
    } else if (facing === 'left') {
      ctx.fillStyle = bowColor;
      ctx.fillRect(14, 2, 6, 5);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(16, 6, 3, 4);
    } else if (facing === 'right') {
      ctx.fillStyle = bowColor;
      ctx.fillRect(12, 2, 6, 5);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(13, 6, 3, 4);
    }
  } else if (acc === 'beret') {
    // 复古贝雷帽
    ctx.fillStyle = '#475569';
    if (facing === 'down' || facing === 'up') {
      ctx.beginPath();
      ctx.ellipse(16, 4, 14, 6, -0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(15, -2, 2, 3); // 顶端小揪揪
    } else if (facing === 'left') {
      ctx.beginPath();
      ctx.ellipse(14, 4, 13, 6, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(13, -2, 2, 3);
    } else if (facing === 'right') {
      ctx.beginPath();
      ctx.ellipse(18, 4, 13, 6, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(17, -2, 2, 3);
    }
  } else if (acc === 'flower') {
    // 栀子花/小花饰
    ctx.fillStyle = '#ffffff';
    const fx = facing === 'left' ? 14 : (facing === 'right' ? 13 : 23);
    const fy = 6;
    ctx.beginPath();
    ctx.arc(fx - 2, fy, 2, 0, Math.PI * 2);
    ctx.arc(fx + 2, fy, 2, 0, Math.PI * 2);
    ctx.arc(fx, fy - 2, 2, 0, Math.PI * 2);
    ctx.arc(fx, fy + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 绘制角色头顶名字标签
 */
function drawNameTag(
  ctx: CanvasRenderingContext2D,
  name: string,
  isPlayer: boolean,
  gender?: 'male' | 'female',
  relationship?: string,
  isChildBody?: boolean
): void {
  ctx.save();
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const isChild = isChildBody || relationship === 'child';
  const genderIcon = isChild ? (gender === 'female' ? '👧' : '👦') : (gender === 'female' ? '♀' : '♂');
  const displayName = isPlayer ? (name ? `★ ${name}` : '★ 我') : `${genderIcon} ${name}`;

  const metrics = ctx.measureText(displayName);
  const tagWidth = Math.max(46, metrics.width + 16);
  const tagHeight = 17;
  const tagX = 16 - tagWidth / 2;
  const tagY = isChild ? -2 : -15; // 避开头部发饰与缩放高度

  // 1. 标签背景 (圆角胶囊与高对比半透阴影)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 8.5);
  ctx.fill();

  // 2. 边框着色
  let borderColor = '#38bdf8';
  if (isPlayer) {
    borderColor = '#38bdf8';
  } else if (isChild) {
    borderColor = '#f59e0b'; // 温暖星光橙
  } else if (relationship === 'married') {
    borderColor = '#fb7185';
  } else if (relationship === 'engaged') {
    borderColor = '#f472b6';
  } else if (relationship === 'dating') {
    borderColor = '#c084fc';
  } else if (gender === 'female') {
    borderColor = '#fb7185';
  } else {
    borderColor = '#38bdf8';
  }

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 3. 名字文本
  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayName, 16, tagY + tagHeight / 2);

  // 4. 小指示标
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  ctx.moveTo(14, tagY + tagHeight);
  ctx.lineTo(18, tagY + tagHeight);
  ctx.lineTo(16, tagY + tagHeight + 3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 绘制身体打马赛克效果 (像素遮挡 censorship mosaic)
 */
function drawMosaicOverlay(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  ctx.save();
  const blockSize = 3.5;
  const cols = Math.ceil(width / blockSize);
  const rows = Math.ceil(height / blockSize);

  const palette = [
    '#fff2e8', '#fdeee2', '#f5dfcc', '#e8cbb0', // 肤色
    '#fbcfe8', '#f472b6', '#fda4af',             // 浅粉
    '#e0f2fe', '#bae6fd',                      // 泡沫明蓝
    '#ffffff', '#fef08a'                       // 高光
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = startX + c * blockSize;
      const by = startY + r * blockSize;
      
      const hash = Math.abs(Math.sin((c + startX) * 12.9898 + (r + startY) * 78.233) * 43758.5453);
      const colorIdx = Math.floor(hash * palette.length) % palette.length;
      
      ctx.fillStyle = palette[colorIdx];
      ctx.fillRect(bx, by, blockSize, blockSize);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bx, by, blockSize, blockSize);
    }
  }
  ctx.restore();
}

/**
 * 绘制女性像素小人 (支持发型自定义、发色、肤色与配饰)
 */
function drawFemaleCharacter(
  ctx: CanvasRenderingContext2D,
  facing: Direction,
  clothColor: string,
  customization?: AvatarCustomization,
  isBathing?: boolean
): void {
  const hairColor = customization?.hairColor || '#5c3d2e';
  const hairHighlight = getHairHighlight(hairColor, customization?.hairHighlight);
  const eyeColor = customization?.eyeColor || '#2c1e19';
  const eyeHighlight = getEyeHighlight(eyeColor);
  const skinColor = getSkinTone(customization?.skinTone);
  const blushColor = 'rgba(235, 140, 150, 0.65)';
  const skirtColor = customization?.clothColor || clothColor;
  const hairstyle = customization?.hairstyle || 'default';

  // 1. 身体阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(16, 45, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isBathing) {
    // 泡澡中：去除常规衣物，绘制裸肌身躯 + 像素打马赛克 + 飘散水汽与气泡
    ctx.fillStyle = skinColor;
    ctx.fillRect(9, 21, 14, 18);
    ctx.fillRect(6, 23, 3, 9);
    ctx.fillRect(23, 23, 3, 9);
    ctx.fillRect(11, 39, 4, 5);
    ctx.fillRect(17, 39, 4, 5);

    // 头部皮肤与五官
    ctx.fillRect(8, 7, 16, 15);
    ctx.fillStyle = hairColor;
    ctx.fillRect(5, 3, 22, 8);
    ctx.fillRect(4, 7, 5, 14);
    ctx.fillRect(23, 7, 5, 14);
    ctx.fillRect(8, 8, 16, 4);

    ctx.fillStyle = eyeColor;
    ctx.fillRect(9, 13, 4, 4);
    ctx.fillRect(19, 13, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 13, 2, 2);
    ctx.fillRect(19, 13, 2, 2);

    ctx.fillStyle = blushColor;
    ctx.fillRect(7, 17, 3.5, 2);
    ctx.fillRect(21.5, 17, 3.5, 2);

    // 像素打马赛克 censorship
    drawMosaicOverlay(ctx, 5, 20, 22, 22);

    // 水汽标与气泡
    ctx.font = '10px sans-serif';
    ctx.fillText('♨️', 1, -2);
    ctx.fillText('🫧', 24, -4);

    drawAccessory(ctx, facing, customization, 'female');
    return;
  }

  if (facing === 'down') {
    // 2. 长发后层 (波波头/双马尾等特殊处理)
    if (hairstyle === 'twin_tails') {
      // 双马尾后束
      ctx.fillStyle = hairColor;
      ctx.fillRect(1, 10, 6, 18);
      ctx.fillRect(25, 10, 6, 18);
      // 发绳
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(2, 9, 4, 3);
      ctx.fillRect(26, 9, 4, 3);
    } else if (hairstyle === 'ponytail') {
      // 单高马尾 (偏左或后束)
      ctx.fillStyle = hairColor;
      ctx.fillRect(24, 7, 7, 16);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(23, 6, 4, 3);
    } else if (hairstyle !== 'short_bob') {
      // 默认/优雅长发
      ctx.fillStyle = hairColor;
      ctx.fillRect(4, 10, 24, 20);
      ctx.fillRect(3, 14, 26, 14);
    }

    // 3. 头部皮肤
    ctx.fillStyle = skinColor;
    ctx.fillRect(8, 7, 16, 15);

    // 4. 前额刘海 & 侧发
    ctx.fillStyle = hairColor;
    ctx.fillRect(5, 3, 22, 8); // 蓬松头顶发量

    if (hairstyle === 'short_bob') {
      // 齐耳可爱短发包裹
      ctx.fillRect(4, 7, 5, 12);
      ctx.fillRect(23, 7, 5, 12);
    } else {
      ctx.fillRect(4, 7, 5, 17);  // 垂颊长发
      ctx.fillRect(23, 7, 5, 17);
    }

    ctx.fillRect(8, 8, 16, 4);  // 齐刘海
    ctx.fillRect(9, 11, 4, 2.5);
    ctx.fillRect(19, 11, 4, 2.5);

    // 头发高光
    ctx.fillStyle = hairHighlight;
    ctx.fillRect(8, 4, 16, 2);
    ctx.fillRect(5, 9, 2, 8);
    ctx.fillRect(25, 9, 2, 8);

    // 5. 萌系大眼睛
    ctx.fillStyle = eyeColor;
    ctx.fillRect(9, 13, 4, 4);
    ctx.fillRect(19, 13, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 13, 2, 2);
    ctx.fillRect(19, 13, 2, 2);
    ctx.fillStyle = eyeHighlight;
    ctx.fillRect(10, 15, 2, 2);
    ctx.fillRect(20, 15, 2, 2);

    // 腮红
    ctx.fillStyle = blushColor;
    ctx.fillRect(7, 17, 3.5, 2);
    ctx.fillRect(21.5, 17, 3.5, 2);

    // 小巧嘴巴
    ctx.fillStyle = '#c77d6d';
    ctx.fillRect(15, 18, 2, 1);

    // 6. 上衣 (修身精致，宽度10px，明显窄于头部22px)
    ctx.fillStyle = skirtColor;
    ctx.fillRect(11, 22, 10, 9);
    // 奶白领口
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(13, 22, 6, 4);
    // 领口深咖缎带纽扣
    ctx.fillStyle = '#4e3629';
    ctx.fillRect(15, 24, 2, 2);

    // 7. 可爱蓬蓬百褶短裙 (宽度12px，窄于头部)
    ctx.fillStyle = skirtColor;
    ctx.fillRect(10, 31, 12, 7);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(10, 36, 12, 2);
    ctx.fillRect(12, 31, 1.5, 7);
    ctx.fillRect(15, 31, 1.5, 7);
    ctx.fillRect(18, 31, 1.5, 7);

    // 8. 双手 (紧贴身体两侧)
    ctx.fillStyle = skirtColor;
    ctx.fillRect(8, 23, 3, 4);
    ctx.fillRect(21, 23, 3, 4);
    ctx.fillStyle = skinColor;
    ctx.fillRect(8, 27, 3, 4);
    ctx.fillRect(21, 27, 3, 4);

    // 9. 少女双腿与鞋 (纤细可爱)
    ctx.fillStyle = skinColor;
    ctx.fillRect(12, 38, 3, 4);
    ctx.fillRect(17, 38, 3, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(12, 39, 3, 2);
    ctx.fillRect(17, 39, 3, 2);
    ctx.fillStyle = '#2b2623';
    ctx.fillRect(11, 41, 4, 4);
    ctx.fillRect(17, 41, 4, 4);

  } else if (facing === 'up') {
    // 背面
    ctx.fillStyle = hairColor;
    if (hairstyle === 'short_bob') {
      ctx.fillRect(5, 3, 22, 18);
      ctx.fillRect(6, 20, 20, 3);
    } else if (hairstyle === 'twin_tails') {
      ctx.fillRect(5, 3, 22, 16);
      ctx.fillRect(1, 10, 6, 20);
      ctx.fillRect(25, 10, 6, 20);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(2, 9, 4, 3);
      ctx.fillRect(26, 9, 4, 3);
    } else if (hairstyle === 'ponytail') {
      ctx.fillRect(5, 3, 22, 16);
      ctx.fillRect(13, 5, 6, 24);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(13, 4, 6, 3);
    } else {
      ctx.fillRect(4, 3, 24, 28);
      ctx.fillRect(3, 10, 26, 20);
    }

    ctx.fillStyle = hairHighlight;
    ctx.fillRect(7, 5, 18, 3);

    // 上衣背部
    ctx.fillStyle = skirtColor;
    ctx.fillRect(8, 23, 16, 8);
    ctx.fillRect(6, 31, 20, 7);

    // 手臂与腿
    ctx.fillStyle = skinColor;
    ctx.fillRect(4, 26, 4, 5);
    ctx.fillRect(24, 26, 4, 5);
    ctx.fillRect(10, 38, 4, 4);
    ctx.fillRect(18, 38, 4, 4);
    ctx.fillStyle = '#2b2623';
    ctx.fillRect(9, 41, 5, 4);
    ctx.fillRect(18, 41, 5, 4);

  } else if (facing === 'left') {
    // 侧面左
    ctx.fillStyle = hairColor;
    ctx.fillRect(8, 3, 19, 20);
    ctx.fillRect(10, 18, 16, 12);
    ctx.fillRect(8, 25, 14, 6);

    ctx.fillStyle = skinColor;
    ctx.fillRect(6, 8, 13, 14);

    ctx.fillStyle = hairColor;
    ctx.fillRect(4, 3, 22, 7);
    ctx.fillRect(3, 7, 7, 8);
    ctx.fillRect(2, 11, 5, 6);
    ctx.fillRect(8, 8, 7, 16);

    ctx.fillStyle = hairHighlight;
    ctx.fillRect(7, 4, 14, 2);
    ctx.fillRect(15, 6, 7, 2);

    ctx.fillStyle = eyeColor;
    ctx.fillRect(6, 13, 3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 13, 1.5, 2);
    ctx.fillStyle = eyeHighlight;
    ctx.fillRect(7, 15, 2, 2);

    ctx.fillStyle = blushColor;
    ctx.fillRect(5, 17, 3, 2);

    // 上衣 & 裙子
    ctx.fillStyle = skirtColor;
    ctx.fillRect(7, 22, 14, 9);
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(7, 22, 4, 3);
    ctx.fillStyle = skirtColor;
    ctx.fillRect(6, 31, 17, 7);

    ctx.fillStyle = skinColor;
    ctx.fillRect(5, 25, 4, 6);
    ctx.fillRect(9, 38, 5, 3);
    ctx.fillRect(15, 38, 4, 3);
    ctx.fillStyle = '#2b2623';
    ctx.fillRect(8, 41, 6, 4);
    ctx.fillRect(15, 41, 5, 4);

  } else if (facing === 'right') {
    // 侧面右
    ctx.fillStyle = hairColor;
    ctx.fillRect(5, 3, 19, 20);
    ctx.fillRect(6, 18, 16, 12);
    ctx.fillRect(10, 25, 14, 6);

    ctx.fillStyle = skinColor;
    ctx.fillRect(13, 8, 13, 14);

    ctx.fillStyle = hairColor;
    ctx.fillRect(6, 3, 22, 7);
    ctx.fillRect(22, 7, 7, 8);
    ctx.fillRect(25, 11, 5, 6);
    ctx.fillRect(17, 8, 7, 16);

    ctx.fillStyle = hairHighlight;
    ctx.fillRect(11, 4, 14, 2);
    ctx.fillRect(10, 6, 7, 2);

    ctx.fillStyle = eyeColor;
    ctx.fillRect(22, 13, 3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 13, 1.5, 2);
    ctx.fillStyle = eyeHighlight;
    ctx.fillRect(22, 15, 2, 2);

    ctx.fillStyle = blushColor;
    ctx.fillRect(23, 17, 3, 2);

    // 上衣 & 裙子
    ctx.fillStyle = skirtColor;
    ctx.fillRect(11, 22, 14, 9);
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(21, 22, 4, 3);
    ctx.fillStyle = skirtColor;
    ctx.fillRect(9, 31, 17, 7);

    ctx.fillStyle = skinColor;
    ctx.fillRect(23, 25, 4, 6);
    ctx.fillRect(13, 38, 4, 3);
    ctx.fillRect(18, 38, 5, 3);
    ctx.fillStyle = '#2b2623';
    ctx.fillRect(12, 41, 5, 4);
    ctx.fillRect(18, 41, 6, 4);
  }

  // 绘制头部饰品
  drawAccessory(ctx, facing, customization, 'female');
}

/**
 * 绘制男性像素小人 (支持发型自定义、发色、肤色与配饰)
 */
function drawMaleCharacter(
  ctx: CanvasRenderingContext2D,
  facing: Direction,
  clothColor: string,
  customization?: AvatarCustomization,
  isBathing?: boolean
): void {
  const hairColor = customization?.hairColor || '#1f242d';
  const hairHighlight = getHairHighlight(hairColor, customization?.hairHighlight);
  const eyeColor = customization?.eyeColor || '#0f172a';
  const eyeHighlight = getEyeHighlight(eyeColor);
  const skinColor = getSkinTone(customization?.skinTone);
  const pantsColor = customization?.pantsColor || '#242a35';
  const topColor = customization?.clothColor || clothColor;
  const hairstyle = customization?.hairstyle || 'default';

  // 1. 身体阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(16, 45, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isBathing) {
    // 泡澡中：去除常规衣物，绘制裸肌身躯 + 像素打马赛克 + 飘散水汽与气泡
    ctx.fillStyle = skinColor;
    ctx.fillRect(9, 21, 14, 18);
    ctx.fillRect(6, 23, 3, 9);
    ctx.fillRect(23, 23, 3, 9);
    ctx.fillRect(11, 39, 4, 5);
    ctx.fillRect(17, 39, 4, 5);

    // 头部皮肤与五官
    ctx.fillRect(8, 7, 16, 15);
    ctx.fillStyle = hairColor;
    ctx.fillRect(5, 3, 22, 8);
    ctx.fillRect(4, 6, 5, 12);
    ctx.fillRect(23, 6, 5, 12);
    ctx.fillRect(8, 8, 16, 4);

    ctx.fillStyle = eyeColor;
    ctx.fillRect(9, 13, 4, 4);
    ctx.fillRect(19, 13, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 13, 2, 2);
    ctx.fillRect(19, 13, 2, 2);

    // 像素打马赛克 censorship
    drawMosaicOverlay(ctx, 5, 20, 22, 22);

    // 水汽标与气泡
    ctx.font = '10px sans-serif';
    ctx.fillText('♨️', 1, -2);
    ctx.fillText('🫧', 24, -4);

    drawAccessory(ctx, facing, customization, 'male');
    return;
  }

  if (facing === 'down') {
    // 2. 头部皮肤
    ctx.fillStyle = skinColor;
    ctx.fillRect(8, 7, 16, 15);

    // 3. 帅气短发
    ctx.fillStyle = hairColor;
    ctx.fillRect(5, 3, 22, 8);
    ctx.fillRect(4, 6, 5, 12);
    ctx.fillRect(23, 6, 5, 12);
    ctx.fillRect(8, 8, 16, 4);

    if (hairstyle === 'anime_messy') {
      // 动感碎发
      ctx.fillRect(8, 10, 4, 4);
      ctx.fillRect(14, 10, 5, 4);
      ctx.fillRect(21, 10, 4, 3);
      ctx.fillRect(3, 1, 4, 4);
      ctx.fillRect(25, 1, 4, 4);
    } else if (hairstyle === 'ponytail') {
      // 雅痞偏分 + 后脑微露小揪
      ctx.fillRect(9, 10, 5, 3);
      ctx.fillRect(18, 10, 5, 3);
      ctx.fillRect(25, 2, 5, 5); // 右上发髻
    } else {
      ctx.fillRect(9, 10, 4, 3.5);
      ctx.fillRect(15, 10, 5, 3.5);
      ctx.fillRect(20, 10, 3, 2.5);
    }

    ctx.fillStyle = hairHighlight;
    ctx.fillRect(7, 4, 18, 2);
    ctx.fillRect(5, 8, 2, 5);

    // 4. 深邃眼睛
    ctx.fillStyle = eyeColor;
    ctx.fillRect(9, 13, 4, 3.5);
    ctx.fillRect(19, 13, 4, 3.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 13, 1.5, 1.5);
    ctx.fillRect(19, 13, 1.5, 1.5);
    ctx.fillStyle = eyeHighlight;
    ctx.fillRect(10, 14.5, 2, 1.5);
    ctx.fillRect(20, 14.5, 2, 1.5);

    // 5. 挺括修身外套 (宽度12px，窄于头部)
    ctx.fillStyle = topColor;
    ctx.fillRect(10, 22, 12, 11);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 22, 4, 5);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(15, 23, 2, 3);

    // 6. 手臂 (紧贴两侧)
    ctx.fillStyle = topColor;
    ctx.fillRect(7, 23, 3, 5);
    ctx.fillRect(22, 23, 3, 5);
    ctx.fillStyle = skinColor;
    ctx.fillRect(7, 28, 3, 4);
    ctx.fillRect(22, 28, 3, 4);

    // 7. 西裤 & 皮鞋 (修身窄版)
    ctx.fillStyle = pantsColor;
    ctx.fillRect(11, 33, 4, 9);
    ctx.fillRect(17, 33, 4, 9);
    ctx.fillStyle = '#111827';
    ctx.fillRect(10, 42, 5, 3.5);
    ctx.fillRect(17, 42, 5, 3.5);

  } else if (facing === 'up') {
    // 背面
    ctx.fillStyle = hairColor;
    ctx.fillRect(5, 3, 22, 18);
    ctx.fillRect(7, 20, 18, 4);

    if (hairstyle === 'ponytail') {
      ctx.fillRect(13, 8, 6, 12); // 后脑发束
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(14, 7, 4, 2);
    }

    ctx.fillStyle = hairHighlight;
    ctx.fillRect(8, 5, 16, 2.5);

    ctx.fillStyle = topColor;
    ctx.fillRect(7, 22, 18, 11);

    ctx.fillStyle = topColor;
    ctx.fillRect(4, 23, 4, 7);
    ctx.fillRect(24, 23, 4, 7);
    ctx.fillStyle = skinColor;
    ctx.fillRect(4, 30, 4, 2.5);
    ctx.fillRect(24, 30, 4, 2.5);

    ctx.fillStyle = pantsColor;
    ctx.fillRect(8, 33, 6, 9);
    ctx.fillRect(18, 33, 6, 9);
    ctx.fillStyle = '#111827';
    ctx.fillRect(7, 42, 7, 3.5);
    ctx.fillRect(18, 42, 7, 3.5);

  } else if (facing === 'left') {
    // 侧面左
    ctx.fillStyle = hairColor;
    ctx.fillRect(10, 3, 16, 19);
    ctx.fillRect(8, 4, 18, 10);
    ctx.fillRect(12, 14, 13, 8);

    ctx.fillStyle = skinColor;
    ctx.fillRect(7, 8, 12, 14);

    ctx.fillStyle = hairColor;
    ctx.fillRect(5, 3, 20, 6);
    ctx.fillRect(4, 6, 7, 8);
    ctx.fillRect(3, 10, 4, 7);
    ctx.fillRect(11, 7, 13, 13);
    ctx.fillRect(7, 10, 4, 7);

    ctx.fillStyle = hairHighlight;
    ctx.fillRect(7, 4, 13, 2);
    ctx.fillRect(13, 6, 7, 2);

    ctx.fillStyle = eyeColor;
    ctx.fillRect(7, 13, 3, 3.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 13, 1.5, 1.5);
    ctx.fillStyle = eyeHighlight;
    ctx.fillRect(8, 14.5, 1.5, 1.5);

    ctx.fillStyle = topColor;
    ctx.fillRect(7, 22, 16, 11);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 22, 4, 4);

    ctx.fillStyle = skinColor;
    ctx.fillRect(5, 26, 4, 6);

    ctx.fillStyle = pantsColor;
    ctx.fillRect(8, 33, 7, 9);
    ctx.fillRect(14, 33, 6, 9);
    ctx.fillStyle = '#111827';
    ctx.fillRect(7, 42, 7, 3.5);
    ctx.fillRect(13, 42, 6, 3.5);

  } else if (facing === 'right') {
    // 侧面右
    ctx.fillStyle = hairColor;
    ctx.fillRect(6, 3, 16, 19);
    ctx.fillRect(6, 4, 18, 10);
    ctx.fillRect(7, 14, 13, 8);

    ctx.fillStyle = skinColor;
    ctx.fillRect(13, 8, 12, 14);

    ctx.fillStyle = hairColor;
    ctx.fillRect(7, 3, 20, 6);
    ctx.fillRect(21, 6, 7, 8);
    ctx.fillRect(25, 10, 4, 7);
    ctx.fillRect(8, 7, 13, 13);
    ctx.fillRect(21, 10, 4, 7);

    ctx.fillStyle = hairHighlight;
    ctx.fillRect(12, 4, 13, 2);
    ctx.fillRect(12, 6, 7, 2);

    ctx.fillStyle = eyeColor;
    ctx.fillRect(22, 13, 3, 3.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 13, 1.5, 1.5);
    ctx.fillStyle = eyeHighlight;
    ctx.fillRect(22, 14.5, 1.5, 1.5);

    ctx.fillStyle = topColor;
    ctx.fillRect(9, 22, 16, 11);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(21, 22, 4, 4);

    ctx.fillStyle = skinColor;
    ctx.fillRect(23, 26, 4, 6);

    ctx.fillStyle = pantsColor;
    ctx.fillRect(11, 33, 6, 9);
    ctx.fillRect(17, 33, 7, 9);
    ctx.fillStyle = '#111827';
    ctx.fillRect(12, 42, 6, 3.5);
    ctx.fillRect(18, 42, 7, 3.5);
  }

  // 绘制头部饰品
  drawAccessory(ctx, facing, customization, 'male');
}

/**
 * 绘制完整角色
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  character: CharacterState
): void {
  ctx.save();
  ctx.translate(character.x, character.y);

  const isChildBody = character.customization?.bodyType === 'child' || character.relationship === 'child';

  ctx.save();
  if (isChildBody) {
    // 呈现头更小、身体更矮的小孩体型 (以脚底 16, 44 为缩放原点)
    ctx.translate(16, 44);
    ctx.scale(0.74, 0.68);
    ctx.translate(-16, -44);
  }

  if (character.gender === 'female') {
    drawFemaleCharacter(ctx, character.facing, character.clothColor, character.customization, character.isBathing);
  } else {
    drawMaleCharacter(ctx, character.facing, character.clothColor, character.customization, character.isBathing);
  }

  // 玩家自定义像素图上色/删减/绘制覆层 (支持 32x48 像素网格)
  if (character.customization?.customPixels) {
    const pixels = character.customization.customPixels;
    for (const [key, color] of Object.entries(pixels)) {
      const [px, py] = key.split(',').map(Number);
      if (!isNaN(px) && !isNaN(py) && px >= 0 && px < 32 && py >= 0 && py < 48) {
        if (color === 'transparent' || color === 'erase' || color === 'delete') {
          ctx.clearRect(px, py, 1, 1);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }
  ctx.restore();

  if (character.isSleepingOnBed) {
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#7EA8E6';
    ctx.fillText('Zzz...', 18, isChildBody ? 2 : -12);
  }

  drawNameTag(
    ctx,
    character.name,
    character.isPlayer,
    character.gender,
    character.relationship,
    isChildBody
  );

  ctx.restore();
}

/**
 * 绘制互动粒子 (亲亲、牵手、抱抱等浪漫/温馨光效)
 */
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: IntimacyParticle[]
): void {
  for (const p of particles) {
    if (p.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    ctx.translate(p.x, p.y);

    if (p.type === 'heart') {
      ctx.fillStyle = p.color || '#f43f5e';
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.2);
      ctx.bezierCurveTo(-s * 0.6, -s * 0.8, -s * 1.1, -s * 0.2, 0, s * 0.8);
      ctx.bezierCurveTo(s * 1.1, -s * 0.2, s * 0.6, -s * 0.8, 0, -s * 0.2);
      ctx.fill();
    } else if (p.type === 'kiss') {
      ctx.font = `${Math.round(p.size * 2.2)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💋', 0, 0);
    } else {
      // 闪烁四角星
      ctx.fillStyle = p.color || '#fbbf24';
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.25, -s * 0.25);
      ctx.lineTo(s, 0);
      ctx.lineTo(s * 0.25, s * 0.25);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.25, s * 0.25);
      ctx.lineTo(-s, 0);
      ctx.lineTo(-s * 0.25, -s * 0.25);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * 绘制单个家具
 */
export function drawFurniture(
  ctx: CanvasRenderingContext2D,
  furniture: Furniture
): void {
  const px = furniture.gx * TILE_SIZE;
  const py = furniture.gy * TILE_SIZE;
  const w = furniture.widthTiles * TILE_SIZE;
  const h = furniture.heightTiles * TILE_SIZE;

  ctx.save();

  // 投影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.fillRect(px + 4, py + h - 6, w - 8, 8);

  switch (furniture.type) {
    case 'sofa': {
      ctx.fillStyle = furniture.color;
      ctx.fillRect(px, py, w, h);

      ctx.fillStyle = '#9b6e6c';
      ctx.fillRect(px + 4, py + 4, w - 8, 20);

      ctx.fillStyle = '#8a5e5c';
      ctx.fillRect(px + 2, py + 4, 10, h - 8);
      ctx.fillRect(px + w - 12, py + 4, 10, h - 8);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(px + 14, py + 26, (w - 28) / 2 - 2, h - 30);
      ctx.fillRect(px + 14 + (w - 28) / 2 + 2, py + 26, (w - 28) / 2 - 2, h - 30);
      break;
    }

    case 'coffee_machine': {
      ctx.fillStyle = '#8a6b4a';
      ctx.fillRect(px + 2, py + 12, w - 4, h - 14);

      ctx.fillStyle = furniture.color;
      ctx.fillRect(px + 6, py + 4, w - 12, 18);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px + 8, py + 6, 4, 4);

      ctx.fillStyle = '#e11d48';
      ctx.fillRect(px + w - 12, py + 6, 3, 3);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 12, py + 18, 8, 6);
      break;
    }

    case 'bookshelf': {
      ctx.fillStyle = furniture.color;
      ctx.fillRect(px, py, w, h);

      ctx.fillStyle = '#4a3520';
      ctx.fillRect(px + 4, py + 4, w - 8, h - 8);

      const bookColors = ['#e63946', '#457b9d', '#2a9d8f', '#e76f51', '#f4a261', '#a8dadc', '#9d4edd'];
      let bx = px + 6;
      let cIdx = 0;
      while (bx < px + w - 10) {
        ctx.fillStyle = bookColors[cIdx % bookColors.length];
        const bw = (cIdx % 3 === 0) ? 6 : 4;
        ctx.fillRect(bx, py + 6, bw, h - 12);
        bx += bw + 2;
        cIdx++;
      }
      break;
    }

    case 'crib': {
      ctx.fillStyle = furniture.color;
      ctx.fillRect(px, py, w, h);

      ctx.fillStyle = '#fff0f5';
      ctx.fillRect(px + 6, py + 6, w - 12, h - 12);

      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(px + 8, py + 24, w - 16, h - 32);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 10, py + 10, 20, 10);

      ctx.fillStyle = '#b88a9a';
      for (let rx = px + 8; rx < px + w - 6; rx += 8) {
        ctx.fillRect(rx, py + 2, 2, 4);
        ctx.fillRect(rx, py + h - 6, 2, 4);
      }
      break;
    }

    case 'double_bed': {
      // 洛可可双人大床 (3x2 瓦片)
      ctx.fillStyle = '#6c4731';
      ctx.fillRect(px, py, w, 14);
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(px + 4, py + 2, w - 8, 4);

      ctx.fillStyle = '#FAF5EE';
      ctx.fillRect(px + 4, py + 12, w - 8, h - 14);

      // 双人软枕
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(px + 8, py + 14, (w - 20) / 2, 14, 4);
      ctx.roundRect(px + 12 + (w - 20) / 2, py + 14, (w - 20) / 2, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#E5C378';
      ctx.fillRect(px + 10, py + 24, (w - 24) / 2, 2);
      ctx.fillRect(px + 14 + (w - 20) / 2, py + 24, (w - 24) / 2, 2);

      // 蚕丝丝绒大被褥
      ctx.fillStyle = furniture.color || '#E8A5B8';
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 30, w - 8, h - 32, [6, 6, 4, 4]);
      ctx.fill();

      // 被折沿象牙金边
      ctx.fillStyle = '#FAF3E0';
      ctx.fillRect(px + 4, py + 30, w - 8, 6);
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(px + 4, py + 36, w - 8, 2);
      break;
    }

    case 'single_bed': {
      // 青少年单人床 / 普通床 (2x2 瓦片)
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(px, py, w, 12);

      ctx.fillStyle = '#FAF5EE';
      ctx.fillRect(px + 4, py + 10, w - 8, h - 12);

      // 单人枕头
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(px + 8, py + 12, w - 16, 14, 4);
      ctx.fill();

      // 单人粉蓝/绿被褥
      ctx.fillStyle = furniture.color || '#7EA8E6';
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 28, w - 8, h - 30, [4, 4, 4, 4]);
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(px + 4, py + 28, w - 8, 5);
      break;
    }

    case 'dining_table': {
      // 浪漫双人餐桌 (2x2)
      ctx.fillStyle = furniture.color;
      ctx.beginPath();
      ctx.roundRect(px + 6, py + 6, w - 12, h - 12, 12);
      ctx.fill();

      // 桌布
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(px + 12, py + 12, w - 24, h - 24, 8);
      ctx.fill();

      // 烛台/鲜花
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h / 2 - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'tea_table': {
      // 实木八仙大圆桌 (3x3)
      ctx.fillStyle = furniture.color;
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h / 2, (w - 12) / 2, 0, Math.PI * 2);
      ctx.fill();

      // 年轮与桌面微光
      ctx.fillStyle = '#6b4423';
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h / 2, (w - 24) / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h / 2, (w - 36) / 2, 0, Math.PI * 2);
      ctx.fill();

      // 茶壶与四盏茶杯
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h / 2, 7, 0, Math.PI * 2);
      ctx.fill();

      const cups = [
        { dx: -18, dy: 0 },
        { dx: 18, dy: 0 },
        { dx: 0, dy: -18 },
        { dx: 0, dy: 18 }
      ];
      ctx.fillStyle = '#ffffff';
      for (const cup of cups) {
        ctx.beginPath();
        ctx.arc(px + w / 2 + cup.dx, py + h / 2 + cup.dy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'tv_cabinet': {
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(px, py, w, h);

      ctx.fillStyle = '#262626';
      ctx.fillRect(px + 14, py + 2, w - 28, h - 4);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + 18, py + 5, w - 48, h - 10);

      ctx.fillStyle = '#d4d4d8';
      ctx.fillRect(px + w - 26, py + 8, 4, 4);
      ctx.fillRect(px + w - 26, py + 16, 4, 4);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + w / 2, py + 2);
      ctx.lineTo(px + w / 2 - 12, py - 6);
      ctx.moveTo(px + w / 2, py + 2);
      ctx.lineTo(px + w / 2 + 12, py - 6);
      ctx.stroke();
      break;
    }

    case 'kitchen_stove': {
      ctx.fillStyle = '#475569';
      ctx.fillRect(px, py, w, h);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px + 4, py + 4, w - 8, h - 8);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2);
      ctx.arc(px + w - 16, py + 16, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d97706';
      ctx.fillRect(px + 10, py + h - 22, 16, 12);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(px + 18, py + h - 16, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'family_photo': {
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(px, py, w, h);

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(px + 3, py + 3, w - 6, h - 6);

      const figures = [
        { fx: px + 12, color: '#3b82f6' },
        { fx: px + 24, color: '#ec4899' },
        { fx: px + 36, color: '#10b981' },
        { fx: px + 48, color: '#8b5cf6' }
      ];
      for (const fig of figures) {
        ctx.fillStyle = fig.color;
        ctx.beginPath();
        ctx.arc(fig.fx, py + 11, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(fig.fx - 3, py + 15, 6, 8);
      }
      break;
    }

    case 'bathtub': {
      // 云朵珍珠欧式大浴缸 (2x2 瓦片)
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(px + 4, py + 4, 8, 8);
      ctx.fillRect(px + w - 12, py + 4, 8, 8);
      ctx.fillRect(px + 4, py + h - 12, 8, 8);
      ctx.fillRect(px + w - 12, py + h - 12, 8, 8);

      ctx.fillStyle = '#FAF5EE';
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, w - 4, h - 4, 16);
      ctx.fill();
      ctx.strokeStyle = '#E5C378';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.roundRect(px + 8, py + 8, w - 16, h - 16, 12);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(px + 20, py + 22, 6, 0, Math.PI * 2);
      ctx.arc(px + w - 22, py + 34, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      const bubbles = [
        { bx: px + 14, by: py + 14, r: 5 },
        { bx: px + 22, by: py + 12, r: 4 },
        { bx: px + w - 18, by: py + 16, r: 6 },
        { bx: px + 16, by: py + h - 16, r: 5 },
        { bx: px + w - 20, by: py + h - 14, r: 4 },
      ];
      for (const b of bubbles) {
        ctx.beginPath();
        ctx.arc(b.bx, b.by, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#d4af37';
      ctx.fillRect(px + w / 2 - 4, py + 4, 8, 8);
      ctx.beginPath();
      ctx.arc(px + w / 2, py + 12, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('♨️ 泡澡', px + w / 2 - 14, py - 3);
      break;
    }

    default: {
      ctx.fillStyle = furniture.color;
      ctx.fillRect(px, py, w, h);
      break;
    }
  }

  ctx.restore();
}
