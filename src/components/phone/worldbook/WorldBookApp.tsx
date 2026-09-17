import React, { useState } from 'react';
import { WorldBookItem } from '../../../types/phone';
import { ArrowLeft, Plus, BookOpen, Trash2, Globe, Lock, Check } from 'lucide-react';

interface WorldBookAppProps {
  worldBooks: WorldBookItem[];
  onAddWorldBook: (wb: WorldBookItem) => void;
  onUpdateWorldBook: (id: string, updates: Partial<WorldBookItem>) => void;
  onDeleteWorldBook: (id: string) => void;
  onReturnToDesktop: () => void;
}

export const WorldBookApp: React.FC<WorldBookAppProps> = ({
  worldBooks,
  onAddWorldBook,
  onUpdateWorldBook,
  onDeleteWorldBook,
  onReturnToDesktop
}) => {
  const [editingItem, setEditingItem] = useState<WorldBookItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<'global' | 'local'>('local');

  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;

    if (editingItem) {
      onUpdateWorldBook(editingItem.id, { name, content, scope });
      setEditingItem(null);
    } else {
      onAddWorldBook({
        id: `wb_${Date.now()}`,
        name: name.trim(),
        content: content.trim(),
        scope
      });
    }
    setIsAdding(false);
    setName('');
    setContent('');
  };

  return (
    <div
      className="rococo-theme h-full w-full flex flex-col select-none relative overflow-hidden font-serif"
      style={{
        backgroundColor: '#f3f8fc',
        color: '#234358'
      }}
    >
      {/* Header - Soft Rococo Pastel Blue */}
      <div className="h-11 px-3 bg-gradient-to-r from-[#d9e8f5] via-[#cde0f0] to-[#bed7ec] border-b border-[#a6c7df] flex items-center justify-between shrink-0 z-10 shadow-xs">
        <button
          onClick={onReturnToDesktop}
          className="flex items-center gap-0.5 text-[#234c6b] text-xs font-semibold cursor-pointer active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-[#32648a]" />
          <span>桌面</span>
        </button>
        <span className="font-bold text-xs text-[#234c6b] flex items-center gap-1 font-serif">
          <BookOpen className="w-3.5 h-3.5 text-[#32648a]" />
          <span>世界书</span>
        </span>
        <button
          onClick={() => {
            setName('');
            setContent('');
            setScope('local');
            setEditingItem(null);
            setIsAdding(true);
          }}
          className="p-1 rounded-full hover:bg-white/40 text-[#234c6b] cursor-pointer active:scale-90 transition-colors"
          title="新建词条"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* World Book List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs font-sans">
        {worldBooks.map((wb) => (
          <div
            key={wb.id}
            className="p-3 bg-white rounded-2xl border border-[#cfe0ec] shadow-xs space-y-1.5 hover:border-[#86b5d6] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[#234c6b]">
                {wb.scope === 'global' ? (
                  <Globe className="w-3.5 h-3.5 text-[#2c77a6]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#5a7d94]" />
                )}
                <span className="font-serif">{wb.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  wb.scope === 'global' ? 'bg-[#e3f0fa] text-[#18537a] border-[#b6d6ec]' : 'bg-[#eff4f8] text-[#44667d] border-[#d2e0e8]'
                }`}>
                  {wb.scope === 'global' ? '全局通用' : '角色绑定'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingItem(wb);
                    setName(wb.name);
                    setContent(wb.content);
                    setScope(wb.scope);
                    setIsAdding(true);
                  }}
                  className="text-[#266e9c] hover:text-[#174e70] font-semibold cursor-pointer"
                >
                  编辑
                </button>
                <button
                  onClick={() => onDeleteWorldBook(wb.id)}
                  className="text-red-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#28495f] leading-relaxed bg-[#f0f6fa] p-2.5 rounded-xl border border-[#d6e5ef]">
              {wb.content}
            </p>
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="w-80 bg-white rounded-2xl p-4 shadow-2xl text-xs space-y-3 border border-[#cfe0ec]">
            <h4 className="font-bold text-sm text-[#234c6b] font-serif">
              {editingItem ? '编辑世界书词条' : '新建世界书词条'}
            </h4>
            <div>
              <label className="block text-[11px] text-[#416885] mb-1">设定名称:</label>
              <input
                type="text"
                placeholder="例如: 维多利亚魔法公约"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-[#cfe0ec] rounded-xl text-xs bg-[#f4f9fd] text-[#1d3d52] focus:outline-hidden focus:border-[#387aa4]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#416885] mb-1">作用范围:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('global')}
                  className={`py-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    scope === 'global' ? 'bg-[#e3f0fa] text-[#18537a] border-[#387aa4] font-semibold shadow-xs' : 'bg-white border-[#cfe0ec] text-[#416885]'
                  }`}
                >
                  全局生效 (所有AI已知)
                </button>
                <button
                  type="button"
                  onClick={() => setScope('local')}
                  className={`py-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    scope === 'local' ? 'bg-[#e3f0fa] text-[#18537a] border-[#387aa4] font-semibold shadow-xs' : 'bg-white border-[#cfe0ec] text-[#416885]'
                  }`}
                >
                  局部生效 (需角色绑定)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-[#416885] mb-1">设定具体内容:</label>
              <textarea
                placeholder="描述具体世界观、技术水平或历史事件..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2.5 border border-[#cfe0ec] rounded-xl h-24 resize-none leading-relaxed bg-[#f4f9fd] text-[#1d3d52] focus:outline-hidden focus:border-[#387aa4]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 rounded-xl border border-[#cfe0ec] text-[#416885] hover:bg-[#edf5fb] cursor-pointer font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || !content.trim()}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#427fa8] to-[#30688c] hover:from-[#377095] hover:to-[#265574] text-white font-semibold disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
              >
                保存设定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
