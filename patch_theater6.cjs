const fs = require('fs');
let content = fs.readFileSync('src/components/phone/theater/TheaterApp.tsx', 'utf8');

const oldTopButtons = `{gameState === 'playing' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowExportModal(true);
                printToast(' 正在汇整并准备导出剧本...');
              }}
              className="px-2 py-1.5 bg-[var(--global-accent)]/20 border border-[var(--global-accent)]/40 hover:bg-[var(--global-accent)]/30 hover:border-[var(--global-accent)]/60 rounded-xl transition-all text-[var(--global-accent)] text-xs flex items-center gap-1 font-bold cursor-pointer"
              title="导出当前完整的文字剧情剧本"
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
              className="px-1.5 py-1 bg-[var(--global-accent)]/10 border border-[var(--global-accent)]/20 hover:bg-[var(--global-accent)]/20 rounded-lg transition-all text-[var(--global-accent)] text-[10px] flex items-center gap-1 font-bold cursor-pointer shrink-0"
              title="保存与导出"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              onClick={handleResetGame}
              className="px-1.5 py-1 hover:bg-[var(--global-accent)]/10 hover:text-red-400 rounded-lg transition-all text-[var(--global-text-soft)] cursor-pointer text-[10px] flex items-center gap-1 font-bold shrink-0"
              title="重置当前进度"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">重置</span>
            </button>
          </div>
        )}`;

content = content.replace(oldTopButtons, newTopButtons);
fs.writeFileSync('src/components/phone/theater/TheaterApp.tsx', content);
console.log("Fixed top buttons sizes");
