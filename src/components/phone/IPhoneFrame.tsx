import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
  onHomeClick?: () => void;
  wallpaperUrl: string;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  onHomeClick,
  wallpaperUrl
}) => {
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const bgImageStyle = wallpaperUrl && wallpaperUrl.trim()
    ? (wallpaperUrl.trim().startsWith('url(') ? wallpaperUrl.trim() : `url("${wallpaperUrl.trim()}")`)
    : undefined;

  return (
    <div className="relative mx-auto select-none transition-all duration-300">
      {/* Phone Body 375x700 with rounded frame */}
      <div
        className="w-[375px] h-[700px] max-w-[100vw] rounded-[48px] p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] border-[4px] relative flex flex-col justify-between overflow-hidden transition-colors duration-300"
        style={{
          backgroundColor: '#000000',
          borderColor: '#000000'
        }}
      >
        {/* Screen Area (Inner Viewport) */}
        <div
          className="w-full h-full rounded-[38px] overflow-hidden relative flex flex-col bg-cover bg-center shadow-inner"
          style={{
            backgroundImage: bgImageStyle,
            backgroundColor: 'var(--gg-page-bg, #F0F0E9)'
          }}
        >
          {/* Status Bar */}
          <div className="h-11 w-full px-7 flex items-center justify-between z-40 text-white font-medium text-xs shrink-0 select-none drop-shadow-sm relative">
            {/* Time */}
            <span className="font-semibold tracking-tight text-[13px]">{currentTime}</span>

            {/* Dynamic Island Pill / Centered Camera Cutout */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[104px] h-[26px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-md pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-[#18181b] border border-stone-800 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-900/60"></div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
            </div>

            {/* Signal & Battery */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-bold text-[10px]">5G</span>
              <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
              <div className="flex items-center gap-0.5">
                <div className="w-5 h-2.5 rounded-[3px] border border-white p-[1px] flex items-center">
                  <div className="w-full h-full bg-white rounded-[1px]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main App Content Container */}
          <div className="flex-1 w-full h-[calc(100%-44px-20px)] overflow-hidden relative">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div
            onClick={onHomeClick}
            className="h-5 w-full flex items-center justify-center z-50 cursor-pointer active:scale-95 transition-transform"
            title="点击返回桌面"
          >
            <div className="w-32 h-1 bg-white/70 hover:bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
