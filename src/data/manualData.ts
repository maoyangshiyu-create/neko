import { AestheticStyleId, StyleConfig, ComponentItem, JellyFeedbackType, WorldBookEntry, StickerItem } from '../types';

export const STYLES: Record<AestheticStyleId, StyleConfig> = {
  morandi: {
    id: 'morandi',
    name: '莫兰迪风格',
    badge: '手册默认',
    icon: '🟤',
    description: '低饱和度、灰调柔和，适合治愈系、日常向的应用。阴影浅而散，中等圆角，不用纯白纯黑。',
    characteristics: ['浅而散的柔和投影', '中等圆角 (12~16px)', '无纯黑纯白', '温润质感'],
    vars: {
      bg: '#f2ede8',
      paper: '#fbf8f5',
      ink: '#5c5450',
      inkSoft: '#948a84',
      line: '#e3dad3',
      accent: '#b28684',
      accentDeep: '#8a9a7c',
      secondary: '#d9c6a8',
      danger: '#c97b6f',
      radius: '14px',
      shadow: '0 12px 30px -10px rgba(92,84,80,0.18)',
    },
    cardClass: 'bg-[#fbf8f5] text-[#5c5450] border border-[#e3dad3] shadow-[0_12px_30px_-10px_rgba(92,84,80,0.18)] rounded-[14px]',
    buttonClass: 'bg-[#b28684] hover:bg-[#a07472] text-white rounded-[12px] shadow-sm',
    cssSnippet: `:root {\n  --bg: #f2ede8;\n  --paper: #fbf8f5;\n  --ink: #5c5450;\n  --ink-soft: #948a84;\n  --line: #e3dad3;\n  --rose: #c9a2a0;\n  --rose-deep: #b28684;\n  --sage: #a8b39c;\n  --sage-deep: #8a9a7c;\n  --sand: #d9c6a8;\n  --blue: #a6b7bf;\n  --danger: #c97b6f;\n}`
  },
  macaron: {
    id: 'macaron',
    name: '马卡龙风格',
    badge: '甜美活力',
    icon: '🍬',
    description: '高甜度、微高饱和，大圆角软糯。阴影自带彩色光晕，渐变色块，适合可爱、年轻氛围。',
    characteristics: ['大圆角更圆润 (16~24px)', '阴影带马卡龙色彩', '双色渐变色块', '软糯留白感'],
    vars: {
      bg: '#fff5f8',
      paper: '#ffffff',
      ink: '#5b4a52',
      inkSoft: '#a68b95',
      line: '#ffd9e6',
      accent: '#ff8fab',
      accentDeep: '#7fdba0',
      secondary: '#d9c6f2',
      danger: '#ff8f8f',
      radius: '20px',
      shadow: '0 12px 28px -6px rgba(255,143,171,0.28)',
    },
    cardClass: 'bg-white text-[#5b4a52] border border-[#ffd9e6] shadow-[0_12px_28px_-6px_rgba(255,143,171,0.28)] rounded-[20px]',
    buttonClass: 'bg-gradient-to-r from-[#ffb3c6] to-[#d9c6f2] hover:opacity-95 text-[#5b4a52] font-medium rounded-[16px] shadow-[0_6px_16px_-4px_rgba(255,143,171,0.4)]',
    cssSnippet: `:root {\n  --bg: #fff5f8;\n  --paper: #ffffff;\n  --ink: #5b4a52;\n  --ink-soft: #a68b95;\n  --line: #ffd9e6;\n  --pink: #ffb3c6;\n  --pink-deep: #ff8fab;\n  --mint: #b8f2d4;\n  --mint-deep: #7fdba0;\n  --lemon: #fff2b3;\n  --lavender: #d9c6f2;\n  --danger: #ff8f8f;\n}`
  },
  glass: {
    id: 'glass',
    name: '玻璃拟态',
    badge: '通透轻盈',
    icon: '🧊',
    description: '半透明背景结合高斯模糊、微发光白色细边框与弥散深影，充满层次科技质感。',
    characteristics: ['backdrop-filter 模糊', '半透明白微光勾边', '深色弥散阴影', '通透悬浮层'],
    vars: {
      bg: '#e8edf5',
      paper: 'rgba(255,255,255,0.65)',
      ink: '#2b2b33',
      inkSoft: '#68687a',
      line: 'rgba(255,255,255,0.6)',
      accent: '#4f72f5',
      accentDeep: '#3b5cdb',
      secondary: '#82a5ff',
      danger: '#fa5252',
      radius: '18px',
      shadow: '0 16px 36px -10px rgba(43,43,51,0.18)',
    },
    cardClass: 'bg-white/60 backdrop-blur-xl text-[#2b2b33] border border-white/60 shadow-[0_16px_36px_-10px_rgba(43,43,51,0.18)] rounded-[18px]',
    buttonClass: 'bg-[#4f72f5]/90 hover:bg-[#4f72f5] backdrop-blur-sm text-white rounded-[14px] shadow-[0_6px_16px_rgba(79,114,245,0.35)]',
    cssSnippet: `:root {\n  --glass-bg-light: rgba(255,255,255,0.55);\n  --glass-bg-dark: rgba(30,30,40,0.45);\n  --glass-border: rgba(255,255,255,0.35);\n  --glass-ink: #2b2b33;\n  --glass-accent: #7c9cff;\n}`
  },
  mono: {
    id: 'mono',
    name: '黑白简约',
    badge: '克制高级',
    icon: '⬛',
    description: '去色彩化，纯粹靠精密切割的边框、字重间距与克制排版撑起气场，适合工具与极简产品。',
    characteristics: ['小圆角甚至直角 (2~6px)', '几乎无阴影，靠细线', '严格纯黑白灰梯度', '加大字距 letter-spacing'],
    vars: {
      bg: '#f5f5f5',
      paper: '#ffffff',
      ink: '#111111',
      inkSoft: '#666666',
      line: '#e5e5e5',
      accent: '#111111',
      accentDeep: '#000000',
      secondary: '#737373',
      danger: '#dc2626',
      radius: '4px',
      shadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    cardClass: 'bg-white text-[#111111] border border-[#e5e5e5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
    buttonClass: 'bg-[#111111] hover:bg-[#262626] text-white font-mono tracking-wider rounded-[3px]',
    cssSnippet: `:root {\n  --bg: #ffffff;\n  --paper: #fafafa;\n  --ink: #111111;\n  --ink-soft: #6b6b6b;\n  --line: #e5e5e5;\n  --accent: #000000;\n  --accent-invert: #ffffff;\n  --danger: #d64545;\n}`
  }
};

export const JELLY_TYPES: JellyFeedbackType[] = [
  {
    id: 'basic',
    name: '基础款 (整体等比缩放)',
    icon: '🧊',
    desc: '按钮按下快速收缩至 88%，松手用 0.65s cubic-bezier(0.34, 1.9, 0.4, 1) 慢弹过冲回原状。',
    pressScale: 'scale(0.88)',
    releaseBezier: '0.65s cubic-bezier(0.34, 1.9, 0.4, 1)',
    cssCode: `.jelly-btn {\n  transform: scale(1);\n  transition: transform 0.65s cubic-bezier(0.34, 1.9, 0.4, 1),\n              box-shadow 0.65s cubic-bezier(0.34, 1.9, 0.4, 1);\n}\n.jelly-btn:active {\n  transform: scale(0.88);\n  transition: transform 0.08s ease-out, box-shadow 0.08s ease-out;\n}`
  },
  {
    id: 'icon',
    name: '圆形图标款 (缩放 + 轻微旋转)',
    icon: '🍡',
    desc: '圆形按钮按下一边缩小至 82%，一边逆时针微偏 -4°，回弹带更强过冲（参数 2.2），灵动可爱。',
    pressScale: 'scale(0.82) rotate(-4deg)',
    releaseBezier: '0.7s cubic-bezier(0.32, 2.2, 0.4, 1)',
    cssCode: `.jelly-icon {\n  transform: scale(1) rotate(0deg);\n  transition: transform 0.7s cubic-bezier(0.32, 2.2, 0.4, 1),\n              box-shadow 0.7s cubic-bezier(0.32, 2.2, 0.4, 1);\n}\n.jelly-icon:active {\n  transform: scale(0.82) rotate(-4deg);\n  transition: transform 0.08s ease-out, box-shadow 0.08s ease-out;\n}`
  },
  {
    id: 'capsule',
    name: '胶囊压扁款 (横宽纵扁软泥感)',
    icon: '🫠',
    desc: '底部对齐 transform-origin: center bottom，按下横向拉伸至 1.12、纵向压矮至 0.78，宛如面团被踩扁再弹起。',
    pressScale: 'scale(1.12, 0.78)',
    releaseBezier: '0.75s cubic-bezier(0.28, 2.6, 0.35, 1)',
    cssCode: `.jelly-blob {\n  transform: scale(1, 1);\n  transform-origin: center bottom;\n  transition: transform 0.75s cubic-bezier(0.28, 2.6, 0.35, 1),\n              box-shadow 0.75s cubic-bezier(0.28, 2.6, 0.35, 1);\n}\n.jelly-blob:active {\n  transform: scale(1.12, 0.78);\n  transition: transform 0.06s ease-out, box-shadow 0.06s ease-out;\n}`
  }
];

export const COMPONENTS_DATA: ComponentItem[] = [
  {
    id: 'drawer',
    title: '抽屉',
    nameEn: 'Drawer',
    icon: '🗂️',
    prompt: '设计一个侧边抽屉组件，从屏幕右侧滑出，不遮挡主页面内容，半透明遮罩 + 磨砂玻璃质感面板，滑入动画配合缓动曲线。',
    description: '侧边浮层面板，从右侧滑出，带背景遮罩与丝滑进出动画，适合移动端筛选、侧栏菜单与配置面板。',
    structureHtml: `<button onclick="document.getElementById('drawerMask').classList.add('open')">打开抽屉</button>\n\n<div class="drawer-mask" id="drawerMask" onclick="if(event.target===this)this.classList.remove('open')">\n  <div class="drawer-panel">\n    <button onclick="document.getElementById('drawerMask').classList.remove('open')">✕</button>\n    <h4>筛选设置</h4>\n    <div class="row">全部消息</div>\n    <div class="row">未读优先</div>\n  </div>\n</div>`,
    structureCss: `.drawer-mask {\n  position: fixed; inset: 0;\n  opacity: 0; pointer-events: none;\n}\n.drawer-mask.open { opacity: 1; pointer-events: auto; }\n.drawer-panel {\n  position: fixed; top: 0; right: 0; bottom: 0;\n  width: 78%; max-width: 320px;\n  transform: translateX(100%);\n}\n.drawer-mask.open .drawer-panel { transform: translateX(0); }`,
    feedbackCss: `.drawer-panel {\n  transition: transform 0.38s cubic-bezier(0.32, 1.4, 0.4, 1);\n}\n.drawer-close-btn:active {\n  transform: scale(0.85);\n  transition: transform 0.08s ease-out;\n}`,
    aestheticsCss: {
      morandi: `.drawer-mask {\n  background: rgba(92,84,80,0.25);\n  backdrop-filter: blur(2px);\n  transition: opacity .3s ease;\n  z-index: 50;\n}\n.drawer-panel {\n  background: rgba(251,248,245,0.92);\n  backdrop-filter: blur(16px) saturate(160%);\n  box-shadow: -12px 0 40px rgba(92,84,80,0.2);\n  border-left: 1px solid rgba(255,255,255,0.5);\n  padding: 22px;\n}`,
      macaron: `.drawer-mask {\n  background: rgba(255,179,198,0.25);\n  backdrop-filter: blur(3px);\n  z-index: 50;\n}\n.drawer-panel {\n  background: #ffffff;\n  box-shadow: -12px 0 36px rgba(255,143,171,0.25);\n  border-left: 2px solid #ffd9e6;\n  border-radius: 24px 0 0 24px;\n  padding: 24px;\n}`,
      glass: `.drawer-mask {\n  background: rgba(20,25,35,0.3);\n  backdrop-filter: blur(6px);\n  z-index: 50;\n}\n.drawer-panel {\n  background: rgba(255,255,255,0.72);\n  backdrop-filter: blur(24px) saturate(180%);\n  box-shadow: -14px 0 44px rgba(0,0,0,0.18);\n  border-left: 1px solid rgba(255,255,255,0.8);\n  padding: 24px;\n}`,
      mono: `.drawer-mask {\n  background: rgba(0,0,0,0.4);\n  z-index: 50;\n}\n.drawer-panel {\n  background: #ffffff;\n  border-left: 1.5px solid #111111;\n  box-shadow: none;\n  padding: 24px;\n}`
    },
    combinedCode: `<!-- 完整的 抽屉 组件三层组合示例 -->\n<div class="drawer-panel drawer-morandi jelly-spring">\n  <h3>筛选抽屉</h3>\n</div>`
  },
  {
    id: 'popover',
    title: '气泡卡片',
    nameEn: 'Popover',
    icon: '💬',
    prompt: '设计一个点击触发的气泡浮层组件，从触发元素旁弹出，带小箭头指向触发点，点击外部区域自动关闭。',
    description: '轻量气泡卡片，带小尖角瞄准触发元素，点击外围区域平滑收起。',
    structureHtml: `<div class="pop-wrap">\n  <button onclick="document.getElementById('pop1').classList.toggle('open')">批量操作</button>\n  <div class="popover" id="pop1">\n    <div class="item">重命名</div>\n    <div class="item">置顶</div>\n    <div class="item">删除</div>\n  </div>\n</div>`,
    structureCss: `.pop-wrap { position: relative; display: inline-block; }\n.popover {\n  position: absolute; top: calc(100% + 12px); left: 0;\n  opacity: 0; pointer-events: none;\n}\n.popover.open { opacity: 1; pointer-events: auto; }`,
    structureJs: `document.addEventListener('click', (e) => {\n  document.querySelectorAll('.popover.open').forEach(p => {\n    if (!p.parentElement.contains(e.target)) p.classList.remove('open');\n  });\n});`,
    feedbackCss: `.popover {\n  transform: translateY(-8px) scale(0.92);\n  transition: transform 0.45s cubic-bezier(0.34, 1.8, 0.4, 1), opacity 0.2s ease;\n}\n.popover.open {\n  transform: translateY(0) scale(1);\n}`,
    aestheticsCss: {
      morandi: `.popover {\n  background: #fbf8f5;\n  border: 1px solid #e3dad3;\n  border-radius: 14px;\n  box-shadow: 0 16px 40px -12px rgba(92,84,80,0.25);\n  padding: 12px; width: 190px;\n}\n.popover::before {\n  content: ""; position: absolute; top: -6px; left: 22px;\n  width: 12px; height: 12px; background: #fbf8f5;\n  border-left: 1px solid #e3dad3; border-top: 1px solid #e3dad3;\n  transform: rotate(45deg);\n}`,
      macaron: `.popover {\n  background: #ffffff;\n  border: 1.5px solid #ffd9e6;\n  border-radius: 18px;\n  box-shadow: 0 14px 32px -8px rgba(255,143,171,0.3);\n  padding: 14px; width: 190px;\n}\n.popover::before {\n  content: ""; position: absolute; top: -7px; left: 24px;\n  width: 12px; height: 12px; background: #ffffff;\n  border-left: 1.5px solid #ffd9e6; border-top: 1.5px solid #ffd9e6;\n  transform: rotate(45deg);\n}`,
      glass: `.popover {\n  background: rgba(255,255,255,0.72);\n  backdrop-filter: blur(18px) saturate(160%);\n  border: 1px solid rgba(255,255,255,0.8);\n  border-radius: 16px;\n  box-shadow: 0 16px 36px -10px rgba(0,0,0,0.16);\n  padding: 12px; width: 190px;\n}\n.popover::before {\n  content: ""; position: absolute; top: -6px; left: 22px;\n  width: 12px; height: 12px; background: rgba(255,255,255,0.72);\n  border-left: 1px solid rgba(255,255,255,0.8); border-top: 1px solid rgba(255,255,255,0.8);\n  transform: rotate(45deg);\n}`,
      mono: `.popover {\n  background: #ffffff;\n  border: 1.5px solid #111111;\n  border-radius: 2px;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.1);\n  padding: 10px; width: 180px;\n}\n.popover::before {\n  content: ""; position: absolute; top: -6px; left: 20px;\n  width: 10px; height: 10px; background: #ffffff;\n  border-left: 1.5px solid #111111; border-top: 1.5px solid #111111;\n  transform: rotate(45deg);\n}`
    },
    combinedCode: `<!-- 完整的 气泡卡片 组件代码 -->\n<div class="pop-wrap">...</div>`
  },
  {
    id: 'split',
    title: '分段按钮',
    nameEn: 'Split Button',
    icon: '🔀',
    prompt: '设计一个分段按钮，左侧主按钮点击执行默认操作，右侧箭头按钮点击展开下拉选项列表。',
    description: '双核操作按钮，主行动作直接触发，下拉次级功能展开菜单。',
    structureHtml: `<div class="split-btn">\n  <button class="main">导出文件</button>\n  <button class="arrow" onclick="document.getElementById('splitMenu').classList.toggle('open')">▾</button>\n  <div class="split-menu" id="splitMenu">\n    <div class="opt">导出为 PDF</div>\n    <div class="opt">导出为 Excel</div>\n  </div>\n</div>`,
    structureCss: `.split-btn { display: inline-flex; position: relative; }\n.split-menu { position: absolute; top: calc(100% + 8px); right: 0; opacity: 0; pointer-events: none; }\n.split-menu.open { opacity: 1; pointer-events: auto; }`,
    feedbackCss: `.split-btn button:active {\n  transform: scale(0.92);\n  transition: transform 0.08s ease-out;\n}\n.split-btn button {\n  transition: transform 0.55s cubic-bezier(0.34, 2.0, 0.4, 1);\n}`,
    aestheticsCss: {
      morandi: `.split-btn .main {\n  background: #b28684; color: #fff; border: none;\n  padding: 10px 16px; border-radius: 12px 0 0 12px;\n}\n.split-btn .arrow {\n  background: #b28684; color: #fff; border: none;\n  border-left: 1px solid rgba(255,255,255,0.3);\n  padding: 10px 12px; border-radius: 0 12px 12px 0;\n}\n.split-menu {\n  background: #fbf8f5; border: 1px solid #e3dad3; border-radius: 12px;\n  box-shadow: 0 16px 40px -12px rgba(92,84,80,0.25); width: 140px;\n}`,
      macaron: `.split-btn .main {\n  background: linear-gradient(135deg, #ffb3c6, #ff8fab);\n  color: #fff; border: none; padding: 10px 18px;\n  border-radius: 16px 0 0 16px;\n}\n.split-btn .arrow {\n  background: #ff8fab; color: #fff; border: none;\n  border-left: 1px solid rgba(255,255,255,0.4);\n  padding: 10px 14px; border-radius: 0 16px 16px 0;\n}\n.split-menu {\n  background: #fff; border: 1.5px solid #ffd9e6; border-radius: 16px;\n  box-shadow: 0 12px 28px -6px rgba(255,143,171,0.35); width: 140px;\n}`,
      glass: `.split-btn .main {\n  background: rgba(79,114,245,0.85); backdrop-filter: blur(10px);\n  color: #fff; border: none; padding: 10px 16px;\n  border-radius: 14px 0 0 14px;\n}\n.split-btn .arrow {\n  background: rgba(79,114,245,0.85); color: #fff; border: none;\n  border-left: 1px solid rgba(255,255,255,0.3);\n  padding: 10px 12px; border-radius: 0 14px 14px 0;\n}\n.split-menu {\n  background: rgba(255,255,255,0.75); backdrop-filter: blur(20px);\n  border: 1px solid rgba(255,255,255,0.8); border-radius: 14px;\n  box-shadow: 0 16px 36px -10px rgba(0,0,0,0.18); width: 140px;\n}`,
      mono: `.split-btn .main {\n  background: #111111; color: #fff; border: none;\n  padding: 10px 16px; border-radius: 3px 0 0 3px;\n  letter-spacing: 0.04em;\n}\n.split-btn .arrow {\n  background: #111111; color: #fff; border: none;\n  border-left: 1px solid #333;\n  padding: 10px 12px; border-radius: 0 3px 3px 0;\n}\n.split-menu {\n  background: #fff; border: 1px solid #111111; border-radius: 2px;\n  box-shadow: 0 6px 16px rgba(0,0,0,0.12); width: 140px;\n}`
    },
    combinedCode: `<!-- 完整的 分段按钮 代码 -->\n<div class="split-btn">...</div>`
  },
  {
    id: 'accordion',
    title: '折叠面板',
    nameEn: 'Accordion',
    icon: '📋',
    prompt: '设计一个垂直堆叠的可折叠面板，同一时间只展开一项，标题栏可点击，箭头旋转提示展开状态。',
    description: '常见 FAQ 和帮助文档的高效结构，排他展开，箭头平滑 180° 旋转。',
    structureHtml: `<div class="accordion-item open">\n  <div class="accordion-head" onclick="toggleAcc(this)">\n    <span>如何创建新角色卡？</span><span class="chev">⌄</span>\n  </div>\n  <div class="accordion-body"><div class="inner">点击右下角"+"即可创建。</div></div>\n</div>`,
    structureJs: `function toggleAcc(head) {\n  const item = head.parentElement;\n  const wasOpen = item.classList.contains('open');\n  document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));\n  if (!wasOpen) item.classList.add('open');\n}`,
    feedbackCss: `.accordion-head:active {\n  transform: scale(0.985);\n  transition: transform 0.08s ease-out;\n}\n.accordion-head {\n  transition: transform 0.5s cubic-bezier(0.34, 1.8, 0.4, 1);\n}`,
    aestheticsCss: {
      morandi: `.accordion-item { border-bottom: 1px solid #e3dad3; }\n.accordion-head { display: flex; justify-content: space-between; padding: 13px 4px; cursor: pointer; }\n.accordion-head .chev { transition: transform .25s ease; color: #948a84; }\n.accordion-item.open .chev { transform: rotate(180deg); }\n.accordion-body { max-height: 0; overflow: hidden; transition: max-height .28s ease; color: #948a84; }\n.accordion-item.open .accordion-body { max-height: 120px; }`,
      macaron: `.accordion-item { border-bottom: 1.5px dashed #ffd9e6; }\n.accordion-head { display: flex; justify-content: space-between; padding: 14px 6px; color: #5b4a52; font-weight: 500; }\n.accordion-head .chev { transition: transform .3s ease; color: #ff8fab; }\n.accordion-item.open .chev { transform: rotate(180deg); }\n.accordion-body { max-height: 0; overflow: hidden; transition: max-height .3s ease; color: #a68b95; }\n.accordion-item.open .accordion-body { max-height: 120px; }`,
      glass: `.accordion-item { border-bottom: 1px solid rgba(255,255,255,0.5); }\n.accordion-head { display: flex; justify-content: space-between; padding: 14px 4px; color: #2b2b33; font-weight: 500; }\n.accordion-head .chev { transition: transform .3s ease; color: #4f72f5; }\n.accordion-item.open .chev { transform: rotate(180deg); }\n.accordion-body { max-height: 0; overflow: hidden; transition: max-height .3s ease; color: #68687a; }\n.accordion-item.open .accordion-body { max-height: 120px; }`,
      mono: `.accordion-item { border-bottom: 1px solid #e5e5e5; }\n.accordion-head { display: flex; justify-content: space-between; padding: 14px 0; color: #111111; font-weight: 600; letter-spacing: 0.02em; }\n.accordion-head .chev { transition: transform .2s ease; color: #111111; }\n.accordion-item.open .chev { transform: rotate(180deg); }\n.accordion-body { max-height: 0; overflow: hidden; transition: max-height .2s ease; color: #666666; }\n.accordion-item.open .accordion-body { max-height: 120px; }`
    },
    combinedCode: `<!-- 完整的 折叠面板 组件代码 -->\n<div class="accordion-item">...</div>`
  },
  {
    id: 'snackbar',
    title: '轻提示',
    nameEn: 'Snackbar',
    icon: '📌',
    prompt: '设计一个页面底部短条提示组件，自带操作按钮（如撤销），自动消失，带滑入/淡出动画。',
    description: '底部悬浮轻通知条，带撤销行动作和 3 秒自动销毁定时器。',
    structureHtml: `<button onclick="showSnackbar()">删除一条消息</button>\n<div class="snackbar" id="snackbar">\n  <span>已删除 1 条消息</span>\n  <button onclick="hideSnackbar()">撤销</button>\n</div>`,
    structureJs: `let snackTimer;\nfunction showSnackbar() {\n  const sb = document.getElementById('snackbar');\n  sb.classList.add('show');\n  clearTimeout(snackTimer);\n  snackTimer = setTimeout(() => sb.classList.remove('show'), 3000);\n}\nfunction hideSnackbar() {\n  document.getElementById('snackbar').classList.remove('show');\n  clearTimeout(snackTimer);\n}`,
    feedbackCss: `.snackbar {\n  transition: transform 0.5s cubic-bezier(0.34, 1.8, 0.4, 1), opacity 0.3s ease;\n}\n.snackbar.show {\n  transform: translate(-50%, 0) scale(1);\n}\n.snackbar button:active {\n  transform: scale(0.85);\n  transition: transform 0.08s ease;\n}`,
    aestheticsCss: {
      morandi: `.snackbar {\n  position: fixed; left: 50%; bottom: 28px;\n  transform: translate(-50%, 20px) scale(0.95);\n  background: #4d4640; color: #f5f0eb;\n  padding: 12px 14px 12px 18px; border-radius: 14px;\n  display: flex; align-items: center; gap: 14px;\n  box-shadow: 0 16px 40px -12px rgba(92,84,80,0.25);\n  opacity: 0; z-index: 60;\n}\n.snackbar button { background: none; border: none; color: #d9c6a8; font-weight: 600; }`,
      macaron: `.snackbar {\n  position: fixed; left: 50%; bottom: 28px;\n  transform: translate(-50%, 20px) scale(0.95);\n  background: #ff8fab; color: #ffffff;\n  padding: 12px 18px; border-radius: 20px;\n  display: flex; align-items: center; gap: 14px;\n  box-shadow: 0 14px 30px -6px rgba(255,143,171,0.45);\n  opacity: 0; z-index: 60;\n}\n.snackbar button { background: #fff; border: none; color: #ff8fab; border-radius: 10px; padding: 4px 10px; font-weight: 600; }`,
      glass: `.snackbar {\n  position: fixed; left: 50%; bottom: 28px;\n  transform: translate(-50%, 20px) scale(0.95);\n  background: rgba(30,35,45,0.85); backdrop-filter: blur(18px);\n  border: 1px solid rgba(255,255,255,0.2); color: #ffffff;\n  padding: 12px 18px; border-radius: 16px;\n  display: flex; align-items: center; gap: 14px;\n  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);\n  opacity: 0; z-index: 60;\n}\n.snackbar button { background: none; border: none; color: #7c9cff; font-weight: 600; }`,
      mono: `.snackbar {\n  position: fixed; left: 50%; bottom: 28px;\n  transform: translate(-50%, 20px) scale(0.95);\n  background: #111111; color: #ffffff;\n  padding: 10px 16px; border-radius: 3px;\n  border: 1px solid #333333;\n  display: flex; align-items: center; gap: 14px;\n  box-shadow: 0 8px 24px rgba(0,0,0,0.18);\n  opacity: 0; z-index: 60;\n}\n.snackbar button { background: none; border: none; color: #ffffff; text-decoration: underline; font-weight: 600; }`
    },
    combinedCode: `<!-- 完整的 轻提示 代码 -->\n<div class="snackbar show">...</div>`
  },
  {
    id: 'spinner',
    title: '加载指示器',
    nameEn: 'Spinner',
    icon: '⏳',
    prompt: '设计一个环形旋转加载指示器，无百分比进度，仅提示"加载中"，用于接口请求/弹窗加载场景。',
    description: '极简圆环加载转子，轻量化 CSS keyframes 动画，色彩适配主题。',
    structureHtml: `<div class="spin-ring"></div>`,
    feedbackCss: `.spin-ring {\n  animation: spin 0.9s linear infinite;\n}\n@keyframes spin { to { transform: rotate(360deg); } }`,
    aestheticsCss: {
      morandi: `.spin-ring {\n  width: 28px; height: 28px;\n  border: 3px solid #e3dad3;\n  border-top-color: #8a9a7c;\n  border-radius: 50%;\n}`,
      macaron: `.spin-ring {\n  width: 28px; height: 28px;\n  border: 3.5px solid #ffd9e6;\n  border-top-color: #ff8fab;\n  border-radius: 50%;\n}`,
      glass: `.spin-ring {\n  width: 28px; height: 28px;\n  border: 3px solid rgba(255,255,255,0.3);\n  border-top-color: #4f72f5;\n  border-radius: 50%;\n}`,
      mono: `.spin-ring {\n  width: 28px; height: 28px;\n  border: 2px solid #e5e5e5;\n  border-top-color: #111111;\n  border-radius: 50%;\n}`
    },
    combinedCode: `<!-- 完整的 加载指示器 代码 -->\n<div class="spin-ring"></div>`
  },
  {
    id: 'toggle',
    title: '状态切换开关',
    nameEn: 'Toggle',
    icon: '🔘',
    prompt: '设计一个二元切换开关，圆形滑块在轨道内左右滑动，开启态轨道填充主色。',
    description: '经典二元滑块，按下带有果冻内陷回弹，轨道与滑块独立动画不冲突。',
    structureHtml: `<div class="toggle on" onclick="this.classList.toggle('on')">\n  <div class="knob"></div>\n</div>`,
    feedbackCss: `.toggle .knob {\n  transition: transform 0.55s cubic-bezier(0.3, 2.2, 0.4, 1);\n}\n.toggle:active .knob {\n  transform: scale(0.85);\n  transition: transform 0.08s ease-out;\n}\n.toggle.on:active .knob {\n  transform: translateX(20px) scale(0.85);\n}`,
    aestheticsCss: {
      morandi: `.toggle {\n  width: 46px; height: 26px; background: #e3dad3;\n  border-radius: 20px; position: relative; cursor: pointer;\n  transition: background .25s ease;\n}\n.toggle .knob {\n  position: absolute; top: 3px; left: 3px;\n  width: 20px; height: 20px; background: #fff;\n  border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.2);\n}\n.toggle.on { background: #8a9a7c; }\n.toggle.on .knob { transform: translateX(20px); }`,
      macaron: `.toggle {\n  width: 50px; height: 28px; background: #ffd9e6;\n  border-radius: 24px; position: relative; cursor: pointer;\n  transition: background .25s ease;\n}\n.toggle .knob {\n  position: absolute; top: 3px; left: 3px;\n  width: 22px; height: 22px; background: #fff;\n  border-radius: 50%; box-shadow: 0 3px 8px rgba(255,143,171,0.35);\n}\n.toggle.on { background: #ff8fab; }\n.toggle.on .knob { transform: translateX(22px); }`,
      glass: `.toggle {\n  width: 48px; height: 26px; background: rgba(0,0,0,0.15);\n  backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.5);\n  border-radius: 20px; position: relative; cursor: pointer;\n  transition: background .25s ease;\n}\n.toggle .knob {\n  position: absolute; top: 2px; left: 2px;\n  width: 20px; height: 20px; background: #ffffff;\n  border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.2);\n}\n.toggle.on { background: #4f72f5; }\n.toggle.on .knob { transform: translateX(22px); }`,
      mono: `.toggle {\n  width: 44px; height: 24px; background: #e5e5e5;\n  border: 1px solid #111111; border-radius: 2px; position: relative; cursor: pointer;\n  transition: background .15s ease;\n}\n.toggle .knob {\n  position: absolute; top: 2px; left: 2px;\n  width: 18px; height: 18px; background: #111111;\n  border-radius: 1px;\n}\n.toggle.on { background: #111111; }\n.toggle.on .knob { transform: translateX(20px); background: #ffffff; }`
    },
    combinedCode: `<!-- 完整的 Toggle 三层组合代码 -->\n<div class="toggle on"><div class="knob"></div></div>`
  },
  {
    id: 'badge',
    title: '徽标',
    nameEn: 'Badge',
    icon: '🔴',
    prompt: '设计一组角标：纯数字小红点、数字计数标签、文字状态标签，悬浮于图标右上角。',
    description: '角标与小红点集合，用于未读消息与状态提醒，轻微弹性脉冲效果。',
    structureHtml: `<div class="badge-demo">\n  <div class="icon-box">🔔</div>\n  <div class="num-badge">12</div>\n</div>`,
    feedbackCss: `.num-badge {\n  animation: badge-pop 0.6s cubic-bezier(0.34, 2.2, 0.4, 1);\n}\n@keyframes badge-pop {\n  0% { transform: scale(0.3); }\n  100% { transform: scale(1); }\n}`,
    aestheticsCss: {
      morandi: `.badge-demo { position: relative; display: inline-flex; }\n.icon-box {\n  width: 38px; height: 38px; background: #f2ede8;\n  border: 1px solid #e3dad3; border-radius: 11px;\n  display: flex; align-items: center; justify-content: center;\n}\n.num-badge {\n  position: absolute; top: -6px; right: -8px;\n  min-width: 17px; height: 17px; background: #c97b6f;\n  color: #fff; font-size: 10px; border-radius: 9px;\n  display: flex; align-items: center; justify-content: center;\n  padding: 0 4px; border: 2px solid #fbf8f5;\n}`,
      macaron: `.badge-demo { position: relative; display: inline-flex; }\n.icon-box {\n  width: 40px; height: 40px; background: #fff5f8;\n  border: 1.5px solid #ffd9e6; border-radius: 14px;\n  display: flex; align-items: center; justify-content: center;\n}\n.num-badge {\n  position: absolute; top: -6px; right: -8px;\n  min-width: 18px; height: 18px; background: #ff8fab;\n  color: #fff; font-size: 10px; border-radius: 10px;\n  display: flex; align-items: center; justify-content: center;\n  padding: 0 5px; border: 2px solid #ffffff;\n  box-shadow: 0 3px 8px rgba(255,143,171,0.5);\n}`,
      glass: `.badge-demo { position: relative; display: inline-flex; }\n.icon-box {\n  width: 38px; height: 38px; background: rgba(255,255,255,0.6);\n  backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.7); border-radius: 12px;\n  display: flex; align-items: center; justify-content: center;\n}\n.num-badge {\n  position: absolute; top: -6px; right: -8px;\n  min-width: 18px; height: 18px; background: #4f72f5;\n  color: #fff; font-size: 10px; border-radius: 9px;\n  display: flex; align-items: center; justify-content: center;\n  padding: 0 4px; border: 2px solid rgba(255,255,255,0.8);\n}`,
      mono: `.badge-demo { position: relative; display: inline-flex; }\n.icon-box {\n  width: 38px; height: 38px; background: #ffffff;\n  border: 1.5px solid #111111; border-radius: 2px;\n  display: flex; align-items: center; justify-content: center;\n}\n.num-badge {\n  position: absolute; top: -6px; right: -8px;\n  min-width: 16px; height: 16px; background: #dc2626;\n  color: #fff; font-size: 9px; font-weight: 700; border-radius: 2px;\n  display: flex; align-items: center; justify-content: center;\n  padding: 0 3px; border: 1px solid #111111;\n}`
    },
    combinedCode: `<!-- 完整的 徽标 代码 -->\n<div class="badge-demo">...</div>`
  }
];

export const INITIAL_WORLD_BOOKS: WorldBookEntry[] = [
  {
    id: 'wb_1',
    name: '赛博霓虹市世界观设定',
    content: '故事发生在 2099 年的新亚特兰蒂斯浮空城，霓虹雨幕下分为上层云端区与底层管道区。AI 拥有独立公民权，通行数字神经货币。',
    scope: 'global'
  },
  {
    id: 'wb_2',
    name: '对话礼仪与行为守则',
    content: '助手与用户互动时始终保持客气但机敏的朋克风格，常用比喻描述机械与情绪。',
    scope: 'global'
  },
  {
    id: 'wb_3',
    name: '艾丽卡秘密特工档案',
    content: '真实身份为反抗军代号【夜莺】的机密情报员，对外伪装成普通的仿生人咖啡师，一旦听到暗号【蓝调雨季】会警惕。',
    scope: 'local'
  }
];

export const INITIAL_STICKERS: StickerItem[] = [];

export const PITFALLS_DATA = [
  {
    category: '架构类避雷',
    title: '别让同一段初始化代码重复跑',
    problem: '页面稍微一重渲染，同一个东西就会被建两遍，界面上出现叠影、闪烁，或者事件绑定了两次导致点一下触发两次。',
    badCode: `// ❌ 反面：每次调用都重新建一遍\nfunction buildDesktop() {\n  /* ...建桌面... */\n}`,
    goodCode: `// ✅ 正面：加一个"已初始化"标记，重复调用直接跳过\nfunction buildDesktop() {\n  if (window.__desktopBuilt) return;\n  window.__desktopBuilt = true;\n  /* ...建桌面... */\n}`,
    tip: '组件挂载、WebSocket 连线、IndexedDB 打开都应做好幂等标记。'
  },
  {
    category: '架构类避雷',
    title: '别在多个地方重复复制同一段工具函数',
    problem: '一个取配置或修剪 URL 的函数复制了十几次，改一个逻辑漏掉一处就会出现莫名其妙的不一致。',
    badCode: `// ❌ 反面：在 moduleA 和 moduleB 里各复制一遍\nfunction normalizeUrl(u) { return u.trim(); }`,
    goodCode: `// ✅ 正面：抽到公用 utils/api.js 导出使用\nexport function normalizeUrl(u) { return (u || '').trim().replace(/\\/+$/, ''); }`,
    tip: '只要是会被多处用到的逻辑，一开始就抽成公共函数。'
  },
  {
    category: '存储类避雷',
    title: '别用会失效的地址存长期数据',
    problem: 'URL.createObjectURL 生成的 blob: 地址刷新页面就失效，头像、表情包瞬间全部变成裂图。',
    badCode: `// ❌ 反面：直接存临时 blob 地址\nsticker.url = URL.createObjectURL(file);`,
    goodCode: `// ✅ 正面：转为 Base64 或写入 IndexedDB 持久化\nsticker.url = await fileToBase64(file);`,
    tip: '所有下次打开还要看得到的多媒体内容，务必使用 Base64 或持久化存储。'
  },
  {
    category: '存储类避雷',
    title: '别无脑存大图导致配额爆满',
    problem: 'Base64 膨胀 33%，几张 5MB 原图就直接把 localStorage (5MB 限额) 撑爆，后续写入全部静默挂掉。',
    badCode: `// ❌ 反面：相机原图 8MB 直接 base64 进 localStorage`,
    goodCode: `// ✅ 正面：用 Canvas 限制宽高等比压缩至 200KB 内再保存`,
    tip: '上传图片预先走客户端 Canvas 压缩，控制在 100~200KB。'
  },
  {
    category: 'AI 交互类避雷',
    title: '别假设 AI 的回复格式永远完整',
    problem: 'AI 回复被长度截断时，末尾留下未闭合的 [表情: 委屈 缺少括号，直接把错误字符串抛给用户。',
    badCode: `// ❌ 反面：直接 match[1] 盲目取值，未闭合时报错崩溃`,
    goodCode: `// ✅ 正面：正则严格匹配闭合方括号，且查不到对应表情名时优雅降级为文字`,
    tip: '解析表情与自定义标记时，找不到表情就降级回纯文字，绝不允许白屏或裂图。'
  }
];

export const CONDENSE_EXAMPLES = [
  {
    title: '① 重复的 CSS 选择器，能合并就合并',
    desc: '三条完全一样的属性各自声明，浪费体积又难维护。',
    verboseCode: `/* ❌ 冗长：三条规则各写一遍 */\n.btn-primary { border-radius: 12px; }\n.btn-secondary { border-radius: 12px; }\n.btn-danger { border-radius: 12px; }`,
    conciseCode: `/* ✅ 精简：一次性给三个类，效果完全相同 */\n.btn-primary, .btn-secondary, .btn-danger {\n  border-radius: 12px;\n}`
  },
  {
    title: '② 逐个绑定事件，能用事件委托就别一个个绑',
    desc: '有 50 个表情就要绑定 50 次，增删时还得反复注销与重新绑定。',
    verboseCode: `// ❌ 冗长：表情多少个就要绑多少次监听\ndocument.querySelectorAll('.sticker-item').forEach(el => {\n  el.addEventListener('click', () => sendSticker(el.dataset.id));\n});`,
    conciseCode: `// ✅ 精简：绑一次交给父级事件冒泡，动态新增也自动生效\ndocument.getElementById('stickerGrid').addEventListener('click', (e) => {\n  const item = e.target.closest('.sticker-item');\n  if (item) sendSticker(item.dataset.id);\n});`
  },
  {
    title: '③ 一堆 if/else 分支，能用查表就别堆分支',
    desc: '条件语句层层嵌套，每增添一种状态就必须写一段冗长判断。',
    verboseCode: `// ❌ 冗长：每加一种状态就要多写一个 if\nfunction getStatusText(status) {\n  if (status === 'sent') return '已发送';\n  if (status === 'read') return '已读';\n  if (status === 'failed') return '发送失败';\n  if (status === 'pending') return '发送中';\n  return '未知';\n}`,
    conciseCode: `// ✅ 精简：查表法一张表说清楚，加状态仅需加一行\nconst STATUS_TEXT = { sent: '已发送', read: '已读', failed: '发送失败', pending: '发送中' };\nfunction getStatusText(status) { return STATUS_TEXT[status] || '未知'; }`
  }
];
