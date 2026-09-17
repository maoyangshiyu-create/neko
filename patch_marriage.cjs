const fs = require('fs');
let content = fs.readFileSync('src/components/phone/MarriageCertificateApp.tsx', 'utf8');
content = content.replace(/<Heart className="w-4 h-4 text-rose-500 fill-rose-500\/40" \/>/, '');
fs.writeFileSync('src/components/phone/MarriageCertificateApp.tsx', content);
