import React, { useState } from 'react';
import { JELLY_TYPES } from '../data/manualData';
import { CodeBlock } from './CodeBlock';
import { Sparkles, Sliders, Heart, Send, Bell } from 'lucide-react';

export const JellyPlayground: React.FC = () => {
  const [activeJellyId, setActiveJellyId] = useState('basic');
  const [customOvershoot, setCustomOvershoot] = useState(2.2);
  const [customReleaseTime, setCustomReleaseTime] = useState(0.65);
  const [clickCount, setClickCount] = useState(0);

  const activeJelly = JELLY_TYPES.find(j => j.id === activeJellyId) || JELLY_TYPES[0];

  return (
    <section id="jelly-section" className="mb-14 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Part 2 果冻反馈代码实验室 (Jelly Physics)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            三大手感模型：按住快速收缩蓄力，松开超强弹性过冲缓慢回弹。
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-stone-100 rounded-full text-stone-600">
          已测试点击: {clickCount} 次
        </span>
      </div>

      {/* Principle Law Card */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-amber-950 text-xs sm:text-sm">
        <div className="font-bold flex items-center gap-2 text-base text-amber-900 mb-1">
          <span>🍮</span> 果冻反馈第一定律
        </div>
        <p className="leading-relaxed text-amber-800/90">
          <strong>按下用短时长（0.06~0.08s）快压</strong>，<strong>松开用长时长（0.6~0.8s）+ 过冲的 cubic-bezier 慢弹回</strong>。
          贝塞尔曲线第二个参数（通常在 1.8 ~ 2.6 之间）越大，弹得越夸张！
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3 Preset Cards */}
        {JELLY_TYPES.map((jelly) => {
          const isSelected = activeJellyId === jelly.id;
          return (
            <div
              key={jelly.id}
              onClick={() => setActiveJellyId(jelly.id)}
              className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-white border-stone-800 ring-2 ring-stone-800 shadow-md'
                  : 'bg-white/80 border-stone-200 hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{jelly.icon}</span>
                  <h3 className="font-bold text-sm text-stone-800">{jelly.name}</h3>
                </div>
                {isSelected && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-900 text-white font-mono">
                    选定
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-600 mb-4 min-h-[48px] leading-relaxed">
                {jelly.desc}
              </p>

              {/* Interactive Demo Area */}
              <div className="p-6 rounded-xl bg-stone-50 border border-stone-200/60 flex flex-col items-center justify-center gap-3">
                {jelly.id === 'basic' && (
                  <button
                    onClick={() => setClickCount(c => c + 1)}
                    className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md cursor-pointer select-none"
                    style={{
                      transform: 'scale(1)',
                      transition: `transform ${jelly.releaseBezier}, box-shadow ${jelly.releaseBezier}`,
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.88)';
                      e.currentTarget.style.transition = 'transform 0.08s ease-out';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.transition = `transform ${jelly.releaseBezier}`;
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.88)';
                      e.currentTarget.style.transition = 'transform 0.08s ease-out';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.transition = `transform ${jelly.releaseBezier}`;
                    }}
                  >
                    按住我感受回弹
                  </button>
                )}

                {jelly.id === 'icon' && (
                  <button
                    onClick={() => setClickCount(c => c + 1)}
                    className="w-13 h-13 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg cursor-pointer select-none"
                    style={{
                      transform: 'scale(1) rotate(0deg)',
                      transition: `transform ${jelly.releaseBezier}, box-shadow ${jelly.releaseBezier}`,
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.82) rotate(-4deg)';
                      e.currentTarget.style.transition = 'transform 0.08s ease-out';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.transition = `transform ${jelly.releaseBezier}`;
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.82) rotate(-4deg)';
                      e.currentTarget.style.transition = 'transform 0.08s ease-out';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.transition = `transform ${jelly.releaseBezier}`;
                    }}
                  >
                    <Heart className="w-6 h-6 fill-white" />
                  </button>
                )}

                {jelly.id === 'capsule' && (
                  <button
                    onClick={() => setClickCount(c => c + 1)}
                    className="px-7 py-3 rounded-full bg-gradient-to-r from-amber-500 to-rose-400 text-white font-bold text-xs shadow-md cursor-pointer select-none"
                    style={{
                      transformOrigin: 'center bottom',
                      transform: 'scale(1, 1)',
                      transition: `transform ${jelly.releaseBezier}, box-shadow ${jelly.releaseBezier}`,
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(1.12, 0.78)';
                      e.currentTarget.style.transition = 'transform 0.06s ease-out';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1, 1)';
                      e.currentTarget.style.transition = `transform ${jelly.releaseBezier}`;
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(1.12, 0.78)';
                      e.currentTarget.style.transition = 'transform 0.06s ease-out';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1, 1)';
                      e.currentTarget.style.transition = `transform ${jelly.releaseBezier}`;
                    }}
                  >
                    软泥胶囊 (长按压扁)
                  </button>
                )}

                <span className="text-[11px] text-stone-400">
                  点击或按住 0.5s 后松手
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Code details of selected jelly feedback */}
      <div className="mt-6 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeJelly.icon}</span>
            <h3 className="font-bold text-stone-800 text-sm">
              【{activeJelly.name}】CSS 样式代码
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            松开曲线: {activeJelly.releaseBezier}
          </span>
        </div>
        <CodeBlock code={activeJelly.cssCode} language="css" title="果冻动效 CSS 规则" />
      </div>

      {/* Interactive Custom Curve Slider */}
      <div className="mt-6 p-5 rounded-2xl bg-stone-50 border border-stone-200/80">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-stone-700" />
          <h3 className="font-bold text-xs sm:text-sm text-stone-800">
            自定义果冻回弹曲线调参器 (Overshoot Tuner)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-mono mb-1 text-stone-700">
                <span>过冲强度 (Overshoot Ratio):</span>
                <span className="font-bold text-amber-600">{customOvershoot}</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="3.0"
                step="0.1"
                value={customOvershoot}
                onChange={(e) => setCustomOvershoot(parseFloat(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>1.2 (轻微软弹)</span>
                <span>2.0 (标准果冻)</span>
                <span>3.0 (极度夸张)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono mb-1 text-stone-700">
                <span>回弹时长 (Duration):</span>
                <span className="font-bold text-amber-600">{customReleaseTime}s</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.2"
                step="0.05"
                value={customReleaseTime}
                onChange={(e) => setCustomReleaseTime(parseFloat(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-stone-200 font-mono text-[11px] text-stone-600">
              transition: transform {customReleaseTime}s cubic-bezier(0.34, {customOvershoot}, 0.4, 1);
            </div>
          </div>

          {/* Interactive button with custom parameter */}
          <div className="p-8 rounded-xl bg-white border border-stone-200 flex flex-col items-center justify-center gap-2">
            <button
              className="px-6 py-3 rounded-2xl bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer select-none"
              style={{
                transform: 'scale(1)',
                transition: `transform ${customReleaseTime}s cubic-bezier(0.34, ${customOvershoot}, 0.4, 1)`,
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.85)';
                e.currentTarget.style.transition = 'transform 0.08s ease-out';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.transition = `transform ${customReleaseTime}s cubic-bezier(0.34, ${customOvershoot}, 0.4, 1)`;
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.85)';
                e.currentTarget.style.transition = 'transform 0.08s ease-out';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.transition = `transform ${customReleaseTime}s cubic-bezier(0.34, ${customOvershoot}, 0.4, 1)`;
              }}
            >
              🚀 实时测试调参按钮
            </button>
            <span className="text-[11px] text-stone-400">
              移动滑块后点击上方按钮感受参数差异
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
