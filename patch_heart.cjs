const fs = require('fs');

const customHeart = `const CustomHeartSVG = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);
`;

const insertCustomHeart = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('CustomHeartSVG')) {
    // Insert after imports
    const importMatch = content.match(/import [^;]+;/g);
    const lastImport = importMatch ? importMatch[importMatch.length - 1] : '';
    content = content.replace(lastImport, lastImport + '\n\n' + customHeart);
  }
  return content;
};

// 1. UnifiedBubble.tsx
let ubContent = insertCustomHeart('src/components/phone/wechat/UnifiedBubble.tsx');
ubContent = ubContent.replace(/<Heart className="w-4 h-4 text-rose-500 fill-rose-500\/20" \/>/g, '<CustomHeartSVG className="w-4 h-4 text-rose-500 fill-rose-500/20" />');
fs.writeFileSync('src/components/phone/wechat/UnifiedBubble.tsx', ubContent);

// 2. ChatRoom.tsx
let crContent = insertCustomHeart('src/components/phone/wechat/ChatRoom.tsx');
crContent = crContent.replace(/<Heart className="w-4 h-4 text-rose-500 fill-rose-500\/20" \/>/g, '<CustomHeartSVG className="w-4 h-4 text-rose-500 fill-rose-500/20" />');
fs.writeFileSync('src/components/phone/wechat/ChatRoom.tsx', crContent);

// 3. DIYWorkshop.tsx
let dwContent = insertCustomHeart('src/components/phone/DIYWorkshop.tsx');
dwContent = dwContent.replace(/<Heart className="w-5 h-5 text-rose-500" \/>/g, '<CustomHeartSVG className="w-5 h-5 text-rose-500" />');
fs.writeFileSync('src/components/phone/DIYWorkshop.tsx', dwContent);

console.log("Replaced heart with custom SVG");
