const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

const oldCode = `<span>氛围：{playerStats.atmosphere || '探索中'}</span>`;
const newCode = `<span className="flex items-center gap-1">
                      氛围：{(playerStats.atmosphere || '探索中').replace(/🔮/g, '')}
                      {((playerStats.atmosphere || '').includes('🔮') || (playerStats.atmosphere || '').includes('自定氛围')) && (
                        <CrystalBall className="w-3.5 h-3.5" />
                      )}
                    </span>`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated atmosphere render");
