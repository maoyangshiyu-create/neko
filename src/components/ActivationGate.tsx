import React, { useState } from 'react';
import { verifyGateCode } from '../utils/gateCode';

interface ActivationGateProps {
  onActivated: () => void;
}

export default function ActivationGate({ onActivated }: ActivationGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setIsVerifying(true);
    setError('');
    
    const result = await verifyGateCode(code);
    if (result.valid) {
      localStorage.setItem('wephone_gate_code', code.trim());
      onActivated();
    } else {
      setError(result.error || '激活失败，请检查激活码是否正确');
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-4 transition-colors" style={{ backgroundColor: '#fdf6f0' }}>
      <div 
        className="w-full max-w-sm p-8 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{ 
          backgroundColor: '#fffaf5', 
          border: '1px solid #f0dfe0', 
          borderRadius: '18px' 
        }}
      >
        <h2 className="text-xl text-center" style={{ color: '#6b4a52', fontWeight: 'bold' }}>
          请输入门禁激活码
        </h2>
        
        <div className="space-y-1">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="例如: WP00-XXXX-XXXX-XXXX"
            maxLength={30}
            className="w-full p-3.5 text-center font-mono tracking-wider text-sm rounded-xl focus:outline-none focus:ring-2 transition-shadow"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #f0dfe0',
              color: '#6b4a52',
              outlineColor: '#e89aab'
            }}
          />
          
          {error && (
            <p className="text-red-500 text-xs text-center mt-2 animate-in fade-in">{error}</p>
          )}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!code.trim() || isVerifying}
          className="w-full py-3 mt-2 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md hover:shadow-lg"
          style={{ backgroundColor: '#e89aab' }}
        >
          {isVerifying ? '验证中...' : '进入系统'}
        </button>
      </div>
    </div>
  );
}
