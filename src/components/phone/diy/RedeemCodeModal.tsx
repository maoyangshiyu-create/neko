import React, { useState } from 'react';
import { KeyRound, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { verifyActivationCode } from '../../../utils/activationCode';
import { addBread, addActivatedCode } from '../../../utils/themeStoreDB';
import { BreadIcon } from './BreadIcon';

interface RedeemCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (breadAdded: number) => void;
}

export const RedeemCodeModal: React.FC<RedeemCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setErrorMsg('请输入激活码');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await verifyActivationCode(trimmed);

      if (!res.valid || !res.payload) {
        setErrorMsg(res.error || '激活码校验失败');
        setLoading(false);
        return;
      }

      const { bread, serial } = res.payload;

      // 存储记录并更新面包数
      addActivatedCode(serial);
      addBread(bread);

      setSuccessMsg(`兑换成功！成功获得 ${bread} 面包`);
      setCode('');
      setLoading(false);

      onSuccess(bread);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (e: any) {
      setErrorMsg(e?.message || '兑换过程发生错误，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-[#f7f6f2] text-stone-800 rounded-3xl shadow-xl border border-[#e2ddd5] overflow-hidden flex flex-col">
        {/* Modal Header - Morandi Sage Green */}
        <div className="p-4 bg-[#7a8b7b] text-white flex items-center justify-between border-b border-[#6e7d6f]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4.5 h-4.5 text-[#e5ebe3]" />
            <h3 className="font-bold text-sm tracking-wide text-white">兑换激活码</h3>
          </div>
          <button
            onClick={() => {
              setErrorMsg('');
              setSuccessMsg('');
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Morandi Palette */}
        <div className="p-4 space-y-3.5">
          <p className="text-xs text-[#6e6862] leading-relaxed flex items-center justify-between">
            <span>请输入激活码，校验通过后自动添加面包：</span>
            <span className="text-[10px] text-[#7a8b7b] bg-[#eef3ee] px-1.5 py-0.5 rounded font-medium">1rmb=10面包</span>
          </p>

          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (errorMsg) setErrorMsg('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRedeem();
              }}
              placeholder="例如: BD00-64XX-XXXX-XXXX 或 BREAD888"
              maxLength={30}
              className="w-full p-2.5 text-center text-xs font-mono tracking-wider bg-[#efeee9] border border-[#d8d3c9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8c9e8d] focus:bg-white text-stone-800 placeholder:text-[#a09990]"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-[#fbf2f2] border border-[#ebd2d2] rounded-xl flex items-start gap-2 text-[#994747] text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#b85b5b]" />
              <div className="flex-1 leading-snug">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-[#f1f6f2] border border-[#d2e2d5] rounded-xl flex items-center gap-2 text-[#466a4f] text-xs">
              <BreadIcon className="w-4 h-4 shrink-0 text-[#678e70]" />
              <div className="flex-1 font-semibold">{successMsg}</div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setSuccessMsg('');
                onClose();
              }}
              className="flex-1 py-2 rounded-xl border border-[#d8d3c9] text-[#635d56] bg-[#efeee9] hover:bg-[#e4e1d7] text-xs font-semibold transition-colors cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              disabled={loading || !code.trim()}
              onClick={handleRedeem}
              className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                loading || !code.trim()
                  ? 'bg-[#a3b0a4] opacity-70 cursor-not-allowed'
                  : 'bg-[#7a8b7b] hover:bg-[#6b7a6c] active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>校验中...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>立即兑换</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
