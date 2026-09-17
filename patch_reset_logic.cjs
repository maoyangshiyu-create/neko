const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

const targetStr = `
    printToast(' 已重置本局进度，重新开始推演！');
    
    // Slight delay to let states settle before sending
    setTimeout(() => {
      handleSendAction(starterText, true);
    }, 100);`;

const newTargetStr = `
    printToast(' 已清空本局聊天记录与状态，请重新开始推演！');
    // Note: Do not automatically send the starter text or let AI generate. Let the user initiate.`;

content = content.replace(targetStr, newTargetStr);
fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated reset logic");
