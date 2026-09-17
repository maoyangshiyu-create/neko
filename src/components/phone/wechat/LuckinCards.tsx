import React, { useState } from 'react';
import { LuckinOrderData } from '../../../types/luckin';
import { Check, Clock, Coffee, ExternalLink, MapPin, Sparkles, Truck, X } from 'lucide-react';

interface LuckinOrderPreviewCardProps {
  order: LuckinOrderData;
  onConfirm: (order: LuckinOrderData) => void;
  onCancel?: (order: LuckinOrderData) => void;
  disabled?: boolean;
}

export const LuckinOrderPreviewCard: React.FC<LuckinOrderPreviewCardProps> = ({
  order,
  onConfirm,
  onCancel,
  disabled = false
}) => {
  return (
    <div 
      className="w-full max-w-[270px] rounded-2xl border shadow-md overflow-hidden bg-white/95 backdrop-blur-xs transition-all duration-300"
      style={{
        borderColor: 'var(--app-card-border, #f0dfe0)',
        color: 'var(--app-text, #4a3b32)'
      }}
    >
      {/* 顶部品牌条 */}
      <div 
        className="px-3 py-1.5 flex items-center justify-between text-white text-[11px] font-bold"
        style={{
          background: 'linear-gradient(135deg, #002244 0%, #0c3866 100%)'
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-amber-300 font-extrabold tracking-wider">luckin coffee</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-300/30">
            AI 帮点预览
          </span>
        </div>
        <Coffee className="w-3.5 h-3.5 text-amber-300" />
      </div>

      {/* 饮品内容与图片 */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-100 shadow-2xs">
            <img 
              src={order.drinkImage} 
              alt={order.drinkName} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] px-1 rounded-bl-md font-bold">
              人气
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-stone-900 truncate">
              {order.drinkName}
            </h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {order.specs.split('·').map((spec, i) => (
                <span 
                  key={i} 
                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium"
                >
                  {spec.trim()}
                </span>
              ))}
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xs font-extrabold text-rose-600">
                ¥<span className="text-base">{order.price}</span>
              </span>
              {order.originalPrice && (
                <span className="text-[10px] text-stone-400 line-through">
                  ¥{order.originalPrice}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 门店信息 */}
        <div className="mt-2.5 pt-2 border-t border-dashed border-stone-200 flex items-center gap-1 text-[10px] text-stone-500">
          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="truncate">{order.storeName}</span>
        </div>

        {/* 底部确认按钮 */}
        {order.status === 'preview' && (
          <div className="mt-3 flex items-center gap-2">
            {onCancel && (
              <button
                disabled={disabled}
                onClick={() => onCancel(order)}
                className="flex-1 py-1.5 rounded-xl border border-stone-200 text-[11px] font-medium text-stone-600 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                修改/取消
              </button>
            )}
            <button
              disabled={disabled}
              onClick={() => onConfirm(order)}
              className="flex-2 py-1.5 rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 hover:from-blue-900 hover:to-blue-800 text-amber-200 text-[11px] font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              <span>确认点单生成支付</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface LuckinPaymentCardProps {
  order: LuckinOrderData;
  onPay: (order: LuckinOrderData) => void;
  disabled?: boolean;
}

export const LuckinPaymentCard: React.FC<LuckinPaymentCardProps> = ({
  order,
  onPay,
  disabled = false
}) => {
  const isPaid = order.status === 'paid' || order.status === 'delivering' || order.status === 'completed';

  return (
    <div 
      className="w-full max-w-[270px] rounded-2xl border shadow-md overflow-hidden bg-white/95 backdrop-blur-xs transition-all duration-300"
      style={{
        borderColor: 'var(--app-card-border, #f0dfe0)',
        color: 'var(--app-text, #4a3b32)'
      }}
    >
      {/* 顶部品牌深蓝渐变 */}
      <div 
        className="px-3 py-2 flex items-center justify-between text-white"
        style={{
          background: isPaid
            ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)'
            : 'linear-gradient(135deg, #002244 0%, #0f4c81 100%)'
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-amber-300 font-extrabold text-xs tracking-wider">luckin coffee</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-300/30">
            {isPaid ? '已成功支付' : '瑞幸快捷买单'}
          </span>
        </div>
        {isPaid ? (
          <Check className="w-4 h-4 text-emerald-300" />
        ) : (
          <Coffee className="w-4 h-4 text-amber-300 animate-pulse" />
        )}
      </div>

      {/* 订单核心信息 */}
      <div className="p-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <h4 className="text-xs font-bold text-stone-900">{order.drinkName}</h4>
            <p className="text-[10px] text-stone-500 mt-0.5">{order.specs}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-rose-600">
              ¥<span className="text-base">{order.price}</span>
            </span>
          </div>
        </div>

        {/* 配送/骑手状态 */}
        {isPaid ? (
          <div className="my-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
            <div className="text-[10px] text-emerald-800 leading-tight">
              <p className="font-bold">{order.riderName || '瑞幸专送 · 骑手已接单'}</p>
              <p className="text-[9px] text-emerald-600 mt-0.5">正在为您全速赶往配送地点</p>
            </div>
          </div>
        ) : (
          <div className="my-2.5 flex items-center justify-between text-[10px] text-stone-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>待支付 · 优惠立减锁定中</span>
            </span>
            <span className="font-mono text-[9px] text-stone-400">#{order.orderId.slice(-6)}</span>
          </div>
        )}

        {/* 支付按钮 */}
        {!isPaid ? (
          <button
            disabled={disabled}
            onClick={() => onPay(order)}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 hover:from-blue-900 hover:to-indigo-900 text-amber-200 text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>点击支付 ¥{order.price}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>
        ) : (
          <div className="w-full py-1.5 rounded-xl bg-stone-100 text-stone-500 text-[11px] font-medium text-center flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>已完成支付，静待骑手送达</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface LuckinTreatCardProps {
  order: LuckinOrderData;
}

export const LuckinTreatCard: React.FC<LuckinTreatCardProps> = ({ order }) => {
  return (
    <div 
      className="w-full max-w-[270px] rounded-2xl border shadow-md overflow-hidden bg-white/95 backdrop-blur-xs"
      style={{
        borderColor: 'var(--app-card-border, #f0dfe0)',
        color: 'var(--app-text, #4a3b32)'
      }}
    >
      {/* 顶部礼物卡头 */}
      <div 
        className="px-3 py-2 flex items-center justify-between text-white"
        style={{
          background: 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)'
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-amber-200 font-extrabold text-xs tracking-wider">luckin coffee</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 text-white font-medium border border-white/30">
            好友请客 · 暖心咖啡
          </span>
        </div>
        <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-spin" />
      </div>

      {/* 饮品展示 */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
          <img 
            src={order.drinkImage} 
            alt={order.drinkName} 
            className="w-12 h-12 rounded-xl object-cover border border-rose-100 shadow-2xs"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-stone-900 truncate">
              {order.aiContactName} 请你喝《{order.drinkName}》
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">{order.specs}</p>
          </div>
        </div>

        {/* 配送信息 */}
        <div className="mt-2.5 p-2 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center gap-2">
          <Truck className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
          <div className="text-[10px] text-rose-900 leading-tight">
            <p className="font-bold">{order.riderName || '瑞幸专送 · 骑手正全力配送'}</p>
            <p className="text-[9px] text-rose-600 mt-0.5">对方已全额买单，坐等咖啡送到吧～</p>
          </div>
        </div>
      </div>
    </div>
  );
};
