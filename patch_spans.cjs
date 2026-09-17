const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

content = content.replace(
  /<span><\/span> 破甲指令/g,
  '<ShieldAlert className="w-3.5 h-3.5" /> 破甲指令'
);

content = content.replace(
  /<span><\/span> 激活的世界书/g,
  '<BookOpen className="w-3.5 h-3.5" /> 激活的世界书'
);

content = content.replace(
  /<span><\/span>\s*<span>温馨提示/g,
  '<Info className="w-3.5 h-3.5" />\n                  <span>温馨提示'
);

fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated spans");
