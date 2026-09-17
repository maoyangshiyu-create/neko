import React from 'react';
import { CreditCard, MapPin, FileText, Heart, Sparkles, LogOut, Coins, Volume2, CalendarHeart } from 'lucide-react';
import type { DIYTheme } from '../../../types/phone';
import { getBubbleBgStyle, getBubbleContainerStyle, parseBorderCSS } from '../../../utils/bubbleStyle';

const CustomHeartSVG = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const WeddingChurchSVG = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v3" />
    <path d="M10.5 3.5h3" />
    <path d="M12 5L4 11v10h16V11L12 5z" fill="currentColor" fillOpacity="0.1" />
    <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    <path d="M12 9v3" />
    <path d="M10.5 10.5h3" />
  </svg>
);


export type BubbleType =
  | 'transfer'
  | 'location'
  | 'file'
  | 'proposal'
  | 'wedding'
  | 'divorce'
  | 'meet_invite'
  | 'voice'
  | 'text'
  | 'custom';

export interface UnifiedBubbleProps {
  bubbleType: BubbleType;
  isUser: boolean;
  activeTheme?: DIYTheme | null;
  defaultIcon?: React.ReactNode;
  defaultTitle?: string;
  title?: string;
  subtitle?: string;
  amount?: string;
  defaultBg?: string;
  defaultBorder?: string;
  defaultTextColor?: string;
  children?: React.ReactNode;
  extra?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isPlaying?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const UnifiedBubble: React.FC<UnifiedBubbleProps> = ({
  bubbleType,
  isUser,
  activeTheme,
  defaultIcon,
  defaultTitle,
  title,
  subtitle,
  amount,
  defaultBg,
  defaultBorder,
  defaultTextColor = '#1c1917',
  children,
  extra,
  actions,
  className = '',
  style = {},
  isPlaying,
  onClick,
}) => {
  // 1. 获取该特殊气泡对应的自定义资源及 CSS 配置
  const isText = bubbleType === 'text' || bubbleType === 'custom';
  const isVoice = bubbleType === 'voice';
  const isProposal = bubbleType === 'proposal';
  const isWedding = bubbleType === 'wedding';
  const isDivorce = bubbleType === 'divorce';
  const isMeetInvite = bubbleType === 'meet_invite';

  // 资源 key 与前缀映射
  let prefix = bubbleType as string;
  let bgKey = `${bubbleType}Bg`;
  let iconKey = `${bubbleType}Icon`;

  if (isText || isVoice) {
    prefix = isUser ? 'self' : 'other';
    bgKey = isUser ? 'bubbleBgSelf' : 'bubbleBgOther';
    iconKey = isUser ? 'bubbleIconSelf' : 'bubbleIconOther';
  } else if (isProposal) {
    prefix = isUser ? 'proposalSelf' : 'proposalOther';
    bgKey = isUser ? 'proposalBgSelf' : 'proposalBgOther';
    iconKey = 'proposalIcon';
  } else if (isWedding) {
    prefix = isUser ? 'weddingSelf' : 'weddingOther';
    bgKey = isUser ? 'weddingBgSelf' : 'weddingBgOther';
    iconKey = 'weddingIcon';
  } else if (isDivorce) {
    prefix = isUser ? 'divorceSelf' : 'divorceOther';
    bgKey = isUser ? 'divorceBgSelf' : 'divorceBgOther';
    iconKey = 'divorceIcon';
  } else if (isMeetInvite) {
    prefix = isUser ? 'meetInviteSelf' : 'meetInviteOther';
    bgKey = isUser ? 'meetInviteBgSelf' : 'meetInviteBgOther';
    iconKey = 'meetInviteIcon';
  }

  // 背景图与图标别名解析器
  const getAssetVal = (...keys: string[]): string | undefined => {
    if (!activeTheme?.assets) return undefined;
    const assets = activeTheme.assets as Record<string, any>;
    for (const k of keys) {
      if (k && assets[k] && typeof assets[k] === 'string' && assets[k].trim()) {
        return assets[k];
      }
    }
    return undefined;
  };

  // 背景图（支持点九覆盖原气泡，优先特定方向前缀，回退基础前缀与别名）
  const customBgImg = isText || isVoice
    ? (isUser
        ? getAssetVal('bubbleBgSelf', 'bubbleBgRight', 'bubbleSelf', 'chatBubbleSelf', 'rightBubble', bgKey)
        : getAssetVal('bubbleBgOther', 'bubbleBgLeft', 'bubbleOther', 'chatBubbleOther', 'leftBubble', bgKey))
    : (getAssetVal(bgKey, `${bubbleType}Bg`, bubbleType === 'transfer' ? 'transferCardBg' : ''));

  // 图标贴图
  const customIconImg = getAssetVal(iconKey, `${bubbleType}Icon`, `${prefix}Icon`);

  // 默认样式回退
  const fallbackBg =
    defaultBg ||
    (bubbleType === 'transfer'
      ? '#F6C453'
      : bubbleType === 'location'
      ? '#ffffff'
      : bubbleType === 'file'
      ? '#ffffff'
      : (bubbleType === 'proposal' || bubbleType === 'wedding')
      ? (isUser ? '#ffe4e6' : '#fff1f2')
      : bubbleType === 'divorce'
      ? '#f4f4f5'
      : bubbleType === 'meet_invite'
      ? (isUser ? '#fef3c7' : '#fffbeb')
      : isUser
      ? '#95ec69'
      : '#ffffff');

  const fallbackBorder =
    defaultBorder ||
    (bubbleType === 'transfer'
      ? '1px solid #D97A2B'
      : bubbleType === 'location'
      ? '1px solid #e5e7eb'
      : bubbleType === 'file'
      ? '1px solid #e5e7eb'
      : (bubbleType === 'proposal' || bubbleType === 'wedding')
      ? '1.5px solid #fda4af'
      : bubbleType === 'divorce'
      ? '1.5px solid #d4d4d8'
      : bubbleType === 'meet_invite'
      ? '1.5px solid #f59e0b'
      : isUser
      ? '1px solid #7ec952'
      : '1px solid #e5e7eb');

  const fallbackText =
    defaultTextColor ||
    (bubbleType === 'transfer'
      ? '#6B3A1E'
      : (bubbleType === 'proposal' || bubbleType === 'wedding')
      ? '#9f1239'
      : bubbleType === 'divorce'
      ? '#3f3f46'
      : bubbleType === 'meet_invite'
      ? '#78350f'
      : '#1c1917');

  // 颜色与边框精准匹配（兼容主题工坊中的各类 key 格式）
  const bgColor =
    (isText || isVoice
      ? (isUser ? (activeTheme?.css?.['--gg-bubble-self'] || activeTheme?.css?.['--gg-bubbleSelf-bg']) : (activeTheme?.css?.['--gg-bubble-other'] || activeTheme?.css?.['--gg-bubbleOther-bg']))
      : (activeTheme?.css?.[`--gg-${prefix}-bg`] || activeTheme?.css?.[`--gg-${bubbleType}-bg`])) ||
    fallbackBg;

  const textColor =
    (isText || isVoice
      ? (isUser ? (activeTheme?.css?.['--gg-bubble-self-text'] || activeTheme?.css?.['--gg-bubbleSelf-text']) : (activeTheme?.css?.['--gg-bubble-other-text'] || activeTheme?.css?.['--gg-bubbleOther-text']))
      : (activeTheme?.css?.[`--gg-${prefix}-text`] || activeTheme?.css?.[`--gg-${bubbleType}-text`])) ||
    fallbackText;

  const borderStr =
    (isText || isVoice
      ? (isUser ? (activeTheme?.css?.['--gg-bubble-border-self'] || activeTheme?.css?.['--gg-bubbleSelf-border']) : (activeTheme?.css?.['--gg-bubble-border-other'] || activeTheme?.css?.['--gg-bubbleOther-border']))
      : (activeTheme?.css?.[`--gg-${prefix}-border`] || activeTheme?.css?.[`--gg-${bubbleType}-border`])) ||
    fallbackBorder;

  const radius =
    (isText || isVoice)
      ? (isUser ? activeTheme?.css?.['--gg-bubble-radius-self'] || '12px' : activeTheme?.css?.['--gg-bubble-radius-other'] || '12px')
      : activeTheme?.css?.[`--gg-${prefix}-radius`] || activeTheme?.css?.[`--gg-${bubbleType}-radius`] || '12px';

  const shadow =
    (isText || isVoice)
      ? (isUser ? activeTheme?.css?.['--gg-bubble-shadow-self'] || '0 1px 3px rgba(0,0,0,0.08)' : activeTheme?.css?.['--gg-bubble-shadow-other'] || '0 1px 3px rgba(0,0,0,0.08)')
      : activeTheme?.css?.[`--gg-${prefix}-shadow`] || activeTheme?.css?.[`--gg-${bubbleType}-shadow`] || '0 1px 3px rgba(0,0,0,0.08)';

  // 图标与文字的位置与尺寸偏移配置
  const iconOffsetX = activeTheme?.css?.[`--gg-${prefix}-icon-x`] || activeTheme?.css?.[`--gg-${bubbleType}-icon-x`] || '0px';
  const iconOffsetY = activeTheme?.css?.[`--gg-${prefix}-icon-y`] || activeTheme?.css?.[`--gg-${bubbleType}-icon-y`] || '0px';
  const iconSize = activeTheme?.css?.[`--gg-${prefix}-icon-size`] || activeTheme?.css?.[`--gg-${bubbleType}-icon-size`] || (bubbleType === 'transfer' ? '28px' : '20px');
  const iconColor =
    activeTheme?.css?.[`--gg-${prefix}-icon-color`] ||
    activeTheme?.css?.[`--gg-${bubbleType}-icon-color`] ||
    ((bubbleType === 'proposal' || bubbleType === 'wedding') ? '#f43f5e' : bubbleType === 'divorce' ? '#71717a' : undefined);
  const customIconChar =
    activeTheme?.css?.[`--gg-${prefix}-icon-char`] ||
    activeTheme?.css?.[`--gg-${bubbleType}-icon-char`];

  const textOffsetX = activeTheme?.css?.[`--gg-${prefix}-text-x`] || activeTheme?.css?.[`--gg-${bubbleType}-text-x`] || '0px';
  const textOffsetY = activeTheme?.css?.[`--gg-${prefix}-text-y`] || activeTheme?.css?.[`--gg-${bubbleType}-text-y`] || '0px';

  const rawTitle = title || defaultTitle;
  // 确保标题中不包含重复的前缀 Emoji 图标，保证左上角只展示一个图标
  const resolvedTitle = (rawTitle || (bubbleType === 'proposal' ? '浪漫求婚' : bubbleType === 'wedding' ? '婚礼邀请' : bubbleType === 'divorce' ? '婚姻协议' : bubbleType === 'meet_invite' ? '线下见面邀请' : '')).replace(/^[💍💒💔❤️✨🏮⛪☕📅]\s*/, '');

  // 2. 容器样式组装
  let containerStyle: React.CSSProperties = {};

  if (customBgImg) {
    const isDot9 =
      activeTheme?.css?.[`--gg-is-dot9-${bgKey}`] === 'true' ||
      activeTheme?.css?.[`--gg-is-dot9-${prefix}`] === 'true' ||
      (activeTheme?.css?.[`--gg-is-dot9-${bgKey}`] !== 'false' && activeTheme?.css?.[`--gg-is-dot9-${prefix}`] !== 'false');

    containerStyle = {
      ...getBubbleContainerStyle({
        isUser,
        prefix,
        editingTheme: activeTheme,
        bubbleBgUrl: customBgImg,
        customText: textColor,
        defaultText: fallbackText,
        isDot9,
        minWidth: isText ? undefined : 160,
        minHeight: isText ? undefined : 48,
      }),
      color: textColor,
      ...style,
    };
  } else {
    const borderObj = parseBorderCSS(borderStr, fallbackBorder);
    containerStyle = {
      position: 'relative',
      backgroundColor: bgColor,
      color: textColor,
      borderRadius: radius,
      boxShadow: shadow,
      padding: isText ? '8px 12px' : '10px 12px',
      minWidth: isText ? undefined : '160px',
      maxWidth: '240px',
      ...borderObj,
      ...style,
    };
  }

  // 渲染自定义图标组件
  const renderIcon = (fallbackElement?: React.ReactNode, wrapperClassName: string = '') => {
    if (customIconImg === 'none') {
      return null;
    }
    let content: React.ReactNode = null;
    if (customIconImg && !isPlaying) {
      content = (
        <img
          src={customIconImg}
          alt="图标"
          className="w-full h-full object-contain pointer-events-none"
        />
      );
    } else if (customIconChar) {
      content = (
        <span
          className="leading-none select-none flex items-center justify-center font-bold"
          style={{ fontSize: `calc(${iconSize} * 0.9)`, color: iconColor }}
        >
          {customIconChar}
        </span>
      );
    } else {
      const base = fallbackElement || defaultIcon;
      if (React.isValidElement(base) && iconColor) {
        content = React.cloneElement(base as React.ReactElement<any>, {
          style: { ...(base.props.style || {}), color: iconColor, stroke: iconColor },
          className: base.props.className?.replace(/text-\w+-\d+/g, '') || '',
        });
      } else {
        content = base;
      }
    }

    return (
      <div
        className={`shrink-0 flex items-center justify-center relative ${wrapperClassName}`}
        style={{
          width: iconSize,
          height: iconSize,
          color: iconColor,
          transform:
            iconOffsetX !== '0px' || iconOffsetY !== '0px'
              ? `translate(${iconOffsetX}, ${iconOffsetY})`
              : undefined,
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`select-none transition-all relative overflow-visible ${className}`}
      style={containerStyle}
    >
      {/* 点九图片背景层（若上传了背景图） */}
      {customBgImg && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={getBubbleBgStyle({
            isUser,
            prefix,
            editingTheme: activeTheme,
            bubbleBgUrl: customBgImg,
            customText: textColor,
            defaultText: fallbackText,
            isDot9:
              activeTheme?.css?.[`--gg-is-dot9-${bgKey}`] === 'true' ||
              activeTheme?.css?.[`--gg-is-dot9-${prefix}`] === 'true' ||
              (activeTheme?.css?.[`--gg-is-dot9-${bgKey}`] !== 'false' && activeTheme?.css?.[`--gg-is-dot9-${prefix}`] !== 'false'),
          })}
        />
      )}

      {/* 内部内容区域 */}
      <div
        className="relative z-10 w-full"
        style={{
          transform:
            textOffsetX !== '0px' || textOffsetY !== '0px'
              ? `translate(${textOffsetX}, ${textOffsetY})`
              : undefined,
        }}
      >
        {/* === 类型 1: 转账卡片 (Transfer) === */}
        {bubbleType === 'transfer' && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              {renderIcon(
                <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-900 flex items-center justify-center shadow-2xs">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm leading-tight font-mono tracking-tight">
                  {amount || resolvedTitle || '¥520.00'}
                </div>
                {(subtitle || resolvedTitle) && (
                  <div className="text-[10px] opacity-85 mt-0.5 truncate leading-tight">
                    {subtitle || (amount ? resolvedTitle : '转账给你')}
                  </div>
                )}
              </div>
            </div>

            {/* 转账备注或主体文字 */}
            {children && (
              <div className="mt-1 text-[10.5px] opacity-90 leading-snug break-words">
                {children}
              </div>
            )}

            {/* 底部条 */}
            <div className="mt-2 pt-1.5 border-t border-black/10 text-[9px] opacity-75 flex items-center justify-between">
              <span>{extra || '微信转账'}</span>
            </div>

            {/* 交互按钮 */}
            {actions && (
              <div className="mt-1.5 pt-1.5 border-t border-black/10 flex items-center gap-1.5">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* === 类型 2: 位置分享 (Location) === */}
        {bubbleType === 'location' && (
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs leading-tight truncate">
                  {resolvedTitle || '浪漫星空咖啡馆'}
                </div>
                <div className="text-[9.5px] opacity-75 mt-0.5 truncate leading-tight">
                  {subtitle || (typeof children === 'string' ? children : '朝阳区三里屯路 88 号 · 1.2km')}
                </div>
              </div>
              {renderIcon(
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: activeTheme?.css?.['--gg-location-icon-bg'] || '#d1fae5',
                    color: activeTheme?.css?.['--gg-location-icon-color'] || '#059669',
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* 地图视觉缩略图 */}
            <div
              className="h-10 w-full rounded-md border border-stone-200/80 flex items-center justify-center relative overflow-hidden my-0.5 bg-cover bg-center"
              style={{
                backgroundImage: activeTheme?.assets?.locationNavBg ? `url(${activeTheme.assets.locationNavBg})` : undefined,
                backgroundColor: activeTheme?.assets?.locationNavBg ? undefined : (activeTheme?.css?.['--gg-location-nav-bg'] || 'rgba(0,0,0,0.03)')
              }}
            >
              {!activeTheme?.assets?.locationNavBg && (
                <div className="absolute inset-0 opacity-20 [background-size:6px_6px]" style={{ backgroundImage: `radial-gradient(${activeTheme?.css?.['--gg-location-nav-dots'] || '#10b981'} 1px, transparent 1px)` }} />
              )}
              <div 
                className="flex items-center gap-1 text-[9px] font-medium z-10"
                style={{
                  color: activeTheme?.css?.['--gg-location-nav-text'] || activeTheme?.css?.['--gg-location-icon-color'] || '#57534e'
                }}
              >
                {activeTheme?.assets?.locationNavIcon ? (
                  <img src={activeTheme.assets.locationNavIcon} alt="Nav" className="h-4 w-auto object-contain shrink-0" />
                ) : (
                  <MapPin 
                    className="w-3.5 h-3.5 animate-bounce shrink-0" 
                    style={{
                      color: activeTheme?.css?.['--gg-location-icon-color'] || '#10b981'
                    }}
                  />
                )}
                <span>地图实时导航</span>
              </div>
            </div>

            {/* 底部说明 */}
            <div className="pt-1 border-t border-black/10 text-[8.5px] opacity-60 flex items-center justify-between">
              <span>{extra || '位置分享'}</span>
            </div>
          </div>
        )}

        {/* === 类型 3: 文件传送 (File) === */}
        {bubbleType === 'file' && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs leading-tight line-clamp-2">
                  {resolvedTitle || (typeof children === 'string' ? children : '专属企划案.pdf')}
                </div>
                <div className="text-[9.5px] opacity-70 mt-0.5">
                  {subtitle || '2.4 MB · 已下载'}
                </div>
              </div>
              {renderIcon(
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-black/5 shadow-2xs"
                  style={{
                    backgroundColor: activeTheme?.css?.['--gg-file-icon-bg'] || '#eff6ff',
                    color: activeTheme?.css?.['--gg-file-icon-color'] || '#2563eb',
                  }}
                >
                  <FileText className="w-4.5 h-4.5" />
                </div>
              )}
            </div>

            {children && typeof children !== 'string' && (
              <div className="mt-1 text-[10px] opacity-85">
                {children}
              </div>
            )}

            {/* 底部说明：去除点击查看 */}
            <div className="mt-2 pt-1 border-t border-black/10 text-[8.5px] opacity-60 flex items-center justify-between">
              <span>{extra || '微信文件'}</span>
            </div>
          </div>
        )}

        {/* === 类型 4: 求婚 / 婚礼 / 离婚 / 仪式卡片 (Proposal / Wedding / Divorce) === */}
        {(bubbleType === 'proposal' || bubbleType === 'wedding' || bubbleType === 'divorce') && (
          <div className="flex flex-col">
            {/* 头部：图标与标题 */}
            <div className={`flex items-center mb-1.5 pb-1 border-b border-black/10 ${customIconImg === 'none' ? 'gap-0' : 'gap-1.5'}`}>
              {customIconImg !== 'none' && renderIcon(
                bubbleType === 'proposal' ? (
                  <CustomHeartSVG className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                ) : bubbleType === 'wedding' ? (
                  <WeddingChurchSVG className="w-4 h-4 text-rose-500" />
                ) : (
                  <LogOut className="w-4 h-4 text-stone-500" />
                )
              )}
              <span className="font-bold text-xs leading-tight">
                {resolvedTitle || (bubbleType === 'proposal' ? '浪漫求婚' : bubbleType === 'wedding' ? '婚礼邀请' : '婚姻协议')}
              </span>
              {subtitle && (
                <span className="text-[9px] opacity-75 ml-auto font-normal">
                  {subtitle}
                </span>
              )}
            </div>

            {/* 主体正文 */}
            <div className="text-xs leading-relaxed break-words font-normal my-0.5">
              {children || (bubbleType === 'proposal' ? '遇见你是我最大的幸运，你愿意和我共度余生吗？' : bubbleType === 'wedding' ? '良辰吉日，与你共赴永恒誓约！' : '愿彼此安好，珍重前程。')}
            </div>

            {/* 辅助信息 */}
            {extra && (
              <div className="mt-1 pt-1 border-t border-black/10 text-[9.5px] opacity-85">
                {extra}
              </div>
            )}

            {/* 交互按钮 */}
            {actions && (
              <div className="mt-2 pt-1.5 border-t border-black/10 flex items-center gap-1.5">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* === 类型 4.5: 线下见面邀请卡片 (Meet Invite) === */}
        {bubbleType === 'meet_invite' && (
          <div className="flex flex-col">
            {/* 头部：图标与标题 */}
            <div className={`flex items-center mb-1.5 pb-1 border-b border-black/10 ${customIconImg === 'none' ? 'gap-0' : 'gap-1.5'}`}>
              {customIconImg !== 'none' && renderIcon(
                <CalendarHeart className="w-4 h-4 text-amber-600 fill-amber-500/20" />
              )}
              <span className="font-bold text-xs leading-tight">
                {resolvedTitle || '线下见面邀请'}
              </span>
              {subtitle && (
                <span className="text-[9px] opacity-75 ml-auto font-normal">
                  {subtitle}
                </span>
              )}
            </div>

            {/* 主体正文 */}
            <div className="text-xs leading-relaxed break-words font-normal my-0.5">
              {children || '要不要找个时间线下见个面？我已经选好了想去的地方，等你一起。'}
            </div>

            {/* 约见地点或时间 */}
            {amount && (
              <div className="mt-1 px-2 py-1 rounded bg-black/5 flex items-center gap-1 text-[10px] font-medium opacity-90">
                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">地点：{amount}</span>
              </div>
            )}

            {/* 辅助信息 */}
            {extra && (
              <div className="mt-1.5 pt-1 border-t border-black/10 text-[9px] opacity-80">
                {extra}
              </div>
            )}

            {/* 交互按钮 */}
            {actions && (
              <div className="mt-2 pt-1.5 border-t border-black/10 flex items-center gap-1.5">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* === 类型 5: 语音消息 (Voice Self / Other) === */}
        {bubbleType === 'voice' && (
          <div className={`flex items-center gap-2 justify-between w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {renderIcon(<Volume2 className="w-4 h-4" />)}
            <span className="font-mono text-xs font-semibold">
              {amount || resolvedTitle || children || '3"'}
            </span>
          </div>
        )}

        {/* === 类型 6: 普通文本/自定义气泡 (Text / Custom) === */}
        {isText && (
          <div className="text-xs leading-relaxed break-words font-normal">
            {/* 挂件装饰 (若有) */}
            {isUser && activeTheme?.assets?.bubbleDecorSelf && (
              <div
                className="absolute pointer-events-none z-30 bg-contain bg-no-repeat"
                style={{
                  top: activeTheme.css['--gg-decor-offset-y-self'] || '-4px',
                  right: activeTheme.css['--gg-decor-offset-x-self'] || '-4px',
                  width: activeTheme.css['--gg-decor-size-self'] || '14px',
                  height: activeTheme.css['--gg-decor-size-self'] || '14px',
                  backgroundImage: `url(${activeTheme.assets.bubbleDecorSelf})`,
                }}
              />
            )}
            {!isUser && activeTheme?.assets?.bubbleDecorOther && (
              <div
                className="absolute pointer-events-none z-30 bg-contain bg-no-repeat"
                style={{
                  top: activeTheme.css['--gg-decor-offset-y-other'] || '-4px',
                  left: activeTheme.css['--gg-decor-offset-x-other'] || '-4px',
                  width: activeTheme.css['--gg-decor-size-other'] || '14px',
                  height: activeTheme.css['--gg-decor-size-other'] || '14px',
                  backgroundImage: `url(${activeTheme.assets.bubbleDecorOther})`,
                }}
              />
            )}
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

