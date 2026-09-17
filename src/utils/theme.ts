import { ThemeStyle } from '../types/phone';

export const THEME_STORAGE_KEY = 'wephone_theme_style';

export interface ThemeConfig {
  id: ThemeStyle;
  name: string;
  emoji: string;
  description: string;
  iconToneDesc: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  borderRadius: string;
  shadowDesc: string;
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: 'morandi',
    name: '莫兰迪',
    emoji: '🟤',
    description: '低饱和柔和大地调，温润优雅',
    iconToneDesc: '低饱和大地灰调（鼠尾绿/肉桂棕/雾霾蓝/暖褐灰）',
    previewBg: '#f2ede8',
    previewCard: '#fbf8f5',
    previewAccent: '#a8b39c',
    borderRadius: '14px',
    shadowDesc: '低饱和柔光'
  },
  {
    id: 'macaron',
    name: '马卡龙',
    emoji: '🍬',
    description: '梦幻马卡龙色系，粉嫩甜美',
    iconToneDesc: '奶油梦幻粉彩调（薄荷绿/香芒黄/香芋紫/草莓粉）',
    previewBg: '#fff5f8',
    previewCard: '#ffffff',
    previewAccent: '#ffb3c6',
    borderRadius: '20px',
    shadowDesc: '粉紫浪漫柔光'
  },
  {
    id: 'glass',
    name: '玻璃拟态',
    emoji: '🧊',
    description: '磨砂半透明质感，灵动通透',
    iconToneDesc: '纯净透亮毛玻璃（晶莹折射与柔亮透光）',
    previewBg: 'linear-gradient(135deg, #c9d6e8, #e8edf5)',
    previewCard: 'rgba(255, 255, 255, 0.55)',
    previewAccent: '#7c9cff',
    borderRadius: '18px',
    shadowDesc: '透光柔影 + 毛玻璃'
  },
  {
    id: 'mono',
    name: '黑白简约',
    emoji: '⬛',
    description: '纯粹极简黑白线条，利落分明',
    iconToneDesc: '极简黑白灰阶调（纯粹黑曜石与高对比钛白）',
    previewBg: '#ffffff',
    previewCard: '#fafafa',
    previewAccent: '#000000',
    borderRadius: '4px',
    shadowDesc: '平直极简无阴影'
  },
  {
    id: 'rococo',
    name: '洛可可',
    emoji: '🎀',
    description: '18世纪宫廷风，奶油粉嫩梦幻',
    iconToneDesc: '奶油粉嫩调',
    previewBg: '#fdf6f0',
    previewCard: '#fffaf5',
    previewAccent: '#e89aab',
    borderRadius: '18px',
    shadowDesc: '柔光珍珠质感'
  }
];

export function applyTheme(themeName: ThemeStyle) {
  if (typeof document === 'undefined') return;

  const validThemes: ThemeStyle[] = ['morandi', 'macaron', 'glass', 'mono', 'rococo'];
  const safeTheme = validThemes.includes(themeName) ? themeName : 'morandi';

  // 1. Remove all old theme classes from body
  validThemes.forEach(t => {
    document.body.classList.remove(`theme-${t}`);
  });

  // 2. Add new theme class
  document.body.classList.add(`theme-${safeTheme}`);

  // 3. Persist to localStorage
  try {
    localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
  } catch (e) {
    console.error('Failed to save theme to localStorage:', e);
  }
}

export function getInitialTheme(): ThemeStyle {
  if (typeof window === 'undefined') return 'morandi';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeStyle;
    if (saved && ['morandi', 'macaron', 'glass', 'mono', 'rococo'].includes(saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'morandi';
}
