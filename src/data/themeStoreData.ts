import type { DIYTheme } from '../types/phone';

export interface ShopThemeItem {
  id: string;
  name: string;
  author: string;
  price: number; // 面包数量
  preview: string; // 预览图 URL (Base64 或链接)
  description?: string;
  jsonUrl?: string; // 外部或本地 JSON 链接
  themeData: DIYTheme;
}

/**
 * 主题商店精选主题列表（卡片支持拉长展示原比例截图）
 */
export const SHOP_THEMES: ShopThemeItem[] = [
  {
    id: 'theme_bread_dog',
    name: '面包小狗',
    author: '开发者',
    price: 50,
    preview: 'https://i.postimg.cc/9Ff3rRmG/Screenshot-2026-09-15-09-18-27-91-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
    description: '软萌治愈的面包小狗专属全套个性化主题，包含精美吐司气泡、转账卡片、语音条与内心潜台词专属样式。',
    jsonUrl: '/面包小狗.json',
    themeData: {
      id: 'theme_bread_dog',
      name: '面包小狗',
      version: '1.0.0',
      author: '开发者',
      description: '软萌治愈的面包小狗专属全套个性化主题',
      createdAt: Date.now(),
      css: {
        '--gg-shell-bg': '#FEDAA2',
        '--gg-accent-color': '#F89838',
        '--gg-text-primary': '#3A1E08',
        '--gg-text-secondary': '#8A6240',
        '--gg-page-bg': '#FBF3DF',
        '--gg-header-bg': '#FEDAA2',
        '--gg-header-text': '#3A1E08',
        '--gg-tabbar-bg': '#FEDAA2',
        '--gg-tabbar-text': '#8A6240',
        '--gg-bubble-self': '#FFFFFF',
        '--gg-bubble-self-text': '#2D1B0C',
        '--gg-bubble-other': '#FFFFFF',
        '--gg-bubble-other-text': '#2D1B0C',
        '--gg-bubble-border-self': '2px solid #4A2A10',
        '--gg-bubble-border-other': '2px solid #4A2A10',
        '--gg-bubble-radius-self': '14px',
        '--gg-bubble-radius-other': '14px',
      },
      assets: {
        homeWallpaper: 'https://i.postimg.cc/3JqqNtbQ/Screenshot-2026-09-11-16-54-03-08-df198e732186825c8df26e3c5a10d7cd.jpg'
      }
    }
  }
];
