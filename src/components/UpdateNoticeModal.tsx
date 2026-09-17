import React from 'react';
import { Sparkles, X, Check, Megaphone, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { CURRENT_VERSION, LATEST_UPDATE } from '../data/versionLog';

interface UpdateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceShow?: boolean;
}

export const UpdateNoticeModal: React.FC<UpdateNoticeModalProps> = ({
  isOpen,
  onClose,
  forceShow = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    localStorage.setItem('wephone_last_seen_version', CURRENT_VERSION);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#fffaf5] text-[#593c3f] rounded-3xl shadow-2xl border border-[#ebd2d5] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        style={{ boxShadow: '0 20px 40px -15px rgba(184, 92, 103, 0.25)' }}
      >
        {/* Header - Rococo Soft Rose gradient */}
        <div className="p-4 bg-gradient-to-r from-[#f2cbd0] via-[#eed0c8] to-[#ecd3c2] border-b border-[#e3b8bc] flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-full bg-white/70 text-[#b85c67] flex items-center justify-center shadow-xs border border-white/60">
              <Megaphone className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#593c3f]">系统更新公告</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#b85c67] text-white shadow-2xs">
                  {LATEST_UPDATE.version}
                </span>
              </div>
              <p className="text-[10px] text-[#7a585c] flex items-center gap-1 mt-0.5 font-mono">
                <Clock className="w-3 h-3 text-[#a67c82]" />
                <span>发布日期：{LATEST_UPDATE.date}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="p-1.5 rounded-full hover:bg-white/40 text-[#7a585c] hover:text-[#593c3f] transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Main Title */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#6e4348] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#d9828b]" />
              <span>{LATEST_UPDATE.title}</span>
            </h4>
            <p className="text-[11px] text-[#8c6f72] leading-relaxed">
              为了给您带来更丝滑拟真的体验，本次更新包含以下主要优化与新增功能：
            </p>
          </div>

          {/* Highlights List */}
          <div className="space-y-2 bg-[#f9f1eb] p-3.5 rounded-2xl border border-[#ebdcd5]">
            {LATEST_UPDATE.highlights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-[#593c3f] leading-relaxed">
                <div className="w-4 h-4 rounded-full bg-[#fce8ea] text-[#b85c67] flex items-center justify-center shrink-0 mt-0.5 border border-[#e8b4b8]/60 text-[10px] font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 font-medium">{item}</div>
              </div>
            ))}
          </div>

          {/* Notice Tips */}
          {LATEST_UPDATE.notice && (
            <div className="p-3 bg-[#fdf2f4] rounded-xl border border-[#f5d5da] text-[11px] text-[#8c434b] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#b85c67] shrink-0 mt-0.5" />
              <span>{LATEST_UPDATE.notice}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-[#f5ede4] border-t border-[#ebd2cb] flex items-center justify-between gap-3">
          <span className="text-[10px] text-[#8c6f72]">
            可在「设置 &gt; 关于与公告」中随时回看
          </span>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-gradient-to-r from-[#d9828b] to-[#c7727b] hover:from-[#c7727b] hover:to-[#b5616a] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>进入体验</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
