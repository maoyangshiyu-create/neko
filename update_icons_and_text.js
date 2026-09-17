const fs = require('fs');

// 1. ChatRoom.tsx
let chatRoom = fs.readFileSync('src/components/phone/wechat/ChatRoom.tsx', 'utf8');
chatRoom = chatRoom.replace(
  /<span\s*className="font-semibold cursor-pointer"\s*style=\{\{\s*color: activeTheme\?.css\?\.\['--gg-file-action-color'\] \|\| activeTheme\?.css\?\.\['--gg-file-icon-color'\] \|\| '#2563eb'\s*\}\}\s*>\s*点击查看\s*<\/span>/g,
  ''
);
chatRoom = chatRoom.replace(
  /<div className="flex justify-between items-center text-\[10px\] opacity-75">\s*<span>\{msg\.fileSize \|\| '文档'\}<\/span>\s*<\/div>/g,
  '<span>{msg.fileSize || "文档"}</span>'
);
fs.writeFileSync('src/components/phone/wechat/ChatRoom.tsx', chatRoom);
console.log('ChatRoom updated');

// 2. DIYWorkshop.tsx
let diy = fs.readFileSync('src/components/phone/DIYWorkshop.tsx', 'utf8');
diy = diy.replace(
  /<span\s*className="font-semibold cursor-pointer"\s*style=\{\{\s*color: editingTheme\.css\?\.\['--gg-file-action-color'\] \|\| editingTheme\.css\?\.\['--gg-file-icon-color'\] \|\| '#2563eb'\s*\}\}\s*>\s*点击查看\s*<\/span>/g,
  ''
);
diy = diy.replace(
  /<div className="flex justify-between items-center text-\[8\.5px\] opacity-75">\s*<span>2\.4 MB<\/span>\s*<\/div>/g,
  '<span>2.4 MB</span>'
);
diy = diy.replace(/\s*'--gg-location-icon-char': \{ label: '定位图标 \(Emoji\/文字，如 📍\)', type: 'text' \},/g, '');
diy = diy.replace(/\s*'--gg-file-icon-char': \{ label: '文件图标 \(Emoji\/文字，如 📄\)', type: 'text' \},/g, '');
fs.writeFileSync('src/components/phone/DIYWorkshop.tsx', diy);
console.log('DIYWorkshop updated');

// 3. UnifiedBubble.tsx
let bubble = fs.readFileSync('src/components/phone/wechat/UnifiedBubble.tsx', 'utf8');

// For location
bubble = bubble.replace(
  /\{activeTheme\?.css\?\.\['--gg-location-icon-char'\] \?\s*\(\s*<span[^>]*>\{activeTheme\.css\['--gg-location-icon-char'\]\}<\/span>\s*\)\s*:\s*\(\s*<MapPin[^>]*\/>\s*\)\}/g,
  '<MapPin className="w-4 h-4" style={{ color: activeTheme?.css?.[\'--gg-location-icon-color\'] || \'#059669\' }} />'
);

// For file
bubble = bubble.replace(
  /\{activeTheme\?.css\?\.\['--gg-file-icon-char'\] \?\s*\(\s*<span[^>]*>\{activeTheme\.css\['--gg-file-icon-char'\]\}<\/span>\s*\)\s*:\s*\(\s*<FileText[^>]*\/>\s*\)\}/g,
  '<FileText className="w-4.5 h-4.5" />'
);

// check if there's any other references to icon-char
fs.writeFileSync('src/components/phone/wechat/UnifiedBubble.tsx', bubble);
console.log('UnifiedBubble updated');
