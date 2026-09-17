import React, { useState } from 'react';
import { BookOpen, Globe, Lock, Plus, Trash2, Check, Copy, User } from 'lucide-react';
import { INITIAL_WORLD_BOOKS } from '../data/manualData';
import { WorldBookEntry } from '../types';
import { CodeBlock } from './CodeBlock';

export const WorldBookStudio: React.FC = () => {
  const [worldBooks, setWorldBooks] = useState<WorldBookEntry[]>(INITIAL_WORLD_BOOKS);
  const [activeChar, setActiveChar] = useState({
    id: 'char_001',
    name: '特工「夜莺」艾丽卡',
    basePersona: '你是一名潜伏在新亚特兰蒂斯的仿生人情报员，性格外冷内热，擅长分析情报，说话干练克制。',
    boundWorldBookIds: ['wb_3']
  });

  // New book modal / inputs
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newScope, setNewScope] = useState<'global' | 'local'>('local');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Part 5 active logic:
  function getActiveWorldBooks(char: typeof activeChar, allBooks: WorldBookEntry[]) {
    return allBooks.filter(wb =>
      wb.scope === 'global' || (char.boundWorldBookIds || []).includes(wb.id)
    );
  }

  function buildSystemPrompt(char: typeof activeChar, allBooks: WorldBookEntry[]) {
    const books = getActiveWorldBooks(char, allBooks);
    const worldSection = books.length
      ? `\n\n【世界设定，仅供你理解背景，不要复述或提及这是"设定"】\n` +
        books.map(wb => `· ${wb.name}：${wb.content}`).join('\n')
      : '';

    return `${char.basePersona}${worldSection}`;
  }

  const activeBooks = getActiveWorldBooks(activeChar, worldBooks);
  const assembledPrompt = buildSystemPrompt(activeChar, worldBooks);

  const handleAddBook = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const newBook: WorldBookEntry = {
      id: 'wb_' + Date.now(),
      name: newTitle.trim(),
      content: newContent.trim(),
      scope: newScope
    };
    setWorldBooks([...worldBooks, newBook]);
    if (newScope === 'local') {
      setActiveChar({
        ...activeChar,
        boundWorldBookIds: [...activeChar.boundWorldBookIds, newBook.id]
      });
    }
    setNewTitle('');
    setNewContent('');
  };

  const toggleBindLocal = (bookId: string) => {
    const isBound = activeChar.boundWorldBookIds.includes(bookId);
    setActiveChar({
      ...activeChar,
      boundWorldBookIds: isBound
        ? activeChar.boundWorldBookIds.filter(id => id !== bookId)
        : [...activeChar.boundWorldBookIds, bookId]
    });
  };

  const handleDeleteBook = (id: string) => {
    setWorldBooks(worldBooks.filter(wb => wb.id !== id));
    setActiveChar({
      ...activeChar,
      boundWorldBookIds: activeChar.boundWorldBookIds.filter(bid => bid !== id)
    });
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(assembledPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  return (
    <section id="worldbook-section" className="mb-14 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
            <BookOpen className="w-5 h-5 text-stone-700" />
            Part 5 世界书装配工作台 (World Book Studio)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            背景世界观与私密设定的组装：全局自动附带 + 局部按需绑定，无缝拼装进 System Prompt。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: World Books Manager */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                <span>📚</span> 世界书词条库 ({worldBooks.length} 条)
              </h3>
              <span className="text-[11px] text-stone-400">
                全局条目人人拥有，局部条目需勾选
              </span>
            </div>

            {/* List of World Books */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {worldBooks.map((wb) => {
                const isGlobal = wb.scope === 'global';
                const isBound = activeChar.boundWorldBookIds.includes(wb.id);

                return (
                  <div
                    key={wb.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isGlobal
                        ? 'bg-blue-50/50 border-blue-200/70'
                        : isBound
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-stone-50/60 border-stone-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-stone-800">
                        {isGlobal ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] flex items-center gap-0.5">
                            <Globe className="w-3 h-3" /> 全局
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] flex items-center gap-0.5">
                            <Lock className="w-3 h-3" /> 局部
                          </span>
                        )}
                        <span>{wb.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isGlobal && (
                          <button
                            onClick={() => toggleBindLocal(wb.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                              isBound
                                ? 'bg-amber-600 text-white'
                                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                            }`}
                          >
                            {isBound ? '已绑定当前角色' : '+ 绑定'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBook(wb.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                          title="删除设定"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {wb.content}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Add New World Book */}
            <div className="mt-4 pt-4 border-t border-stone-100 space-y-2">
              <span className="text-xs font-bold text-stone-700 block">
                + 新建世界书条目
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="设定条目名称 (如: 货币制度)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                />
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as any)}
                  className="px-2 py-1.5 rounded-lg border border-stone-200 text-xs bg-white text-stone-700 cursor-pointer"
                >
                  <option value="local">局部绑定 (Local)</option>
                  <option value="global">全局通用 (Global)</option>
                </select>
              </div>
              <textarea
                placeholder="设定正文描述（AI 将原样读到这段设定）..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs h-16 resize-none"
              />
              <button
                onClick={handleAddBook}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                添加至世界书
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Assembly Output */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-bold text-stone-800">
                  当前角色：{activeChar.name}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                生效设定: {activeBooks.length} 项
              </span>
            </div>

            {/* Base Persona Input */}
            <div className="mb-3">
              <label className="block text-[11px] text-stone-500 mb-1 font-semibold">
                角色基础人设 (Base Persona):
              </label>
              <textarea
                value={activeChar.basePersona}
                onChange={(e) => setActiveChar({ ...activeChar, basePersona: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 resize-none h-16"
              />
            </div>

            {/* Assembled Prompt Preview */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-stone-700">
                  最终拼装生成的完整 System Prompt:
                </span>
                <button
                  onClick={copyPrompt}
                  className="flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 cursor-pointer font-medium"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPrompt ? '已复制' : '复制全文'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs leading-relaxed flex-1 overflow-y-auto max-h-56 select-all whitespace-pre-wrap">
                {assembledPrompt}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
              💡 关键细节：拼接时加入 <code>【世界设定，仅供你理解背景，不要复述或提及这是"设定"】</code> 标头，防止模型误认为用户输入。
            </div>
          </div>
        </div>
      </div>

      {/* Assembly Logic Code */}
      <div className="mt-6">
        <CodeBlock
          code={`// 取出某个角色实际生效的世界书列表：全局自动生效，局部看是否绑定\nfunction getActiveWorldBooks(char, allWorldBooks) {\n  return allWorldBooks.filter(wb =>\n    wb.scope === 'global' ||\n    (char.boundWorldBookIds || []).includes(wb.id)\n  );\n}\n\n// 组装进 system prompt，明确告诉 AI 这是背景设定\nfunction buildSystemPrompt(char, allWorldBooks, basePersona) {\n  const books = getActiveWorldBooks(char, allWorldBooks);\n  const worldSection = books.length\n    ? \`\\n\\n【世界设定，仅供你理解背景，不要复述或提及这是"设定"】\\n\` +\n      books.map(wb => \`· \${wb.name}：\${wb.content}\`).join('\\n')\n    : '';\n\n  return \`\${basePersona}\${worldSection}\`;\n}`}
          language="javascript"
          title="世界书组装核心逻辑代码"
        />
      </div>
    </section>
  );
};
