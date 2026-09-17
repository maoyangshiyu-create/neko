import React, { useState } from 'react';
import { Layers, Check, Copy, Bot, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { STYLES } from '../data/manualData';
import { AestheticStyleId } from '../types';

export const ThreeLayerGuide: React.FC = () => {
  // Custom Prompt Builder state
  const [targetComponent, setTargetComponent] = useState('Toggle 开关');
  const [featureDesc, setFeatureDesc] = useState('二元切换，开启时滑块右移 20px 并填充满主色');
  const [jellyType, setJellyType] = useState('0.55s cubic-bezier(0.3, 2.2, 0.4, 1) 过冲慢弹');
  const [chosenStyle, setChosenStyle] = useState<AestheticStyleId>('morandi');
  const [customStyleNote, setCustomStyleNote] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const styleObj = STYLES[chosenStyle];

  const generatedPrompt = `帮我做一个 ${targetComponent} 组件，结构上要 ${featureDesc}；交互反馈用果冻回弹效果，按下快速压缩至 0.85，松开用 ${jellyType} 慢速弹回；视觉上按【${styleObj.name}】风格，圆角、阴影跟着选定的风格走${customStyleNote ? `，另外注意：${customStyleNote}` : ''}。代码尽量精简，能合并的选择器/逻辑合并写，不要多余注释与防御性代码。`;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  return (
    <section id="threelayer-section" className="mb-14 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
            <Layers className="w-5 h-5 text-stone-700" />
            Part 3 三层组合公式与解耦思想 (Three Layers)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            结构（功能）+ 反馈（手感）+ 美化（视觉）= 健壮且绝不打架的高品质组件。
          </p>
        </div>
      </div>

      {/* Visual Diagram Banner */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Layer 1 */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center">
            <div className="w-8 h-8 mx-auto rounded-full bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs mb-2">
              1
            </div>
            <div className="font-bold text-sm text-stone-800">结构代码</div>
            <div className="text-[11px] text-stone-500 mt-1 font-mono">
              HTML + 基础定位
            </div>
            <div className="text-[11px] text-emerald-600 mt-2 font-medium">
              “能不能用”
            </div>
          </div>

          <div className="text-center font-bold text-stone-400 text-xl hidden md:block">
            +
          </div>

          {/* Layer 2 */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
            <div className="w-8 h-8 mx-auto rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs mb-2">
              2
            </div>
            <div className="font-bold text-sm text-amber-950">反馈代码</div>
            <div className="text-[11px] text-amber-800 mt-1 font-mono">
              只碰 transform / transition
            </div>
            <div className="text-[11px] text-amber-600 mt-2 font-medium">
              “点了有没有手感”
            </div>
          </div>

          <div className="text-center font-bold text-stone-400 text-xl hidden md:block">
            +
          </div>

          {/* Layer 3 */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-center">
            <div className="w-8 h-8 mx-auto rounded-full bg-rose-200 text-rose-900 flex items-center justify-center font-bold text-xs mb-2">
              3
            </div>
            <div className="font-bold text-sm text-rose-950">美化代码</div>
            <div className="text-[11px] text-rose-800 mt-1 font-mono">
              色彩 / 阴影 / 边框圆角
            </div>
            <div className="text-[11px] text-rose-600 mt-2 font-medium">
              “好不好看”
            </div>
          </div>
        </div>

        {/* Why no conflict */}
        <div className="mt-5 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>核心不打架定律</strong>：果冻反馈只管 <code>transform</code> 与 <code>transition: transform ...</code>；美化代码只管 <code>background</code>、<code>box-shadow</code>、<code>border-radius</code> 等纯视觉属性。两条 transition 绑定互不重叠的属性，换皮肤换风格无需重写交互！
          </p>
        </div>
      </div>

      {/* Toggle Case Study Demonstration */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs mb-8">
        <h3 className="font-bold text-base text-stone-800 mb-2 flex items-center gap-2">
          <span>🔬</span> 实例解析：Toggle 开关的三层叠合
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          看Toggle是如何将结构、反馈与美化各自分离的：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="font-bold text-stone-800 mb-1 font-sans">① 结构层 (HTML)</div>
            <pre className="text-stone-600 text-[11px] leading-normal overflow-x-auto">
{`<div class="toggle on">
  <div class="knob"></div>
</div>`}
            </pre>
          </div>
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
            <div className="font-bold text-amber-900 mb-1 font-sans">② 反馈层 (过冲曲线)</div>
            <pre className="text-amber-800 text-[11px] leading-normal overflow-x-auto">
{`.toggle .knob {
  transition: transform 
    0.55s cubic-bezier(0.3, 2.2, 0.4, 1);
}
.toggle:active .knob {
  transform: scale(0.85);
}`}
            </pre>
          </div>
          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200">
            <div className="font-bold text-rose-900 mb-1 font-sans">③ 美化层 (莫兰迪色彩)</div>
            <pre className="text-rose-800 text-[11px] leading-normal overflow-x-auto">
{`.toggle {
  width: 46px; height: 26px;
  background: #e3dad3;
  border-radius: 20px;
}
.toggle.on { background: #8a9a7c; }`}
            </pre>
          </div>
        </div>
      </div>

      {/* Interactive Prompt Generator */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-stone-700">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">
                一键生成喂给 AI 的 Prompt (Prompt Builder)
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              组合三层要素，自动按手册规范拼好一条精确生成指令：
            </p>
          </div>
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            {copiedPrompt ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPrompt ? '已复制到剪贴板!' : '一键复制完整 Prompt'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs mb-5">
          {/* Target component */}
          <div>
            <label className="block text-stone-300 mb-1 font-medium">1. 目标组件:</label>
            <select
              value={targetComponent}
              onChange={(e) => setTargetComponent(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="Toggle 开关">🔘 Toggle 开关</option>
              <option value="Drawer 侧边抽屉">🗂️ Drawer 侧边抽屉</option>
              <option value="Popover 气泡卡片">💬 Popover 气泡卡片</option>
              <option value="Split Button 分段按钮">🔀 Split Button 分段按钮</option>
              <option value="Accordion 折叠面板">📋 Accordion 折叠面板</option>
              <option value="Snackbar 轻提示条">📌 Snackbar 轻提示条</option>
              <option value="Badge 徽标与角标">🔴 Badge 徽标与角标</option>
              <option value="自定义组件">✨ 自定义组件</option>
            </select>
          </div>

          {/* Feedback model */}
          <div>
            <label className="block text-stone-300 mb-1 font-medium">2. 果冻反馈手感:</label>
            <select
              value={jellyType}
              onChange={(e) => setJellyType(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="0.65s cubic-bezier(0.34, 1.9, 0.4, 1) 慢速回弹">
                🧊 基础等比慢弹 (1.9)
              </option>
              <option value="0.7s cubic-bezier(0.32, 2.2, 0.4, 1) 缩放轻旋">
                🍡 圆形图标轻旋 (2.2)
              </option>
              <option value="0.75s cubic-bezier(0.28, 2.6, 0.35, 1) 胶囊软泥">
                🫠 胶囊横宽纵扁 (2.6)
              </option>
            </select>
          </div>

          {/* Aesthetic theme */}
          <div>
            <label className="block text-stone-300 mb-1 font-medium">3. 选定美化风格:</label>
            <select
              value={chosenStyle}
              onChange={(e) => setChosenStyle(e.target.value as AestheticStyleId)}
              className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="morandi">🟤 莫兰迪风格</option>
              <option value="macaron">🍬 马卡龙风格</option>
              <option value="glass">🧊 玻璃拟态风格</option>
              <option value="mono">⬛ 黑白简约大气</option>
            </select>
          </div>

          {/* Custom functional requirement */}
          <div>
            <label className="block text-stone-300 mb-1 font-medium">4. 补充指令细节:</label>
            <input
              type="text"
              placeholder="例如: 手机端适配, 点击外部关闭"
              value={customStyleNote}
              onChange={(e) => setCustomStyleNote(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Live Output */}
        <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-700/80 font-mono text-xs leading-relaxed text-amber-200 select-all">
          "{generatedPrompt}"
        </div>
      </div>
    </section>
  );
};
