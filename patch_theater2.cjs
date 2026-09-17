const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

const colorMap = {
  // Common Dark UI to Theme
  'bg-zinc-950/90': 'bg-[var(--global-bg)]/90 backdrop-blur-md',
  'bg-zinc-950': 'bg-[var(--global-bg)]',
  'bg-zinc-900/90': 'bg-[var(--global-card)]/90',
  'bg-zinc-900/40': 'bg-[var(--global-card)]/40',
  'bg-zinc-900': 'bg-[var(--global-card)]',
  'bg-zinc-800': 'bg-[var(--global-line)]/50',
  'bg-zinc-700': 'bg-[var(--global-line)]',
  
  'hover:bg-zinc-900': 'hover:bg-[var(--global-card)]',
  'hover:bg-zinc-800': 'hover:bg-[var(--global-line)]',
  'hover:bg-zinc-700': 'hover:bg-[var(--global-line)]',

  'border-zinc-900/60': 'border-[var(--global-line)]/60',
  'border-zinc-900': 'border-[var(--global-line)]',
  'border-zinc-800/80': 'border-[var(--global-line)]/80',
  'border-zinc-800/60': 'border-[var(--global-line)]/60',
  'border-zinc-800': 'border-[var(--global-line)]',
  'hover:border-zinc-700': 'hover:border-[var(--global-line)]',
  'border-zinc-700': 'border-[var(--global-line)]',

  'text-zinc-600': 'text-[var(--global-text-soft)]',
  'text-zinc-500': 'text-[var(--global-text-soft)]',
  'text-zinc-400': 'text-[var(--global-text-soft)]',
  'text-zinc-300': 'text-[var(--global-text)]',
  'text-zinc-200': 'text-[var(--global-text)]',
  'text-zinc-100': 'text-[var(--global-text)]',

  // Black backgrounds
  'bg-black/90': 'bg-[var(--global-bg)]/90',
  'bg-black/85': 'bg-[var(--global-bg)]/85',
  'bg-black/80': 'bg-[var(--global-bg)]/80',
  'bg-black/60': 'bg-[var(--global-bg)]/60',
  'bg-black/40': 'bg-[var(--global-card)]/40',
  'bg-black': 'bg-[var(--global-card)]',

  // Purple accents (GM / game highlights)
  'bg-purple-950/40': 'bg-[var(--global-accent)]/20',
  'bg-purple-900/90': 'bg-[var(--global-accent)]/90',
  'bg-purple-900/40': 'bg-[var(--global-accent)]/30',
  'bg-purple-800/80': 'bg-[var(--global-accent)]/50',
  'bg-purple-500/15': 'bg-[var(--global-accent)]/15',
  'bg-purple-500/10': 'bg-[var(--global-accent)]/10',
  'bg-purple-500/20': 'bg-[var(--global-accent)]/20',
  
  'border-purple-800/40': 'border-[var(--global-accent)]/40',
  'border-purple-600/60': 'border-[var(--global-accent)]/60',
  'border-purple-500/10': 'border-[var(--global-line)]', // subtle borders often line color instead
  'border-purple-500/20': 'border-[var(--global-accent)]/20',
  'border-purple-500/25': 'border-[var(--global-accent)]/25',
  'border-purple-500/30': 'border-[var(--global-accent)]/30',
  
  'text-purple-400': 'text-[var(--global-accent)]',
  'text-purple-300': 'text-[var(--global-accent)]',
  'text-purple-200': 'text-[var(--global-text)]',
  'text-purple-100': 'text-[var(--global-text)]',

  // Self messages or highlights (amber/rose)
  'text-amber-500': 'text-[var(--global-text)]',
  'text-amber-400': 'text-[var(--global-text)]',
  
  'bg-rose-500/10': 'bg-[var(--global-accent)]/10',
  'border-rose-500/20': 'border-[var(--global-accent)]/20',
  'text-rose-300': 'text-[var(--global-accent)]',
  'text-rose-200': 'text-[var(--global-text-soft)]',

  // General text
  'text-gray-300': 'text-[var(--global-text)]',
  'text-gray-600': 'text-[var(--global-text-soft)]',
  'hover:text-gray-200': 'hover:text-[var(--global-text)]',
  'hover:text-white': 'hover:text-[var(--global-text)]'
};

for (const [oldClass, newClass] of Object.entries(colorMap)) {
  content = content.split(oldClass).join(newClass);
}

fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated TheaterApp.tsx part 2");
