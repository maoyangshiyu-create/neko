import type { CSSProperties } from 'react';

export interface BubbleStyleParams {
  isUser?: boolean;
  prefix?: string; // 'self' | 'other' | 'transfer' | 'location' | 'file' | 'proposal' | 'wedding' | 'divorce' | string
  editingTheme?: any;
  bubbleBgUrl?: string;
  customText?: string;
  defaultText?: string;
  isDot9?: boolean;
  stretchTop?: number;
  stretchRight?: number;
  stretchBottom?: number;
  stretchLeft?: number;
  contentTop?: number;
  contentRight?: number;
  contentBottom?: number;
  contentLeft?: number;
  minWidth?: number;
  minHeight?: number;
}

/**
 * 解析切片数值，若不存在则回退至默认值
 */
export function parseThemeVal(val: string | number | undefined | null, defaultVal: number = 30): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const num = parseFloat(val);
  return isNaN(num) ? defaultVal : num;
}

/**
 * 计算点九切片拉伸与内容区缩放参数：
 * 核心逻辑：
 * 1. 彻底去除文字与内容安全区之间的中间虚拉空腔，文字紧密贴合内容区边缘线；
 * 2. 以微信单行聊天气泡的标准高度（42px左右）为基准，将文字和气泡一起等比例放大；
 * 3. 装饰物尺寸（四周切片）饱满醒目，文字紧凑舒适，视觉比例平衡！
 */
export function calculateBubbleScale({
  isUser,
  prefix,
  editingTheme,
  stretchTop,
  stretchRight,
  stretchBottom,
  stretchLeft,
  contentTop,
  contentRight,
  contentBottom,
  contentLeft,
}: Omit<BubbleStyleParams, 'bubbleBgUrl' | 'customText' | 'defaultText'>) {
  const p = prefix || (isUser ? 'self' : 'other');
  
  const rawSTop = stretchTop ?? parseThemeVal(editingTheme?.css?.[`--gg-slice-top-${p}`], 14);
  const rawSRight = stretchRight ?? parseThemeVal(editingTheme?.css?.[`--gg-slice-right-${p}`], 14);
  const rawSBottom = stretchBottom ?? parseThemeVal(editingTheme?.css?.[`--gg-slice-bottom-${p}`], 14);
  const rawSLeft = stretchLeft ?? parseThemeVal(editingTheme?.css?.[`--gg-slice-left-${p}`], 14);

  const sTop = Math.max(1, Math.round(rawSTop));
  const sRight = Math.max(1, Math.round(rawSRight));
  const sBottom = Math.max(1, Math.round(rawSBottom));
  const sLeft = Math.max(1, Math.round(rawSLeft));

  const rawCTop = contentTop ?? parseThemeVal(editingTheme?.css?.[`--gg-padding-top-${p}`], sTop);
  const rawCRight = contentRight ?? parseThemeVal(editingTheme?.css?.[`--gg-padding-right-${p}`], sRight);
  const rawCBottom = contentBottom ?? parseThemeVal(editingTheme?.css?.[`--gg-padding-bottom-${p}`], sBottom);
  const rawCLeft = contentLeft ?? parseThemeVal(editingTheme?.css?.[`--gg-padding-left-${p}`], sLeft);

  const cTop = Math.max(1, Math.round(rawCTop));
  const cRight = Math.max(1, Math.round(rawCRight));
  const cBottom = Math.max(1, Math.round(rawCBottom));
  const cLeft = Math.max(1, Math.round(rawCLeft));

  // 微信单行标准气泡高度约 40px~44px，按钮高度约 34px~38px
  const isBtn = p.includes('Btn') || p.includes('Option');
  const isFullWidthBar = ['header', 'input', 'tabbar', 'chatlist', 'moments', 'pluspanel', 'voicepanel', 'photopanel', 'transferpanel', 'locationpanel'].some(k => p.includes(k));

  const TARGET_BORDER_V = isFullWidthBar 
    ? (p.includes('input') ? 54 : p.includes('tabbar') ? 50 : 44) 
    : (isBtn ? 34 : 44);
  const TARGET_BORDER_H = isFullWidthBar ? 99999 : (isBtn ? 100 : 140);

  const vSum = sTop + sBottom;
  const hSum = sLeft + sRight;

  let autoScale = 1;
  if (isFullWidthBar) {
    if (vSum > TARGET_BORDER_V) {
      autoScale = Math.min(1, TARGET_BORDER_V / vSum);
    }
  } else if (vSum > TARGET_BORDER_V || hSum > TARGET_BORDER_H) {
    autoScale = Math.min(TARGET_BORDER_V / vSum, TARGET_BORDER_H / hSum);
  }

  // 用户可在 DIY 工坊自由微调气泡放大倍数（默认 1.0x ~ 1.25x 醒目放大）
  const userScaleKey = editingTheme?.css?.[`--gg-${p}-scale`]
    ? `--gg-${p}-scale`
    : `--gg-bubble-scale-${p}`;
    
  const customUserScale = editingTheme?.css?.[userScaleKey]
    ? parseFloat(editingTheme.css[userScaleKey]) || 1.0
    : 1.0;

  const finalScale = autoScale * customUserScale;

  // 屏幕渲染展示的边框与切片厚度（CSS 显示像素）
  const dispTop = Math.max(1, Math.round(sTop * finalScale));
  const dispRight = Math.max(1, Math.round(sRight * finalScale));
  const dispBottom = Math.max(1, Math.round(sBottom * finalScale));
  const dispLeft = Math.max(1, Math.round(sLeft * finalScale));

  // 文字内边距：直接按黄色内容安全区等比例换算，紧密贴合边缘线！
  const padTop = Math.max(2, Math.round(cTop * finalScale));
  const padRight = Math.max(4, Math.round(cRight * finalScale));
  const padBottom = Math.max(2, Math.round(cBottom * finalScale));
  const padLeft = Math.max(4, Math.round(cLeft * finalScale));

  return {
    sTop, sRight, sBottom, sLeft,
    cTop, cRight, cBottom, cLeft,
    finalScale,
    dispTop, dispRight, dispBottom, dispLeft,
    padTop, padRight, padBottom, padLeft,
  };
}

/**
 * 气泡外层容器样式：
 * 控制气泡几何尺寸、文字排版内边距（文字紧贴内容安全区边缘）
 */
export function getBubbleContainerStyle(params: BubbleStyleParams): CSSProperties {
  if (!params.bubbleBgUrl) {
    return {};
  }

  const { padTop, padRight, padBottom, padLeft, dispTop, dispRight, dispBottom, dispLeft } = calculateBubbleScale(params);

  return {
    position: 'relative',
    display: 'inline-block',
    boxSizing: 'border-box',
    width: 'fit-content',
    maxWidth: '100%',
    color: params.customText || params.defaultText || '#1c1917',
    backgroundColor: 'transparent',
    // 文字紧密贴合内容区边缘线，排版内边距严格等于内容安全区尺寸
    padding: `${padTop}px ${padRight}px ${padBottom}px ${padLeft}px`,
    // 最小宽高确保即使只有一个字，四周的完整装饰物也能完整展示
    minWidth: `${params.minWidth || Math.min(dispLeft + dispRight, 48)}px`,
    minHeight: `${params.minHeight || Math.min(dispTop + dispBottom, 38)}px`,
    wordBreak: 'break-word',
    borderRadius: '0px',
    boxShadow: 'none',
  };
}

/**
 * 独立点九图背景层样式：
 * 底层绝对定位贴合容器，9-patch 切片拉伸独立渲染，绝不向内挤压推挤文字！
 */
export function getBubbleBgStyle(params: BubbleStyleParams): CSSProperties {
  if (!params.bubbleBgUrl) {
    return { display: 'none' };
  }

  // 若明确标记非点九图（普通贴图），直接使用百分百贴合平铺，防止被默认切片截断！
  if (params.isDot9 === false) {
    return {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      backgroundImage: `url(${params.bubbleBgUrl})`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      zIndex: 0,
    };
  }

  const { sTop, sRight, sBottom, sLeft, dispTop, dispRight, dispBottom, dispLeft } = calculateBubbleScale(params);

  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderWidth: `${dispTop}px ${dispRight}px ${dispBottom}px ${dispLeft}px`,
    borderImageSource: `url(${params.bubbleBgUrl})`,
    borderImageSlice: `${sTop} ${sRight} ${sBottom} ${sLeft} fill`,
    borderImageWidth: `${dispTop}px ${dispRight}px ${dispBottom}px ${dispLeft}px`,
    borderImageOutset: '0',
    borderImageRepeat: 'stretch',
    borderRadius: '0px',
    zIndex: 0,
  };
}

/**
 * 解析边框 CSS 字符串为合法的 React CSSProperties
 */
export function parseBorderCSS(borderStr?: string, defaultBorder: string = '1px solid #e5e7eb'): CSSProperties {
  if (!borderStr) {
    return { border: defaultBorder };
  }
  if (borderStr === 'none' || borderStr === '0' || borderStr === '0px') {
    return { border: 'none' };
  }
  if (borderStr.includes(' ')) {
    return { border: borderStr };
  }
  if (borderStr.startsWith('#') || borderStr.startsWith('rgb') || borderStr.startsWith('hsl')) {
    return { border: `1px solid ${borderStr}` };
  }
  return { border: borderStr };
}

/**
 * 兼容旧调用的单样式入口
 */
export function getBubbleStyle(params: BubbleStyleParams): CSSProperties {
  return getBubbleContainerStyle(params);
}
