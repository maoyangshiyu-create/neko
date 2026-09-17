import React, { useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface MessagePopupBannerProps {
  popup: {
    contactId: string;
    contactName: string;
    contactAvatar: string;
    content: string;
  } | null;
  onClose: () => void;
  onClick: (contactId: string) => void;
}

export const MessagePopupBanner: React.FC<MessagePopupBannerProps> = ({
  popup,
  onClose,
  onClick
}) => {
  useEffect(() => {
    if (!popup) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000); // Increased to 6s for better readability
    return () => clearTimeout(timer);
  }, [popup, onClose]);

  if (!popup) return null;

  return (
    <div className="absolute top-12 left-3 right-3 z-[1000] animate-banner-entry">
      <div
        onClick={() => onClick(popup.contactId)}
        className="backdrop-blur-xl rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-white/20 flex items-center gap-3 cursor-pointer transition-all active:scale-95 group relative overflow-hidden"
        style={{
          backgroundColor: 'var(--gg-header-bg, rgba(255, 255, 255, 0.9))',
          color: 'var(--gg-header-text, #111827)',
          boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Progress bar to show auto-dismiss timing */}
        <div 
          className="absolute bottom-0 left-0 h-0.5 animate-shrink-x"
          style={{ 
            animationDuration: '6s', 
            animationTimingFunction: 'linear',
            backgroundColor: 'var(--gg-tabbar-active-label-color, #a8b39c)'
          }}
        />

        {popup.contactAvatar ? (
          <img
            src={popup.contactAvatar}
            alt={popup.contactName}
            className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-white/40 shadow-sm"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
            {popup.contactName.slice(0, 1)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[13px] tracking-tight truncate flex items-center gap-1.5" style={{ color: 'inherit' }}>
              <MessageCircle className="w-3 h-3" style={{ color: 'var(--gg-tabbar-active-label-color, #a8b39c)' }} />
              {popup.contactName}
            </span>
            <span className="text-[10px] opacity-60 font-medium">刚刚</span>
          </div>
          <p className="text-[12px] opacity-90 truncate mt-0.5 font-medium leading-tight" style={{ color: 'inherit' }}>
            {popup.content}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors shrink-0"
          style={{ color: 'inherit' }}
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
