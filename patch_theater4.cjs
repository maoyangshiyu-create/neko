const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

const colorMap = {
  'text-gray-100': 'text-[var(--global-text)]',
  'text-gray-200': 'text-[var(--global-text)]',
  'text-gray-500': 'text-[var(--global-text-soft)]',
  'text-gray-400': 'text-[var(--global-text-soft)]',
  'text-gray-600': 'text-[var(--global-text-soft)]',
  'text-gray-300': 'text-[var(--global-text)]'
};

for (const [oldClass, newClass] of Object.entries(colorMap)) {
  content = content.split(oldClass).join(newClass);
}

fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated TheaterApp.tsx part 4");
