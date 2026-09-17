const fs = require('fs');
let content = fs.readFileSync('src/components/phone/DIYWorkshop.tsx', 'utf8');

const importNewButtons = `        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => jsonImportRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              title="导入主题 JSON"
            >
              <Upload className="w-3.5 h-3.5 text-purple-600" />
              <span>导入 JSON</span>
            </button>
            <button
              onClick={handleCreateNewTheme}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建</span>
            </button>
          </div>
        )}`;

const newButtons = `        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => jsonImportRef.current?.click()}
              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              title="导入主题 JSON"
            >
              <Upload className="w-3.5 h-3.5 text-purple-600" />
              <span>导入</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('确定要恢复出厂设置吗？这将删除所有自定义主题，并恢复系统默认主题。')) {
                  const defaultTheme = JSON.parse(JSON.stringify(DEFAULT_DIY_THEME));
                  onUpdateSettings({ diyThemes: [defaultTheme], activeDIYThemeId: defaultTheme.id });
                  setEditingTheme(defaultTheme);
                  setSelectedThemeId(defaultTheme.id);
                  applyDIYThemeToDOM(defaultTheme, [defaultTheme]);
                  triggerToast('🧹 已恢复出厂设置，所有自定义主题已删除。');
                }
              }}
              className="px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-[11px] font-semibold shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              title="恢复出厂设置"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
            <button
              onClick={handleCreateNewTheme}
              className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建</span>
            </button>
          </div>
        )}`;

content = content.replace(importNewButtons, newButtons);
fs.writeFileSync('src/components/phone/DIYWorkshop.tsx', content);
console.log("Updated DIY buttons");
