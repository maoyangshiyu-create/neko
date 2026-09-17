import React from 'react';
import { AestheticStyleId } from '../types';
import { STYLES } from '../data/manualData';
import { CodeBlock } from './CodeBlock';
import { Palette, Sparkles, Check, Flame } from 'lucide-react';

interface StyleSelectorProps {
  currentStyle: AestheticStyleId;
  onSelectStyle: (style: AestheticStyleId) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  currentStyle,
  onSelectStyle,
}) => {
  const activeStyle = STYLES[currentStyle];

  return (
    <section id="styles-section" className="mb-14 scroll-mt-24">
      {/* Principle Banner */}
      <div className="mb-6 p-4 rounded-2xl border border-amber-200/70 bg-amber-50/70 text-amber-900 text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-200/80 text-amber-800 shrink-0 mt-0.5">
            <Flame className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <span className="font-semibold text-amber-950 block text-base">
              重要法则：玩家指令永远优先！
            </span>
            <p className="text-amber-800/90 text-xs sm:text-sm mt-0.5 leading-relaxed">
              手册里所有美化代码（包括莫兰迪配色）都只是<strong>示例起点</strong>，不是死规范。玩家有明确风格指令时以玩家为准；无明确指令时从4大风格库任选，切忌无脑只套莫兰迪。
            </p>
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full bg-amber-200/70 font-mono text-amber-900 whitespace-nowrap self-end md:self-auto">
          当前生效: {activeStyle.name}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
            <Palette className="w-5 h-5 text-stone-600" />
            美化风格库 (Style Presets)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            切换下列风格，实时查看所有 UI 组件的美化层渲染与 CSS 变量变幻：
          </p>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(STYLES) as AestheticStyleId[]).map((key) => {
          const style = STYLES[key];
          const isSelected = currentStyle === key;

          return (
            <div
              key={key}
              onClick={() => onSelectStyle(key)}
              className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border text-left ${
                isSelected
                  ? 'ring-2 ring-stone-800 border-stone-800 shadow-md bg-white'
                  : 'border-stone-200 bg-white/70 hover:bg-white hover:border-stone-300 hover:shadow-sm'
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{style.icon}</span>
                <div>
                  <h3 className="font-bold text-stone-800 text-sm sm:text-base leading-tight">
                    {style.name}
                  </h3>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {style.badge}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 mb-3 min-h-[36px] line-clamp-2 leading-relaxed">
                {style.description}
              </p>

              {/* Color Swatches */}
              <div className="flex items-center gap-1.5 mb-3">
                <span
                  className="w-5 h-5 rounded-full border border-stone-300/60 shadow-inner"
                  style={{ backgroundColor: style.vars.bg }}
                  title={`bg: ${style.vars.bg}`}
                />
                <span
                  className="w-5 h-5 rounded-full border border-stone-300/60 shadow-inner"
                  style={{ backgroundColor: style.vars.accent }}
                  title={`accent: ${style.vars.accent}`}
                />
                <span
                  className="w-5 h-5 rounded-full border border-stone-300/60 shadow-inner"
                  style={{ backgroundColor: style.vars.accentDeep }}
                  title={`accentDeep: ${style.vars.accentDeep}`}
                />
                <span
                  className="w-5 h-5 rounded-full border border-stone-300/60 shadow-inner"
                  style={{ backgroundColor: style.vars.secondary }}
                  title={`secondary: ${style.vars.secondary}`}
                />
                <span
                  className="w-5 h-5 rounded-full border border-stone-300/60 shadow-inner"
                  style={{ backgroundColor: style.vars.ink }}
                  title={`ink: ${style.vars.ink}`}
                />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1">
                {style.characteristics.slice(0, 2).map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-sans"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Style Variable Details Accordion */}
      <div className="mt-4 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-stone-800">
              当前【{activeStyle.name}】CSS 变量与应用规范
            </span>
          </div>
          <span className="text-[11px] text-stone-400">
            可直接复制进 :root 中
          </span>
        </div>
        <CodeBlock code={activeStyle.cssSnippet} language="css" title={`${activeStyle.name} 变量清单`} />
      </div>
    </section>
  );
};
