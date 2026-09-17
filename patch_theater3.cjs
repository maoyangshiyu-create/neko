const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

const colorMap = {
  'bg-purple-600': 'bg-[var(--global-accent)]',
  'hover:bg-purple-500': 'hover:opacity-80',
  'bg-purple-900/25': 'bg-[var(--global-accent)]/15',
  'border-purple-500': 'border-[var(--global-accent)]/30',
  'bg-purple-400': 'bg-[var(--global-accent)]',
  'bg-purple-500': 'bg-[var(--global-accent)]',
  'text-amber-300': 'text-[var(--global-accent)]',
  'text-rose-400': 'text-red-400',
  'hover:text-rose-400': 'hover:text-red-400',
};

for (const [oldClass, newClass] of Object.entries(colorMap)) {
  content = content.split(oldClass).join(newClass);
}

fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated TheaterApp.tsx part 3");
