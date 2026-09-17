/**
 * Generates and downloads a complete, self-contained, single-file HTML version
 * of the iPhone + WeChat AI Chat simulator with embedded CSS and JavaScript.
 */
export function downloadStandaloneHtmlFile() {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>iPhone 桌面与微信 AI 聊天模拟器 (单文件离线版)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background-color: #121214;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      color: #1c1c1e;
    }
    #phone-wrapper {
      width: 375px;
      height: 700px;
      border-radius: 48px;
      background: #000;
      border: 4px solid #27272a;
      box-shadow: 0 25px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    #screen {
      flex: 1;
      border-radius: 40px;
      background-size: cover;
      background-position: center;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
    }
    #status-bar {
      height: 44px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      z-index: 50;
      position: relative;
    }
    #island {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 9px;
      width: 104px;
      height: 26px;
      background: #000;
      border-radius: 20px;
      pointer-events: none;
    }
    #home-indicator {
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 50;
    }
    #home-line {
      width: 130px;
      height: 4px;
      background: rgba(255,255,255,0.7);
      border-radius: 10px;
    }
    /* Main View Container */
    #content-container {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    .view {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
    }
    .view.active { display: flex; }
    /* Desktop */
    .desktop-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 16px 12px;
      margin-top: 10px;
      place-items: center;
    }
    .app-icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      color: #fff;
      font-size: 11px;
      font-weight: 500;
      transition: transform 0.25s cubic-bezier(0.34, 1.8, 0.4, 1);
    }
    .app-icon:active { transform: scale(0.88); }
    .icon-box {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      position: relative;
      box-shadow: 0 6px 14px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .dock {
      margin: 16px;
      padding: 10px;
      border-radius: 26px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(20px);
      display: flex;
      justify-content: space-around;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .dock-item {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .dock-item:active { transform: scale(0.85); }
    /* WeChat View */
    .wechat-header {
      height: 44px;
      background: #ededed;
      border-bottom: 1px solid #dcdcdc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      font-size: 13px;
      font-weight: bold;
    }
    .chat-scroll {
      flex: 1;
      overflow-y: auto;
      background: #ededed;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .msg-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 12px;
    }
    .msg-row.user {
      flex-direction: row-reverse;
    }
    .msg-bubble {
      max-width: 75%;
      padding: 8px 12px;
      border-radius: 12px;
      line-height: 1.5;
      word-break: break-word;
    }
    .msg-row.user .msg-bubble {
      background: #95ec69;
      color: #000;
    }
    .msg-row.ai .msg-bubble {
      background: #fff;
      color: #000;
    }
    .chat-input-bar {
      height: 48px;
      background: #f7f7f7;
      border-top: 1px solid #ddd;
      display: flex;
      align-items: center;
      padding: 0 8px;
      gap: 6px;
    }
    .chat-input-bar input {
      flex: 1;
      height: 32px;
      border-radius: 8px;
      border: 1px solid #ccc;
      padding: 0 10px;
      font-size: 12px;
      outline: none;
      background: #fff;
    }
    .btn-action {
      height: 32px;
      padding: 0 10px;
      border-radius: 8px;
      border: none;
      background: #07c160;
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
    }
    .btn-ai {
      background: #e8f8ee;
      color: #07c160;
      border: 1px solid #b7edca;
    }
    .wechat-tabbar {
      height: 48px;
      background: #f7f7f7;
      border-top: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: space-around;
      font-size: 11px;
    }
    .tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #777;
      cursor: pointer;
    }
    .tab-btn.active { color: #07c160; font-weight: bold; }
  </style>
</head>
<body>
  <div id="phone-wrapper">
    <div id="screen">
      <!-- Status Bar -->
      <div id="status-bar">
        <span id="time-display">09:41</span>
        <div id="island"></div>
        <span>5G 100%</span>
      </div>

      <!-- Main Container -->
      <div id="content-container">
        <!-- 1. DESKTOP VIEW -->
        <div id="view-desktop" class="view active">
          <!-- Top Avatar -->
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(0,0,0,0.35);backdrop-filter:blur(12px);margin:10px 12px 6px;border-radius:16px;color:#fff;">
            <div style="width:38px;height:38px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:18px;border:2px solid #fff;shrink:0;">👤</div>
            <div>
              <div style="font-weight:bold;font-size:13px;">旅行者</div>
              <div style="font-size:10px;opacity:0.8;">保持好奇，热爱生活 ☕</div>
            </div>
          </div>

          <!-- Update 实时动态模块 (外卖/微信弹窗) -->
          <div style="margin:4px 12px 8px;padding:10px 12px;background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);border-radius:18px;box-shadow:0 4px 16px rgba(0,0,0,0.12);display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="openView('wechat')">
            <div style="width:34px;height:34px;border-radius:10px;background:#fff2e8;display:flex;align-items:center;justify-content:center;font-size:18px;">🛵</div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:bold;font-size:11px;color:#1c1917;">美团外卖 · 正在配送</span>
                <span style="font-size:9px;color:#ea580c;background:#ffedd5;padding:1px 5px;border-radius:6px;font-weight:bold;">预计12分钟送达</span>
              </div>
              <div style="font-size:10px;color:#78716c;margin-top:2px;">骑手已接单「超大杯生椰拿铁 + 芝士可颂」</div>
            </div>
          </div>

          <!-- 4 Icons in One Row (微信、设置、世界书、面具 - 去掉角色卡) -->
          <div class="desktop-grid">
            <div class="app-icon" onclick="openView('wechat')">
              <div id="icon-wechat" class="icon-box" style="background:linear-gradient(135deg,#6C7E69,#869883)">💬</div>
              <span>微信</span>
            </div>
            <div class="app-icon" onclick="openThemeSelector()">
              <div id="icon-settings" class="icon-box" style="background:linear-gradient(135deg,#736B64,#8C847D)">⚙️</div>
              <span>设置</span>
            </div>
            <div class="app-icon" onclick="alert('进入世界书档案库')">
              <div id="icon-worldbook" class="icon-box" style="background:linear-gradient(135deg,#966F57,#B08971)">📚</div>
              <span>世界书</span>
            </div>
            <div class="app-icon" onclick="alert('面具预设库')">
              <div id="icon-masks" class="icon-box" style="background:linear-gradient(135deg,#746080,#8F7C99)">✨</div>
              <span>面具</span>
            </div>
          </div>

          <!-- Meituan Takeaway Button Below 4 Icons -->
          <div id="takeaway-btn" style="margin:6px 12px;padding:10px 14px;background:linear-gradient(135deg,#BFA071,#D2B68A);border-radius:18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;box-shadow:0 4px 12px rgba(191,160,113,0.4);" onclick="triggerTakeawayOrder()">
            <div style="display:flex;align-items:center;gap:10px;">
              <div id="takeaway-badge-icon" style="width:32px;height:32px;border-radius:10px;background:#3A3228;color:#EADEC7;display:flex;align-items:center;justify-content:center;font-size:16px;">🛵</div>
              <div>
                <div style="font-weight:900;font-size:12px;color:#2D261E;">美团外卖 <span id="takeaway-badge-pill" style="background:#3A3228;color:#EADEC7;font-size:9px;padding:1px 6px;border-radius:10px;">心意送</span></div>
                <div style="font-size:10px;color:#3A3228;opacity:0.85;">为 AI 好友送份热腾腾的心意餐</div>
              </div>
            </div>
            <div id="takeaway-action-btn" style="background:#3A3228;color:#EADEC7;font-size:10px;font-weight:bold;padding:4px 10px;border-radius:10px;">去点餐 ›</div>
          </div>

          <!-- Dock Bar -->
          <div id="dock-bar" class="dock" style="background:rgba(229,220,211,0.3);border-radius:24px;">
            <div id="dock-phone" class="dock-item" style="background:linear-gradient(135deg,#6C7E69,#869883);border-radius:15px;" onclick="alert('拨号中...')">📞</div>
            <div id="dock-novel" class="dock-item" style="background:linear-gradient(135deg,#966F57,#B08971);border-radius:15px;" onclick="alert('阅读器已就绪')">📖</div>
          </div>
        </div>

        <!-- 2. WECHAT VIEW -->
        <div id="view-wechat" class="view" style="background:#ededed">
          <div class="wechat-header">
            <span onclick="openView('desktop')" style="cursor:pointer">‹ 桌面</span>
            <span id="wechat-title">张三 (发小死党)</span>
            <span onclick="alert('进入聊天设置')">⋯</span>
          </div>

          <div id="chat-messages" class="chat-scroll">
            <div class="msg-row ai">
              <div style="width:34px;height:34px;border-radius:6px;background:#cbd5e1;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:16px;flex-shrink:0;">🤖</div>
              <div class="msg-bubble">下班没？今晚整点烧烤？[心声: 今天被抓着开了三个小时会，饿晕了]</div>
            </div>
          </div>

          <div class="chat-input-bar">
            <button class="btn-action btn-ai" onclick="triggerAiReply()" title="让对方回复" style="font-size:15px;padding:0 8px;">🍥</button>
            <input id="user-input" placeholder="发消息..." onkeydown="if(event.key==='Enter')sendMessage()">
            <button class="btn-action" onclick="sendMessage()">发送</button>
          </div>

          <div class="wechat-tabbar">
            <div class="tab-btn active">💬 聊天</div>
            <div class="tab-btn" onclick="alert('通讯录')">👥 通讯录</div>
            <div class="tab-btn" onclick="alert('朋友圈')">⭕ 朋友圈</div>
            <div class="tab-btn" onclick="alert('个人中心')">👤 我</div>
          </div>
        </div>
      </div>

      <!-- Home Indicator -->
      <div id="home-indicator" onclick="openView('desktop')">
        <div id="home-line"></div>
      </div>
    </div>
  </div>

  <script>
    // Clock
    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      document.getElementById('time-display').innerText = h + ':' + m;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // View Navigation
    function openView(viewName) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + viewName).classList.add('active');
    }

    // Chat Logic
    function sendMessage() {
      const input = document.getElementById('user-input');
      const val = input.value.trim();
      if (!val) return;

      const container = document.getElementById('chat-messages');
      const row = document.createElement('div');
      row.className = 'msg-row user';
      row.innerHTML = '<div style="width:34px;height:34px;border-radius:6px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:16px;flex-shrink:0;">👤</div><div class="msg-bubble">' + escapeHtml(val) + '</div>';
      container.appendChild(row);
      input.value = '';
      container.scrollTop = container.scrollHeight;
    }

    function triggerAiReply() {
      const replies = [
        '哈哈哈哈没毛病，听你的！[心声: 这主意太正点了]',
        '得嘞！一会儿老地方见，我先去占个座！',
        '你说得太对了，必须点赞！'
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];

      setTimeout(() => {
        const container = document.getElementById('chat-messages');
        const row = document.createElement('div');
        row.className = 'msg-row ai';
        row.innerHTML = '<div style="width:34px;height:34px;border-radius:6px;background:#cbd5e1;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:16px;flex-shrink:0;">🤖</div><div class="msg-bubble">' + escapeHtml(reply) + '</div>';
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;

        // TTS voice
        if ('speechSynthesis' in window) {
          const clean = reply.replace(/\[心声:[^\]]+\]/g, '');
          const u = new SpeechSynthesisUtterance(clean);
          u.lang = 'zh-CN';
          window.speechSynthesis.speak(u);
        }
      }, 500);
    }

    function escapeHtml(text) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function triggerTakeawayOrder() {
      const food = prompt('想给 AI 好友点什么外卖？', '霸王茶姬 伯牙绝弦奶茶');
      if (!food) return;
      alert('🛵 美团外卖已下单【' + food + '】！骑手正在火速赶往好友家中，预计10秒后送达...');
      setTimeout(() => {
        openView('wechat');
        const container = document.getElementById('chat-messages');
        const row = document.createElement('div');
        row.className = 'msg-row ai';
        const msgText = '天哪！！刚才外卖小哥敲门给我送来了【' + food + '】！真的是你帮我点的吗？太惊喜太感动了，谢谢你！🥰';
        row.innerHTML = '<div style="width:34px;height:34px;border-radius:6px;background:#cbd5e1;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:16px;flex-shrink:0;">🤖</div><div class="msg-bubble">' + escapeHtml(msgText) + '</div>';
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;
      }, 10000);
    }

    function openThemeSelector() {
      const choice = prompt('选择应用图标与界面风格：\\n1. 🟤 莫兰迪 (柔和大地低饱和)\\n2. 🍬 马卡龙 (粉嫩甜美奶油色)\\n3. 🧊 玻璃拟态 (晶透半透明毛玻璃)\\n4. ⬛ 黑白简约 (极简哑光黑灰阶)', '1');
      if (choice === '1') applyStandaloneTheme('morandi');
      else if (choice === '2') applyStandaloneTheme('macaron');
      else if (choice === '3') applyStandaloneTheme('glass');
      else if (choice === '4') applyStandaloneTheme('mono');
    }

    function applyStandaloneTheme(theme) {
      const themes = {
        morandi: {
          wechat: 'linear-gradient(135deg, #6C7E69, #869883)',
          worldbook: 'linear-gradient(135deg, #966F57, #B08971)',
          masks: 'linear-gradient(135deg, #746080, #8F7C99)',
          settings: 'linear-gradient(135deg, #736B64, #8C847D)',
          takeawayBg: 'linear-gradient(135deg, #BFA071, #D2B68A)',
          dockBg: 'rgba(229, 220, 211, 0.3)',
          phone: 'linear-gradient(135deg, #6C7E69, #869883)',
          novel: 'linear-gradient(135deg, #966F57, #B08971)',
          radius: '15px'
        },
        macaron: {
          wechat: 'linear-gradient(135deg, #34D399, #A7F3D0)',
          worldbook: 'linear-gradient(135deg, #FBBF24, #FDE68A)',
          masks: 'linear-gradient(135deg, #6366F1, #A5B4FC)',
          settings: 'linear-gradient(135deg, #F472B6, #FBCFE8)',
          takeawayBg: 'linear-gradient(135deg, #FDE047, #FBBF24)',
          dockBg: 'rgba(255, 255, 255, 0.45)',
          phone: 'linear-gradient(135deg, #34D399, #A7F3D0)',
          novel: 'linear-gradient(135deg, #F472B6, #FBCFE8)',
          radius: '20px'
        },
        glass: {
          wechat: 'rgba(52, 211, 153, 0.25)',
          worldbook: 'rgba(251, 191, 36, 0.25)',
          masks: 'rgba(139, 92, 246, 0.25)',
          settings: 'rgba(255, 255, 255, 0.25)',
          takeawayBg: 'rgba(255, 255, 255, 0.25)',
          dockBg: 'rgba(255, 255, 255, 0.2)',
          phone: 'rgba(255, 255, 255, 0.25)',
          novel: 'rgba(255, 255, 255, 0.25)',
          radius: '16px'
        },
        mono: {
          wechat: '#18181B',
          worldbook: '#27272A',
          masks: '#1C1917',
          settings: '#09090B',
          takeawayBg: '#FAFAFA',
          dockBg: 'rgba(9, 9, 11, 0.8)',
          phone: '#18181B',
          novel: '#27272A',
          radius: '10px'
        }
      };

      const cfg = themes[theme] || themes.morandi;
      document.getElementById('icon-wechat').style.background = cfg.wechat;
      document.getElementById('icon-worldbook').style.background = cfg.worldbook;
      document.getElementById('icon-masks').style.background = cfg.masks;
      document.getElementById('icon-settings').style.background = cfg.settings;
      document.getElementById('takeaway-btn').style.background = cfg.takeawayBg;
      document.getElementById('dock-bar').style.background = cfg.dockBg;
      document.getElementById('dock-phone').style.background = cfg.phone;
      document.getElementById('dock-novel').style.background = cfg.novel;

      document.querySelectorAll('.icon-box, .dock-item').forEach(el => {
        el.style.borderRadius = cfg.radius;
      });
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'iphone-wechat-ai-simulator.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
