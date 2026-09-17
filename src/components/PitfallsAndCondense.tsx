import React, { useState } from 'react';
import { AlertTriangle, Scissors, Check, ShieldAlert, Zap, ArrowRight } from 'lucide-react';
import { PITFALLS_DATA, CONDENSE_EXAMPLES } from '../data/manualData';
import { CodeBlock } from './CodeBlock';

export const PitfallsAndCondense: React.FC = () => {
  const [checkedPitfalls, setCheckedPitfalls] = useState<Record<number, boolean>>({});

  const togglePitfallCheck = (idx: number) => {
    setCheckedPitfalls(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-14">
      {/* PART 7: PITFALLS */}
      <section id="pitfalls-section" className="scroll-mt-24">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Part 7 避雷清单：哪些事千万别做
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              单文件与动态迭代最容易踩到的隐形大坑：架构、存储、性能与容错排雷。
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
            已核对 {Object.values(checkedPitfalls).filter(Boolean).length} / {PITFALLS_DATA.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PITFALLS_DATA.map((item, idx) => {
            const isChecked = !!checkedPitfalls[idx];
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  isChecked
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                    : 'bg-white border-stone-200/90 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-sm text-stone-800">
                      {item.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => togglePitfallCheck(idx)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-stone-300 text-transparent hover:border-stone-500'
                    }`}
                    title="标记为已核对"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

                <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                  {item.problem}
                </p>

                <div className="space-y-2">
                  <CodeBlock code={item.badCode} language="javascript" title="❌ 易崩溃的反面写法" />
                  <CodeBlock code={item.goodCode} language="javascript" title="✅ 健壮的正面写法" />
                </div>

                <div className="mt-3 text-[11px] text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
                  <span className="font-bold">避坑口诀：</span>
                  <span>{item.tip}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PART 8: CONDENSE PRINCIPLE */}
      <section id="condense-section" className="scroll-mt-24">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
              <Scissors className="w-5 h-5 text-amber-600" />
              Part 8 精简原则：同效果优先选短代码
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              写代码前自问三问：能一行解决不写十行，效果没差，选字数少的那份。
            </p>
          </div>
        </div>

        {/* The 3 Core Questions Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-md mb-6">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" />
            落笔前三问 (The Three Checks):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <div className="font-bold text-stone-200 mb-1">Q1: 等价精简？</div>
              <p className="text-stone-400 text-[11px]">
                这段逻辑有没有更短的等价写法？例如字典查表 vs 繁复的 if/else。
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <div className="font-bold text-stone-200 mb-1">Q2: 合并复用？</div>
              <p className="text-stone-400 text-[11px]">
                有没有可以合并的选择器或重复片段？CSS 规则与公用函数提取一次。
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <div className="font-bold text-stone-200 mb-1">Q3: 剔除冗余？</div>
              <p className="text-stone-400 text-[11px]">
                有没有根本用不上的分支、废弃旧代码或无意义注释？全部清理。
              </p>
            </div>
          </div>
        </div>

        {/* 3 Side-by-Side Comparison Examples */}
        <div className="space-y-6">
          {CONDENSE_EXAMPLES.map((example, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs"
            >
              <div className="mb-3">
                <h3 className="font-bold text-sm text-stone-800">
                  {example.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {example.desc}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-rose-600 block mb-1">
                    ❌ 冗长代码（行数多、易改漏）:
                  </span>
                  <CodeBlock code={example.verboseCode} language="javascript" title="冗长写法" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 block mb-1">
                    ✅ 精简代码（清晰紧凑、零冗余）:
                  </span>
                  <CodeBlock code={example.conciseCode} language="javascript" title="精简写法" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
