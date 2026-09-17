import React, { useState } from 'react';
import { LuckinOrderData } from '../../../types/luckin';
import { X, Check, Coffee, ShieldCheck, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import { parseLuckinPayUrl } from '../../../services/luckinMcpService';

interface LuckinPaymentModalProps {
  isOpen: boolean;
  order: LuckinOrderData | null;
  onClose: () => void;
  onPaymentSuccess: (paidOrder: LuckinOrderData) => void;
}

export const LuckinPaymentModal: React.FC<LuckinPaymentModalProps> = ({
  isOpen,
  order,
  onClose,
  onPaymentSuccess
}) => {
  if (!isOpen || !order) return null;

  const discount = order.originalPrice ? order.originalPrice - order.price : 11;
  const parsedUrl = parseLuckinPayUrl(order.paymentUrl, order.isRealMcpOrder);

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn select-none">
      {/* 遮罩背景 */}
      <div className="flex-1" onClick={onClose} />

      {/* 底部拉起收银台面板 */}
      <div className="rounded-t-3xl bg-white border-t border-stone-200 shadow-2xl p-4 flex flex-col animate-slideUp">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-950 flex items-center justify-center">
              <Coffee className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-900 leading-none">
                luckin coffee 官方快捷支付
              </h3>
              <p className="text-[9px] text-stone-400 mt-0.5">安全加密支付 · 极速出餐</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 订单详情区域 */}
        <div className="py-3.5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <img 
                src={order.drinkImage} 
                alt={order.drinkName} 
                className="w-12 h-12 rounded-xl object-cover border border-stone-100 shadow-2xs"
              />
              <div>
                <h4 className="text-xs font-bold text-stone-900">{order.drinkName}</h4>
                <p className="text-[10px] text-stone-500 mt-0.5">{order.specs}</p>
                <p className="text-[9px] text-stone-400 mt-0.5 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{order.storeName}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-stone-900">¥{order.price}</span>
              {order.originalPrice && (
                <p className="text-[10px] text-stone-400 line-through">¥{order.originalPrice}</p>
              )}
            </div>
          </div>

          {/* 优惠明细 */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between text-[11px]">
            <span className="text-amber-900 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>AI好友特惠咖啡券</span>
            </span>
            <span className="text-rose-600 font-bold">-¥{discount}</span>
          </div>

          {/* 支付展示区域 */}
          <div className="pt-2 flex flex-col items-center">
            {!parsedUrl || parsedUrl.isSimulated ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl w-full text-center">
                <p className="text-xs text-rose-700 font-bold">未拿到官方支付链接</p>
                <p className="text-[10px] text-rose-500 mt-1">订单未成功提交，已禁止模拟支付。请检查 MCP 设置。</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full">
                {parsedUrl.qrCodeUrl && (
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-100 flex flex-col items-center justify-center">
                    <img src={parsedUrl.qrCodeUrl} alt="支付二维码" className="w-24 h-24" />
                    <p className="text-[9px] text-stone-400 mt-1">长按保存或截图扫码支付</p>
                  </div>
                )}
                
                <a 
                  href={parsedUrl.rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    // Simulate returning back successfully after going to official link
                    setTimeout(() => {
                      onPaymentSuccess(order);
                      onClose();
                    }, 3000);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#0b2d64] hover:bg-[#1a3d75] active:bg-[#071f45] text-white py-3 rounded-xl font-bold text-[13px] transition-colors cursor-pointer"
                >
                  {parsedUrl.suggestedActionName}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 底部保障 */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-4 text-[9px] text-stone-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            官方通道
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            支付安全
          </span>
        </div>
      </div>
    </div>
  );
};
