const fs = require('fs');
let content = fs.readFileSync('src/components/phone/DIYWorkshop.tsx', 'utf8');
content = content.replace(/MessageCircle\n} from 'lucide-react';/, "MessageCircle,\n  RefreshCw\n} from 'lucide-react';");
fs.writeFileSync('src/components/phone/DIYWorkshop.tsx', content);
