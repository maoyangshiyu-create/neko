import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface GlobalLoaderProps {
  imageUrl?: string;
  text?: string;
  visible: boolean;
}

export default function GlobalLoader({
  imageUrl = 'https://i.postimg.cc/tCcQy2Hj/wu-biao-ti5-20260916191033.png',
  text,
  visible
}: GlobalLoaderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'var(--bg, var(--gg-page-bg, #f4f6f9))' }}
    >
      <style>{`
        @keyframes loaderFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }
        .animate-loader-float {
          animation: loaderFloat 1.6s ease-in-out infinite;
        }
        @keyframes fillProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes moveIcon {
          0% { left: 0%; }
          100% { left: 100%; }
        }
        .animate-fill-progress {
          animation: fillProgress 1.5s ease-out forwards;
        }
        .animate-move-icon {
          animation: moveIcon 1.5s ease-out forwards;
        }
      `}</style>
      
      {!imageFailed ? (
        <img 
          src={imageUrl} 
          alt="Loading" 
          className="w-24 h-24 animate-loader-float object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Loader2 className="w-12 h-12 animate-spin text-[var(--gg-text-secondary,gray)]" />
      )}

      {text && (
        <p className="mt-4 text-[12px] font-medium" style={{ color: 'var(--gg-text-secondary, #6b7280)' }}>
          {text}
        </p>
      )}

      {/* Pink Progress Bar */}
      <div className="relative w-48 h-2 mt-8 rounded-full overflow-visible" style={{ backgroundColor: 'rgba(253, 230, 236, 0.4)' }}>
        {/* Pink Fill */}
        <div className="absolute top-0 left-0 h-full rounded-full animate-fill-progress" style={{ backgroundColor: '#fde6ec' }} />
        
        {/* Moving Icon */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 animate-move-icon z-10" style={{ left: '0%' }}>
          <img 
            src="https://i.postimg.cc/7PVXg6Bt/retouch-2026091622521915.png" 
            alt="progress icon" 
            className="w-8 h-8 object-contain drop-shadow-sm pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
