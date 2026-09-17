import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveApp, PhoneSettings, Contact, TakeawayOrder, ThemeStyle, ChatMessage } from '../../types/phone';
import { THEME_ICON_SETS, getAppIconStyle } from '../../utils/themeIcons';
import { compressImage } from '../../utils/image';
import { Avatar } from './Avatar';
import { 
  MessageCircle, 
  Settings, 
  BookOpen, 
  Phone, 
  BookMarked, 
  Camera, 
  Bike, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  BellRing, 
  RefreshCw, 
  Utensils, 
  CheckCircle2, 
  AlertCircle, 
  Twitter,
  Heart,
  Palette,
  Baby,
  Timer,
  Music,
  Coffee,
  Tv,
  Home,
  Dices
} from 'lucide-react';

import { DiyWorkshopIcon } from './diy/DiyWorkshopIcon';

interface DesktopViewProps {
  onOpenApp: (app: ActiveApp) => void;
  settings: PhoneSettings;
  onUpdateSettings: (s: Partial<PhoneSettings>) => void;
  contacts: Contact[];
  messages?: Record<string, ChatMessage[]>;
  takeawayOrder: TakeawayOrder | null;
  onOpenTakeawayModal: () => void;
}

export const DesktopView: React.FC<DesktopViewProps> = ({
  onOpenApp,
  settings,
  onUpdateSettings,
  contacts,
  messages,
  takeawayOrder,
  onOpenTakeawayModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updateType, setUpdateType] = useState<'takeaway' | 'wechat'>(
    takeawayOrder ? 'takeaway' : 'wechat'
  );
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);

  const activeTheme = settings.activeDIYThemeId && settings.diyThemes
    ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
    : undefined;
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const totalUnread = safeContacts.reduce((acc, c) => acc + (c?.unreadCount || 0), 0);
  const activeContactWithMsg = safeContacts.find(c => (c?.unreadCount || 0) > 0) || safeContacts[0];

  // 综合所有联系人的聊天记录，找出时间戳最新的一条消息
  let latestMsgData: { contact: Contact | undefined; msg: ChatMessage } | null = null;
  if (messages && typeof messages === 'object') {
    Object.keys(messages).forEach(contactId => {
      const msgs = messages[contactId];
      if (!Array.isArray(msgs) || msgs.length === 0) return;
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && (!latestMsgData || lastMsg.timestamp > latestMsgData.msg.timestamp)) {
        const contact = safeContacts.find(c => c && c.id === contactId);
        latestMsgData = { contact, msg: lastMsg };
      }
    });
  }

  // 根据消息类型格式化预览内容
  const getMessagePreviewText = (msg: ChatMessage | undefined): string => {
    if (!msg) return '暂无消息，开始聊天吧';
    switch (msg.type) {
      case 'image':
        return '[图片]';
      case 'voice':
        return '[语音]';
      case 'transfer':
        return `[转账${msg.transferAmount ? ` ¥${msg.transferAmount}` : ''}]`;
      case 'sticker':
        return '[表情包]';
      case 'photo_desc':
        return '[照片]';
      case 'offline_scene':
        return '[线下互动]';
      case 'location':
        return '[位置]';
      case 'text':
      default: {
        const text = (msg.content || '').trim();
        if (!text) return '[消息]';
        return text.length > 20 ? text.slice(0, 20) + '...' : text;
      }
    }
  };

  const displayContact = latestMsgData?.contact || activeContactWithMsg || contacts[0];
  const displaySenderName = displayContact ? (displayContact.remark || displayContact.name) : '微信好友';
  const displayAvatar = displayContact?.avatar || '';
  const displayPreviewText = latestMsgData ? getMessagePreviewText(latestMsgData.msg) : '暂无消息，开始聊天吧';

  // Theme-aware unified icon set
  const currentTheme = (settings.themeStyle || 'morandi') as ThemeStyle;
  const iconSet = THEME_ICON_SETS[currentTheme] || THEME_ICON_SETS.morandi;

  // Calculate live takeaway progress
  let takeawayProgress = 0;
  let remainingSeconds = 0;
  let isArrived = false;

  if (takeawayOrder) {
    const elapsed = Math.floor((Date.now() - takeawayOrder.orderTime) / 1000);
    remainingSeconds = Math.max(0, takeawayOrder.durationSeconds - elapsed);
    takeawayProgress = Math.min(100, Math.floor((elapsed / takeawayOrder.durationSeconds) * 100));
    isArrived = takeawayOrder.status === 'arrived' || remainingSeconds === 0;
  }

  const handleAvatarClick = () => {
    console.log('[Avatar] 点击主屏幕头像，触发文件选择');
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[Avatar] 主屏幕选择头像文件:', file.name, file.size);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImage(raw, 160, 160, 0.8);
        onUpdateSettings({ userAvatar: compressed });
        console.log('[Avatar] 主屏幕头像更新成功并已保存');
      } catch (err) {
        console.error('[Avatar] 主屏幕头像压缩或保存失败:', err);
        onUpdateSettings({ userAvatar: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getCustomAppIcon = (keys: string[]): string | undefined => {
    if (!activeTheme?.assets) return undefined;
    const assets = activeTheme.assets as any;
    for (const k of keys) {
      const val = assets[k] || assets?.desktopIcons?.[k] || assets?.appIcons?.[k];
      if (typeof val === 'string' && val.trim()) {
        return val;
      }
    }
    return undefined;
  };

  // 桌面应用列表（支持一行4个、一列4个，每页放满16个才开启下一页）
  const desktopApps = [
    {
      id: 'wechat',
      name: '微信',
      title: '微信',
      customKeys: ['appIconWechat', 'wechatIcon', 'desktopIconWechat'],
      boxClass: iconSet.wechat.boxClass,
      iconClass: iconSet.wechat.iconClass,
      iconFill: iconSet.wechat.iconFill,
      IconComponent: MessageCircle,
      badge: totalUnread > 0 ? (
        <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse z-10" style={{ backgroundColor: 'var(--gg-danger-color, #f87171)' }}>
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      ) : null,
      onClick: () => onOpenApp('wechat'),
    },
    {
      id: 'takeaway',
      name: '美团外卖',
      title: '美团外卖 (给AI好友点餐)',
      customKeys: ['appIconTakeaway', 'takeawayIcon', 'desktopIconTakeaway'],
      boxClass: iconSet.takeawayApp.boxClass,
      iconClass: iconSet.takeawayApp.iconClass,
      iconFill: iconSet.takeawayApp.iconFill,
      IconComponent: Bike,
      badge: takeawayOrder && !isArrived ? (
        <span className="absolute -top-1.5 -right-2 px-1 h-4 text-[8px] font-extrabold rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse z-10 whitespace-nowrap" style={{ backgroundColor: 'var(--gg-warning-color, #fbbf24)', color: '#000000' }}>
          配送中
        </span>
      ) : null,
      onClick: onOpenTakeawayModal,
    },
    {
      id: 'worldbook',
      name: '世界书',
      title: '世界书',
      customKeys: ['appIconWorldbook', 'worldbookIcon', 'desktopIconWorldbook'],
      boxClass: iconSet.worldbook.boxClass,
      iconClass: iconSet.worldbook.iconClass,
      iconFill: false,
      IconComponent: BookOpen,
      badge: null,
      onClick: () => onOpenApp('worldbook'),
    },
    {
      id: 'marriage',
      name: '婚书',
      title: '婚书',
      customKeys: ['appIconMarriage', 'marriageIcon', 'desktopIconMarriage'],
      boxClass: iconSet.marriage.boxClass,
      iconClass: iconSet.marriage.iconClass,
      iconFill: false,
      IconComponent: Heart,
      badge: null,
      onClick: () => onOpenApp('marriage'),
    },
    {
      id: 'masks',
      name: '面具',
      title: '面具',
      customKeys: ['appIconMasks', 'masksIcon', 'desktopIconMasks'],
      boxClass: iconSet.masks.boxClass,
      iconClass: iconSet.masks.iconClass,
      iconFill: false,
      IconComponent: Sparkles,
      badge: null,
      onClick: () => onOpenApp('masks'),
    },
    {
      id: 'twitter',
      name: 'X',
      title: 'X',
      customKeys: ['appIconTwitter', 'twitterIcon', 'desktopIconTwitter'],
      boxClass: iconSet.twitter.boxClass,
      iconClass: iconSet.twitter.iconClass,
      iconFill: false,
      IconComponent: Twitter,
      badge: null,
      onClick: () => onOpenApp('twitter'),
    },
    {
      id: 'diy',
      name: 'DIY工坊',
      title: 'DIY工坊',
      customKeys: ['appIconDiy', 'diyIcon', 'desktopIconDiy'],
      boxClass: iconSet.diy.boxClass,
      iconClass: iconSet.diy.iconClass,
      iconFill: false,
      IconComponent: DiyWorkshopIcon,
      badge: null,
      onClick: () => onOpenApp('diy'),
    },
    {
      id: 'suki_baby',
      name: '养娃',
      title: '养娃',
      customKeys: ['appIconSukiBaby', 'sukiBabyIcon', 'babyIcon'],
      boxClass: iconSet.sukiBaby.boxClass,
      iconClass: iconSet.sukiBaby.iconClass,
      iconFill: false,
      IconComponent: Baby,
      badge: null,
      onClick: () => onOpenApp('suki_baby'),
    },
    {
      id: 'pomodoro',
      name: '番茄钟',
      title: '番茄钟',
      customKeys: ['appIconPomodoro', 'pomodoroIcon'],
      boxClass: getAppIconStyle(iconSet, 'pomodoro').boxClass,
      iconClass: getAppIconStyle(iconSet, 'pomodoro').iconClass,
      iconFill: false,
      IconComponent: Timer,
      badge: null,
      onClick: () => onOpenApp('pomodoro'),
    },
    {
      id: 'luckin',
      name: '瑞幸咖啡',
      title: '瑞幸咖啡',
      customKeys: ['appIconLuckin', 'luckinIcon'],
      boxClass: getAppIconStyle(iconSet, 'luckin').boxClass,
      iconClass: getAppIconStyle(iconSet, 'luckin').iconClass,
      iconFill: false,
      IconComponent: Coffee,
      badge: null,
      onClick: () => onOpenApp('luckin'),
    },
    {
      id: 'bilibili',
      name: '哔哩哔哩',
      title: '哔哩哔哩',
      customKeys: ['appIconBilibili', 'bilibiliIcon'],
      boxClass: getAppIconStyle(iconSet, 'bilibili').boxClass,
      iconClass: getAppIconStyle(iconSet, 'bilibili').iconClass,
      iconFill: false,
      IconComponent: Tv,
      customIcon: (
        <div className="relative">
          <Tv className={`w-5.5 h-5.5 transition-colors duration-300 ${getAppIconStyle(iconSet, 'bilibili').iconClass}`} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-pink-400" />
        </div>
      ),
      badge: null,
      onClick: () => onOpenApp('bilibili'),
    },
    {
      id: 'theater',
      name: '剧场',
      title: '剧场 RPG',
      customKeys: ['appIconTheater', 'theaterIcon'],
      boxClass: getAppIconStyle(iconSet, 'theater').boxClass,
      iconClass: getAppIconStyle(iconSet, 'theater').iconClass,
      iconFill: false,
      IconComponent: Dices,
      badge: null,
      onClick: () => onOpenApp('theater'),
    }
  ];

  // 4列 × 4行 = 每页16个应用
  const APPS_PER_PAGE = 16;
  const totalPages = Math.max(1, Math.ceil(desktopApps.length / APPS_PER_PAGE));
  const activePage = Math.min(currentDesktopPage, totalPages - 1);
  const currentPageApps = desktopApps.slice(
    activePage * APPS_PER_PAGE,
    (activePage + 1) * APPS_PER_PAGE
  );

  return (
    <div className="h-full w-full flex flex-col justify-between px-4 pt-3 pb-2 text-white select-none">
      {/* Hidden file input for avatar change */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 1. Top Section: User Profile & Dynamic Update Module */}
      <div className="space-y-2">
        {/* Top User Profile Bar */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/15 shadow-sm">
          <div
            onClick={handleAvatarClick}
            className="relative group cursor-pointer active:scale-90 transition-transform shrink-0"
            title="点击上传更换头像"
          >
            <Avatar
              src={settings.userAvatar}
              className="w-11 h-11 rounded-full border-2 border-white/80 shadow-md"
              size={20}
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight truncate">
                {settings.userNickname}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium" style={{ backgroundColor: 'var(--gg-online-badge-bg, #10b981)', color: 'var(--gg-online-badge-text, #ffffff)' }}>
                在线
              </span>
            </div>
            <p className="text-[11px] text-white/80 truncate mt-0.5">
              {settings.userSignature || '心向远方，随时出发'}
            </p>
          </div>
        </div>

        {/* Dynamic Update Module (Update 模块: 可弹出微信消息 / 外卖消息) */}
        <div className="rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/20 p-2.5 shadow-xl transition-all">
          {/* Header Switcher */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg">
              <button
                onClick={() => setUpdateType('takeaway')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  updateType === 'takeaway'
                    ? 'font-bold shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                style={updateType === 'takeaway' ? { backgroundColor: 'var(--gg-warning-color, #fbbf24)', color: 'var(--gg-accent-text, #000000)' } : undefined}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>外卖消息</span>
                {takeawayOrder && !isArrived && (
                  <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--gg-danger-color, #f87171)' }} />
                )}
              </button>
              <button
                onClick={() => setUpdateType('wechat')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  updateType === 'wechat'
                    ? 'font-bold shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                style={updateType === 'wechat' ? { backgroundColor: 'var(--gg-success-color, #10b981)', color: 'var(--gg-accent-text, #ffffff)' } : undefined}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>微信消息</span>
                {totalUnread > 0 && (
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--gg-danger-color, #f87171)' }} />
                )}
              </button>
            </div>

            {updateType === 'takeaway' && takeawayOrder && (
              <span className="text-[10px] font-mono font-bold flex items-center gap-1" style={{ color: 'var(--gg-warning-color, #fbbf24)' }}>
                <Clock className="w-3 h-3" />
                {isArrived ? '已送达' : `${remainingSeconds}s`}
              </span>
            )}
          </div>

          {/* Body Content: 外卖消息 / 微信消息 */}
          {updateType === 'takeaway' ? (
            <div className="pt-2 text-xs space-y-1.5 animate-fadeIn">
              {/* 没有外卖时，不直接显示虚假信息，展示温馨空状态引导去点外卖 */}
              {!takeawayOrder ? (
                <div className="py-2.5 text-center space-y-1.5">
                  <p className="text-[11px] text-white/80 font-medium">当前暂无进行中的外卖订单</p>
                  <p className="text-[10px] text-white/50">点击下方「美团外卖」可为 AI 好友送去惊喜</p>
                  <button
                    onClick={onOpenTakeawayModal}
                    className="mt-1 px-3 py-1 rounded-full font-bold text-[11px] shadow-xs active:scale-95 transition-transform cursor-pointer"
                    style={{ backgroundColor: 'var(--gg-warning-color, #fbbf24)', color: '#000000' }}
                  >
                    🛵 去为好友点一份外卖
                  </button>
                </div>
              ) : isArrived ? (
                /* 外卖已送达 */
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--gg-delivery-badge-bg, rgba(16, 185, 129, 0.3))', color: 'var(--gg-delivery-badge-text, #34d399)', border: '1px solid var(--gg-delivery-badge-bg)' }}>
                        美团专送
                      </span>
                      <span className="font-semibold text-white/95 text-xs truncate max-w-[150px]">
                        {takeawayOrder.storeName}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: 'var(--gg-success-color, #34d399)' }}>
                      <CheckCircle2 className="w-3 h-3" />
                      已送达好友手中
                    </span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-white/10 text-[11px] text-white/90">
                    <p className="line-clamp-1">
                      🍲 {takeawayOrder.aiContactName} 已签收【{takeawayOrder.foodName}】
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--gg-success-color, #34d399)' }}>
                      TA 已在微信向您发来消息，去微信看看吧！
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 text-[10px]">
                    <span className="text-white/60">骑手：{takeawayOrder.riderName}</span>
                    <button
                      onClick={onOpenTakeawayModal}
                      className="font-bold hover:underline cursor-pointer"
                      style={{ color: 'var(--gg-warning-color, #fbbf24)' }}
                    >
                      再点一单 ›
                    </button>
                  </div>
                </div>
              ) : (
                /* 外卖正在配送中 (真实倒计时) */
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold" style={{ backgroundColor: 'var(--gg-warning-color, #fbbf24)', color: '#000000' }}>
                        美团外卖
                      </span>
                      <span className="font-semibold text-white/95 text-xs truncate max-w-[150px]">
                        {takeawayOrder.storeName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold flex items-center gap-0.5" style={{ color: 'var(--gg-warning-color, #fbbf24)' }}>
                      <Clock className="w-3 h-3" />
                      约 {remainingSeconds} 秒送达
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/80">
                    <span>
                      {takeawayProgress < 30
                        ? '商家正在精心烹饪出餐中...'
                        : takeawayProgress < 75
                        ? '骑手已取餐，飞速赶往目的地 🛵'
                        : '骑手距好友仅200米，准备敲门送达'}
                    </span>
                    <span className="text-white/50 text-[10px]">送至好友家</span>
                  </div>

                  {/* Delivery Progress Bar */}
                  <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${takeawayProgress}%`, backgroundColor: 'var(--gg-warning-color, #fbbf24)' }}
                    />
                  </div>

                  <div className="pt-0.5 flex items-center justify-between text-[10px] text-white/70">
                    <span className="truncate max-w-[190px]">
                      送给 {takeawayOrder.aiContactName} · {takeawayOrder.foodName}
                    </span>
                    <span style={{ color: 'var(--gg-warning-color, #fbbf24)' }}>{takeawayOrder.riderName}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div 
              onClick={() => onOpenApp('wechat')}
              className="pt-2 text-xs space-y-1.5 cursor-pointer group hover:bg-white/5 p-1 rounded-xl transition-colors animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    src={displayAvatar}
                    name={displaySenderName}
                    className="w-7 h-7 rounded-lg shrink-0 border border-white/20"
                    size={14}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-white truncate">
                      {displaySenderName}
                    </p>
                    <p className="text-[10px] text-white/60 truncate">
                      {totalUnread > 0 ? `收到 ${totalUnread} 条新微信` : latestMsgData ? '最新互动消息' : '暂无新消息'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--gg-info-color, #60a5fa)' }}>
                  <span>打开微信</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white/10 text-[11px] text-white/85 truncate">
                “{displayPreviewText}”
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle Section: App Icons (一行4个，一列4个，每页16个放满才开启第2页) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative touch-none py-1">
        <motion.div 
          className="flex-1 flex flex-col justify-start pt-1.5 w-full h-full"
          drag={totalPages > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(e, { offset }) => {
            if (totalPages <= 1) return;
            const swipe = offset.x;
            if (swipe < -40 && activePage < totalPages - 1) {
              setCurrentDesktopPage(activePage + 1);
            } else if (swipe > 40 && activePage > 0) {
              setCurrentDesktopPage(activePage - 1);
            }
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={activePage}
              initial={{ opacity: 0, x: activePage === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activePage === 0 ? 20 : -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="grid grid-cols-4 gap-x-2.5 gap-y-3 px-1 place-items-center w-full"
            >
              {currentPageApps.map((app) => {
                const customImg = getCustomAppIcon(app.customKeys);
                const IconComp = app.IconComponent;
                return (
                  <div
                    key={app.id}
                    onClick={app.onClick}
                    className="flex flex-col items-center gap-1 cursor-pointer group active:scale-90 transition-transform w-full"
                    title={app.title || app.name}
                  >
                    <div className="relative w-11 h-11 mx-auto">
                      <div className={`w-full h-full flex items-center justify-center transition-all duration-300 overflow-hidden ${app.boxClass}`} style={{ filter: 'saturate(0.7)' }}>
                        {customImg ? (
                          <img
                            src={customImg}
                            alt={app.name}
                            className="w-full h-full object-cover rounded-[12px]"
                          />
                        ) : app.customIcon ? (
                          app.customIcon
                        ) : (
                          <IconComp className={`w-5.5 h-5.5 transition-colors duration-300 ${app.iconClass} ${app.iconFill ? 'fill-current' : ''}`} />
                        )}
                      </div>
                      {app.badge}
                    </div>
                    <span className="text-[10px] font-medium drop-shadow-sm tracking-tight text-white/95 text-center truncate max-w-[62px]">
                      {app.name}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Page Indicators (多页时显示滑动指示条，单页时隐藏或保持简约) */}
        {totalPages > 1 && (
          <div className="shrink-0 flex justify-center gap-1.5 my-1.5">
            {Array.from({ length: totalPages }).map((_, p) => (
              <button
                key={p}
                onClick={() => setCurrentDesktopPage(p)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activePage === p ? 'bg-white w-4' : 'bg-white/35 w-1.5'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Dock Bar (3 icons: 设置, 网易云, 我的家园 - 整体上移，完整显示) */}
      <div className={`p-2 shadow-lg flex items-center justify-around transition-all duration-300 ${iconSet.dock.wrapperClass} mb-1`}>
        {/* 1. 设置 */}
        <div
          onClick={() => onOpenApp('settings')}
          className="flex flex-col items-center cursor-pointer active:scale-85 transition-transform"
          title="设置"
        >
          <div className={`w-11 h-11 flex items-center justify-center shadow-md transition-all duration-300 overflow-hidden ${getAppIconStyle(iconSet, 'settings').boxClass}`} style={{ filter: 'saturate(0.7)' }}>
            {getCustomAppIcon(['appIconSettings', 'settingsIcon', 'desktopIconSettings']) ? (
              <img
                src={getCustomAppIcon(['appIconSettings', 'settingsIcon', 'desktopIconSettings'])}
                alt="设置"
                className="w-full h-full object-cover rounded-[12px]"
              />
            ) : (
              <Settings className={`w-5.5 h-5.5 transition-colors duration-300 ${getAppIconStyle(iconSet, 'settings').iconClass}`} />
            )}
          </div>
        </div>

        {/* 2. 网易云音乐 */}
        <div
          onClick={() => onOpenApp('music')}
          className="flex flex-col items-center cursor-pointer active:scale-85 transition-transform"
          title="网易云"
        >
          <div className={`w-11 h-11 flex items-center justify-center shadow-md transition-all duration-300 overflow-hidden ${getAppIconStyle(iconSet, 'music').boxClass}`} style={{ filter: 'saturate(0.7)' }}>
            {getCustomAppIcon(['appIconMusic', 'musicIcon']) ? (
              <img
                src={getCustomAppIcon(['appIconMusic', 'musicIcon'])}
                alt="网易云"
                className="w-full h-full object-cover rounded-[12px]"
              />
            ) : (
              <Music className={`w-5.5 h-5.5 transition-colors duration-300 ${getAppIconStyle(iconSet, 'music').iconClass}`} />
            )}
          </div>
        </div>

        {/* 3. 我的家园 */}
        <div
          onClick={() => onOpenApp('homestead')}
          className="flex flex-col items-center cursor-pointer active:scale-85 transition-transform"
          title="我的家园"
        >
          <div className={`w-11 h-11 flex items-center justify-center shadow-md transition-all duration-300 overflow-hidden ${getAppIconStyle(iconSet, 'homestead').boxClass}`} style={{ filter: 'saturate(0.7)' }}>
            {getCustomAppIcon(['appIconHomestead', 'homesteadIcon', 'homeIcon']) ? (
              <img
                src={getCustomAppIcon(['appIconHomestead', 'homesteadIcon', 'homeIcon'])}
                alt="我的家园"
                className="w-full h-full object-cover rounded-[12px]"
              />
            ) : (
              <Home className={`w-5.5 h-5.5 transition-colors duration-300 ${getAppIconStyle(iconSet, 'homestead').iconClass}`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
