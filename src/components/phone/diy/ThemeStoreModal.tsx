import React, { useState } from 'react';
import { Store, X, KeyRound, ShoppingBag, Check, Sparkles, AlertCircle, PackageOpen } from 'lucide-react';
import type { DIYTheme } from '../../../types/phone';
import { SHOP_THEMES, ShopThemeItem } from '../../../data/themeStoreData';
import { deductBread, addPurchasedThemeId, isThemePurchased } from '../../../utils/themeStoreDB';
import { BreadIcon } from './BreadIcon';

interface ThemeStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  breadBalance: number;
  purchasedThemeIds: string[];
  activeThemeId?: string | null;
  onOpenRedeemModal: () => void;
  onBuyThemeSuccess: (theme: DIYTheme, price: number) => void;
  onApplyTheme: (theme: DIYTheme) => void;
}

export const ThemeStoreModal: React.FC<ThemeStoreModalProps> = ({
  isOpen,
  onClose,
  breadBalance,
  purchasedThemeIds,
  activeThemeId,
  onOpenRedeemModal,
  onBuyThemeSuccess,
  onApplyTheme,
}) => {
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  const resolveThemeData = async (item: ShopThemeItem): Promise<DIYTheme> => {
    if (item.jsonUrl) {
      try {
        const res = await fetch(item.jsonUrl);
        if (res.ok) {
          const fetchedData = await res.json();
          return {
            ...item.themeData,
            ...fetchedData,
            id: item.themeData.id || item.id,
            name: item.name || fetchedData.name,
            css: { ...item.themeData.css, ...(fetchedData.css || {}) },
            assets: { ...item.themeData.assets, ...(fetchedData.assets || {}) },
          };
        }
      } catch (err) {
        console.warn('Failed to fetch theme json from URL:', item.jsonUrl, err);
      }
    }
    return item.themeData;
  };

  const handleBuy = async (item: ShopThemeItem) => {
    if (breadBalance < item.price) {
      showToast(`面包不足 (还需要 ${item.price - breadBalance} 面包)，请先兑换激活码！`, 'error');
      return;
    }

    const success = deductBread(item.price);
    if (!success) {
      showToast('扣除面包失败，请检查余额', 'error');
      return;
    }

    const finalThemeData = await resolveThemeData(item);
    addPurchasedThemeId(item.id);
    onBuyThemeSuccess(finalThemeData, item.price);
    showToast(`成功购买「${item.name}」！已加入我的 DIY 主题库`, 'success');
  };

  const handleApply = async (item: ShopThemeItem) => {
    const finalThemeData = await resolveThemeData(item);
    onApplyTheme(finalThemeData);
    showToast(`已应用主题「${item.name}」`, 'success');
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#fcf8f2] text-[#4a3b3d] flex flex-col h-full w-full select-none overflow-hidden animate-in fade-in slide-in-from-right duration-200">
      <div className="w-full h-full bg-[#fcf8f2] text-[#4a3b3d] flex flex-col overflow-hidden">
        {/* Rococo Header */}
        <div className="p-3.5 bg-gradient-to-r from-[#f2cbd0] to-[#ecd3c2] text-[#593c3f] border-b border-[#e3b8bc] flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full hover:bg-white/30 text-[#593c3f] transition-colors cursor-pointer"
              title="返回"
            >
              <Store className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-bold text-sm text-[#593c3f] flex items-center gap-2">
                主题商店
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e3b8bc]/40 text-[#593c3f] border border-[#d4979e]/50 font-serif">
                  Theme Boutique
                </span>
              </h3>
              <p className="text-[10px] text-[#7a585c] mt-0.5">精选高定美学与个性定制换肤</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-[#e3b8bc]/60 hover:bg-[#d4979e]/60 text-[#593c3f] text-xs font-semibold border border-[#d4979e]/50 transition-colors cursor-pointer shadow-xs"
          >
            返回工坊
          </button>
        </div>

        {/* Top Control Bar: Bread balance & Redeem entrance (soft gold/rose tones) */}
        <div className="px-4 py-2.5 bg-[#f5ede4] border-b border-[#ebd2cb] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fce8ea] text-[#b85c67] flex items-center justify-center border border-[#e8b4b8] shadow-xs">
              <BreadIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[10px] text-[#8c6f72] flex items-center gap-1.5">
                <span>当前面包余额</span>
                <span className="text-[9px] text-[#b85c67] bg-[#fce8ea] px-1 py-0.2 rounded border border-[#e8b4b8]/50 font-medium">
                  1rmb=10面包
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-[#6e4348] flex items-center gap-1">
                <span>{breadBalance}</span>
                <span className="text-[10px] font-normal text-[#8c6f72]">面包</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRedeemModal}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#d9828b] to-[#c7727b] hover:from-[#c7727b] hover:to-[#b5616a] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0 border border-[#b5616a]"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>兑换激活码</span>
          </button>
        </div>

        {/* Toast Alert Banner */}
        {toastMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-fadeIn shrink-0 ${
              toastMsg.type === 'success'
                ? 'bg-[#fcf2f4] text-[#8c3f47] border-b border-[#e8b4b8]'
                : 'bg-[#fbf2f2] text-[#994747] border-b border-[#ebd2d2]'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-[#b85c67] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#b85b5b] shrink-0" />
            )}
            <span className="flex-1">{toastMsg.text}</span>
          </div>
        )}

        {/* Theme Grid List or Empty State */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#fcf8f2]">
          {SHOP_THEMES.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-6 bg-[#f7ede6] rounded-2xl border border-dashed border-[#e6c9c4] flex flex-col items-center justify-center text-center space-y-3 shadow-inner">
              <div className="w-14 h-14 rounded-full bg-[#fce8ea] flex items-center justify-center text-[#b85c67] border border-[#e8b4b8] shadow-xs">
                <PackageOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#593c3f]">商店暂无上架主题</h4>
                <p className="text-xs text-[#8c6f72] max-w-xs leading-relaxed">
                  更多精美高定换肤正在精心雕琢上新中，敬请期待...
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenRedeemModal}
                  className="px-4 py-2 bg-[#d9828b] hover:bg-[#c7727b] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BreadIcon className="w-3.5 h-3.5" />
                  <span>提前兑换存面包</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {SHOP_THEMES.map((theme) => {
                const isPurchased = purchasedThemeIds.includes(theme.id) || isThemePurchased(theme.id);
                const isActive = activeThemeId === theme.id;

                return (
                  <div
                    key={theme.id}
                    className="bg-[#fffdfa] rounded-2xl border border-[#ebd2d5] overflow-hidden flex flex-col hover:border-[#d4979e] transition-all shadow-xs group"
                  >
                    {/* Theme Preview Box (Narrow & Tall ratio to fit full screenshot) */}
                    <div className="w-full aspect-[9/16] bg-[#f5ede4] relative overflow-hidden flex items-center justify-center">
                      {theme.preview ? (
                        <img
                          src={theme.preview}
                          alt={theme.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-[#b85c67]">
                          <Sparkles className="w-6 h-6" />
                          <span className="text-[10px]">精选换肤</span>
                        </div>
                      )}

                      {/* Palette badges on top right */}
                      <div className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/90 backdrop-blur-xs flex items-center gap-1 border border-[#e8b4b8]/50 shadow-xs">
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-black/10"
                          style={{ backgroundColor: theme.themeData.css?.['--gg-accent-color'] || '#d9828b' }}
                          title="强调色"
                        />
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-black/10"
                          style={{ backgroundColor: theme.themeData.css?.['--gg-bubble-self'] || '#fce8ea' }}
                          title="气泡色"
                        />
                      </div>

                      {isPurchased && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#d9828b] text-white text-[9px] font-bold shadow-xs">
                          已拥有
                        </div>
                      )}
                    </div>

                    {/* Theme Info & Actions */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-xs text-[#593c3f] truncate">{theme.name}</h4>
                        <p className="text-[10px] text-[#8c6f72] mt-0.5 line-clamp-2 leading-relaxed">
                          {theme.description || `由 ${theme.author} 精心制作的全套桌面与界面皮肤`}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#f5ede4] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold font-mono text-[#8c434b] flex items-center gap-1">
                            <BreadIcon className="w-3.5 h-3.5 text-[#d9828b]" />
                            <span>{theme.price}</span>
                            <span className="text-[9px] font-normal text-[#8c6f72]">面包</span>
                            <span className="text-[9px] font-normal text-[#b85c67] ml-0.5">（1rmb=10面包）</span>
                          </div>
                          <span className="text-[9px] text-[#a67c82] font-mono">{theme.author}</span>
                        </div>

                        {isPurchased ? (
                          isActive ? (
                            <button
                              disabled
                              className="w-full py-1.5 rounded-xl bg-[#fce8ea] text-[#8c3f47] border border-[#e8b4b8] text-xs font-semibold cursor-default flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              使用中
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApply(theme)}
                              className="w-full py-1.5 rounded-xl bg-[#f7ede6] hover:bg-[#f0e0d6] text-[#6e484c] border border-[#ebd2cb] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              应用此主题
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuy(theme)}
                            className="w-full py-1.5 rounded-xl bg-[#d9828b] hover:bg-[#c7727b] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>购买主题</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rococo Footer */}
        <div className="p-2.5 bg-[#f5ede4] border-t border-[#ebd2cb] text-center shrink-0">
          <p className="text-[10px] text-[#8c6f72]">
            购买主题后会自动添加至您的「我的 DIY 主题库」，可随时在本地切换使用
          </p>
        </div>
      </div>
    </div>
  );
};
