const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

// Insert a CrystalBall SVG component at the top
const crystalBallCode = `
const CrystalBall = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="10" r="7"/>
    <path d="M14.1 17.6c-1.3.8-2.9.8-4.2 0"/>
    <path d="M9 20h6"/>
    <path d="M12 20v2"/>
    <path d="M10 22h4"/>
  </svg>
);
`;

content = content.replace(/const CAMPAIGN_PRESETS/, crystalBallCode + '\nconst CAMPAIGN_PRESETS');

// Now, wherever playerStats.atmosphere is rendered, let's replace "🔮" or "自定氛围" 
// Actually, let's just do it in the render block.
fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Added CrystalBall SVG");
