import fs from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 820" width="100%" height="100%">
  <defs>
    <!-- Background Pattern -->
    <pattern id="checkers" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#fdeecb" />
      <rect x="20" width="20" height="20" fill="#fcf6e8" />
      <rect y="20" width="20" height="20" fill="#fcf6e8" />
      <rect x="20" y="20" width="20" height="20" fill="#fdeecb" />
    </pattern>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fedaa2"/>
      <stop offset="100%" stop-color="#f5c784"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#4a3014" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="400" height="820" fill="#fbf3df"/>
  <rect width="400" height="820" fill="url(#checkers)" opacity="0.85"/>

  <!-- Decorative Ribbon / Streamers -->
  <path d="M-20,60 Q120,180 80,360 T40,680 T-10,830" fill="none" stroke="#fff" stroke-width="28" opacity="0.75" stroke-linecap="round"/>
  <path d="M-20,60 Q120,180 80,360 T40,680 T-10,830" fill="none" stroke="#e8a860" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>

  <path d="M420,80 Q280,240 320,440 T380,720" fill="none" stroke="#fff" stroke-width="32" opacity="0.75" stroke-linecap="round"/>
  <path d="M420,80 Q280,240 320,440 T380,720" fill="none" stroke="#e8a860" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>

  <!-- Cute Bread / Dog Doodles in Background -->
  <!-- Top Right Bread Dog -->
  <g transform="translate(310, 110) scale(0.75)" opacity="0.9">
    <ellipse cx="40" cy="40" rx="35" ry="30" fill="#f7ca7d" stroke="#5c3818" stroke-width="2.5"/>
    <ellipse cx="25" cy="20" rx="10" ry="8" fill="#e89848" stroke="#5c3818" stroke-width="2"/>
    <ellipse cx="55" cy="20" rx="10" ry="8" fill="#e89848" stroke="#5c3818" stroke-width="2"/>
    <circle cx="30" cy="38" r="3" fill="#3a1e08"/>
    <circle cx="50" cy="38" r="3" fill="#3a1e08"/>
    <ellipse cx="40" cy="45" rx="4" ry="3" fill="#3a1e08"/>
    <ellipse cx="22" cy="44" rx="5" ry="3" fill="#ff9999" opacity="0.6"/>
    <ellipse cx="58" cy="44" rx="5" ry="3" fill="#ff9999" opacity="0.6"/>
  </g>

  <!-- Middle Left Croissant Dog -->
  <g transform="translate(15, 340) scale(0.85)" opacity="0.95">
    <ellipse cx="45" cy="40" rx="40" ry="32" fill="#fcd78c" stroke="#5c3818" stroke-width="2.5"/>
    <!-- chef hat -->
    <path d="M30,12 C30,2 60,2 60,12 Z" fill="#ffffff" stroke="#5c3818" stroke-width="2"/>
    <!-- ears -->
    <circle cx="18" cy="28" r="10" fill="#e2873a" stroke="#5c3818" stroke-width="2"/>
    <circle cx="72" cy="28" r="10" fill="#e2873a" stroke="#5c3818" stroke-width="2"/>
    <!-- eyes & nose -->
    <circle cx="34" cy="38" r="3" fill="#3a1e08"/>
    <circle cx="56" cy="38" r="3" fill="#3a1e08"/>
    <ellipse cx="45" cy="45" rx="4" ry="3" fill="#3a1e08"/>
  </g>

  <!-- Biscuit Cake Decor Right -->
  <g transform="translate(230, 310) scale(0.8)">
    <rect x="0" y="0" width="70" height="70" rx="14" fill="#f8c679" stroke="#683d18" stroke-width="2.5"/>
    <rect x="3" y="3" width="31" height="31" rx="8" fill="#df7842"/>
    <rect x="36" y="36" width="31" height="31" rx="8" fill="#df7842"/>
    <rect x="36" y="3" width="31" height="31" rx="8" fill="#faebd0"/>
    <rect x="3" y="36" width="31" height="31" rx="8" fill="#faebd0"/>
  </g>

  <!-- Bottom Bread Dog in Santa/Party Hat -->
  <g transform="translate(270, 520) scale(0.9)">
    <ellipse cx="50" cy="55" rx="45" ry="38" fill="#fae0ad" stroke="#5c3818" stroke-width="2.5"/>
    <!-- party hat -->
    <polygon points="50,5 30,35 70,35" fill="#f27d60" stroke="#5c3818" stroke-width="2"/>
    <circle cx="50" cy="5" r="5" fill="#fff" stroke="#5c3818" stroke-width="1.5"/>
    <!-- blush -->
    <ellipse cx="28" cy="62" rx="7" ry="4" fill="#fba1a1"/>
    <ellipse cx="72" cy="62" rx="7" ry="4" fill="#fba1a1"/>
    <!-- eyes -->
    <circle cx="38" cy="54" r="3.5" fill="#3a1e08"/>
    <circle cx="62" cy="54" r="3.5" fill="#3a1e08"/>
    <ellipse cx="50" cy="62" rx="4" ry="3" fill="#3a1e08"/>
  </g>

  <!-- TOP APP BAR -->
  <g id="topbar">
    <rect width="400" height="42" fill="url(#headerGrad)" stroke="#683d18" stroke-width="2.5"/>
    <text x="16" y="27" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="15" font-weight="bold" fill="#3a1e08">← 微信</text>
    <text x="175" y="27" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="16" font-weight="bold" fill="#3a1e08">孟知深</text>
    <!-- Schedule pill -->
    <rect x="235" y="10" width="62" height="22" rx="11" fill="#fff9eb" stroke="#5c3818" stroke-width="1.5"/>
    <text x="242" y="25" font-size="11" fill="#c06820">🥐</text>
    <text x="256" y="25" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="11" font-weight="bold" fill="#7a461e">行程</text>
    <!-- Dots -->
    <circle cx="365" cy="21" r="2" fill="#3a1e08"/>
    <circle cx="373" cy="21" r="2" fill="#3a1e08"/>
    <circle cx="381" cy="21" r="2" fill="#3a1e08"/>
  </g>

  <!-- CHAT MESSAGES AREA -->

  <!-- Message 1: User (Right) -->
  <g transform="translate(0, 60)">
    <!-- Right Avatar -->
    <rect x="345" y="8" width="42" height="42" rx="10" fill="#333" stroke="#fff" stroke-width="2" filter="url(#shadow)"/>
    <text x="356" y="34" font-size="20">👧</text>
    
    <!-- Bubble -->
    <g transform="translate(235, 10)">
      <path d="M 10,0 L 90,0 Q 100,0 100,10 L 100,32 Q 100,42 90,42 L 10,42 Q 0,42 0,32 L 0,10 Q 0,0 10,0 Z" fill="#ffffff" stroke="#4a2a10" stroke-width="2.2" filter="url(#shadow)"/>
      <!-- Toast ears decor top -->
      <path d="M 12,-6 Q 16,-12 24,-6 Q 30,0 20,0 Z" fill="#e69c52" stroke="#4a2a10" stroke-width="1.5"/>
      <path d="M 76,-6 Q 84,-12 90,-6 Q 94,0 84,0 Z" fill="#e69c52" stroke="#4a2a10" stroke-width="1.5"/>
      <!-- Little Bread Icon inside badge -->
      <g transform="translate(10, -8) scale(0.6)">
        <ellipse cx="14" cy="12" rx="12" ry="8" fill="#f8be68" stroke="#4a2a10" stroke-width="2"/>
        <line x1="8" y1="12" x2="20" y2="12" stroke="#fff" stroke-width="1.5"/>
      </g>
      <text x="14" y="27" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="14" font-weight="bold" fill="#2d1b0c">老哥给点钱</text>
    </g>
  </g>

  <!-- Message 2: AI Contact (Left) -->
  <g transform="translate(0, 135)">
    <!-- Left Avatar -->
    <rect x="12" y="8" width="42" height="42" rx="10" fill="#1c2530" stroke="#fff" stroke-width="2" filter="url(#shadow)"/>
    <text x="23" y="34" font-size="20">🧑</text>

    <!-- Bubble -->
    <g transform="translate(62, 10)">
      <path d="M 12,0 L 270,0 Q 280,0 280,10 L 280,68 Q 280,78 270,78 L 12,78 Q 0,78 0,68 L 0,10 Q 0,0 12,0 Z" fill="#ffffff" stroke="#4a2a10" stroke-width="2.2" filter="url(#shadow)"/>
      <!-- Toast ears decor -->
      <path d="M 8,-6 Q 14,-12 22,-6 Q 26,0 18,0 Z" fill="#e69c52" stroke="#4a2a10" stroke-width="1.5"/>
      <g transform="translate(250, -8) scale(0.6)">
        <ellipse cx="14" cy="12" rx="12" ry="8" fill="#f8be68" stroke="#4a2a10" stroke-width="2"/>
        <line x1="8" y1="12" x2="20" y2="12" stroke="#fff" stroke-width="1.5"/>
      </g>
      <text x="14" y="30" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="13.5" font-weight="500" fill="#2d1b0c">刚处理完手头几份文件，喝口水的功夫，就</text>
      <text x="14" y="56" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="13.5" font-weight="500" fill="#2d1b0c">看到小祖宗来讨债了。</text>
    </g>
  </g>

  <!-- Message 3: WeChat Transfer Card (Left) -->
  <g transform="translate(0, 245)">
    <!-- Left Avatar -->
    <rect x="12" y="10" width="42" height="42" rx="10" fill="#1c2530" stroke="#fff" stroke-width="2" filter="url(#shadow)"/>
    <text x="23" y="36" font-size="20">🧑</text>

    <!-- Toast Transfer Container -->
    <g transform="translate(62, 5)">
      <!-- Toast Outline Outer -->
      <path d="M 20,-8 C 35,-14 55,-4 70,-8 C 100,-15 130,-4 155,-8 C 175,-4 195,-14 210,-8 Q 230,0 230,18 L 230,225 Q 230,240 215,240 L 15,240 Q 0,240 0,225 L 0,18 Q 0,0 20,-8 Z" fill="#ffffff" stroke="#4a2a10" stroke-width="2.5" filter="url(#shadow)"/>

      <!-- Egg toast decor on left corner -->
      <g transform="translate(6, -18) scale(0.7)">
        <path d="M 10,10 Q 30,0 45,15 Q 55,35 40,48 Q 20,55 8,42 Q 0,25 10,10 Z" fill="#fff" stroke="#4a2a10" stroke-width="2.5"/>
        <circle cx="26" cy="28" r="10" fill="#fabc42" stroke="#4a2a10" stroke-width="2"/>
      </g>

      <!-- Transfer Header -->
      <g transform="translate(18, 22)">
        <!-- Transfer Toast Icon -->
        <rect x="0" y="0" width="30" height="30" rx="8" fill="#fae8c8" stroke="#7a461e" stroke-width="1.8"/>
        <circle cx="15" cy="14" r="5" fill="#f09038"/>
        <text x="40" y="14" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="14" font-weight="bold" fill="#2d1b0c">微信转账</text>
        <text x="40" y="27" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="11" fill="#88705c">转账给你</text>
      </g>

      <!-- Amount -->
      <text x="18" y="92" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="22" font-weight="bold" fill="#2c3a4a">¥20000.00</text>
      <text x="18" y="122" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="12" fill="#665544">“拿去花不够再跟哥哥说”</text>

      <!-- Divider line -->
      <line x1="16" y1="140" x2="214" y2="140" stroke="#f0e4d2" stroke-width="1.2"/>
      <text x="18" y="158" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="10.5" fill="#a09080">微信安全支付</text>

      <!-- Action Buttons -->
      <g transform="translate(14, 178)">
        <!-- Accept Button -->
        <rect x="0" y="0" width="94" height="34" rx="17" fill="#f89838" stroke="#4a2a10" stroke-width="1.8"/>
        <text x="32" y="22" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="13" font-weight="bold" fill="#ffffff">收下</text>

        <!-- Refund Button -->
        <rect x="106" y="0" width="94" height="34" rx="17" fill="#fabc42" stroke="#4a2a10" stroke-width="1.8"/>
        <text x="138" y="22" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="13" font-weight="bold" fill="#ffffff">退还</text>
      </g>
    </g>
  </g>

  <!-- Message 4: Voice Bar (Left) -->
  <g transform="translate(0, 508)">
    <rect x="12" y="4" width="42" height="42" rx="10" fill="#1c2530" stroke="#fff" stroke-width="2" filter="url(#shadow)"/>
    <text x="23" y="30" font-size="20">🧑</text>

    <!-- Voice Bubble -->
    <g transform="translate(62, 5)">
      <rect x="0" y="0" width="220" height="40" rx="14" fill="#ffffff" stroke="#4a2a10" stroke-width="2.2" filter="url(#shadow)"/>
      <!-- Toast decor badge -->
      <g transform="translate(195, -8) scale(0.6)">
        <ellipse cx="14" cy="12" rx="12" ry="8" fill="#f8be68" stroke="#4a2a10" stroke-width="2"/>
        <line x1="8" y1="12" x2="20" y2="12" stroke="#fff" stroke-width="1.5"/>
      </g>
      <!-- Speaker icon -->
      <text x="14" y="26" font-size="16" fill="#3a1e08">🔊</text>
      <text x="175" y="26" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="14" font-weight="bold" fill="#2d1b0c">25"</text>
    </g>
    <text x="76" y="62" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="11" fill="#b09070">转文字</text>
  </g>

  <!-- Message 5: Inner Voice Card (Bottom Overlay) -->
  <g transform="translate(25, 595)">
    <rect x="0" y="0" width="350" height="85" rx="18" fill="#ffffff" fill-opacity="0.94" stroke="#f6d296" stroke-width="2" filter="url(#shadow)"/>
    <!-- Tag -->
    <rect x="14" y="10" width="42" height="18" rx="6" fill="#fae8c8"/>
    <text x="18" y="23" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="10" font-weight="bold" fill="#b06820">心声</text>
    <text x="62" y="23" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="10.5" fill="#a08570">内心潜台词</text>

    <!-- Text -->
    <text x="14" y="47" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="11.5" font-style="italic" fill="#5c4535">“突然发个外地的地址，小丫头心思越来越难</text>
    <text x="14" y="67" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="11.5" font-style="italic" fill="#5c4535">猜了，最好不是想背着我乱跑。”</text>
  </g>

  <!-- BOTTOM INPUT TOOLBAR -->
  <g transform="translate(0, 755)">
    <!-- Bar BG -->
    <rect x="0" y="0" width="400" height="65" fill="#fedaa2" stroke="#683d18" stroke-width="2.5"/>

    <!-- Left Toast Icon -->
    <g transform="translate(10, 10)">
      <rect x="0" y="0" width="42" height="42" rx="12" fill="#ffffff" stroke="#4a2a10" stroke-width="2"/>
      <circle cx="21" cy="21" r="7" fill="#fabc42"/>
    </g>

    <!-- Croissant divider -->
    <text x="58" y="36" font-size="18">🥐</text>

    <!-- Input Box -->
    <g transform="translate(95, 10)">
      <rect x="0" y="0" width="140" height="42" rx="14" fill="#ffffff" stroke="#4a2a10" stroke-width="1.8"/>
      <text x="12" y="26" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="13" fill="#a69480">发消息...</text>
    </g>

    <!-- Cute Dog Button -->
    <g transform="translate(245, 10)">
      <rect x="0" y="0" width="36" height="42" rx="12" fill="#fae0ad" stroke="#4a2a10" stroke-width="1.8"/>
      <circle cx="13" cy="20" r="1.5" fill="#3a1e08"/>
      <circle cx="23" cy="20" r="1.5" fill="#3a1e08"/>
      <ellipse cx="18" cy="25" rx="2" ry="1.5" fill="#3a1e08"/>
    </g>

    <!-- Plus Button -->
    <g transform="translate(288, 10)">
      <rect x="0" y="0" width="34" height="42" rx="10" fill="none"/>
      <line x1="17" y1="12" x2="17" y2="30" stroke="#4a2a10" stroke-width="2.8" stroke-linecap="round"/>
      <line x1="8" y1="21" x2="26" y2="21" stroke="#4a2a10" stroke-width="2.8" stroke-linecap="round"/>
    </g>

    <!-- Send Button -->
    <g transform="translate(328, 10)">
      <rect x="0" y="0" width="62" height="42" rx="14" fill="#f89838" stroke="#4a2a10" stroke-width="2"/>
      <text x="16" y="27" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="14" font-weight="bold" fill="#ffffff">发送</text>
    </g>
  </g>
</svg>`;

fs.writeFileSync('public/assets/bread_dog_preview.svg', svg.trim());
console.log('Successfully generated public/assets/bread_dog_preview.svg');
