const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

content = content.replace(/const \[playerGender, setPlayerGender\] = useState\('男'\);/, "const [playerGender, setPlayerGender] = useState('女');");

fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated default gender in TheaterApp");
