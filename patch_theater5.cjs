const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

// 1. Change confirmResetGame logic
const oldConfirmResetGame = `  const confirmResetGame = () => {
    localStorage.removeItem('wephone_theater_sessions');
    setSessions([]);
    setCurrentSessionId(null);
    setGameState('list');
    setMessages([]);
    setPlayerStats(null);
    setCustomWorldDesc('');
    printToast(' 剧场已完全重置，可以创建新剧本！');
    setShowResetConfirm(false);
  };`;

const newConfirmResetGame = `  const confirmResetGame = () => {
    if (!currentSessionId) return;
    const initialStats = {
      location: selectedPreset.defaultLocation,
      atmosphere: selectedPreset.defaultAtmosphere,
      name: playerStats?.name || playerName,
      gender: playerStats?.gender || playerGender,
      age: playerStats?.age || playerAge,
      customStats: [...customStats]
    };
    
    setMessages([]);
    setPlayerStats(initialStats);
    setDismissedErrorMsgId(null);
    setShowResetConfirm(false);

    let starterText = selectedPreset.starterPrompt;
    if (customWorldDesc.trim()) {
      starterText = customWorldDesc.trim();
    } else if (worldBooks && worldBooks.length > 0) {
      const activeBooks = worldBooks.filter(b => b.enabled);
      if (activeBooks.length > 0) {
        starterText = "（携带世界书：" + activeBooks.map(b => b.title).join('、') + "）\\n" + starterText;
      }
    }
    
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          lastPlayed: Date.now(),
          data: {
            ...s.data,
            messages: [],
            playerStats: initialStats
          }
        };
      }
      return s;
    }));

    printToast(' 已重置本局进度，重新开始推演！');
    
    // Slight delay to let states settle before sending
    setTimeout(() => {
      handleSendAction(starterText, true);
    }, 100);
  };`;

content = content.replace(oldConfirmResetGame, newConfirmResetGame);

// 2. Change list edit button
const oldListEditButton = `<button
                        onClick={() => {
                          setCurrentEditingId(s.id);
                          setIsEditingSession(true);
                          setGameState('creating');
                          // Load session data into form
                          setPlayerName(s.data.playerName || s.data.playerStats?.name || '');
                          setPlayerGender(s.data.playerGender || s.data.playerStats?.gender || '男');
                          setPlayerAge(s.data.playerAge || s.data.playerStats?.age || '18');
                          setCustomWorldDesc(s.data.customWorldDesc || '');
                          setCustomStats(s.data.customStats || s.data.playerStats?.customStats || []);
                          setSelectedPreset(s.data.selectedPreset);
                        }}
                        className="p-2 text-[var(--global-text-soft)] hover:bg-[var(--global-line)]/50 rounded-xl transition-all"
                        title="编辑剧本信息"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>`;
const newListEditButton = `<button
                        onClick={() => {
                          setCurrentEditingId(s.id);
                          setIsEditingSession(true);
                          setGameState('creating');
                          setPlayerName(s.data.playerName || s.data.playerStats?.name || '');
                          setPlayerGender(s.data.playerGender || s.data.playerStats?.gender || '男');
                          setPlayerAge(s.data.playerAge || s.data.playerStats?.age || '18');
                          setCustomWorldDesc(s.data.customWorldDesc || '');
                          setCustomStats(s.data.customStats || s.data.playerStats?.customStats || []);
                          setSelectedPreset(s.data.selectedPreset);
                        }}
                        className="px-2 py-1.5 flex items-center gap-1 text-[var(--global-text-soft)] hover:bg-[var(--global-line)]/50 rounded-xl transition-all font-bold text-[11px]"
                        title="编辑剧本信息"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>编辑</span>
                      </button>`;
content = content.replace(oldListEditButton, newListEditButton);

// We need to import Edit2 from lucide-react
content = content.replace('Trash2, ShieldAlert,', 'Trash2, ShieldAlert, Edit2,');

// 3. Shrink top buttons in playing state
const oldTopButtons = `{gameState === 'playing' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowExportModal(true);
                printToast(' 正在汇整并准备导出剧本...');
              }}
              className="p-1.5 hover:bg-[var(--global-accent)]/10 hover:text-[var(--global-accent)] rounded-xl transition-all text-[var(--global-text-soft)] cursor-pointer text-xs flex items-center gap-1 font-bold"
              title="保存与导出"
            >
              <Download className="w-3.5 h-3.5" />
              <span>保存与导出</span>
            </button>
            <button
              onClick={handleResetGame}
              className="p-1.5 hover:bg-[var(--global-accent)]/10 hover:text-red-400 rounded-xl transition-all text-[var(--global-text-soft)] cursor-pointer text-xs flex items-center gap-1 font-bold"
              title="退出当前剧情重置"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">重置剧场</span>
            </button>
          </div>
        )}`;
const newTopButtons = `{gameState === 'playing' && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                setShowExportModal(true);
                printToast(' 正在汇整并准备导出剧本...');
              }}
              className="px-1.5 py-1 hover:bg-[var(--global-accent)]/10 hover:text-[var(--global-accent)] rounded-lg transition-all text-[var(--global-text-soft)] cursor-pointer text-[10px] flex items-center gap-1 font-bold"
              title="保存与导出"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              onClick={handleResetGame}
              className="px-1.5 py-1 hover:bg-[var(--global-accent)]/10 hover:text-red-400 rounded-lg transition-all text-[var(--global-text-soft)] cursor-pointer text-[10px] flex items-center gap-1 font-bold"
              title="重置当前进度"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">重置</span>
            </button>
          </div>
        )}`;
content = content.replace(oldTopButtons, newTopButtons);

// 4. Update the confirm modal text for reset
const oldConfirmModalText = `<h3 className="text-sm font-bold text-[var(--global-text)]">放弃当前跑团剧场进度吗？</h3>
                  <p className="text-[11px] text-[var(--global-text-soft)] mt-2 leading-relaxed">
                    重置后，当前正在进行的剧本剧情与状态属性将完全抹除，无法找回。您可以在退出后随时重新开启和设定新剧本。
                  </p>`;
const newConfirmModalText = `<h3 className="text-sm font-bold text-[var(--global-text)]">重置当前剧本推演进度吗？</h3>
                  <p className="text-[11px] text-[var(--global-text-soft)] mt-2 leading-relaxed">
                    重置后，当前正在进行的剧情对话与状态属性将被清空并重新开始。之前设定的背景和属性信息会被保留。
                  </p>`;
content = content.replace(oldConfirmModalText, newConfirmModalText);

fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Updated TheaterApp reset and edit logics");
