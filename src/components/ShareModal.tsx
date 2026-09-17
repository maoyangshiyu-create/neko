import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Globe, Smartphone, ShieldCheck, X } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTip, setCopiedTip] = useState(false);

  if (!isOpen) return null;

  // 获取当前真实的独立网页地址
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-t6v4is5vhxyysl5xo7nref-107144104454.us-west2.run.app';

  const copyToClipboard = async (text: string, type: 'link' | 'tip') => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedTip(true);
        setTimeout(() => setCopiedTip(false), 2000);
      }
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const inviteText = `📱 给你分享一个超逼真的 iPhone + 微信 AI 模拟器网页：\n👉 专属体验地址：${shareUrl}\n✨ 支持微信聊天、朋友圈、主题商店换肤与丰富应用，手机浏览器打开效果更佳！`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#fffaf5] text-[#593c3f] rounded-3xl shadow-2xl border border-[#ebd2d5] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#f2cbd0] via-[#eed0c8] to-[#ecd3c2] border-b border-[#e3b8bc] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/70 text-[#b85c67] flex items-center justify-center shadow-xs border border-white/60">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#593c3f]">分享网页给他人</h3>
              <p className="text-[10px] text-[#7a585c] mt-0.5">纯净独立链接 · 随时随地跨端畅玩</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/40 text-[#7a585c] hover:text-[#593c3f] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-[#593c3f]">
          {/* Tip Banner */}
          <div className="p-3 bg-[#fdf2f4] rounded-2xl border border-[#f5d5da] text-[11px] text-[#8c434b] leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[#b85c67]">
              <Globe className="w-3.5 h-3.5" />
              <span>正确的分享方式说明：</span>
            </div>
            <p>
              请<strong>不要</strong>直接复制开发工作台（带有 AI 对话框）的链接。请使用下方生成的<strong>独立纯净网页链接</strong>，别人点开将直接全屏进入模拟器！
            </p>
          </div>

          {/* Share URL Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#6e4348]">独立纯净体验链接：</label>
            <div className="flex items-center gap-2 p-2 bg-[#f9f1eb] rounded-xl border border-[#ebdcd5]">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent font-mono text-[11px] text-[#593c3f] outline-hidden truncate"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(shareUrl, 'link')}
                className="px-3 py-1.5 bg-[#d9828b] hover:bg-[#c7727b] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '已复制' : '复制网址'}</span>
              </button>
            </div>
          </div>

          {/* Quick Copy Whole Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#6e4348]">一键复制完整微信分享文案：</label>
              <button
                type="button"
                onClick={() => copyToClipboard(inviteText, 'tip')}
                className="text-[10px] text-[#b85c67] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedTip ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTip ? '已复制文案' : '复制文案'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-[#f9f1eb] rounded-xl border border-[#ebdcd5] text-[11px] text-[#7a585c] leading-relaxed whitespace-pre-wrap font-sans">
              {inviteText}
            </div>
          </div>

          {/* Features Tips */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 bg-white/70 rounded-xl border border-[#ebd2cb] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#d9828b] shrink-0" />
              <span className="text-[10px] text-[#6e4348] font-medium">支持手机浏览器添加到主屏幕全屏体验</span>
            </div>
            <div className="p-2.5 bg-white/70 rounded-xl border border-[#ebd2cb] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7a8b7b] shrink-0" />
              <span className="text-[10px] text-[#6e4348] font-medium">实时热更新，改动后访客刷新自动弹新公告</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#f5ede4] border-t border-[#ebd2cb] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#6e4348] hover:bg-[#593c3f] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
