import React, { useState } from 'react';
import { LuckinOrderData } from '../../../types/luckin';
import { parseLuckinPayUrl } from '../../../services/luckinMcpService';
import { 
  X, 
  ExternalLink, 
  QrCode, 
  Copy, 
  Check, 
  RotateCcw, 
  Smartphone, 
  ShieldAlert, 
  Coffee,
  Sparkles
} from 'lucide-react';

interface LuckinPayRedirectionModalProps {
  order: LuckinOrderData;
  isOpen: boolean;
  onClose: () => void;
  onRefreshStatus?: () => void;
  onOpenSettings?: () => void;
  isRefreshing?: boolean;
}

export const LuckinPayRedirectionModal: React.FC<LuckinPayRedirectionModalProps> = ({
  order,
  isOpen,
  onClose,
  onRefreshStatus,
  onOpenSettings,
  isRefreshing
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isRealMcp = order.isRealMcpOrder || Boolean(order.mcpOrderId) || Boolean(order.mcpDraftId);
  const parsedUrl = parseLuckinPayUrl(order.paymentUrl, isRealMcp);

  const handleCopy = () => {
    if (order.paymentUrl) {
      navigator.clipboard.writeText(order.paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    if (!order.paymentUrl) return;

    if (parsedUrl?.isSimulated) {
      if (onOpenSettings) {
        onOpenSettings();
      } else {
        window.open('https://open.lkcoffee.com/mcp', '_blank');
      }
      return;
    }

    if (parsedUrl?.isDeepLink) {
      // Direct deep link launch (works on mobile device or native protocol handler)
      window.location.href = order.paymentUrl;
    } else {
      // HTTPS URL
      window.open(order.paymentUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#0b2d64] to-[#1a427d] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-300/30 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">瑞幸官方订单支付</h3>
              <p className="text-[10px] text-blue-200 font-mono">
                订单号: {order.mcpOrderId || order.orderId}
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
          {/* Order Summary Brief */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-stone-900 block text-sm">{order.drinkName}</span>
              <span className="text-[10.5px] text-stone-500 block">{order.specs}</span>
              <span className="text-[10.5px] text-stone-600 block mt-0.5 truncate max-w-[200px]">📍 {order.storeName}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-stone-400 block">实付金额</span>
              <span className="font-extrabold text-lg text-[#0b2d64]">¥{order.price.toFixed(2)}</span>
            </div>
          </div>

          {/* QR Code & Pay Link Details */}
          {parsedUrl ? (
            <div className="bg-gradient-to-b from-blue-50/70 to-stone-50 p-4 rounded-2xl border border-blue-100 text-center space-y-3">
              {parsedUrl.isSimulated ? (
                /* Simulated Link Notice */
                <div className="space-y-3 text-left">
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>未获取到官方支付链接</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      已禁止模拟支付兜底，请确保 Luckin MCP 官方 Token 配置正确并重新下单。
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    {onOpenSettings && (
                      <button
                        onClick={onOpenSettings}
                        className="w-full py-2.5 bg-[#0b2d64] hover:bg-[#113876] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>配置 Luckin MCP 官方 Token</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Real Official Pay Link */
                <>
                  <div className="flex items-center justify-center gap-1.5 text-[#0b2d64] font-bold text-xs">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>扫码或点击下方按钮完成支付</span>
                  </div>

                  {/* QR Code Image */}
                  <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm inline-block mx-auto relative group">
                    <img 
                      src={parsedUrl.qrCodeUrl} 
                      alt="瑞幸支付二维码" 
                      className="w-44 h-44 object-contain mx-auto rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(parsedUrl.rawUrl)}`;
                      }}
                    />
                    <div className="mt-1 text-[10px] font-medium text-stone-400 flex items-center justify-center gap-1">
                      <Smartphone className="w-3 h-3 text-emerald-600" />
                      <span>手机微信 / 支付宝扫码直达</span>
                    </div>
                  </div>

                  {parsedUrl.isDeepLink && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] flex items-start gap-1.5 text-left">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>提示：</strong>当前生成的支付地址为瑞幸 App/小程序深度协议。电脑端请使用手机扫码，移动端可直接点击下方按钮唤醒。
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleOpenLink}
                      className="w-full py-2.5 bg-gradient-to-r from-[#0b2d64] to-[#1a427d] hover:from-[#113876] hover:to-[#22559c] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{parsedUrl.suggestedActionName}</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="flex-1 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">已复制链接</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                            <span>复制支付链接</span>
                          </>
                        )}
                      </button>

                      {onRefreshStatus && (
                        <button
                          onClick={onRefreshStatus}
                          disabled={isRefreshing}
                          className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                          <span>{isRefreshing ? '检查中...' : '已完成支付?'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2 text-amber-900">
              <Sparkles className="w-6 h-6 text-amber-600 mx-auto animate-pulse" />
              <p className="font-bold">订单已提交给瑞幸官方工单</p>
              <p className="text-[11px] text-amber-700">请前往订单页手动刷新制作状态或获取取餐码。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
