import React, { useState } from 'react';
import { LuckinOrderData } from '../../../types/luckin';
import { 
  Coffee, 
  X, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  ExternalLink, 
  QrCode, 
  Store,
  Sparkles,
  Ticket
} from 'lucide-react';

interface LuckinRealCashierModalProps {
  order: LuckinOrderData;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (order: LuckinOrderData, paymentMethod: 'wechat' | 'alipay') => void;
  isPaying: boolean;
}

export const LuckinRealCashierModal: React.FC<LuckinRealCashierModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmPayment,
  isPaying
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');

  if (!isOpen) return null;

  const discountAmount = Math.max(0, (order.originalPrice || order.price) - order.price);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#0b2d64] to-[#1a427d] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-300/30 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">瑞幸官方收银台</h3>
              <p className="text-[10px] text-blue-200">
                {order.isRealMcpOrder ? '⚡ 瑞幸 MCP 直连真实下单' : '标准智能点单收银'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto">
          {/* Price Display */}
          <div className="text-center py-3 bg-gradient-to-b from-blue-50/80 to-stone-50 rounded-2xl border border-blue-100/80 space-y-1">
            <span className="text-[11px] text-stone-500 block font-medium">待支付实付金额</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm font-bold text-[#0b2d64]">¥</span>
              <span className="font-extrabold text-3xl text-[#0b2d64] tracking-tight">
                {order.price.toFixed(2)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                <Ticket className="w-3 h-3" />
                <span>已自动抵扣优惠券 ¥{discountAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-2 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex justify-between text-stone-600">
              <span>商品名称</span>
              <span className="font-bold text-stone-900">{order.drinkName}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>所选规格</span>
              <span className="font-medium text-stone-800">{order.specs}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>制作门店</span>
              <span className="font-medium text-stone-800 truncate max-w-[160px]">{order.storeName}</span>
            </div>
            {order.aiContactName && (
              <div className="flex justify-between text-stone-600">
                <span>帮点好友</span>
                <span className="font-medium text-[#0b2d64]">{order.aiContactName}</span>
              </div>
            )}
            {order.isRealMcpOrder && (
              <div className="flex justify-between text-emerald-700 bg-emerald-50 p-1.5 rounded-lg text-[10.5px]">
                <span>通道状态</span>
                <span className="font-bold">瑞幸 MCP 官方出单协议</span>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <label className="font-bold text-stone-700">选择支付方式</label>
            <div className="space-y-1.5">
              <div
                onClick={() => setPaymentMethod('wechat')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'wechat' ? 'border-[#07c160] bg-emerald-50/50' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#07c160] text-white flex items-center justify-center font-bold text-[10px]">
                    微
                  </div>
                  <div>
                    <span className="font-semibold text-stone-800 block text-xs">微信支付 / 小程序快捷支付</span>
                    <span className="text-[9.5px] text-stone-400">支持直接拉起瑞幸小程序收银台</span>
                  </div>
                </div>
                {paymentMethod === 'wechat' && <Check className="w-4 h-4 text-[#07c160]" />}
              </div>

              <div
                onClick={() => setPaymentMethod('alipay')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'alipay' ? 'border-[#1677ff] bg-blue-50/50' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1677ff] text-white flex items-center justify-center font-bold text-[10px]">
                    支
                  </div>
                  <div>
                    <span className="font-semibold text-stone-800 block text-xs">支付宝支付</span>
                    <span className="text-[9.5px] text-stone-400">快捷扫码与免密扣款</span>
                  </div>
                </div>
                {paymentMethod === 'alipay' && <Check className="w-4 h-4 text-[#1677ff]" />}
              </div>
            </div>
          </div>

          {/* Confirm Pay Button */}
          <button
            onClick={() => onConfirmPayment(order, paymentMethod)}
            disabled={isPaying}
            className="w-full py-3.5 bg-gradient-to-r from-[#0b2d64] to-[#1a427d] hover:from-[#113876] hover:to-[#22559c] text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isPaying ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-amber-300" />
                <span>正在向瑞幸官方系统提交真实出单...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {order.isRealMcpOrder ? '确认向瑞幸 MCP 真实下单' : '确认支付'} ¥{order.price.toFixed(2)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
