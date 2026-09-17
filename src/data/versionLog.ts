export interface VersionLog {
  version: string;
  title: string;
  date: string;
  highlights: string[];
  notice?: string;
}

/**
 * 当前最新版本与更新公告配置
 * 每次修改并想向用户推送更新通知时，只需更新此处的 version 和 highlights 即可！
 * 访客进入网页时检测到新版本号，将自动优先弹出更新通知。
 */
export const CURRENT_VERSION = 'v1.1.0';

export const LATEST_UPDATE: VersionLog = {
  version: CURRENT_VERSION,
  title: '✨ WePhone 1.1.0 版本更新通知',
  date: '2026-09-16',
  highlights: [
    '🥖 主题商店「面包小狗」专属高定个性化换肤上新（包含精美吐司气泡、转账卡片与内心潜台词专属样式）',
    '🎨 接入面包兑换体系与 DIY 主题库，已购买主题支持一键即时应用与自由切换',
    '✨ 优化手机桌面与各应用交互动画，带来更丝滑拟真的操作体验'
  ],
  notice: '💡 提示：若遇到新功能未生效或显示异常，刷新网页即可体验最新内容。'
};

export const VERSION_HISTORY: VersionLog[] = [
  LATEST_UPDATE,
  {
    version: 'v1.0.0',
    title: 'WePhone 模拟器基础架构发布',
    date: '2026-09-10',
    highlights: [
      '微信模拟聊天、朋友圈、人设世界书、AI 自定义驱动支持',
      '网易云音乐、外卖、番茄钟、记账等全套拟真应用'
    ]
  }
];
