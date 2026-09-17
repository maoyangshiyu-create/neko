const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

// Remove emojis
const emojisToRemove = [
  '🧑‍🚀', '⚙️', '⚜️', '⚠️', '✅', '🎙️', '🎬', '🎭', '🎲', '👤', '💡', '💬', '💾', '📁', '📄', '📊', '📋', '📎', '📚', '📥', '📸', '🔄', '🔍', '🔓', '🔮', '🗑️', '🚪', '🛡️'
];

for (const emoji of emojisToRemove) {
  content = content.split(emoji).join('');
}

// Replace hardcoded color strings
const colorMap = {
  'bg-[#fdfbf7]': 'bg-[var(--global-bg)]',
  'text-[#5d4037]': 'text-[var(--global-text)]',
  'bg-[#fbf5e9]/80': 'bg-[var(--global-bg)]/80',
  'bg-[#fbf5e9]/70': 'bg-[var(--global-card)]',
  'bg-[#fbf5e9]': 'bg-[var(--global-card)]',
  'border-[#e6c9a8]': 'border-[var(--global-line)]',
  'text-[#8d6e63]': 'text-[var(--global-text-soft)]',
  'bg-[#e6c9a8]/30': 'bg-[var(--global-line)]/50',
  'bg-[#e6c9a8]/20': 'bg-[var(--global-line)]/30',
  'hover:bg-[#e6c9a8]/30': 'hover:bg-[var(--global-line)]/50',
  'hover:bg-[#e6c9a8]/20': 'hover:bg-[var(--global-line)]/30',
  'bg-[#f8bbd0]/40': 'bg-[var(--global-accent)]/20',
  'border-[#f8bbd0]': 'border-[var(--global-accent)]/30',
  'text-[#880e4f]': 'text-[var(--global-accent)]',
  'text-purple-200': 'text-[var(--global-text)]', // It was purple for title, changing to theme
  'text-gray-400': 'text-[var(--global-text-soft)]',
  'bg-[#d4af37]/10': 'bg-[var(--global-accent)]/10',
  'text-[#d4af37]': 'text-[var(--global-accent)]',
  'bg-[#d4af37]': 'bg-[var(--global-accent)]',
  'hover:bg-[#b8952f]': 'hover:opacity-80',
  'border-[#d4af37]/30': 'border-[var(--global-accent)]/30',
  'bg-[#d4af37]/20': 'bg-[var(--global-accent)]/20',
  'bg-[#0d0c10]': 'bg-[var(--global-bg)]', // chat bg
  'text-[#ffebee]': 'text-[var(--global-bg)]',
  'border-[#ffebee]/20': 'border-[var(--global-line)]',
  'bg-[#1a1720]': 'bg-[var(--global-card)]',
  'border-[#ffcdd2]/50': 'border-[var(--global-line)]',
  'bg-[#ffebee]': 'bg-[var(--global-card)]',
  'hover:bg-[#ffcdd2]/30': 'hover:bg-[var(--global-line)]/30',
  'bg-[#ffcdd2]/10': 'bg-[var(--global-line)]/10',
  'bg-[#ffcdd2]/30': 'bg-[var(--global-line)]/30',
  'text-emerald-500': 'text-[var(--global-accent)]',
  'text-[#ffcdd2]': 'text-[var(--global-text-soft)]',
  'border-white/10': 'border-[var(--global-line)]',
  'bg-white/5': 'bg-[var(--global-card)]/50',
  'text-white/40': 'text-[var(--global-text-soft)]',
  'text-white/60': 'text-[var(--global-text-soft)]',
  'text-white/80': 'text-[var(--global-text)]',
  'text-white': 'text-white', // Sometimes white is fine on accent button
  'bg-[#2a2632]': 'bg-[var(--global-line)]',
  'bg-[#1c1921]': 'bg-[var(--global-card)]',
  'border-[#e6c9a8]/30': 'border-[var(--global-line)]',
};

for (const [oldClass, newClass] of Object.entries(colorMap)) {
  content = content.split(oldClass).join(newClass);
}

fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated TheaterApp.tsx");
