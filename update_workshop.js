const fs = require('fs');

let code = fs.readFileSync('src/components/phone/DIYWorkshop.tsx', 'utf8');

// 1. Update fields definitions in DIYWorkshop.tsx for proposal, wedding, divorce
// We can replace the fields object for these 3 sections.

// Let's find the fields for '浪漫求婚气泡'
const proposalOldFields = `  '浪漫求婚气泡': {
    icon: Heart,
    fields: {
      'proposalBgOther': { label: '求婚气泡背景图（对方，支持点九）', type: 'image' },
      'proposalBgSelf': { label: '求婚气泡背景图（我，支持点九）', type: 'image' },
      'proposalIcon': { label: '求婚左上角图标贴图', type: 'image' },
      '--gg-proposal-btn-yes-bg': { label: '「我愿意」按钮背景颜色', type: 'color' },
      '--gg-proposal-btn-yes-text': { label: '「我愿意」按钮文字颜色', type: 'color' },
      '--gg-proposal-btn-yes-icon': { label: '「我愿意」按钮图标 (可填Emoji/留空或填none去除)', type: 'text' },
      '--gg-proposal-btn-no-bg': { label: '「再想想」按钮背景颜色', type: 'color' },
      '--gg-proposal-btn-no-text': { label: '「再想想」按钮文字颜色', type: 'color' },
      '--gg-proposal-btn-no-icon': { label: '「再想想」按钮图标 (可填Emoji/留空或填none去除)', type: 'text' },
      '--gg-proposalOther-bg': { label: '对方求婚气泡背景颜色', type: 'color' },
      '--gg-proposalSelf-bg': { label: '我的求婚气泡背景颜色', type: 'color' },
      '--gg-proposalOther-text': { label: '对方求婚气泡文字颜色', type: 'color' },
      '--gg-proposalSelf-text': { label: '我的求婚气泡文字颜色', type: 'color' },
      '--gg-proposalOther-border': { label: '对方求婚气泡边框', type: 'border' },
      '--gg-proposalSelf-border': { label: '我的求婚气泡边框', type: 'border' },
      '--gg-proposal-icon-size': { label: '图标大小 (如 22px)', type: 'text' },
      '--gg-proposal-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },`;

const proposalNewFields = `  '浪漫求婚气泡': {
    icon: Heart,
    fields: {
      'proposalBgOther': { label: '求婚气泡背景图（对方，支持点九）', type: 'image' },
      'proposalBgSelf': { label: '求婚气泡背景图（我，支持点九）', type: 'image' },
      'proposalIcon': { label: '求婚左上角图标贴图', type: 'image' },
      '--gg-proposalOther-bg': { label: '对方求婚气泡背景颜色', type: 'color' },
      '--gg-proposalSelf-bg': { label: '我的求婚气泡背景颜色', type: 'color' },
      '--gg-proposalOther-border': { label: '对方求婚气泡边框', type: 'border' },
      '--gg-proposalSelf-border': { label: '我的求婚气泡边框', type: 'border' },
      '--gg-proposalOther-text': { label: '对方求婚气泡文字颜色', type: 'color' },
      '--gg-proposalSelf-text': { label: '我的求婚气泡文字颜色', type: 'color' },
      '--gg-proposal-btn-yes-bg': { label: '「我愿意」按钮背景颜色', type: 'color' },
      '--gg-proposal-btn-yes-text': { label: '「我愿意」按钮文字颜色', type: 'color' },
      '--gg-proposal-btn-yes-border': { label: '「我愿意」按钮边框', type: 'border' },
      '--gg-proposal-btn-no-bg': { label: '「再想想」按钮背景颜色', type: 'color' },
      '--gg-proposal-btn-no-text': { label: '「再想想」按钮文字颜色', type: 'color' },
      '--gg-proposal-btn-no-border': { label: '「再想想」按钮边框', type: 'border' },
      '--gg-proposal-icon-size': { label: '图标大小 (如 22px)', type: 'text' },
      '--gg-proposal-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },`;

const weddingNewFields = `  '婚礼仪式气泡': {
    icon: Sparkles,
    fields: {
      'weddingBgOther': { label: '婚礼气泡背景图（对方，支持点九）', type: 'image' },
      'weddingBgSelf': { label: '婚礼气泡背景图（我，支持点九）', type: 'image' },
      'weddingIcon': { label: '婚礼左上角图标贴图', type: 'image' },
      '--gg-weddingOther-bg': { label: '对方婚礼气泡背景颜色', type: 'color' },
      '--gg-weddingSelf-bg': { label: '我的婚礼气泡背景颜色', type: 'color' },
      '--gg-weddingOther-border': { label: '对方婚礼气泡边框', type: 'border' },
      '--gg-weddingSelf-border': { label: '我的婚礼气泡边框', type: 'border' },
      '--gg-weddingOther-text': { label: '对方婚礼气泡文字颜色', type: 'color' },
      '--gg-weddingSelf-text': { label: '我的婚礼气泡文字颜色', type: 'color' },
      '--gg-wedding-btn-enter-bg': { label: '「进入仪式」按钮背景颜色', type: 'color' },
      '--gg-wedding-btn-enter-text': { label: '「进入仪式」按钮文字颜色', type: 'color' },
      '--gg-wedding-btn-enter-border': { label: '「进入仪式」按钮边框', type: 'border' },
      '--gg-wedding-btn-chinese-bg': { label: '「中式」按钮背景颜色', type: 'color' },
      '--gg-wedding-btn-chinese-text': { label: '「中式」按钮文字颜色', type: 'color' },
      '--gg-wedding-btn-chinese-border': { label: '「中式」按钮边框', type: 'border' },
      '--gg-wedding-btn-western-bg': { label: '「西式」按钮背景颜色', type: 'color' },
      '--gg-wedding-btn-western-text': { label: '「西式」按钮文字颜色', type: 'color' },
      '--gg-wedding-btn-western-border': { label: '「西式」按钮边框', type: 'border' },
      '--gg-wedding-icon-size': { label: '图标大小 (如 22px)', type: 'text' },
      '--gg-wedding-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-wedding-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-wedding-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-wedding-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },`;

const divorceNewFields = `  '解约/离婚气泡': {
    icon: LogOut,
    fields: {
      'divorceBgOther': { label: '离婚气泡背景图（对方，支持点九）', type: 'image' },
      'divorceBgSelf': { label: '离婚气泡背景图（我，支持点九）', type: 'image' },
      'divorceIcon': { label: '离婚左上角图标贴图', type: 'image' },
      '--gg-divorceOther-bg': { label: '对方离婚气泡背景颜色', type: 'color' },
      '--gg-divorceSelf-bg': { label: '我的离婚气泡背景颜色', type: 'color' },
      '--gg-divorceOther-border': { label: '对方离婚气泡边框', type: 'border' },
      '--gg-divorceSelf-border': { label: '我的离婚气泡边框', type: 'border' },
      '--gg-divorceOther-text': { label: '对方离婚气泡文字颜色', type: 'color' },
      '--gg-divorceSelf-text': { label: '我的离婚气泡文字颜色', type: 'color' },
      '--gg-divorce-btn-yes-bg': { label: '「确定离婚」按钮背景颜色', type: 'color' },
      '--gg-divorce-btn-yes-text': { label: '「确定离婚」按钮文字颜色', type: 'color' },
      '--gg-divorce-btn-yes-border': { label: '「确定离婚」按钮边框', type: 'border' },
      '--gg-divorce-btn-no-bg': { label: '「不离了」按钮背景颜色', type: 'color' },
      '--gg-divorce-btn-no-text': { label: '「不离了」按钮文字颜色', type: 'color' },
      '--gg-divorce-btn-no-border': { label: '「不离了」按钮边框', type: 'border' },
      '--gg-divorce-icon-size': { label: '图标大小 (如 22px)', type: 'text' },
      '--gg-divorce-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-divorce-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-divorce-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-divorce-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },`;

// Replace blocks in code
// We can use regex to replace '浪漫求婚气泡' section, '婚礼仪式气泡' section, '解约/离婚气泡' section.
code = code.replace(/  '浪漫求婚气泡': \{[\s\S]*?\n  \},/, proposalNewFields);
code = code.replace(/  '婚礼仪式气泡': \{[\s\S]*?\n  \},/, weddingNewFields);
code = code.replace(/  '解约\/离婚气泡': \{[\s\S]*?\n  \},/, divorceNewFields);

// Also update preview buttons in DIYWorkshop.tsx for proposal, wedding, divorce:
// Remove emojis from button labels and support border + background colors properly.

// 1. Proposal Yes button text "❤️ 我愿意" -> "我愿意" and background/border style
code = code.replace(
  /className="flex-1 py-1 px-1.5 rounded-lg bg-rose-500 text-white font-bold text-\[7\.5px\] shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 transition-transform"/g,
  'className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"'
);
code = code.replace(
  /style=\{\{\s*color:\s*editingTheme\?.css\?\.\['--gg-proposal-btn-yes-text'\]\s*\|\|\s*'#ffffff'\s*\}\}/g,
  'style={{ backgroundColor: editingTheme?.css?.[\'--gg-proposal-btn-yes-bg\'] || \'#f43f5e\', color: editingTheme?.css?.[\'--gg-proposal-btn-yes-text\'] || \'#ffffff\', border: editingTheme?.css?.[\'--gg-proposal-btn-yes-border\'] || undefined }}'
);
code = code.replace(/>\s*❤️\s*我愿意\s*<\/span>/g, '>我愿意</span>');
code = code.replace(/>\s*❤️\s*我愿意\s*<\/button>/g, '>我愿意</button>');

// Proposal No button
code = code.replace(
  /className="flex-1 py-1 px-1.5 rounded-lg bg-stone-200 text-stone-700 font-bold text-\[7\.5px\] shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 transition-transform"/g,
  'className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"'
);
code = code.replace(
  /style=\{\{\s*color:\s*editingTheme\?.css\?\.\['--gg-proposal-btn-no-text'\]\s*\|\|\s*'#374151'\s*\}\}/g,
  'style={{ backgroundColor: editingTheme?.css?.[\'--gg-proposal-btn-no-bg\'] || \'#e7e5e4\', color: editingTheme?.css?.[\'--gg-proposal-btn-no-text\'] || \'#374151\', border: editingTheme?.css?.[\'--gg-proposal-btn-no-border\'] || undefined }}'
);
code = code.replace(/>\s*再想想\s*<\/span>/g, '>再想想</span>');
code = code.replace(/>\s*再想想\s*<\/button>/g, '>再想想</button>');

// Wedding Enter button
code = code.replace(
  /className="w-full py-1 px-1.5 rounded-lg bg-linear-to-r from-rose-500 to-pink-500 text-white font-bold text-\[7\.5px\] shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 transition-transform"/g,
  'className="w-full py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"'
);
code = code.replace(
  /style=\{\{\s*color:\s*editingTheme\?.css\?\.\['--gg-wedding-btn-enter-text'\]\s*\|\|\s*'#ffffff'\s*\}\}/g,
  'style={{ backgroundColor: editingTheme?.css?.[\'--gg-wedding-btn-enter-bg\'] || \'#ec4899\', color: editingTheme?.css?.[\'--gg-wedding-btn-enter-text\'] || \'#ffffff\', border: editingTheme?.css?.[\'--gg-wedding-btn-enter-border\'] || undefined }}'
);
code = code.replace(/>\s*💒\s*我愿意！进入婚礼仪式\s*<\/span>/g, '>我愿意！进入婚礼仪式</span>');
code = code.replace(/>\s*💒\s*我愿意！进入婚礼仪式\s*<\/button>/g, '>我愿意！进入婚礼仪式</button>');

// Wedding Chinese button
code = code.replace(
  /className="flex-1 py-1 px-1.5 rounded-lg bg-red-600 text-white font-bold text-\[7\.5px\] shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 transition-transform"/g,
  'className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"'
);
code = code.replace(
  /style=\{\{\s*color:\s*editingTheme\?.css\?\.\['--gg-wedding-btn-chinese-text'\]\s*\|\|\s*'#ffffff'\s*\}\}/g,
  'style={{ backgroundColor: editingTheme?.css?.[\'--gg-wedding-btn-chinese-bg\'] || \'#dc2626\', color: editingTheme?.css?.[\'--gg-wedding-btn-chinese-text\'] || \'#ffffff\', border: editingTheme?.css?.[\'--gg-wedding-btn-chinese-border\'] || undefined }}'
);
code = code.replace(/>\s*🏮\s*中式\s*<\/span>/g, '>中式</span>');
code = code.replace(/>\s*🏮\s*中式\s*<\/button>/g, '>中式</button>');

// Wedding Western button
code = code.replace(
  /className="flex-1 py-1 px-1.5 rounded-lg bg-blue-600 text-white font-bold text-\[7\.5px\] shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 transition-transform"/g,
  'className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"'
);
code = code.replace(
  /style=\{\{\s*color:\s*editingTheme\?.css\?\.\['--gg-wedding-btn-western-text'\]\s*\|\|\s*'#ffffff'\s*\}\}/g,
  'style={{ backgroundColor: editingTheme?.css?.[\'--gg-wedding-btn-western-bg\'] || \'#2563eb\', color: editingTheme?.css?.[\'--gg-wedding-btn-western-text\'] || \'#ffffff\', border: editingTheme?.css?.[\'--gg-wedding-btn-western-border\'] || undefined }}'
);
code = code.replace(/>\s*⛪\s*西式\s*<\/span>/g, '>西式</span>');
code = code.replace(/>\s*⛪\s*西式\s*<\/button>/g, '>西式</button>');

// Divorce Yes button
code = code.replace(
  /className="flex-1 py-1 px-1.5 rounded-lg bg-red-500 text-white font-bold text-\[7\.5px\] shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 transition-transform"/g,
  'className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"'
);
code = code.replace(
  /style=\{\{\s*color:\s*editingTheme\?.css\?\.\['--gg-divorce-btn-yes-text'\]\s*\|\|\s*'#ffffff'\s*\}\}/g,
  'style={{ backgroundColor: editingTheme?.css?.[\'--gg-divorce-btn-yes-bg\'] || \'#ef4444\', color: editingTheme?.css?.[\'--gg-divorce-btn-yes-text\'] || \'#ffffff\', border: editingTheme?.css?.[\'--gg-divorce-btn-yes-border\'] || undefined }}'
);
code = code.replace(/>\s*确定解除\s*<\/span>/g, '>确定解除</span>');
code = code.replace(/>\s*确定解除\s*<\/button>/g, '>确定解除</button>');

// Divorce No button
code = code.replace(
  /className="flex-1 py-1 px-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 font-bold text-\[7\.5px\] shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 transition-transform"/g,
  'className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"'
);
code = code.replace(
  /style=\{\{\s*color:\s*editingTheme\?.css\?\.\['--gg-divorce-btn-no-text'\]\s*\|\|\s*'#374151'\s*\}\}/g,
  'style={{ backgroundColor: editingTheme?.css?.[\'--gg-divorce-btn-no-bg\'] || \'#f5f5f4\', color: editingTheme?.css?.[\'--gg-divorce-btn-no-text\'] || \'#374151\', border: editingTheme?.css?.[\'--gg-divorce-btn-no-border\'] || undefined }}'
);
code = code.replace(/>\s*再想想\s*<\/span>/g, '>再想想</span>');
code = code.replace(/>\s*再想想\s*<\/button>/g, '>再想想</button>');

fs.writeFileSync('src/components/phone/DIYWorkshop.tsx', code, 'utf8');
console.log('DIYWorkshop updated successfully.');
