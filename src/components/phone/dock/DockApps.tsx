import React, { useState } from 'react';
import { ArrowLeft, Phone, Delete } from 'lucide-react';

interface DockAppProps {
  onReturnToDesktop: () => void;
}

// 1. Phone Keypad Simulator
export const PhoneCallApp: React.FC<DockAppProps> = ({ onReturnToDesktop }) => {
  const [dialNumber, setDialNumber] = useState('');
  const [inCall, setInCall] = useState(false);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div
      className="rococo-theme h-full w-full flex flex-col select-none relative overflow-hidden"
      style={{
        backgroundColor: 'var(--app-bg, #fdf6f0)',
        color: 'var(--app-text, #6b4a52)'
      }}
    >
      <div
        className="h-11 px-3 border-b flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--app-card, #fffaf5)',
          borderColor: 'var(--app-card-border, #f0dfe0)',
          color: 'var(--app-text, #6b4a52)'
        }}
      >
        <button onClick={onReturnToDesktop} className="flex items-center gap-0.5 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> 桌面
        </button>
        <span className="font-bold text-xs">电话</span>
        <div className="w-10"></div>
      </div>

      {inCall ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
            style={{ backgroundColor: 'var(--app-item-bg, #fffaf5)', color: 'var(--app-btn-bg, #e89aab)' }}
          >
            <Phone className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-base" style={{ color: 'var(--app-text, #6b4a52)' }}>{dialNumber || '客服热线'}</h4>
            <p className="text-xs opacity-75 mt-1" style={{ color: 'var(--app-text-soft, #b398a0)' }}>通话中 00:15...</p>
          </div>
          <button
            onClick={() => setInCall(false)}
            className="px-6 py-2.5 rounded-full text-white font-semibold text-xs active:scale-95"
            style={{ backgroundColor: 'var(--app-down, #d68a8a)' }}
          >
            挂断电话
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end p-6 pb-8 space-y-4">
          {/* Display */}
          <div className="h-12 flex items-center justify-center text-2xl font-bold font-mono" style={{ color: 'var(--app-text, #6b4a52)' }}>
            {dialNumber || ' '}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 place-items-center">
            {keys.map((k) => (
              <button
                key={k}
                onClick={() => setDialNumber((prev) => prev + k)}
                className="w-16 h-16 rounded-full text-xl font-semibold flex items-center justify-center active:scale-90 transition-transform"
                style={{
                  backgroundColor: 'var(--app-card, #fffaf5)',
                  borderColor: 'var(--app-card-border, #f0dfe0)',
                  borderWidth: '1px',
                  color: 'var(--app-text, #6b4a52)'
                }}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-around pt-2">
            <div className="w-14"></div>
            <button
              onClick={() => {
                if (dialNumber) setInCall(true);
              }}
              disabled={!dialNumber}
              className="w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)' }}
            >
              <Phone className="w-7 h-7 fill-white" />
            </button>
            <button
              onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
              className="w-14 flex justify-center"
              style={{ color: 'var(--app-text-soft, #b398a0)' }}
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Novel Reader Simulator
export const NovelApp: React.FC<DockAppProps> = ({ onReturnToDesktop }) => {
  return (
    <div
      className="rococo-theme h-full w-full flex flex-col select-none relative overflow-hidden"
      style={{
        backgroundColor: 'var(--app-bg, #fdf6f0)',
        color: 'var(--app-text, #6b4a52)'
      }}
    >
      <div
        className="h-11 px-3 border-b flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--app-card, #fffaf5)',
          borderColor: 'var(--app-card-border, #f0dfe0)',
          color: 'var(--app-text, #6b4a52)'
        }}
      >
        <button onClick={onReturnToDesktop} className="flex items-center gap-0.5 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> 桌面
        </button>
        <span className="font-serif font-bold text-xs">星河漫游指南 · 第一章</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-serif text-xs leading-relaxed space-y-3 select-text">
        <h3 className="font-bold text-sm text-center my-2" style={{ color: 'var(--app-text, #6b4a52)' }}>第 1 章：夜航者的回音</h3>
        <p>
          在远星际的边缘，穿梭舰的推进器发出平稳的嗡鸣。窗外的星云如淡紫色的轻纱，缓缓漂浮在无垠的暗夜中。
        </p>
        <p>
          通讯屏忽然亮起微光，伴随着轻微的沙沙电流声，一道熟悉的声音穿越了无数光年的折跃空间传来：“指挥官，第七航标已校准，等待您的最终确认。”
        </p>
        <p>
          屏幕另一端，那个被称作「夜莺」的身影微微躬身。在这个寂静的深夜，漫长的宇宙探索才刚刚揭开序幕……
        </p>
      </div>
    </div>
  );
};
