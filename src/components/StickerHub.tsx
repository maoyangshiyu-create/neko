import React, { useState } from 'react';
import { Smile, Image, AlertCircle, Plus, Send, RefreshCw, Check, Sparkles } from 'lucide-react';
import { INITIAL_STICKERS } from '../data/manualData';
import { StickerItem, AestheticStyleId } from '../types';
import { STYLES } from '../data/manualData';
import { CodeBlock } from './CodeBlock';

interface StickerHubProps {
  currentStyle: AestheticStyleId;
}

export const StickerHub: React.FC<StickerHubProps> = ({ currentStyle }) => {
  const [stickers, setStickers] = useState<StickerItem[]>(INITIAL_STICKERS);
  const [newStickerName, setNewStickerName] = useState('');
  const [newStickerUrl, setNewStickerUrl] = useState('');

  // Simulator state
  const [rawAiResponse, setRawAiResponse] = useState(
    '听到这个消息我也好难过 [表情:委屈] 别灰心，明天会更好的！给你加油 [表情:点赞] 顺便测试一个不存在的 [表情:大笑不止] 看看兜底降级效果！'
  );

  const styleConfig = STYLES[currentStyle];

  // Part 6 buildStickerHint function:
  function buildStickerHint(list: StickerItem[]) {
    if (!list.length) {
      return '（当前没有可用表情，不要发 [表情:xxx] 这种标记）';
    }
    const names = list.map(s => s.name).join(' / ');
    return `如果想发表情，格式是 [表情:名字]。\n表情名必须从下面这份清单里一字不差地选，不能自己编，\n如果都不合适就不要发表情，用文字表达就好：\n${names}`;
  }

  // Part 6 parseReplyToMessages function:
  function parseReplyToMessages(rawText: string, stickerLib: StickerItem[]) {
    const parts: Array<{ type: 'text' | 'sticker'; content?: string; sticker?: StickerItem }> = [];
    const regex = /\[表情[:：]\s*([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      const before = rawText.slice(lastIndex, match.index).trim();
      if (before) parts.push({ type: 'text', content: before });

      const name = match[1].trim();
      const sticker = stickerLib.find(s => s.name === name);
      // 找不到就当普通文字处理，避免界面上出现裂图或空白
      if (sticker) {
        parts.push({ type: 'sticker', sticker });
      } else if (match[0]) {
        parts.push({ type: 'text', content: match[0] });
      }

      lastIndex = regex.lastIndex;
    }
    const rest = rawText.slice(lastIndex).trim();
    if (rest) parts.push({ type: 'text', content: rest });

    return parts;
  }

  const parsedBubbles = parseReplyToMessages(rawAiResponse, stickers);
  const hintPrompt = buildStickerHint(stickers);

  const handleAddSticker = () => {
    if (!newStickerName.trim()) return;
    const urlToUse = newStickerUrl.trim() || 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=160&auto=format&fit=crop&q=80';
    const newStk: StickerItem = {
      id: 'st_' + Date.now(),
      name: newStickerName.trim(),
      emoji: '✨',
      url: urlToUse,
      isGlobal: true
    };
    setStickers([...stickers, newStk]);
    setNewStickerName('');
    setNewStickerUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewStickerUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section id="sticker-section" className="mb-14 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
            <Smile className="w-5 h-5 text-stone-700" />
            Part 6 表情包管理与解析渲染 (Sticker Hub)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            如何让 AI 不编造表情名字，以及将 [表情:名字] 安全还原为图片气泡。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sticker Library */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <h3 className="text-sm font-bold text-stone-800 mb-2 flex items-center justify-between">
              <span>🖼️ 已注册表情库 ({stickers.length})</span>
              <span className="text-[11px] text-stone-400 font-mono">Base64 持久存储</span>
            </h3>

            {/* Sticker Grid */}
            <div className="grid grid-cols-4 gap-2.5 my-3">
              {stickers.map((stk) => (
                <div
                  key={stk.id}
                  className="flex flex-col items-center p-2 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-stone-400 transition-colors"
                >
                  {stk.url ? (
                    <img
                      src={stk.url}
                      alt={stk.name}
                      className="w-12 h-12 rounded-lg object-cover shadow-xs mb-1"
                      onError={(e) => {
                        // Fallback placeholder
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-stone-200 flex items-center justify-center text-[10px] text-stone-400 mb-1">
                      无图
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-stone-700 truncate w-full text-center">
                    {stk.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Upload or Add Sticker */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <span className="text-xs font-semibold text-stone-700 block">
                + 新增表情
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="情绪名(如: 惊喜)"
                  value={newStickerName}
                  onChange={(e) => setNewStickerName(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                />
                <label className="w-1/2 px-2.5 py-1.5 rounded-lg border border-dashed border-stone-300 hover:border-stone-500 text-center text-xs text-stone-600 cursor-pointer truncate">
                  <span>{newStickerUrl ? '图片已就绪' : '选择本地图片'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <button
                onClick={handleAddSticker}
                disabled={!newStickerName.trim()}
                className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                保存到表情库
              </button>
            </div>

            {/* Prompt Instruction Preview */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-950">
              <span className="font-bold block mb-1">
                🧠 注入 System Prompt 的表情约束指令：
              </span>
              <pre className="font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-amber-900 bg-white/80 p-2 rounded border border-amber-200">
                {hintPrompt}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Parsing Simulator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col h-full">
            <h3 className="text-sm font-bold text-stone-800 mb-2 flex items-center justify-between">
              <span>🎯 AI 文本解析为图片气泡试验场</span>
              <span className="text-[11px] text-stone-400">自动剔除 [表情:xxx] 并转为独立图</span>
            </h3>

            {/* Text input to simulate AI reply */}
            <div className="mb-3">
              <label className="block text-[11px] text-stone-500 mb-1 font-semibold">
                模拟 AI 传回的一段包含表情标记的原始文本：
              </label>
              <textarea
                value={rawAiResponse}
                onChange={(e) => setRawAiResponse(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 resize-none h-18 font-mono"
              />
            </div>

            {/* Live Rendered Chat Bubble stream */}
            <div className="flex-1 flex flex-col">
              <span className="text-[11px] font-semibold text-stone-700 mb-1.5">
                前端最终渲染出的聊天消息序列：
              </span>
              <div
                className="p-4 rounded-xl border flex-1 min-h-[160px] space-y-2.5 overflow-y-auto"
                style={{
                  backgroundColor: styleConfig.vars.bg,
                  borderColor: styleConfig.vars.line,
                }}
              >
                {parsedBubbles.map((part, index) => {
                  if (part.type === 'text') {
                    return (
                      <div
                        key={index}
                        className="max-w-[80%] p-3 text-xs leading-relaxed transition-all shadow-xs"
                        style={{
                          backgroundColor: styleConfig.vars.paper,
                          color: styleConfig.vars.ink,
                          borderRadius: styleConfig.vars.radius,
                          border: `1px solid ${styleConfig.vars.line}`
                        }}
                      >
                        {part.content}
                      </div>
                    );
                  }

                  if (part.type === 'sticker' && part.sticker && part.sticker.url) {
                    return (
                      <div key={index} className="inline-block my-1">
                        <div className="relative group">
                          <img
                            src={part.sticker.url}
                            alt={part.sticker.name}
                            className="w-24 h-24 object-cover rounded-xl shadow-md transition-transform active:scale-95"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-xs font-mono">
                            {part.sticker.name}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span>✅ 规则：表情气泡单独成图，不加文字底色；未匹配到的标记回退为文字不崩坏。</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Block for Regex Parsing */}
      <div className="mt-6">
        <CodeBlock
          code={`// 把一段AI回复拆成 [{type:'text', content}, {type:'sticker', sticker}] 的消息片段数组\nfunction parseReplyToMessages(rawText, stickerLib) {\n  const parts = [];\n  const regex = /\\[表情[:：]\\s*([^\\]]+)\\]/g;\n  let lastIndex = 0;\n  let match;\n\n  while ((match = regex.exec(rawText)) !== null) {\n    const before = rawText.slice(lastIndex, match.index).trim();\n    if (before) parts.push({ type: 'text', content: before });\n\n    const name = match[1].trim();\n    const sticker = stickerLib.find(s => s.name === name);\n    // 找不到就当普通文字处理，避免界面上出现裂图或空白\n    if (sticker) parts.push({ type: 'sticker', sticker });\n    else if (match[0]) parts.push({ type: 'text', content: match[0] });\n\n    lastIndex = regex.lastIndex;\n  }\n  const rest = rawText.slice(lastIndex).trim();\n  if (rest) parts.push({ type: 'text', content: rest });\n\n  return parts;\n}`}
          language="javascript"
          title="正则提取与安全降级解析函数"
        />
      </div>
    </section>
  );
};
