import React, { useState, useRef, useEffect } from 'react';
import { PhoneSettings, Contact, DIYTheme } from '../../types/phone';
import { saveThemeAssets, loadThemeAssets, deleteThemeAssets } from '../../utils/themeAssetsDB';
import { 
  Palette, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  Sparkles, 
  Image as ImageIcon, 
  Layers, 
  Smartphone, 
  RotateCcw,
  MessageSquare,
  FileText,
  CreditCard,
  Radio,
  Sliders,
  Eye,
  Info,
  ExternalLink,
  X,
  Smile,
  Mic,
  Send,
  Search,
  Users,
  Compass,
  User,
  Camera,
  Gift,
  MapPin,
  FolderOpen,
  Heart,
  Coins,
  LogOut,
  Calendar,
  Volume2,
  PhoneOff,
  Phone,
  Minus,
  History,
  Clock,
  Pencil,
  Edit2,
  Pin,
  Bike,
  MessageCircle,
  RefreshCw,
  Store,
  ShoppingBag,
  KeyRound
} from 'lucide-react';
import { getBubbleStyle, getBubbleContainerStyle, getBubbleBgStyle } from '../../utils/bubbleStyle';
import { parseDot9Image } from '../../utils/dot9';
import { ThemeStoreModal } from './diy/ThemeStoreModal';
import { RedeemCodeModal } from './diy/RedeemCodeModal';
import { BreadIcon } from './diy/BreadIcon';
import { DiyWorkshopIcon } from './diy/DiyWorkshopIcon';
import { getBreadBalance, getPurchasedThemeIds } from '../../utils/themeStoreDB';
import { Avatar } from './Avatar';
import { UnifiedBubble } from './wechat/UnifiedBubble';

const CustomHeartSVG = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);


interface DIYWorkshopProps {
  settings: PhoneSettings;
  onUpdateSettings: (s: Partial<PhoneSettings>) => void;
  onReturnToDesktop: () => void;
  contacts: Contact[];
}

export const SPECIAL_BUBBLE_PREFIX_MAP: Record<string, string> = {
  bubbleBgSelf: 'self',
  bubbleBgOther: 'other',
  transferBg: 'transfer',
  transferCardBg: 'transfer',
  locationBg: 'location',
  fileBg: 'file',
  proposalBgSelf: 'proposalSelf',
  proposalBgOther: 'proposalOther',
  proposalBg: 'proposalOther',
  weddingBgSelf: 'weddingSelf',
  weddingBgOther: 'weddingOther',
  weddingBg: 'weddingOther',
  divorceBgSelf: 'divorceSelf',
  divorceBgOther: 'divorceOther',
  divorceBg: 'divorceOther',
  voiceBgSelf: 'voiceSelf',
  voiceBgOther: 'voiceOther',
  voiceBg: 'voiceSelf',
  headerBg: 'header',
  tabbarBg: 'tabbar',
  inputBg: 'input',
  chatBg: 'chat',
  chatWallpaper: 'chat',
  chatlistBg: 'chatlist',
  wechatBg: 'chatlist',
  momentsBg: 'moments',
  momentsCoverBg: 'momentsCover',
  callBg: 'call',
  voiceCancelBtn: 'voiceCancelBtn',
  voiceSendBtn: 'voiceSendBtn',
  proposalOptionYes: 'proposalOptionYes',
  proposalOptionNo: 'proposalOptionNo',
  weddingOptionEnter: 'weddingOptionEnter',
  weddingOptionChinese: 'weddingOptionChinese',
  weddingOptionWestern: 'weddingOptionWestern',
  divorceOptionYes: 'divorceOptionYes',
  divorceOptionNo: 'divorceOptionNo',
  meetInviteBgSelf: 'meetInviteSelf',
  meetInviteBgOther: 'meetInviteOther',
  meetInviteBg: 'meetInviteOther',
  scheduleBtnBg: 'scheduleBtn',
  scheduleModalBg: 'scheduleModal',
};

// 预设默认 DIY 主题结构
const DEFAULT_DIY_THEME: DIYTheme = {
  id: 'default_diy_theme',
  name: '我的定制主题',
  version: '1.0.0',
  author: '玩家',
  description: '在 DIY 工坊中创作的专属个性化主题',
  css: {
    '--gg-shell-bg': '#000000',
    '--gg-accent-color': '#7c9082',
    '--gg-text-primary': '#3a443d',
    '--gg-text-secondary': '#78827b',
    '--gg-page-bg': '#f7f5f0',

    '--gg-bubble-self': '#e2ebd9',
    '--gg-bubble-self-text': '#2c352f',
    '--gg-bubble-border-self': '1px solid #c8d7bd',
    '--gg-bubble-radius-self': '12px',
    '--gg-bubble-shadow-self': '0 1px 3px rgba(0,0,0,0.06)',

    '--gg-bubble-other': '#ffffff',
    '--gg-bubble-other-text': '#2c352f',
    '--gg-bubble-border-other': '1px solid #e2ddd5',
    '--gg-bubble-radius-other': '12px',
    '--gg-bubble-shadow-other': '0 1px 3px rgba(0,0,0,0.06)',

    '--gg-header-bg': '#f0eee6',
    '--gg-header-text': '#3a443d',
    '--gg-header-blur': '12px',

    '--gg-toolbar-bg': '#f3f1ea',
    '--gg-input-bg': '#ffffff',
    '--gg-input-text': '#3a443d',
    '--gg-send-btn-bg': '#7c9082',
    '--gg-send-btn-text': '#ffffff',

    '--gg-tabbar-bg': '#f3f1ea',
    '--gg-tabbar-label-color': '#8a948e',
    '--gg-tabbar-active-label-color': '#7c9082',
    '--gg-tabbar-icon-fog-color': 'rgba(124, 144, 130, 0.25)',
    '--gg-unread-bg': '#a85570',
    '--gg-unread-text': '#ffffff',

    '--gg-moments-feed-bg': '#f0eee6',
    '--gg-moments-card-bg': '#ffffff',
    '--gg-moments-text': '#3a443d',

    '--gg-transfer-bg': '#f6c453',
    '--gg-transfer-text': '#6b3a1e',
    '--gg-transfer-border': '1px solid #d97a2b',
    '--gg-transfer-btn-bg': '#d97a2b',
    '--gg-transfer-refund-bg': '#f6c453',
    '--gg-transfer-icon-size': '20px',
    '--gg-transfer-icon-x': '0px',
    '--gg-transfer-icon-y': '0px',
    '--gg-transfer-text-x': '0px',
    '--gg-transfer-text-y': '0px',

    '--gg-location-bg': '#ffffff',
    '--gg-location-text': '#1f2937',
    '--gg-location-border': '1px solid #e5e7eb',
    '--gg-location-icon-bg': '#d1fae5',
    '--gg-location-icon-color': '#059669',
    '--gg-location-nav-bg': '#f5f5f4',
    '--gg-location-nav-text': '#57534e',
    '--gg-location-icon-size': '18px',
    '--gg-location-icon-x': '0px',
    '--gg-location-icon-y': '0px',
    '--gg-location-text-x': '0px',
    '--gg-location-text-y': '0px',

    '--gg-file-bg': '#ffffff',
    '--gg-file-text': '#1f2937',
    '--gg-file-border': '1px solid #e5e7eb',
    '--gg-file-icon-bg': '#eff6ff',
    '--gg-file-icon-color': '#2563eb',
    '--gg-file-action-color': '#2563eb',
    '--gg-file-icon-size': '20px',
    '--gg-file-icon-x': '0px',
    '--gg-file-icon-y': '0px',
    '--gg-file-text-x': '0px',
    '--gg-file-text-y': '0px',

    '--gg-proposal-bg': '#fff1f2',
    '--gg-proposal-text': '#881337',
    '--gg-proposal-border': '1.5px solid #fecdd3',
    '--gg-proposal-icon-size': '22px',
    '--gg-proposal-icon-x': '0px',
    '--gg-proposal-icon-y': '0px',
    '--gg-proposal-text-x': '0px',
    '--gg-proposal-text-y': '0px',
    '--gg-proposal-btn-yes-text': '#ffffff',
    '--gg-proposal-btn-no-text': '#374151',

    '--gg-wedding-bg': '#fff1f2',
    '--gg-wedding-text': '#881337',
    '--gg-wedding-border': '1.5px solid #fecdd3',
    '--gg-wedding-icon-size': '22px',
    '--gg-wedding-icon-x': '0px',
    '--gg-wedding-icon-y': '0px',
    '--gg-wedding-text-x': '0px',
    '--gg-wedding-text-y': '0px',
    '--gg-wedding-btn-enter-text': '#ffffff',
    '--gg-wedding-btn-chinese-text': '#ffffff',
    '--gg-wedding-btn-western-text': '#ffffff',

    '--gg-divorce-bg': '#f8fafc',
    '--gg-divorce-text': '#334155',
    '--gg-divorce-border': '1.5px solid #e2e8f0',
    '--gg-divorce-icon-size': '22px',
    '--gg-divorce-icon-x': '0px',
    '--gg-divorce-icon-y': '0px',
    '--gg-divorce-text-x': '0px',
    '--gg-divorce-text-y': '0px',
    '--gg-divorce-btn-yes-text': '#ffffff',
    '--gg-divorce-btn-no-text': '#374151',

    // 线下见面邀请气泡
    '--gg-meetInvite-bg': '#fffbeb',
    '--gg-meetInviteOther-bg': '#fffbeb',
    '--gg-meetInviteSelf-bg': '#fef3c7',
    '--gg-meetInvite-text': '#78350f',
    '--gg-meetInviteOther-text': '#78350f',
    '--gg-meetInviteSelf-text': '#78350f',
    '--gg-meetInvite-border': '1.5px solid #fde68a',
    '--gg-meetInviteOther-border': '1.5px solid #fde68a',
    '--gg-meetInviteSelf-border': '1.5px solid #fcd34d',
    '--gg-meetInvite-btn-accept-bg': '#f59e0b',
    '--gg-meetInvite-btn-accept-text': '#ffffff',
    '--gg-meetInvite-btn-decline-bg': 'rgba(0, 0, 0, 0.05)',
    '--gg-meetInvite-btn-decline-text': '#78350f',
    '--gg-meetInvite-icon-size': '20px',
    '--gg-meetInvite-icon-x': '0px',
    '--gg-meetInvite-icon-y': '0px',
    '--gg-meetInvite-text-x': '0px',
    '--gg-meetInvite-text-y': '0px',

    // 行程按钮与弹窗
    '--gg-schedule-btn-bg': 'rgba(0, 0, 0, 0.05)',
    '--gg-schedule-btn-text': '#4b5563',
    '--gg-schedule-btn-border': '1px solid rgba(0, 0, 0, 0.1)',
    '--gg-schedule-modal-bg': '#ffffff',
    '--gg-schedule-modal-text': '#1c1917',
    '--gg-schedule-modal-border': '1px solid rgba(0, 0, 0, 0.1)',
    '--gg-schedule-modal-radius': '20px',
    '--gg-schedule-item-bg': 'rgba(0, 0, 0, 0.03)',
    '--gg-schedule-item-border': '1px solid rgba(0, 0, 0, 0.05)',
    '--gg-schedule-current-card-bg': 'rgba(245, 158, 11, 0.08)',
    '--gg-schedule-current-card-border': 'rgba(245, 158, 11, 0.35)',
    '--gg-schedule-current-badge-bg': '#f59e0b',
    '--gg-schedule-current-badge-text': '#ffffff',

    // 通讯录分组管理
    '--gg-group-btn-color': '#07c160',
    '--gg-group-modal-bg': '#ffffff',
    '--gg-group-modal-title-color': '#1f2937',
    '--gg-group-modal-label-color': '#78716c',
    '--gg-group-modal-input-bg': '#ffffff',
    '--gg-group-modal-input-text': '#1f2937',
    '--gg-group-modal-input-border': '#e5e7eb',
    '--gg-group-modal-primary-btn-bg': '#07c160',
    '--gg-group-modal-primary-btn-text': '#ffffff',
    '--gg-group-modal-danger-btn-bg': '#ef4444',
    '--gg-group-modal-danger-btn-text': '#ffffff',
    '--gg-group-modal-close-btn-bg': '#ffffff',
    '--gg-group-modal-close-btn-text': '#57534e',
    '--gg-group-modal-close-btn-border': '#e5e7eb',

    '--gg-plus-item-text': '#4b5563',
    '--gg-plus-icon-bg': '#ffffff',
    '--gg-plus-icon-color': '#374151',

    // 发送语音面板
    '--gg-voice-panel-bg': '#ffffff',
    '--gg-voice-panel-text': '#1c1917',
    '--gg-voice-mic-bg': '#dcfce7',
    '--gg-voice-mic-icon-color': '#07c160',
    '--gg-voice-field-bg': '#f5f5f4',
    '--gg-voice-field-text': '#1c1917',
    '--gg-voice-slider-color': '#07c160',
    '--gg-voice-cancel-bg': '#f5f5f4',
    '--gg-voice-cancel-text': '#57534e',
    '--gg-voice-submit-bg': '#07c160',
    '--gg-voice-submit-text': '#ffffff',

    // 拍照描述面板
    '--gg-photo-panel-bg': '#ffffff',
    '--gg-photo-panel-text': '#1c1917',
    '--gg-photo-icon-color': '#059669',
    '--gg-photo-field-bg': '#ffffff',
    '--gg-photo-field-text': '#1c1917',
    '--gg-photo-cancel-bg': '#ffffff',
    '--gg-photo-cancel-text': '#57534e',
    '--gg-photo-submit-bg': '#07c160',
    '--gg-photo-submit-text': '#ffffff',

    // 转账面板
    '--gg-transfer-panel-bg': '#ffffff',
    '--gg-transfer-panel-text': '#1c1917',
    '--gg-transfer-icon-bg': '#fef3c7',
    '--gg-transfer-icon-color': '#b45309',
    '--gg-transfer-field-bg': '#f5f5f4',
    '--gg-transfer-field-text': '#1c1917',
    '--gg-transfer-cancel-bg': '#ffffff',
    '--gg-transfer-cancel-text': '#57534e',
    '--gg-transfer-submit-bg': '#f59e0b',
    '--gg-transfer-submit-text': '#ffffff',

    // 发定位面板
    '--gg-location-panel-bg': '#ffffff',
    '--gg-location-panel-text': '#1c1917',
    '--gg-location-panel-icon-color': '#059669',
    '--gg-location-field-bg': '#ffffff',
    '--gg-location-field-text': '#1c1917',
    '--gg-location-chip-bg': '#f5f5f4',
    '--gg-location-chip-text': '#57534e',
    '--gg-location-cancel-bg': '#ffffff',
    '--gg-location-cancel-text': '#57534e',
    '--gg-location-submit-bg': '#07c160',
    '--gg-location-submit-text': '#ffffff',

    // 语音通话界面
    '--gg-call-bg': '#1c1917',
    '--gg-call-text': '#ffffff',
    '--gg-call-subtext': '#9ca3af',
    '--gg-call-wave-color': '#10b981',
    '--gg-call-dot-color': '#10b981',
    '--gg-call-history-icon-color': '#34d399',
    '--gg-call-history-bg': 'rgba(255, 255, 255, 0.1)',
    '--gg-call-history-text': '#d1d5db',
    '--gg-call-send-btn-bg': '#10b981',
    '--gg-call-send-icon-color': '#ffffff',
    '--gg-call-hangup-bg': '#dc2626',
    '--gg-call-hangup-text': '#ffffff',
    '--gg-call-card-bg': 'rgba(0, 0, 0, 0.45)',
    '--gg-call-card-text': '#f5f5f4',
    '--gg-call-input-bg': 'rgba(255, 255, 255, 0.12)',
    '--gg-call-input-text': '#ffffff',
    '--gg-call-minimize-color': '#e5e7eb',
    '--gg-call-minimize-bg': 'rgba(255, 255, 255, 0.1)',
    '--gg-call-float-bg': '#059669',
    '--gg-call-float-border': '#34d399',
    '--gg-call-float-text': '#ffffff',
    '--gg-call-float-avatar-border': '#34d399',
  },
  assets: {
    homeWallpaper: '',
    wallpaper: '',
    chatBg: '',
    chatWallpaper: '',
    chatlistBg: '',
    wechatBg: '',
    headerBg: '',
    tabbarBg: '',
    tabIconChats: '',
    tabIconContacts: '',
    tabIconMoments: '',
    tabIconMe: '',
    primaryBg: '',
    secondaryBg: '',
    bubbleBgSelf: '',
    bubbleDecorSelf: '',
    bubbleBgOther: '',
    bubbleDecorOther: '',
    transferBg: '',
    transferIcon: '',
    transferCardBg: '',
    locationBg: '',
    locationIcon: '',
    fileBg: '',
    fileIcon: '',
    proposalBgSelf: '',
    proposalBgOther: '',
    proposalBg: '',
    weddingBgSelf: '',
    weddingBgOther: '',
    weddingBg: '',
    divorceBgSelf: '',
    divorceBgOther: '',
    divorceBg: '',
    proposalOptionYes: '',
    proposalOptionNo: '',
    weddingOptionEnter: '',
    weddingOptionChinese: '',
    weddingOptionWestern: '',
    divorceOptionYes: '',
    divorceOptionNo: '',
    plusPanelBg: '',
    voiceModalBg: '',
    photoModalBg: '',
    transferModalBg: '',
    locationModalBg: '',
    voiceBgSelf: '',
    voiceIconSelf: '',
    voiceBgOther: '',
    voiceIconOther: '',
    aiBtn: '',
    voiceBtn: '',
    emojiBtn: '',
    plusBtn: '',
    sendBtn: '',
    meetInviteBgOther: '',
    meetInviteBgSelf: '',
    meetInviteIcon: '',
    scheduleBtnBg: '',
    scheduleBtnIcon: '',
    scheduleModalBg: '',
  },
  createdAt: Date.now()
};

// 预设的可编辑变量结构清单（图片直接内置在各功能模块中，不单开独立分类）
export const editableCategories: Record<string, { icon: any; fields: Record<string, { label: string; type: 'color' | 'text' | 'image' | 'border' }> }> = {
  '整体外观': {
    icon: Sliders,
    fields: {
      'homeWallpaper': { label: '📱 1. 桌面壁纸（手机主屏幕背景）', type: 'image' },
      'chatBg': { label: '💬 2. 私聊壁纸（聊天房间内部背景）', type: 'image' },
      'chatlistBg': { label: '📋 3. 微信壁纸（微信主页面/聊天列表背景）', type: 'image' },
      '--gg-shell-bg': { label: '手机外壳底色', type: 'color' },
      '--gg-accent-color': { label: '全局强调色 (小圆点/角标/高亮)', type: 'color' },
      '--gg-text-primary': { label: '主要文字颜色 (标题/昵称/正文)', type: 'color' },
      '--gg-text-secondary': { label: '次要文字颜色 (时间/说明/状态)', type: 'color' },
      '--gg-page-bg': { label: '默认背景底色 (无壁纸时保底)', type: 'color' },
    }
  },
  '📱 桌面主屏幕壁纸': {
    icon: Smartphone,
    fields: {
      'homeWallpaper': { label: '📱 手机桌面壁纸（主屏幕桌面背景）', type: 'image' },
      '--gg-shell-bg': { label: '手机外壳底色', type: 'color' },
    }
  },
  '💬 私聊背景壁纸': {
    icon: ImageIcon,
    fields: {
      'chatBg': { label: '💬 私聊界面壁纸（聊天房间内部背景，直接平铺）', type: 'image' },
      '--gg-page-bg': { label: '聊天底色 (无壁纸时保底)', type: 'color' },
    }
  },
  '聊天气泡-我的': {
    icon: MessageSquare,
    fields: {
      'bubbleBgSelf': { label: '我的气泡背景图（支持点九）', type: 'image' },
      'bubbleDecorSelf': { label: '我的气泡角落贴图（右上角）', type: 'image' },
      '--gg-bubble-self': { label: '气泡背景颜色', type: 'color' },
      '--gg-bubble-self-text': { label: '文字颜色', type: 'color' },
      '--gg-bubble-border-self': { label: '气泡边框样式与颜色', type: 'border' },
      '--gg-bubble-radius-self': { label: '圆角 (如 12px / 20px)', type: 'text' },
      '--gg-bubble-shadow-self': { label: '阴影 (如 0 2px 8px rgba(0,0,0,0.1))', type: 'text' },
      '--gg-decor-offset-x-self': { label: '贴图 X 轴偏移 (如 -8px 或 10px)', type: 'text' },
      '--gg-decor-offset-y-self': { label: '贴图 Y 轴偏移 (如 -8px 或 10px)', type: 'text' },
      '--gg-decor-size-self': { label: '贴图大小 (如 20px)', type: 'text' },
    }
  },
  '聊天气泡-对方': {
    icon: MessageSquare,
    fields: {
      'bubbleBgOther': { label: '对方气泡背景图（支持点九）', type: 'image' },
      'bubbleDecorOther': { label: '对方气泡角落贴图（左上角）', type: 'image' },
      '--gg-bubble-other': { label: '气泡背景颜色', type: 'color' },
      '--gg-bubble-other-text': { label: '文字颜色', type: 'color' },
      '--gg-bubble-border-other': { label: '气泡边框样式与颜色', type: 'border' },
      '--gg-bubble-radius-other': { label: '圆角 (如 12px / 20px)', type: 'text' },
      '--gg-bubble-shadow-other': { label: '阴影 (如 0 2px 8px rgba(0,0,0,0.1))', type: 'text' },
      '--gg-decor-offset-x-other': { label: '贴图 X 轴偏移 (如 -8px 或 10px)', type: 'text' },
      '--gg-decor-offset-y-other': { label: '贴图 Y 轴偏移 (如 -8px 或 10px)', type: 'text' },
      '--gg-decor-size-other': { label: '贴图大小 (如 20px)', type: 'text' },
    }
  },
  '转账卡片': {
    icon: CreditCard,
    fields: {
      'transferBg': { label: '转账卡片背景图（支持点九）', type: 'image' },
      'transferIcon': { label: '转账图标贴图', type: 'image' },
      '--gg-transfer-bg': { label: '卡片背景颜色', type: 'color' },
      '--gg-transfer-text': { label: '卡片文字颜色', type: 'color' },
      '--gg-transfer-border': { label: '卡片边框样式与颜色', type: 'border' },
      '--gg-transfer-btn-bg': { label: '收下按钮背景色', type: 'color' },
      '--gg-transfer-refund-bg': { label: '退还按钮背景色', type: 'color' },
      '--gg-transfer-icon-size': { label: '图标大小 (如 20px)', type: 'text' },
      '--gg-transfer-icon-x': { label: '图标 X 轴偏移 (如 0px 或 4px)', type: 'text' },
      '--gg-transfer-icon-y': { label: '图标 Y 轴偏移 (如 0px 或 -2px)', type: 'text' },
      '--gg-transfer-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-transfer-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },
  '发定位气泡': {
    icon: MapPin,
    fields: {
      'locationBg': { label: '定位气泡背景图（支持点九）', type: 'image' },
      'locationIcon': { label: '定位图标贴图', type: 'image' },
      '--gg-location-icon-color': { label: '定位图标/图钉颜色', type: 'color' },
      '--gg-location-icon-bg': { label: '定位图标底色', type: 'color' },
      '--gg-location-bg': { label: '气泡背景颜色', type: 'color' },
      '--gg-location-text': { label: '气泡文字颜色', type: 'color' },
      '--gg-location-border': { label: '气泡边框样式与颜色', type: 'border' },
      'locationNavBg': { label: '地图导航区底图', type: 'image' },
      '--gg-location-nav-bg': { label: '地图导航区底色', type: 'color' },
      '--gg-location-nav-text': { label: '地图导航区文字颜色', type: 'color' },
      '--gg-location-nav-dots': { label: '地图导航区绿点颜色', type: 'color' },
      '--gg-location-icon-size': { label: '图标大小 (如 18px)', type: 'text' },
      '--gg-location-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-location-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-location-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-location-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },
  '发文件气泡': {
    icon: FolderOpen,
    fields: {
      'fileBg': { label: '文件气泡背景图（支持点九）', type: 'image' },
      'fileIcon': { label: '文件图标贴图', type: 'image' },
      '--gg-file-icon-color': { label: '文件图标颜色', type: 'color' },
      '--gg-file-icon-bg': { label: '文件图标底色', type: 'color' },
      '--gg-file-bg': { label: '气泡背景颜色', type: 'color' },
      '--gg-file-text': { label: '气泡文字颜色', type: 'color' },
      '--gg-file-border': { label: '气泡边框样式与颜色', type: 'border' },
      '--gg-file-icon-size': { label: '图标大小 (如 20px)', type: 'text' },
      '--gg-file-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-file-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-file-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-file-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },
  '浪漫求婚气泡': {
    icon: Heart,
    fields: {
      'proposalBgOther': { label: '求婚气泡背景图（对方，支持点九）', type: 'image' },
      'proposalBgSelf': { label: '求婚气泡背景图（我，支持点九）', type: 'image' },
      'proposalIcon': { label: '求婚左上角图标贴图', type: 'image' },
      '--gg-proposalOther-bg': { label: '对方求婚气泡背景颜色', type: 'color' },
      '--gg-proposalSelf-bg': { label: '我的求婚气泡背景颜色', type: 'color' },
      '--gg-proposalOther-border': { label: '对方求婚气泡边框', type: 'border' },
      '--gg-proposalSelf-border': { label: '我的求婚气泡边框', type: 'border' },
      '--gg-proposalOther-text': { label: '对方求婚气泡文字颜色', type: 'color' },
      '--gg-proposalSelf-text': { label: '我的求婚气泡文字颜色', type: 'color' },
      '--gg-proposal-btn-yes-bg': { label: '「我愿意」按钮背景颜色', type: 'color' },
      '--gg-proposal-btn-yes-text': { label: '「我愿意」按钮文字颜色', type: 'color' },
      '--gg-proposal-btn-yes-border': { label: '「我愿意」按钮边框', type: 'border' },
      '--gg-proposal-btn-no-bg': { label: '「再想想」按钮背景颜色', type: 'color' },
      '--gg-proposal-btn-no-text': { label: '「再想想」按钮文字颜色', type: 'color' },
      '--gg-proposal-btn-no-border': { label: '「再想想」按钮边框', type: 'border' },
      '--gg-proposal-icon-size': { label: '图标大小 (如 22px)', type: 'text' },
      '--gg-proposal-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-proposal-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },
  '婚礼仪式气泡': {
    icon: Sparkles,
    fields: {
      'weddingBgOther': { label: '婚礼气泡背景图（对方，支持点九）', type: 'image' },
      'weddingBgSelf': { label: '婚礼气泡背景图（我，支持点九）', type: 'image' },
      'weddingIcon': { label: '婚礼左上角图标贴图', type: 'image' },
      '--gg-weddingOther-bg': { label: '对方婚礼气泡背景颜色', type: 'color' },
      '--gg-weddingSelf-bg': { label: '我的婚礼气泡背景颜色', type: 'color' },
      '--gg-weddingOther-border': { label: '对方婚礼气泡边框', type: 'border' },
      '--gg-weddingSelf-border': { label: '我的婚礼气泡边框', type: 'border' },
      '--gg-weddingOther-text': { label: '对方婚礼气泡文字颜色', type: 'color' },
      '--gg-weddingSelf-text': { label: '我的婚礼气泡文字颜色', type: 'color' },
      '--gg-wedding-btn-enter-bg': { label: '「进入仪式」按钮背景颜色', type: 'color' },
      '--gg-wedding-btn-enter-text': { label: '「进入仪式」按钮文字颜色', type: 'color' },
      '--gg-wedding-btn-enter-border': { label: '「进入仪式」按钮边框', type: 'border' },
      '--gg-wedding-btn-chinese-bg': { label: '「中式」按钮背景颜色', type: 'color' },
      '--gg-wedding-btn-chinese-text': { label: '「中式」按钮文字颜色', type: 'color' },
      '--gg-wedding-btn-chinese-border': { label: '「中式」按钮边框', type: 'border' },
      '--gg-wedding-btn-western-bg': { label: '「西式」按钮背景颜色', type: 'color' },
      '--gg-wedding-btn-western-text': { label: '「西式」按钮文字颜色', type: 'color' },
      '--gg-wedding-btn-western-border': { label: '「西式」按钮边框', type: 'border' },
      '--gg-wedding-icon-size': { label: '图标大小 (如 22px)', type: 'text' },
      '--gg-wedding-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-wedding-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-wedding-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-wedding-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },
  '解约/离婚气泡': {
    icon: LogOut,
    fields: {
      'divorceBgOther': { label: '离婚气泡背景图（对方，支持点九）', type: 'image' },
      'divorceBgSelf': { label: '离婚气泡背景图（我，支持点九）', type: 'image' },
      'divorceIcon': { label: '离婚左上角图标贴图', type: 'image' },
      '--gg-divorceOther-bg': { label: '对方离婚气泡背景颜色', type: 'color' },
      '--gg-divorceSelf-bg': { label: '我的离婚气泡背景颜色', type: 'color' },
      '--gg-divorceOther-border': { label: '对方离婚气泡边框', type: 'border' },
      '--gg-divorceSelf-border': { label: '我的离婚气泡边框', type: 'border' },
      '--gg-divorceOther-text': { label: '对方离婚气泡文字颜色', type: 'color' },
      '--gg-divorceSelf-text': { label: '我的离婚气泡文字颜色', type: 'color' },
      '--gg-divorce-btn-yes-bg': { label: '「确定离婚」按钮背景颜色', type: 'color' },
      '--gg-divorce-btn-yes-text': { label: '「确定离婚」按钮文字颜色', type: 'color' },
      '--gg-divorce-btn-yes-border': { label: '「确定离婚」按钮边框', type: 'border' },
      '--gg-divorce-btn-no-bg': { label: '「不离了」按钮背景颜色', type: 'color' },
      '--gg-divorce-btn-no-text': { label: '「不离了」按钮文字颜色', type: 'color' },
      '--gg-divorce-btn-no-border': { label: '「不离了」按钮边框', type: 'border' },
      '--gg-divorce-icon-size': { label: '图标大小 (如 22px)', type: 'text' },
      '--gg-divorce-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-divorce-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-divorce-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-divorce-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },
  '线下见面邀请': {
    icon: Calendar,
    fields: {
      'meetInviteBgOther': { label: '对方邀请气泡背景图（支持点九）', type: 'image' },
      'meetInviteIcon': { label: '邀请图标贴图', type: 'image' },
      '--gg-meetInviteOther-bg': { label: '对方邀请气泡背景颜色', type: 'color' },
      '--gg-meetInviteOther-border': { label: '对方邀请气泡边框', type: 'border' },
      '--gg-meetInviteOther-text': { label: '对方邀请气泡文字颜色', type: 'color' },
      '--gg-meetInvite-btn-accept-bg': { label: '「同意赴约」按钮背景颜色', type: 'color' },
      '--gg-meetInvite-btn-accept-text': { label: '「同意赴约」按钮文字颜色', type: 'color' },
      '--gg-meetInvite-btn-decline-bg': { label: '「婉拒」按钮背景颜色', type: 'color' },
      '--gg-meetInvite-btn-decline-text': { label: '「婉拒」按钮文字颜色', type: 'color' },
      '--gg-meetInvite-icon-size': { label: '图标大小 (如 20px)', type: 'text' },
      '--gg-meetInvite-icon-x': { label: '图标 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-meetInvite-icon-y': { label: '图标 Y 轴偏移 (如 0px)', type: 'text' },
      '--gg-meetInvite-text-x': { label: '文字 X 轴偏移 (如 0px)', type: 'text' },
      '--gg-meetInvite-text-y': { label: '文字 Y 轴偏移 (如 0px)', type: 'text' },
    }
  },
  '行程按钮与弹窗': {
    icon: Clock,
    fields: {
      'scheduleBtnBg': { label: '顶栏行程按钮背景图（支持点九）', type: 'image' },
      'scheduleBtnIcon': { label: '顶栏行程按钮贴图图标', type: 'image' },
      '--gg-schedule-btn-bg': { label: '顶栏行程按钮背景色', type: 'color' },
      '--gg-schedule-btn-text': { label: '顶栏行程按钮文字/图标色', type: 'color' },
      '--gg-schedule-btn-border': { label: '顶栏行程按钮边框', type: 'border' },
      'scheduleModalBg': { label: '行程弹窗整体背景图（支持点九）', type: 'image' },
      '--gg-schedule-modal-bg': { label: '行程弹窗背景颜色', type: 'color' },
      '--gg-schedule-modal-text': { label: '行程弹窗文字颜色', type: 'color' },
      '--gg-schedule-modal-border': { label: '行程弹窗边框', type: 'border' },
      '--gg-schedule-modal-radius': { label: '行程弹窗圆角 (如 20px)', type: 'text' },
      '--gg-schedule-item-bg': { label: '时段日程卡片底色', type: 'color' },
      '--gg-schedule-item-border': { label: '时段日程卡片边框', type: 'border' },
      '--gg-schedule-current-card-bg': { label: '当前进行中日程卡片底色', type: 'color' },
      '--gg-schedule-current-card-border': { label: '当前进行中日程卡片边框', type: 'border' },
      '--gg-schedule-current-badge-bg': { label: '当前进行中徽章背景颜色', type: 'color' },
      '--gg-schedule-current-badge-text': { label: '当前进行中徽章文字颜色', type: 'color' },
    }
  },
  '导航栏': {
    icon: Layers,
    fields: {
      'headerBg': { label: '导航栏背景图', type: 'image' },
      '--gg-header-bg': { label: '背景颜色', type: 'color' },
      '--gg-header-text': { label: '文字颜色', type: 'color' },
      '--gg-header-blur': { label: '毛玻璃 (如 12px)', type: 'text' },
    }
  },
  '输入栏与按钮': {
    icon: FileText,
    fields: {
      'inputBg': { label: '输入栏背景图', type: 'image' },
      'aiBtn': { label: 'AI按钮贴图', type: 'image' },
      'voiceBtn': { label: '语音按钮贴图', type: 'image' },
      'emojiBtn': { label: '表情按钮贴图', type: 'image' },
      'plusBtn': { label: '加号按钮贴图', type: 'image' },
      'sendBtn': { label: '发送按钮贴图', type: 'image' },
      '--gg-toolbar-bg': { label: '工具栏背景', type: 'color' },
      '--gg-input-bg': { label: '输入框背景', type: 'color' },
      '--gg-input-text': { label: '输入框文字', type: 'color' },
      '--gg-send-btn-bg': { label: '发送按钮背景', type: 'color' },
      '--gg-send-btn-text': { label: '发送按钮文字', type: 'color' },
    }
  },
  '📋 微信界面壁纸/列表': {
    icon: FileText,
    fields: {
      'chatlistBg': { label: '📋 微信界面壁纸（微信主页面/聊天列表背景，直接平铺）', type: 'image' },
      '--gg-page-bg': { label: '微信页面底色 (无壁纸时保底)', type: 'color' },
      '--gg-unread-bg': { label: '未读消息红点背景色', type: 'color' },
      '--gg-unread-text': { label: '未读消息字色与数字色', type: 'color' },
    }
  },
  '+拓展菜单': {
    icon: Plus,
    fields: {
      'plusPanelBg': { label: '加号面板背景图', type: 'image' },
      'plusVoiceIcon': { label: '「发语音」图标贴图', type: 'image' },
      'plusCameraIcon': { label: '「拍照」图标贴图', type: 'image' },
      'plusAlbumIcon': { label: '「图片」图标贴图', type: 'image' },
      'plusFileIcon': { label: '「文件」图标贴图', type: 'image' },
      'plusTransferIcon': { label: '「转账」图标贴图', type: 'image' },
      'plusLocationIcon': { label: '「发定位」图标贴图', type: 'image' },
      'plusCallIcon': { label: '「语音通话」图标贴图', type: 'image' },
      'plusOfflineIcon': { label: '「线下模式」图标贴图', type: 'image' },
      '--gg-plus-item-text': { label: '按钮文字颜色', type: 'color' },
      '--gg-plus-icon-bg': { label: '图标底色/背景', type: 'color' },
      '--gg-plus-icon-color': { label: '图标未更换时的默认颜色', type: 'color' },
    }
  },
  '发送语音面板': {
    icon: Mic,
    fields: {
      'voiceModalBg': { label: '语音弹窗背景壁纸', type: 'image' },
      '--gg-voice-panel-bg': { label: '弹窗底色（无壁纸时生效）', type: 'color' },
      '--gg-voice-panel-text': { label: '弹窗标题与文字颜色', type: 'color' },
      '--gg-voice-mic-bg': { label: '左上角话筒背景圆形底色', type: 'color' },
      '--gg-voice-mic-icon-color': { label: '左上角话筒图标颜色', type: 'color' },
      '--gg-voice-field-bg': { label: '文本输入框背景色', type: 'color' },
      '--gg-voice-field-text': { label: '文本输入框文字颜色', type: 'color' },
      '--gg-voice-slider-color': { label: '时长滑块/高亮色', type: 'color' },
      '--gg-voice-cancel-bg': { label: '「取消」按钮背景色', type: 'color' },
      '--gg-voice-cancel-text': { label: '「取消」按钮文字颜色', type: 'color' },
      '--gg-voice-submit-bg': { label: '「发送语音」按钮背景色', type: 'color' },
      '--gg-voice-submit-text': { label: '「发送语音」按钮文字颜色', type: 'color' },
    }
  },
  '拍照面板': {
    icon: Camera,
    fields: {
      'photoModalBg': { label: '拍照弹窗背景壁纸', type: 'image' },
      '--gg-photo-panel-bg': { label: '弹窗底色（无壁纸时生效）', type: 'color' },
      '--gg-photo-panel-text': { label: '弹窗标题与正文文字颜色', type: 'color' },
      '--gg-photo-icon-color': { label: '相机图标颜色', type: 'color' },
      '--gg-photo-field-bg': { label: '文本输入框背景色', type: 'color' },
      '--gg-photo-field-text': { label: '文本输入框文字颜色', type: 'color' },
      '--gg-photo-cancel-bg': { label: '「取消」按钮背景色', type: 'color' },
      '--gg-photo-cancel-text': { label: '「取消」按钮文字颜色', type: 'color' },
      '--gg-photo-submit-bg': { label: '「发送」按钮背景色', type: 'color' },
      '--gg-photo-submit-text': { label: '「发送」按钮文字颜色', type: 'color' },
    }
  },
  '转账面板': {
    icon: Coins,
    fields: {
      'transferModalBg': { label: '转账弹窗背景壁纸', type: 'image' },
      '--gg-transfer-panel-bg': { label: '弹窗底色（无壁纸时生效）', type: 'color' },
      '--gg-transfer-panel-text': { label: '弹窗标题与文字颜色', type: 'color' },
      '--gg-transfer-icon-bg': { label: '钱币图标圆形底色', type: 'color' },
      '--gg-transfer-icon-color': { label: '钱币图标与金额符号¥颜色', type: 'color' },
      '--gg-transfer-field-bg': { label: '金额/备注输入框背景色', type: 'color' },
      '--gg-transfer-field-text': { label: '输入框文字颜色', type: 'color' },
      '--gg-transfer-cancel-bg': { label: '「取消」按钮背景色', type: 'color' },
      '--gg-transfer-cancel-text': { label: '「取消」按钮文字颜色', type: 'color' },
      '--gg-transfer-submit-bg': { label: '「确认转账」按钮背景色', type: 'color' },
      '--gg-transfer-submit-text': { label: '「确认转账」按钮文字颜色', type: 'color' },
    }
  },
  '发定位面板': {
    icon: MapPin,
    fields: {
      'locationModalBg': { label: '发定位弹窗背景壁纸', type: 'image' },
      '--gg-location-panel-bg': { label: '弹窗底色（无壁纸时生效）', type: 'color' },
      '--gg-location-panel-text': { label: '弹窗标题与文字颜色', type: 'color' },
      '--gg-location-panel-icon-color': { label: '定位图钉图标颜色', type: 'color' },
      '--gg-location-field-bg': { label: '输入框背景色', type: 'color' },
      '--gg-location-field-text': { label: '输入框文字颜色', type: 'color' },
      '--gg-location-chip-bg': { label: '快捷推荐按钮背景色', type: 'color' },
      '--gg-location-chip-text': { label: '快捷推荐按钮文字颜色', type: 'color' },
      '--gg-location-cancel-bg': { label: '「取消」按钮背景色', type: 'color' },
      '--gg-location-cancel-text': { label: '「取消」按钮文字颜色', type: 'color' },
      '--gg-location-submit-bg': { label: '「发送定位」按钮背景色', type: 'color' },
      '--gg-location-submit-text': { label: '「发送定位」按钮文字颜色', type: 'color' },
    }
  },
  '语音通话': {
    icon: Phone,
    fields: {
      'callBg': { label: '通话全屏背景壁纸', type: 'image' },
      '--gg-call-wave-color': { label: '声波颜色（头像环绕声波与说话声波图标）', type: 'color' },
      '--gg-call-dot-color': { label: '通话时长旁呼吸小圆点颜色', type: 'color' },
      '--gg-call-history-icon-color': { label: '记录旁边的图标颜色', type: 'color' },
      '--gg-call-send-btn-bg': { label: '发送按钮圆形底色', type: 'color' },
      '--gg-call-send-icon-color': { label: '发送按钮图标颜色', type: 'color' },
      '--gg-call-hangup-bg': { label: '挂断按钮底色', type: 'color' },
      '--gg-call-hangup-text': { label: '挂断按钮图标与文字颜色', type: 'color' },
      '--gg-call-text': { label: '联系人姓名与主文字颜色', type: 'color' },
      '--gg-call-subtext': { label: '通话时长与副标题文字颜色', type: 'color' },
      '--gg-call-card-bg': { label: '实时字幕卡片背景色', type: 'color' },
      '--gg-call-card-text': { label: '实时字幕卡片文字颜色', type: 'color' },
      '--gg-call-input-bg': { label: '底部输入栏背景色', type: 'color' },
      '--gg-call-input-text': { label: '底部输入栏文字颜色', type: 'color' },
      '--gg-call-float-bg': { label: '最小化悬浮窗背景颜色', type: 'color' },
      '--gg-call-float-border': { label: '最小化悬浮窗边框颜色', type: 'color' },
      '--gg-call-float-text': { label: '最小化悬浮窗文字颜色', type: 'color' },
      '--gg-call-float-avatar-border': { label: '最小化悬浮窗头像边框颜色', type: 'color' },
      '--gg-call-minimize-color': { label: '左上角最小化按钮图标颜色', type: 'color' },
      '--gg-call-minimize-bg': { label: '左上角最小化按钮背景色', type: 'color' },
      '--gg-call-history-bg': { label: '通话记录按钮背景色', type: 'color' },
      '--gg-call-history-text': { label: '通话记录文字颜色', type: 'color' },
      '--gg-call-bg': { label: '通话全屏底色（无壁纸时生效）', type: 'color' },
    }
  },
  '底部标签栏': {
    icon: Radio,
    fields: {
      'tabbarBg': { label: 'TabBar背景图', type: 'image' },
      '--gg-tabbar-bg': { label: '标签栏背景', type: 'color' },
      '--gg-tabbar-label-color': { label: '未选中文字颜色', type: 'color' },
      '--gg-tabbar-active-label-color': { label: '选中高亮颜色', type: 'color' },
      'tabIconChats': { label: '「微信」图标贴图', type: 'image' },
      'tabIconContacts': { label: '「通讯录」图标贴图', type: 'image' },
      'tabIconMoments': { label: '「朋友圈」图标贴图', type: 'image' },
      'tabIconMe': { label: '「我」图标贴图', type: 'image' },
      '--gg-tabbar-icon-fog-color': { label: '图标模糊雾颜色 (支持RGBA/Hex/Transparent)', type: 'color' },
    }
  },
  '置顶与消息图标': {
    icon: Pin,
    fields: {
      'pinnedIcon': { label: '「置顶图钉」自定义图标贴图', type: 'image' },
      '--gg-pinned-icon-color': { label: '置顶图钉图标颜色', type: 'color' },
      '--gg-pinned-icon-size': { label: '置顶图标大小 (如 12px)', type: 'text' },
    }
  },
  '联系人左滑操作按钮': {
    icon: Users,
    fields: {
      'swipePinIcon': { label: '「置顶」自定义图标贴图', type: 'image' },
      'swipePinOffIcon': { label: '「取消置顶」自定义图标贴图', type: 'image' },
      'swipeDeleteIcon': { label: '「删除」自定义图标贴图', type: 'image' },
      '--gg-swipe-pin-bg': { label: '「置顶」按钮背景色', type: 'color' },
      '--gg-swipe-pin-text': { label: '「置顶」按钮文字颜色', type: 'color' },
      '--gg-swipe-delete-bg': { label: '「删除」按钮背景色', type: 'color' },
      '--gg-swipe-delete-text': { label: '「删除」按钮文字颜色', type: 'color' },
    }
  },
  '通讯录与分组管理': {
    icon: Users,
    fields: {
      '--gg-group-btn-color': { label: '「分组管理」按钮及图标颜色', type: 'color' },
      '--gg-group-modal-bg': { label: '弹窗背景颜色', type: 'color' },
      '--gg-group-modal-title-color': { label: '弹窗大标题颜色', type: 'color' },
      '--gg-group-modal-label-color': { label: '小标题与提示文字颜色', type: 'color' },
      '--gg-group-modal-input-bg': { label: '输入框与下拉选择框背景', type: 'color' },
      '--gg-group-modal-input-text': { label: '输入框与下拉选择框文字', type: 'color' },
      '--gg-group-modal-primary-btn-bg': { label: '「创建 / 确认移入」按钮背景', type: 'color' },
      '--gg-group-modal-primary-btn-text': { label: '「创建 / 确认移入」按钮文字', type: 'color' },
      '--gg-group-modal-danger-btn-bg': { label: '「确认移出分组」危险按钮背景', type: 'color' },
      '--gg-group-modal-danger-btn-text': { label: '「确认移出分组」危险按钮文字', type: 'color' },
      '--gg-group-modal-close-btn-bg': { label: '「关闭」按钮背景', type: 'color' },
      '--gg-group-modal-close-btn-text': { label: '「关闭」按钮文字颜色', type: 'color' },
    }
  },
  '朋友圈': {
    icon: Sparkles,
    fields: {
      'momentsBg': { label: '动态背景图', type: 'image' },
      'momentsCoverBg': { label: '朋友圈封面背景图', type: 'image' },
      'momentsSettingsIcon': { label: '右上角「AI设置」图标贴图', type: 'image' },
      'momentsAiPostIcon': { label: '右上角「AI发圈」图标贴图', type: 'image' },
      'momentsPostIcon': { label: '右上角「发朋友圈」图标贴图', type: 'image' },
      '--gg-moments-feed-bg': { label: '动态流背景', type: 'color' },
      '--gg-moments-card-bg': { label: '卡片背景', type: 'color' },
      '--gg-moments-text': { label: '正文文字', type: 'color' },
    }
  },
};

// 预设常用友好颜色供玩家一键点选
const COLOR_PRESETS = [
  { name: '优雅玫瑰', color: '#d9828b' },
  { name: '复古豆沙', color: '#b85c67' },
  { name: '香槟淡粉', color: '#fce8ea' },
  { name: '珍珠象牙', color: '#fcf8f2' },
  { name: '玫瑰暮色', color: '#593c3f' },
  { name: '暖调杏黄', color: '#ecd3c2' },
  { name: '微信绿', color: '#95ec69' },
  { name: '翡翠绿', color: '#07c160' },
  { name: '纯白', color: '#ffffff' },
  { name: '奶咖米', color: '#fef3c7' },
  { name: '落日金', color: '#f6c453' },
  { name: '暖阳橙', color: '#fb923c' },
  { name: '樱花粉', color: '#fda4af' },
  { name: '甜莓粉', color: '#f472b6' },
  { name: '薰衣草', color: '#c084fc' },
  { name: '晴空蓝', color: '#38bdf8' },
  { name: '薄荷青', color: '#2dd4bf' },
  { name: '气质灰', color: '#9ca3af' },
  { name: '暗夜灰', color: '#475569' },
  { name: '曜石黑', color: '#1c1917' },
  { name: '透明', color: 'transparent' },
];

// 预设边框线型与粗细
const BORDER_PRESET_STYLES = [
  { label: '无边框', width: '0px', style: 'none' },
  { label: '细实线 1px', width: '1px', style: 'solid' },
  { label: '标准实线 2px', width: '2px', style: 'solid' },
  { label: '加粗实线 3px', width: '3px', style: 'solid' },
  { label: '个性虚线 2px', width: '2px', style: 'dashed' },
  { label: '可爱点线 2px', width: '2px', style: 'dotted' },
  { label: '双实线 3px', width: '3px', style: 'double' },
];

// 预设边框颜色
const BORDER_PRESET_COLORS = [
  { name: '柔粉', color: '#e8b4b8' },
  { name: '复古深粉', color: '#d9828b' },
  { name: '浅杏边', color: '#ecdcd9' },
  { name: '浅边灰', color: '#e5e7eb' },
  { name: '微信绿', color: '#7ec952' },
  { name: '翡翠绿', color: '#07c160' },
  { name: '转账金', color: '#d97a2b' },
  { name: '活力橙', color: '#f97316' },
  { name: '樱粉', color: '#f472b6' },
  { name: '浪漫紫', color: '#a855f7' },
  { name: '晴空蓝', color: '#38bdf8' },
  { name: '深灰', color: '#64748b' },
  { name: '纯黑', color: '#000000' },
];

const parseBorderValue = (borderStr: string | undefined, defaultColor = '#e5e7eb') => {
  if (!borderStr || borderStr === 'none' || borderStr === '0' || borderStr === '0px') {
    return { width: '0px', style: 'none', color: defaultColor, isNone: true };
  }
  const parts = borderStr.trim().split(/\s+/);
  if (parts.length === 1) {
    if (parts[0].startsWith('#') || parts[0].startsWith('rgb') || parts[0].startsWith('hsl')) {
      return { width: '1px', style: 'solid', color: parts[0], isNone: false };
    }
    return { width: '1px', style: 'solid', color: defaultColor, isNone: false };
  }
  return {
    width: parts[0] || '1px',
    style: parts[1] || 'solid',
    color: parts.slice(2).join(' ') || defaultColor,
    isNone: parts[0] === '0px' || parts[1] === 'none',
  };
};

export const DIYWorkshop: React.FC<DIYWorkshopProps> = ({
  settings,
  onUpdateSettings,
  onReturnToDesktop,
  contacts
}) => {
  // 主题列表
  const themes: DIYTheme[] = (settings && Array.isArray(settings.diyThemes) && settings.diyThemes.length > 0)
    ? settings.diyThemes
    : [DEFAULT_DIY_THEME];

  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    settings.activeDIYThemeId || themes[0]?.id || DEFAULT_DIY_THEME.id
  );

  // 主题商店与激活码兑换状态
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [breadBalance, setBreadBalanceState] = useState<number>(() => {
    return typeof settings.breadBalance === 'number' ? settings.breadBalance : getBreadBalance();
  });
  const [purchasedThemeIds, setPurchasedThemeIdsState] = useState<string[]>(() => {
    return Array.isArray(settings.purchasedThemeIds) ? settings.purchasedThemeIds : getPurchasedThemeIds();
  });

  const handleRedeemSuccess = (breadAdded: number) => {
    const updated = getBreadBalance();
    setBreadBalanceState(updated);
    onUpdateSettings({ breadBalance: updated });
  };

  const handleBuyThemeSuccess = (newTheme: DIYTheme, price: number) => {
    const updatedBread = getBreadBalance();
    const updatedPurchasedIds = getPurchasedThemeIds();
    setBreadBalanceState(updatedBread);
    setPurchasedThemeIdsState(updatedPurchasedIds);

    const currentThemes = settings.diyThemes || [DEFAULT_DIY_THEME];
    const exists = currentThemes.some(t => t.id === newTheme.id);
    const nextThemes = exists ? currentThemes : [...currentThemes, newTheme];

    onUpdateSettings({
      diyThemes: nextThemes,
      breadBalance: updatedBread,
      purchasedThemeIds: updatedPurchasedIds,
    });
  };

  const handleApplyThemeFromStore = (theme: DIYTheme) => {
    applyDIYThemeToDOM(theme, settings.diyThemes || [DEFAULT_DIY_THEME]);
    setEditingTheme(JSON.parse(JSON.stringify(theme)));
    setSelectedThemeId(theme.id);
    onUpdateSettings({ activeDIYThemeId: theme.id });
  };

  // 当前正在编辑的主题对象
  const [editingTheme, setEditingTheme] = useState<DIYTheme>(() => {
    const found = themes.find(t => t.id === (settings.activeDIYThemeId || selectedThemeId));
    return found ? JSON.parse(JSON.stringify(found)) : JSON.parse(JSON.stringify(DEFAULT_DIY_THEME));
  });

  const [previewUpdateType, setPreviewUpdateType] = useState<'takeaway' | 'wechat'>('takeaway');

  // 实时将当前正在编辑的主题样式注入全局 root，令外层真机外壳与全局界面即时响应
  useEffect(() => {
    if (activeTab === 'editor' && editingTheme?.css) {
      const root = document.documentElement;
      Object.entries(editingTheme.css).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          root.style.setProperty(key, value);
        }
      });
    }
    return () => {
      // 退出编辑时，还原为当前已启用的主题样式
      if (settings.activeDIYThemeId && settings.diyThemes) {
        const activeTheme = settings.diyThemes.find(t => t.id === settings.activeDIYThemeId);
        if (activeTheme && activeTheme.css) {
          Object.entries(activeTheme.css).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim()) {
              document.documentElement.style.setProperty(key, value);
            }
          });
        }
      }
    };
  }, [activeTab, editingTheme?.css, settings.activeDIYThemeId, settings.diyThemes]);

  const [selectedCategory, setSelectedCategory] = useState<string>('整体外观');
  const [previewTab, setPreviewTab] = useState<'desktop' | 'chat' | 'chatlist' | 'moments' | 'call' | 'pluspanel' | 'voicepanel' | 'photopanel' | 'transferpanel' | 'locationpanel'>('chat');
  const [chatScenario, setChatScenario] = useState<'all' | 'basic' | 'cards' | 'marriage' | 'invite'>('all');
  const [previewShowSchedule, setPreviewShowSchedule] = useState<boolean>(false);
  const [chatInputMode, setChatInputMode] = useState<'text' | 'voice'>('text');
  const [showChatPlusDrawer, setShowChatPlusDrawer] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [previewVoiceContent, setPreviewVoiceContent] = useState<string>('行，等会儿见！');
  const [previewVoiceDuration, setPreviewVoiceDuration] = useState<number>(4);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const [uploadTargetKey, setUploadTargetKey] = useState<string | null>(null);
  // 重命名主题弹窗状态
  const [renamingTheme, setRenamingTheme] = useState<{ id: string; name: string } | null>(null);
  // 恢复出厂设置确认弹窗
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  const handleConfirmResetFactory = () => {
    setShowResetConfirmModal(false);
    const defaultTheme = JSON.parse(JSON.stringify(DEFAULT_DIY_THEME));
    themes.forEach(t => {
      deleteThemeAssets(t.id).catch(err => console.warn('[ThemeAssetsDB] Delete failed:', err));
    });
    [document.documentElement, document.body].forEach(target => {
      for (let i = target.style.length - 1; i >= 0; i--) {
        const key = target.style[i];
        if (key && key.startsWith('--gg-')) {
          target.style.removeProperty(key);
        }
      }
    });
    onUpdateSettings({ diyThemes: [defaultTheme], activeDIYThemeId: defaultTheme.id, wallpaperUrl: '' });
    setEditingTheme(defaultTheme);
    setSelectedThemeId(defaultTheme.id);
    applyDIYThemeToDOM(defaultTheme, [defaultTheme]);
    triggerToast('🧹 已恢复出厂设置，所有自定义主题已删除。');
  };

  // Slice Editor State
  const [sliceEditorConfig, setSliceEditorConfig] = useState<{
    isOpen: boolean;
    bgKey: string;
    imageUrl: string;
    stretch: { top: number; bottom: number; left: number; right: number };
    content: { top: number; bottom: number; left: number; right: number };
    naturalWidth: number;
    naturalHeight: number;
  } | null>(null);
  const [draggingSlice, setDraggingSlice] = useState<'stretchTop'|'stretchBottom'|'stretchLeft'|'stretchRight'|'contentTop'|'contentBottom'|'contentLeft'|'contentRight'|null>(null);
  const sliceContainerRef = useRef<HTMLDivElement>(null);

  // Drag logic for Slice Editor
  useEffect(() => {
    if (!draggingSlice) return;

    const handleMove = (e: PointerEvent) => {
      if (!sliceContainerRef.current || !sliceEditorConfig) return;
      const rect = sliceContainerRef.current.getBoundingClientRect();
      const { naturalWidth, naturalHeight } = sliceEditorConfig;
      const scaleX = naturalWidth / rect.width;
      const scaleY = naturalHeight / rect.height;

      let y = e.clientY - rect.top;
      let x = e.clientX - rect.left;

      x = Math.max(0, Math.min(x, rect.width));
      y = Math.max(0, Math.min(y, rect.height));

      const natX = x * scaleX;
      const natY = y * scaleY;

      setSliceEditorConfig(prev => {
        if (!prev) return prev;
        const next = { ...prev, stretch: { ...prev.stretch }, content: { ...prev.content } };
        if (draggingSlice === 'stretchTop') next.stretch.top = Math.max(0, Math.min(natY, naturalHeight - prev.stretch.bottom - 4));
        if (draggingSlice === 'stretchBottom') next.stretch.bottom = Math.max(0, Math.min(naturalHeight - natY, naturalHeight - prev.stretch.top - 4));
        if (draggingSlice === 'stretchLeft') next.stretch.left = Math.max(0, Math.min(natX, naturalWidth - prev.stretch.right - 4));
        if (draggingSlice === 'stretchRight') next.stretch.right = Math.max(0, Math.min(naturalWidth - natX, naturalWidth - prev.stretch.left - 4));

        if (draggingSlice === 'contentTop') next.content.top = Math.max(0, Math.min(natY, naturalHeight - prev.content.bottom - 4));
        if (draggingSlice === 'contentBottom') next.content.bottom = Math.max(0, Math.min(naturalHeight - natY, naturalHeight - prev.content.top - 4));
        if (draggingSlice === 'contentLeft') next.content.left = Math.max(0, Math.min(natX, naturalWidth - prev.content.right - 4));
        if (draggingSlice === 'contentRight') next.content.right = Math.max(0, Math.min(naturalWidth - natX, naturalWidth - prev.content.left - 4));
        return next;
      });
    };
    const handleUp = () => setDraggingSlice(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingSlice, sliceEditorConfig]);

  const handleOpenSliceEditor = async (bgKey: string, imageUrl: string) => {
    // 解析图片尺寸与安全区，不再强制降采样缩放，保留高保真原图
    const dot9 = await parseDot9Image(imageUrl);
    const useUrl = dot9.croppedImageUrl || imageUrl;
    const w = dot9.naturalWidth;
    const h = dot9.naturalHeight;

    // 如果图片发生了等比缩放或裁切，同步写回 assets 确保全局统一
    if (dot9.croppedImageUrl && dot9.croppedImageUrl !== imageUrl) {
      setEditingTheme(prev => ({
        ...prev,
        assets: {
          ...prev.assets,
          [bgKey]: dot9.croppedImageUrl,
        }
      }));
    }

    const prefix = SPECIAL_BUBBLE_PREFIX_MAP[bgKey] || (bgKey === 'bubbleBgSelf' ? 'self' : 'other');

    const existingSliceTop = Number(editingTheme.css[`--gg-slice-top-${prefix}`]);
    const existingSliceBottom = Number(editingTheme.css[`--gg-slice-bottom-${prefix}`]);
    const existingSliceLeft = Number(editingTheme.css[`--gg-slice-left-${prefix}`]);
    const existingSliceRight = Number(editingTheme.css[`--gg-slice-right-${prefix}`]);

    const existingPadTop = Number(editingTheme.css[`--gg-padding-top-${prefix}`]);
    const existingPadBottom = Number(editingTheme.css[`--gg-padding-bottom-${prefix}`]);
    const existingPadLeft = Number(editingTheme.css[`--gg-padding-left-${prefix}`]);
    const existingPadRight = Number(editingTheme.css[`--gg-padding-right-${prefix}`]);

    // 避免旧的超大坐标越界
    const sTop = existingSliceTop > 0 && existingSliceTop < h ? existingSliceTop : dot9.stretch.top;
    const sBottom = existingSliceBottom > 0 && existingSliceBottom < h ? existingSliceBottom : dot9.stretch.bottom;
    const sLeft = existingSliceLeft > 0 && existingSliceLeft < w ? existingSliceLeft : dot9.stretch.left;
    const sRight = existingSliceRight > 0 && existingSliceRight < w ? existingSliceRight : dot9.stretch.right;

    const cTop = existingPadTop > 0 && existingPadTop < h ? existingPadTop : dot9.content.top;
    const cBottom = existingPadBottom > 0 && existingPadBottom < h ? existingPadBottom : dot9.content.bottom;
    const cLeft = existingPadLeft > 0 && existingPadLeft < w ? existingPadLeft : dot9.content.left;
    const cRight = existingPadRight > 0 && existingPadRight < w ? existingPadRight : dot9.content.right;

    setSliceEditorConfig({
      isOpen: true,
      bgKey,
      imageUrl: useUrl,
      naturalWidth: w,
      naturalHeight: h,
      stretch: {
        top: sTop,
        bottom: sBottom,
        left: sLeft,
        right: sRight,
      },
      content: {
        top: cTop,
        bottom: cBottom,
        left: cLeft,
        right: cRight,
      }
    });
  };

  const handleSaveSliceEditor = () => {
    if (!sliceEditorConfig) return;
    const prefix = SPECIAL_BUBBLE_PREFIX_MAP[sliceEditorConfig.bgKey] || (sliceEditorConfig.bgKey === 'bubbleBgSelf' ? 'self' : 'other');
    setEditingTheme(prev => ({
      ...prev,
      css: {
        ...prev.css,
        [`--gg-is-dot9-${sliceEditorConfig.bgKey}`]: 'true',
        [`--gg-slice-top-${prefix}`]: Math.round(sliceEditorConfig.stretch.top).toString(),
        [`--gg-slice-bottom-${prefix}`]: Math.round(sliceEditorConfig.stretch.bottom).toString(),
        [`--gg-slice-left-${prefix}`]: Math.round(sliceEditorConfig.stretch.left).toString(),
        [`--gg-slice-right-${prefix}`]: Math.round(sliceEditorConfig.stretch.right).toString(),
        [`--gg-padding-top-${prefix}`]: Math.round(sliceEditorConfig.content.top).toString(),
        [`--gg-padding-bottom-${prefix}`]: Math.round(sliceEditorConfig.content.bottom).toString(),
        [`--gg-padding-left-${prefix}`]: Math.round(sliceEditorConfig.content.left).toString(),
        [`--gg-padding-right-${prefix}`]: Math.round(sliceEditorConfig.content.right).toString(),
      }
    }));
    setSliceEditorConfig(null);
    triggerToast('✂️ 点九切片已保存生效');
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  // 应用主题到 DOM 全局
  const applyDIYThemeToDOM = (theme: DIYTheme, customThemesList?: DIYTheme[]) => {
    if (typeof document === 'undefined') return;
    const target = document.body;

    console.log('[DIYWorkshop] applyDIYThemeToDOM theme assets keys:', theme.id, Object.keys(theme.assets || {}));

    // 注入 CSS 变量
    Object.entries(theme.css || {}).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        target.style.setProperty(key, value);
      }
    });

    // 如果包含主屏幕桌面壁纸资产
    const effectiveHomeWallpaper = theme.assets?.homeWallpaper || theme.assets?.wallpaper;
    onUpdateSettings({
      ...(customThemesList ? { diyThemes: customThemesList } : {}),
      activeDIYThemeId: theme.id,
      ...(effectiveHomeWallpaper ? { wallpaperUrl: effectiveHomeWallpaper } : {})
    });

    triggerToast(`✨ 已应用主题【${theme.name}】`);
  };

  // 保存当前编辑的主题
  const handleSaveTheme = () => {
    console.log('[DIYWorkshop] handleSaveTheme editingTheme assets keys:', Object.keys(editingTheme?.assets || {}));
    if (themes[0]?.assets) {
      console.log('[DIYWorkshop] settings.diyThemes[0].assets keys:', Object.keys(themes[0].assets));
    }

    const updatedThemes = themes.map(t => t.id === editingTheme.id ? editingTheme : t);
    if (!updatedThemes.some(t => t.id === editingTheme.id)) {
      updatedThemes.push(editingTheme);
    }
    const effectiveHomeWallpaper = editingTheme.assets?.homeWallpaper || editingTheme.assets?.wallpaper;
    onUpdateSettings({
      diyThemes: updatedThemes.map(t => ({ ...t, assets: t.assets || {} })),
      activeDIYThemeId: editingTheme.id,
      ...(effectiveHomeWallpaper ? { wallpaperUrl: effectiveHomeWallpaper } : {})
    });
    applyDIYThemeToDOM(editingTheme, updatedThemes);
    triggerToast('💾 主题已保存并生效');
  };

  // 新建主题
  const handleCreateNewTheme = () => {
    const newId = `diy_theme_${Date.now()}`;
    const newTheme: DIYTheme = {
      ...JSON.parse(JSON.stringify(DEFAULT_DIY_THEME)),
      id: newId,
      name: `新主题 ${themes.length + 1}`,
      createdAt: Date.now()
    };
    const nextList = [...themes, newTheme];
    onUpdateSettings({ diyThemes: nextList });
    setEditingTheme(newTheme);
    setSelectedThemeId(newId);
    setActiveTab('editor');
    triggerToast('🎨 已创建全新主题');
  };

  // 删除主题
  const handleDeleteTheme = (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteThemeAssets(themeId).catch(err => console.warn('[ThemeAssetsDB] Delete failed:', err));
    const nextList = themes.filter(t => t.id !== themeId);

    if (nextList.length === 0) {
      const defaultTheme = JSON.parse(JSON.stringify(DEFAULT_DIY_THEME));
      onUpdateSettings({
        diyThemes: [defaultTheme],
        activeDIYThemeId: defaultTheme.id,
        wallpaperUrl: ''
      });
      setEditingTheme(defaultTheme);
      setSelectedThemeId(defaultTheme.id);
      applyDIYThemeToDOM(defaultTheme, [defaultTheme]);
      triggerToast('🗑️ 已删除主题，恢复为默认主题');
      return;
    }

    const nextActive = settings.activeDIYThemeId === themeId ? nextList[0].id : settings.activeDIYThemeId;
    onUpdateSettings({
      diyThemes: nextList.map(t => ({ ...t, assets: t.assets || {} })),
      activeDIYThemeId: nextActive
    });
    if (editingTheme.id === themeId) {
      const targetTheme = nextList.find(t => t.id === nextActive) || nextList[0];
      setEditingTheme(targetTheme);
      setSelectedThemeId(targetTheme.id);
      applyDIYThemeToDOM(targetTheme, nextList);
    }
    triggerToast('🗑️ 主题已删除');
  };

  // 确认修改主题名称
  const handleConfirmRename = () => {
    if (!renamingTheme || !renamingTheme.name.trim()) return;
    const newName = renamingTheme.name.trim();
    const nextList = themes.map(t => t.id === renamingTheme.id ? { ...t, name: newName } : t);
    onUpdateSettings({ diyThemes: nextList.map(t => ({ ...t, assets: t.assets || {} })) });
    if (editingTheme.id === renamingTheme.id) {
      setEditingTheme(prev => ({ ...prev, name: newName }));
    }
    triggerToast(`✏️ 主题已重命名为【${newName}】`);
    setRenamingTheme(null);
  };

  // 导出 JSON
  const handleExportJSON = async (theme: DIYTheme, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const dbAssets = await loadThemeAssets(theme.id).catch(() => null);
      const fullAssets = {
        ...(theme.assets || {}),
        ...(dbAssets || {})
      };
      const exportData = {
        name: theme.name || '我的DIY主题',
        version: theme.version || '1.0.0',
        author: theme.author || 'AI Studio',
        description: theme.description || '',
        css: theme.css || {},
        assets: fullAssets,
        createdAt: theme.createdAt || Date.now(),
        exportedAt: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const safeName = (theme.name || 'diy_theme').replace(/[/\\?%*:|"<>]/g, '_');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `${safeName}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      triggerToast(`📥 已导出【${theme.name || '主题'}】JSON文件`);
    } catch (err) {
      console.error(err);
      triggerToast('❌ 导出主题失败');
    }
  };

  // 导入 JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let raw = JSON.parse(event.target?.result as string);
        if (!raw) {
          triggerToast('❌ 无效的主题文件');
          return;
        }

        // Support array of themes or wrapped object
        if (Array.isArray(raw)) {
          raw = raw[0];
        } else if (raw.theme) {
          raw = raw.theme;
        } else if (raw.data) {
          raw = raw.data;
        }

        if (typeof raw !== 'object' || (!raw.name && !raw.css && !raw.assets)) {
          triggerToast('❌ 无效的主题文件格式');
          return;
        }

        const rawCss = raw.css || raw.styles || raw.variables || {};
        const rawAssets = raw.assets || {};

        // Merge assets flexibly (handling both standard and legacy/alternate keys)
        const mergedAssets: Record<string, any> = {
          ...DEFAULT_DIY_THEME.assets,
          ...rawAssets,
          ...(raw.homeWallpaper ? { homeWallpaper: raw.homeWallpaper } : {}),
          ...(raw.wallpaper ? { wallpaper: raw.wallpaper } : {}),
          ...(raw.chatBg ? { chatBg: raw.chatBg } : {}),
          ...(raw.chatWallpaper ? { chatWallpaper: raw.chatWallpaper } : {}),
          ...(raw.chatlistBg ? { chatlistBg: raw.chatlistBg } : {}),
          ...(raw.wechatBg ? { wechatBg: raw.wechatBg } : {}),
          ...(raw.bubbleBgSelf ? { bubbleBgSelf: raw.bubbleBgSelf } : {}),
          ...(raw.bubbleBgOther ? { bubbleBgOther: raw.bubbleBgOther } : {}),
          ...(raw.bubbleDecorSelf ? { bubbleDecorSelf: raw.bubbleDecorSelf } : {}),
          ...(raw.bubbleDecorOther ? { bubbleDecorOther: raw.bubbleDecorOther } : {}),
        };

        if (!mergedAssets.homeWallpaper && mergedAssets.wallpaper) {
          mergedAssets.homeWallpaper = mergedAssets.wallpaper;
        }
        if (!mergedAssets.wallpaper && mergedAssets.homeWallpaper) {
          mergedAssets.wallpaper = mergedAssets.homeWallpaper;
        }
        if (!mergedAssets.chatBg && mergedAssets.chatWallpaper) {
          mergedAssets.chatBg = mergedAssets.chatWallpaper;
        }
        if (!mergedAssets.chatlistBg && mergedAssets.wechatBg) {
          mergedAssets.chatlistBg = mergedAssets.wechatBg;
        }

        const newThemeId = `diy_import_${Date.now()}`;
        await saveThemeAssets(newThemeId, mergedAssets);

        const importedTheme: DIYTheme = {
          ...JSON.parse(JSON.stringify(DEFAULT_DIY_THEME)),
          ...raw,
          id: newThemeId,
          name: raw.name ? `${raw.name}` : `导入主题 ${themes.length + 1}`,
          css: {
            ...DEFAULT_DIY_THEME.css,
            ...rawCss
          },
          assets: mergedAssets,
          createdAt: Date.now()
        };

        const themeForStorage = { ...importedTheme, assets: {} };
        const nextList = [...themes.filter(t => t.id !== importedTheme.id), themeForStorage];

        // Apply immediately to DOM and sync settings atomically
        applyDIYThemeToDOM(importedTheme, nextList);

        setEditingTheme(importedTheme);
        setSelectedThemeId(importedTheme.id);
        setActiveTab('editor');

        triggerToast(`🎉 成功导入并生效【${importedTheme.name}】`);
      } catch (err) {
        console.error(err);
        triggerToast('❌ 解析主题 JSON 失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 图片上传处理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetKey) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result as string;

      // 1. 如果是壁纸类（桌面壁纸、私聊壁纸、微信列表壁纸）
      const isWallpaperKey = ['homeWallpaper', 'wallpaper', 'chatBg', 'chatWallpaper', 'chatlistBg', 'wechatBg'].includes(uploadTargetKey);
      if (isWallpaperKey) {
        setEditingTheme(prev => {
          const nextAssets = { ...prev.assets, [uploadTargetKey]: base64 };
          if (uploadTargetKey === 'homeWallpaper' || uploadTargetKey === 'wallpaper') {
            nextAssets.homeWallpaper = base64;
            nextAssets.wallpaper = base64;
          } else if (uploadTargetKey === 'chatBg' || uploadTargetKey === 'chatWallpaper') {
            nextAssets.chatBg = base64;
            nextAssets.chatWallpaper = base64;
          } else if (uploadTargetKey === 'chatlistBg' || uploadTargetKey === 'wechatBg') {
            nextAssets.chatlistBg = base64;
            nextAssets.wechatBg = base64;
          }
          return {
            ...prev,
            assets: nextAssets,
            css: {
              ...prev.css,
              [`--gg-is-dot9-${uploadTargetKey}`]: 'false'
            }
          };
        });
        triggerToast('🖼️ 壁纸已更换并平铺生效！');
        return;
      }

      // 2. 气泡与控件类切片处理
      const prefix = SPECIAL_BUBBLE_PREFIX_MAP[uploadTargetKey] || (uploadTargetKey === 'bubbleBgSelf' ? 'self' : uploadTargetKey === 'bubbleBgOther' ? 'other' : '');
      const isBubbleKey = !!prefix;

      if (isBubbleKey) {
        let dot9Result;
        try {
          dot9Result = await parseDot9Image(base64);
        } catch {
          dot9Result = { isDot9: false, croppedImageUrl: base64, stretch: { top: 10, bottom: 10, left: 10, right: 10 }, content: { top: 10, bottom: 10, left: 10, right: 10 } };
        }

        if (dot9Result.isDot9) {
          // 成功识别 .9.png，已裁切 1px 黑色导轨边框，保留内部原图与精确切片
          setEditingTheme(prev => ({
            ...prev,
            assets: {
              ...prev.assets,
              [uploadTargetKey]: dot9Result.croppedImageUrl
            },
            css: {
              ...prev.css,
              [`--gg-is-dot9-${uploadTargetKey}`]: 'true',
              [`--gg-slice-top-${prefix}`]: Math.round(dot9Result.stretch.top).toString(),
              [`--gg-slice-bottom-${prefix}`]: Math.round(dot9Result.stretch.bottom).toString(),
              [`--gg-slice-left-${prefix}`]: Math.round(dot9Result.stretch.left).toString(),
              [`--gg-slice-right-${prefix}`]: Math.round(dot9Result.stretch.right).toString(),
              [`--gg-padding-top-${prefix}`]: Math.round(dot9Result.content.top).toString(),
              [`--gg-padding-bottom-${prefix}`]: Math.round(dot9Result.content.bottom).toString(),
              [`--gg-padding-left-${prefix}`]: Math.round(dot9Result.content.left).toString(),
              [`--gg-padding-right-${prefix}`]: Math.round(dot9Result.content.right).toString(),
            }
          }));
          triggerToast('🎉 成功识别点九图！已自动提取拉伸线与文字安全区');
        } else {
          // 普通图片，保存并根据需要打开切片编辑器
          setEditingTheme(prev => ({
            ...prev,
            assets: {
              ...prev.assets,
              [uploadTargetKey]: dot9Result.croppedImageUrl
            },
            css: {
              ...prev.css,
              [`--gg-is-dot9-${uploadTargetKey}`]: 'false',
              [`--gg-slice-top-${prefix}`]: Math.round(dot9Result.stretch.top).toString(),
              [`--gg-slice-bottom-${prefix}`]: Math.round(dot9Result.stretch.bottom).toString(),
              [`--gg-slice-left-${prefix}`]: Math.round(dot9Result.stretch.left).toString(),
              [`--gg-slice-right-${prefix}`]: Math.round(dot9Result.stretch.right).toString(),
              [`--gg-padding-top-${prefix}`]: Math.round(dot9Result.content.top).toString(),
              [`--gg-padding-bottom-${prefix}`]: Math.round(dot9Result.content.bottom).toString(),
              [`--gg-padding-left-${prefix}`]: Math.round(dot9Result.content.left).toString(),
              [`--gg-padding-right-${prefix}`]: Math.round(dot9Result.content.right).toString(),
            }
          }));
          triggerToast('🖼️ 气泡背景已载入');
          if (uploadTargetKey.startsWith('bubbleBg')) {
            handleOpenSliceEditor(uploadTargetKey, dot9Result.croppedImageUrl);
          }
        }
      } else {
        let finalImg = base64;
        try {
          const dot9Res = await parseDot9Image(base64);
          if (dot9Res.isDot9) {
            finalImg = dot9Res.croppedImageUrl;
          }
        } catch {
          // fallback
        }

        setEditingTheme(prev => ({
          ...prev,
          assets: {
            ...prev.assets,
            [uploadTargetKey]: finalImg
          },
          css: {
            ...prev.css,
            [`--gg-is-dot9-${uploadTargetKey}`]: 'false'
          }
        }));
        triggerToast('🖼️ 贴图上传成功！');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 演示假数据
  const demoFriend = contacts.find(c => !c.isGroup && !c.isAssistant) || contacts[0] || {
    id: 'demo',
    name: '心动好友',
    remark: '星河',
    avatar: ''
  };

  return (
    <div
      className="rococo-theme flex flex-col h-full select-none overflow-hidden relative"
      style={{
        backgroundColor: 'var(--app-bg, #fdf6f0)',
        color: 'var(--app-text, #6b4a52)'
      }}
    >
      {/* 隐藏的图片与 JSON 上传 Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,.9.png,application/octet-stream"
        className="hidden"
      />
      <input
        type="file"
        ref={jsonImportRef}
        onChange={handleImportJSON}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Toast */}
      {showToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-stone-900/90 text-white text-xs font-medium shadow-xl backdrop-blur-md animate-in fade-in zoom-in duration-200">
          {showToast}
        </div>
      )}

      {/* 顶部导航栏 (与主题商店统一洛可可玫瑰香槟色调) */}
      <div className="h-12 px-3.5 bg-gradient-to-r from-[#f2cbd0] to-[#ecd3c2] border-b border-[#e3b8bc] flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-1 min-w-0 flex-1 mr-2">
          <button
            onClick={() => {
              if (activeTab === 'editor') {
                setActiveTab('list');
              } else {
                onReturnToDesktop();
              }
            }}
            className="p-1.5 -ml-1 rounded-full hover:bg-white/40 active:scale-90 transition-transform cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-[#593c3f]" />
          </button>
          {activeTab === 'editor' ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[#d9828b] to-[#c7727b] flex items-center justify-center shadow-2xs shrink-0">
                <DiyWorkshopIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-center gap-1 min-w-0 group/title flex-1">
                <input
                  type="text"
                  value={editingTheme.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setEditingTheme(prev => ({ ...prev, name: newName }));
                  }}
                  placeholder="主题名称"
                  className="font-bold text-xs tracking-tight text-[#593c3f] bg-white/80 hover:bg-white focus:bg-white px-1.5 py-0.5 rounded-md border border-[#e3b8bc] focus:border-[#d9828b] focus:outline-none transition-all w-16 sm:w-24 truncate"
                  title="点击直接修改主题名称"
                />
                <Pencil className="w-3 h-3 text-[#8c6f72] group-hover/title:text-[#b85c67] shrink-0 pointer-events-none hidden sm:block" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[#d9828b] to-[#c7727b] flex items-center justify-center shadow-2xs">
                <DiyWorkshopIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight text-[#593c3f] font-serif">
                DIY 主题工坊
              </span>
            </div>
          )}
        </div>

        {activeTab === 'editor' ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleExportJSON(editingTheme)}
              className="p-1.5 rounded-md bg-[#f5ede4] hover:bg-[#ebd2cb] text-[#593c3f] cursor-pointer active:scale-95 transition-all shrink-0 border border-[#ebd2cb]"
              title="导出当前主题"
            >
              <Download className="w-3.5 h-3.5 text-[#b85c67] shrink-0" />
            </button>
            <button
              onClick={() => jsonImportRef.current?.click()}
              className="p-1.5 rounded-md bg-[#f5ede4] hover:bg-[#ebd2cb] text-[#593c3f] cursor-pointer active:scale-95 transition-all shrink-0 border border-[#ebd2cb]"
              title="导入主题"
            >
              <Upload className="w-3.5 h-3.5 text-[#b85c67] shrink-0" />
            </button>
            <button
              onClick={handleSaveTheme}
              className="px-2 py-1 rounded-md bg-[#f5ede4] hover:bg-[#ebd2cb] text-[#593c3f] text-[11px] font-semibold cursor-pointer active:scale-95 transition-all shrink-0 border border-[#ebd2cb]"
            >
              保存
            </button>
            <button
              onClick={() => {
                handleSaveTheme();
                applyDIYThemeToDOM(editingTheme);
              }}
              className="px-2 py-1 rounded-md bg-gradient-to-r from-[#d9828b] to-[#c7727b] hover:from-[#c7727b] hover:to-[#b5616a] text-white text-[11px] font-semibold shadow-2xs flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shrink-0 border border-[#b5616a]"
            >
              <Check className="w-3 h-3 shrink-0" />
              <span>应用</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => jsonImportRef.current?.click()}
              className="px-2 py-1 rounded-lg bg-[#f5ede4] hover:bg-[#ebd2cb] text-[#593c3f] text-[11px] font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-all border border-[#ebd2cb]"
              title="导入主题 JSON"
            >
              <Upload className="w-3.5 h-3.5 text-[#b85c67]" />
              <span>导入</span>
            </button>
            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="px-2 py-1 rounded-lg bg-[#fdf2f2] hover:bg-[#fae6e6] text-[#b85b5b] text-[11px] font-semibold shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all border border-[#f0c8c8]"
              title="恢复出厂设置"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
            <button
              onClick={handleCreateNewTheme}
              className="px-2 py-1 rounded-lg bg-gradient-to-r from-[#d9828b] to-[#c7727b] hover:from-[#c7727b] hover:to-[#b5616a] text-white text-[11px] font-semibold shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all border border-[#b5616a]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建</span>
            </button>
          </div>
        )}
      </div>

      {/* 视图分流：主题列表 VS 可视化编辑器 */}
      {activeTab === 'list' ? (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#fcf8f2]">
          <div className="p-3 bg-[#f5ede4] rounded-2xl border border-[#ebd2cb] flex items-center justify-between shadow-2xs">
            <div>
              <h4 className="text-xs font-bold text-[#593c3f] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#b85c67]" />
                个性化全域换肤
              </h4>
              <p className="text-[10px] text-[#7a585c] mt-0.5">
                实时调节气泡、导航栏、输入框、转账及各种贴图与壁纸
              </p>
            </div>
          </div>

          {/* 主题商店 Banner 入口 (与主题商店洛可可色调深度呼应) */}
          <div className="p-3.5 bg-gradient-to-r from-[#fae8eb] to-[#f7eedf] rounded-2xl text-[#4a3b3d] border border-[#e8cbd0] shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-[#593c3f] flex items-center gap-1.5 font-serif">
                <Store className="w-4 h-4 text-[#b85c67]" />
                主题商店
              </h4>
              <p className="text-[10px] text-[#7a585c] flex items-center gap-1">
                <span>官方精选全域皮肤</span>
                <span className="opacity-60">•</span>
                <span className="font-mono font-bold text-[#b85c67] flex items-center gap-0.5">
                  <BreadIcon className="w-3 h-3 text-[#b85c67]" />
                  <span>{breadBalance} 面包</span>
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsStoreOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#d9828b] to-[#c7727b] hover:from-[#c7727b] hover:to-[#b5616a] text-white font-semibold text-xs rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0 border border-[#b5616a]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              逛商店
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-[#8c6f72] px-1">我的 DIY 主题库 ({themes.length})</div>
            {themes.map((theme) => {
              const isActive = settings.activeDIYThemeId === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    setEditingTheme(JSON.parse(JSON.stringify(theme)));
                    setSelectedThemeId(theme.id);
                    setActiveTab('editor');
                  }}
                  className={`p-3 bg-[#fffdfa] rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-[#d4979e] relative group ${
                    isActive ? 'border-[#d9828b] ring-2 ring-[#d9828b]/20 bg-[#fdf7f7]' : 'border-[#ecdcd9]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#593c3f] truncate font-serif">
                          {theme.name || '未命名主题'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingTheme({ id: theme.id, name: theme.name || '' });
                          }}
                          className="p-1 rounded-md text-[#8c6f72] hover:text-[#b85c67] hover:bg-[#f5ede4] transition-colors"
                          title="修改主题名称"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#d9828b] text-white border border-[#c7727b] text-[9px] font-semibold">
                            使用中
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#7a585c] mt-1 line-clamp-1">
                        {theme.description || '自定义色彩与视觉规范'}
                      </p>
                    </div>

                    {/* 调色板简要色块预览 */}
                    <div className="flex items-center gap-1 shrink-0 p-1 bg-[#f5ede4]/60 rounded-lg border border-[#ebd2cb]">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: theme.css?.['--gg-accent-color'] || '#d9828b' }}
                        title="强调色"
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: theme.css?.['--gg-bubble-self'] || '#fce8ea' }}
                        title="气泡色"
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: theme.css?.['--gg-header-bg'] || '#f5ede4' }}
                        title="导航栏"
                      />
                    </div>
                  </div>

                  {/* 快捷操作栏 */}
                  <div className="mt-3 pt-2.5 border-t border-[#ecdcd9]/60 flex items-center justify-between">
                    <span className="text-[9px] text-[#8c6f72] font-mono">
                      {new Date(theme.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingTheme({ id: theme.id, name: theme.name || '' });
                        }}
                        className="p-1 rounded-md text-[#8c6f72] hover:text-[#b85c67] hover:bg-[#f5ede4] transition-colors cursor-pointer"
                        title="修改主题名称"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleExportJSON(theme, e)}
                        className="p-1 rounded-md text-[#8c6f72] hover:text-[#593c3f] hover:bg-[#f5ede4] transition-colors cursor-pointer"
                        title="导出 JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTheme(theme.id, e)}
                        className="p-1 rounded-md text-[#8c6f72] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="删除主题"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          applyDIYThemeToDOM(theme, themes);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                          isActive
                            ? 'bg-[#d9828b] text-white border border-[#c7727b]'
                            : 'bg-gradient-to-r from-[#d9828b] to-[#c7727b] hover:from-[#c7727b] hover:to-[#b5616a] text-white shadow-2xs border border-[#b5616a]'
                        }`}
                      >
                        {isActive ? '已应用' : '应用'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 可视化编辑器界面 (左右分栏 / 手机预览 + 分类编辑区) */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 上半部：迷你手机交互式实时预览（紧凑短屏 + 内部自由滚动） */}
          <div className="bg-stone-900/95 py-2 px-2.5 sm:px-3 flex flex-col items-center justify-center shrink-0 border-b border-stone-800 shadow-inner">
            {/* 顶栏控制区：紧凑式布局 */}
            <div className="flex flex-col gap-1 w-full max-w-[310px] mb-1.5 text-white">
              <div className="flex items-center justify-between text-[10px] px-0.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Eye className="w-3.5 h-3.5 text-[#d9828b]" />
                  <span>实时预览</span>
                  <span className="text-[8px] text-stone-400 font-normal">（可滑动查看全貌）</span>
                </div>
                <span className="text-[8.5px] text-[#f2cbd0] bg-[#4a3b3d]/90 px-1.5 py-0.5 rounded border border-[#e3b8bc]/40 font-serif">
                  {previewTab === 'desktop' ? '📱 手机桌面' :
                   previewTab === 'chat' ? '💬 聊天私聊' :
                   previewTab === 'chatlist' ? '📋 聊天列表' :
                   previewTab === 'moments' ? '🌸 朋友圈' :
                   previewTab === 'call' ? '📞 语音通话' :
                   previewTab === 'pluspanel' ? '➕ 拓展抽屉' :
                   previewTab === 'voicepanel' ? '🎙️ 发送语音' :
                   previewTab === 'photopanel' ? '📷 拍照描述' :
                   previewTab === 'transferpanel' ? '💰 微信转账' : '📍 发送定位'}
                </span>
              </div>
              <div className="w-full flex items-center gap-1 bg-stone-800/95 rounded-xl p-0.5 border border-stone-700/80 shadow-md overflow-x-auto scrollbar-none">
                {[
                  { id: 'desktop', label: '📱 桌面' },
                  { id: 'chat', label: '💬 聊天' },
                  { id: 'chatlist', label: '📋 列表' },
                  { id: 'moments', label: '🌸 朋友圈' },
                  { id: 'call', label: '📞 通话' },
                  { id: 'pluspanel', label: '➕ 菜单' },
                  { id: 'voicepanel', label: '🎙️ 语音' },
                  { id: 'photopanel', label: '📷 拍照' },
                  { id: 'transferpanel', label: '💰 转账' },
                  { id: 'locationpanel', label: '📍 定位' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setPreviewTab(tab.id as any);
                      if (tab.id === 'pluspanel') setShowChatPlusDrawer(true);
                    }}
                    className={`px-1.5 py-1 rounded-lg text-[8px] font-medium transition-all cursor-pointer text-center flex items-center justify-center whitespace-nowrap shrink-0 ${
                      previewTab === tab.id ? 'bg-gradient-to-r from-[#d9828b] to-[#c7727b] text-white font-bold shadow-xs' : 'text-stone-300 hover:text-white hover:bg-stone-700/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 迷你手机模型 */}
            <div
              className="w-full max-w-[290px] rounded-2xl p-1.5 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all"
              style={{
                backgroundColor: editingTheme.css['--gg-shell-bg'] || '#000000',
                color: editingTheme.css['--gg-text-primary'] || '#1c1917',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {/* 手机内部屏幕：紧凑高度 195px，内容可滚动 */}
              <div
                className="w-full h-[195px] rounded-xl overflow-y-auto scrollbar-none flex flex-col relative bg-cover bg-center shadow-inner text-xs select-none"
                style={{
                  backgroundColor: editingTheme.css['--gg-page-bg'] || editingTheme.css['--gg-moments-feed-bg'] || '#f3f4f6',
                }}
              >
                {/* 1. 导航栏 (Header) - 桌面视图下不展示微信顶栏 */}
                {previewTab !== 'desktop' && (
                  <div
                    className={`h-11 px-3 flex items-center justify-between ${editingTheme.assets?.headerBg ? 'border-b-0 shadow-none' : 'border-b border-black/5 shadow-2xs'} shrink-0 select-none relative overflow-hidden`}
                    style={{
                      backgroundColor: editingTheme.assets?.headerBg ? 'transparent' : (editingTheme.css['--gg-header-bg'] || '#ffffff'),
                      color: editingTheme.css['--gg-header-text'] || editingTheme.css['--gg-text-primary'] || '#111827',
                      border: editingTheme.assets?.headerBg ? 'none' : undefined,
                      borderBottom: editingTheme.assets?.headerBg ? 'none' : undefined,
                      boxShadow: editingTheme.assets?.headerBg ? 'none' : undefined,
                    }}
                  >
                    {editingTheme.assets?.headerBg && (
                      <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={getBubbleBgStyle({
                          isUser: false,
                          prefix: 'header',
                          editingTheme,
                          bubbleBgUrl: editingTheme.assets.headerBg,
                          isDot9: editingTheme.css?.['--gg-is-dot9-headerBg'] !== 'false',
                        })}
                      />
                    )}
                    <div className="relative z-10 flex items-center justify-between w-full h-full my-auto">
                    {previewTab === 'chat' && (
                    <>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('chatlist')}
                          className="flex items-center gap-0.5 min-w-0 cursor-pointer active:scale-90 transition-transform"
                          title="点击返回聊天列表"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="font-bold text-[9.5px] truncate max-w-[80px]" style={{ color: editingTheme.css['--gg-header-text'] || editingTheme.css['--gg-text-primary'] || '#111827' }}>
                            {demoFriend.remark || demoFriend.name}
                          </span>
                        </button>
                        {/* 顶栏查看行程按钮（支持点九及样式自定义） */}
                        <button
                          type="button"
                          onClick={() => setPreviewShowSchedule(prev => !prev)}
                          className="h-5 px-1.5 rounded-full border text-[8px] font-medium flex items-center gap-0.5 cursor-pointer active:scale-90 transition-transform relative overflow-hidden shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: editingTheme.assets?.scheduleBtnBg ? 'transparent' : (editingTheme.css['--gg-schedule-btn-bg'] || 'rgba(0, 0, 0, 0.05)'),
                            borderColor: editingTheme.assets?.scheduleBtnBg ? 'transparent' : (editingTheme.css['--gg-schedule-btn-border'] || 'rgba(0, 0, 0, 0.1)'),
                            color: editingTheme.css['--gg-schedule-btn-text'] || editingTheme.css['--gg-header-text'] || '#4b5563',
                          }}
                          title="点击预览今日行程小弹窗"
                        >
                          {editingTheme.assets?.scheduleBtnBg && (
                            <div
                              className="absolute inset-0 pointer-events-none z-0"
                              style={getBubbleBgStyle({
                                isUser: false,
                                prefix: 'scheduleBtn',
                                editingTheme,
                                bubbleBgUrl: editingTheme.assets.scheduleBtnBg,
                                isDot9: editingTheme.css?.['--gg-is-dot9-scheduleBtnBg'] !== 'false',
                              })}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-0.5">
                            {editingTheme.assets?.scheduleBtnIcon ? (
                              <img src={editingTheme.assets.scheduleBtnIcon} alt="schedule" className="w-2.5 h-2.5 object-contain" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            )}
                            <span className="leading-none">行程</span>
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('call')}
                          className="cursor-pointer active:scale-90 transition-transform p-0.5 hover:bg-black/5 rounded"
                          title="发起语音通话"
                        >
                          <Phone className="w-3 h-3 opacity-75 hover:opacity-100" />
                        </button>
                        <div className="flex items-center gap-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: editingTheme.css['--gg-accent-color'] || '#10b981' }}
                          />
                          <span className="text-[7.5px]" style={{ color: editingTheme.css['--gg-text-secondary'] || '#6b7280' }}>
                            在线
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {previewTab === 'chatlist' && (
                    <>
                      <span className="font-bold text-[10px]" style={{ color: editingTheme.css['--gg-header-text'] || editingTheme.css['--gg-text-primary'] || '#111827' }}>
                        微信 (3)
                      </span>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <Search className="w-3 h-3 cursor-pointer" />
                        <Plus className="w-3 h-3 cursor-pointer" onClick={() => setPreviewTab('chat')} />
                      </div>
                    </>
                  )}

                  {previewTab === 'moments' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chatlist')}
                        className="flex items-center gap-0.5 cursor-pointer active:scale-90 transition-transform"
                        title="点击返回聊天列表"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 opacity-70" />
                        <span className="font-bold text-[10px]" style={{ color: editingTheme.css['--gg-header-text'] || editingTheme.css['--gg-text-primary'] || '#111827' }}>
                          朋友圈
                        </span>
                      </button>
                      <Camera className="w-3 h-3 opacity-80 cursor-pointer" />
                    </>
                  )}

                  {previewTab === 'call' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chat')}
                        className="flex items-center gap-0.5 cursor-pointer active:scale-90 transition-transform"
                        title="返回聊天"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 opacity-70" />
                        <span className="font-bold text-[9.5px]" style={{ color: editingTheme.css['--gg-header-text'] || editingTheme.css['--gg-text-primary'] || '#111827' }}>
                          语音通话中
                        </span>
                      </button>
                      <span className="text-[7.5px] opacity-70 font-mono">02:15</span>
                    </>
                  )}

                  {previewTab === 'pluspanel' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chat')}
                        className="flex items-center gap-0.5 cursor-pointer active:scale-90 transition-transform"
                        title="返回聊天"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 opacity-70" />
                        <span className="font-bold text-[9.5px]" style={{ color: editingTheme.css['--gg-header-text'] || editingTheme.css['--gg-text-primary'] || '#111827' }}>
                          加号功能抽屉
                        </span>
                      </button>
                      <span className="text-[7.5px] opacity-70">效果预览</span>
                    </>
                  )}

                  {previewTab === 'voicepanel' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chat')}
                        className="flex items-center gap-0.5 cursor-pointer active:scale-90 transition-transform"
                        title="返回聊天"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 opacity-70" />
                        <span className="font-bold text-[9.5px]" style={{ color: editingTheme.css['--gg-header-text'] || editingTheme.css['--gg-text-primary'] || '#111827' }}>
                          语音录音面板
                        </span>
                      </button>
                      <span className="text-[7.5px] opacity-70">效果预览</span>
                    </>
                  )}
                  </div>
                </div>
                )}

                {/* 2. 主体视图展示 */}

                {/* Tab 0: 手机桌面主屏幕 (Desktop View) */}
                {previewTab === 'desktop' && (
                  <div
                    className="flex-1 flex flex-col justify-between p-3 relative overflow-hidden bg-cover bg-center"
                    style={{
                      backgroundImage: (editingTheme.assets?.homeWallpaper || editingTheme.assets?.wallpaper)
                        ? `url('${editingTheme.assets.homeWallpaper || editingTheme.assets.wallpaper}')`
                        : undefined,
                      backgroundColor: '#000000'
                    }}
                  >
                    {/* 桌面时钟组件 */}
                    <div className="flex flex-col items-center justify-center pt-1 text-white drop-shadow-md select-none">
                      <div className="text-2xl font-extralight tracking-tight">09:41</div>
                      <div className="text-[8px] font-medium opacity-90">9月11日 星期五</div>
                    </div>

                    {/* 1. Top Section: User Profile & Dynamic Update Module */}
                    <div className="space-y-1.5 my-auto">
                      {/* Top User Profile Bar */}
                      <div className="flex items-center gap-2.5 p-2 rounded-xl shadow-sm bg-black/30 backdrop-blur-xl border border-white/15">
                        <Avatar
                          src={settings.userAvatar}
                          className="w-8 h-8 rounded-full border-2 border-white/80 shadow-md shrink-0"
                          size={16}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs tracking-tight truncate">
                              {settings.userNickname}
                            </span>
                            <span className="text-[7.5px] px-1 py-0.2 rounded-full font-medium" style={{ backgroundColor: 'var(--gg-online-badge-bg, #10b981)', color: 'var(--gg-online-badge-text, #ffffff)' }}>
                              在线
                            </span>
                          </div>
                          <p className="text-[8.5px] text-white/80 truncate mt-0.5">
                            {settings.userSignature || '心向远方，随时出发'}
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Update Module (Notification Message Card) */}
                      <div className="rounded-xl bg-black/40 backdrop-blur-2xl border border-white/20 p-2 shadow-xl transition-all text-[8.5px]">
                        {/* Header Switcher */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[8px]">
                          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-md">
                            <button
                              type="button"
                              onClick={() => setPreviewUpdateType('takeaway')}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[7.5px] font-medium transition-all cursor-pointer ${
                                previewUpdateType === 'takeaway'
                                  ? 'font-bold shadow-xs'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                              style={previewUpdateType === 'takeaway' ? { backgroundColor: 'var(--gg-warning-color, #fbbf24)', color: 'var(--gg-accent-text, #000000)' } : undefined}
                            >
                              <span>外卖消息</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewUpdateType('wechat')}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[7.5px] font-medium transition-all cursor-pointer ${
                                previewUpdateType === 'wechat'
                                  ? 'font-bold shadow-xs'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                              style={previewUpdateType === 'wechat' ? { backgroundColor: 'var(--gg-success-color, #10b981)', color: 'var(--gg-accent-text, #ffffff)' } : undefined}
                            >
                              <span>微信消息</span>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--gg-danger-color, #f87171)' }} />
                            </button>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="pt-1.5">
                          {previewUpdateType === 'takeaway' ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--gg-delivery-badge-bg, rgba(16, 185, 129, 0.3))', color: 'var(--gg-delivery-badge-text, #34d399)', border: '1px solid var(--gg-delivery-badge-bg)' }}>
                                  美团专送
                                </span>
                                <div>
                                  <div className="font-bold text-white/95">麦当劳</div>
                                  <div className="text-[7px] text-white/80">距离您还有 500米 (约 8分钟)</div>
                                </div>
                              </div>
                              <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--gg-warning-color, #fbbf24)', color: '#000000' }}>
                                配送中
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Avatar src={demoFriend.avatar} className="w-6 h-6 rounded-md shadow-2xs" size={12} />
                                <div>
                                  <div className="font-bold text-white/95">{demoFriend.remark || demoFriend.name}</div>
                                  <div className="text-[7px] text-white/80 truncate">喜欢就好，随时随地换肤~ 💕</div>
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded text-[7px] font-bold" style={{ backgroundColor: 'var(--gg-danger-color, #f87171)', color: '#ffffff' }}>
                                3条新消息
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 桌面应用图标网格 */}
                    <div className="grid grid-cols-4 gap-2 px-1 select-none">
                      {/* 微信 */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chatlist')}
                        className="flex flex-col items-center gap-1 cursor-pointer group active:scale-95 transition-transform"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#07c160] to-[#2bd97b] flex items-center justify-center shadow-md relative">
                          <MessageSquare className="w-4 h-4 text-white" />
                          <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] rounded-full text-white text-[7px] font-bold flex items-center justify-center border border-white" style={{ backgroundColor: 'var(--gg-danger-color, #f87171)' }}>
                            3
                          </span>
                        </div>
                        <span className="text-[7.5px] text-white font-medium drop-shadow-sm truncate">微信</span>
                      </button>

                      {/* 朋友圈 */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('moments')}
                        className="flex flex-col items-center gap-1 cursor-pointer group active:scale-95 transition-transform"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-md">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[7.5px] text-white font-medium drop-shadow-sm truncate">朋友圈</span>
                      </button>

                      {/* 语音通话 */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('call')}
                        className="flex flex-col items-center gap-1 cursor-pointer group active:scale-95 transition-transform"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
                          <Phone className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[7.5px] text-white font-medium drop-shadow-sm truncate">通话</span>
                      </button>

                      {/* 主题工坊 */}
                      <button
                        type="button"
                        className="flex flex-col items-center gap-1 cursor-pointer group active:scale-95 transition-transform"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#d9828b] to-[#c7727b] flex items-center justify-center shadow-md">
                          <Palette className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[7.5px] text-white font-medium drop-shadow-sm truncate">工坊</span>
                      </button>
                    </div>

                    {/* 底部 Dock 栏 */}
                    <div className="w-full bg-white/25 backdrop-blur-md rounded-2xl p-1.5 flex items-center justify-around shadow-lg border border-white/20">
                      <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500 flex items-center justify-center shadow-xs cursor-pointer" onClick={() => setPreviewTab('chatlist')}>
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="w-6.5 h-6.5 rounded-lg bg-blue-500 flex items-center justify-center shadow-xs cursor-pointer" onClick={() => setPreviewTab('call')}>
                        <Phone className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500 flex items-center justify-center shadow-xs cursor-pointer" onClick={() => setPreviewTab('desktop')}>
                        <Sliders className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 1: 聊天界面 (Chat Conversation) */}
                {previewTab === 'chat' && (
                  <div 
                    className="flex-1 flex flex-col justify-between overflow-hidden relative bg-cover bg-center"
                    style={{
                      backgroundImage: (editingTheme.assets?.chatBg || editingTheme.assets?.chatWallpaper)
                        ? `url('${editingTheme.assets.chatBg || editingTheme.assets.chatWallpaper}')`
                        : undefined,
                      backgroundColor: editingTheme.css['--gg-page-bg'] || '#f3f4f6'
                    }}
                  >
                    <div className="relative z-10 flex-1 flex flex-col justify-between overflow-hidden">
                    {/* 消息场景切换标签 */}
                    <div className="px-2 py-1 bg-black/5 flex items-center justify-between shrink-0 border-b border-black/5">
                      <span className="text-[7.5px] font-medium text-stone-500">场景演示:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { key: 'all', label: '全部' },
                          { key: 'basic', label: '气泡' },
                          { key: 'cards', label: '转账/定位/文件' },
                          { key: 'marriage', label: '求婚/婚礼/离婚' },
                          { key: 'invite', label: '线下邀约' },
                        ].map(tab => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setChatScenario(tab.key as any)}
                            className={`px-1.5 py-0.5 rounded text-[7px] font-medium transition-colors cursor-pointer ${
                              chatScenario === tab.key
                                ? 'bg-white text-stone-800 shadow-2xs font-bold'
                                : 'text-stone-500 hover:text-stone-800'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 消息滚动区 */}
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-none flex flex-col">
                      {/* 时间分割线 */}
                      <div className="flex justify-center my-0.2">
                        <span
                          className="text-[7px] px-1.5 py-0.2 rounded-full bg-black/5 font-mono"
                          style={{ color: editingTheme.css['--gg-text-secondary'] || '#9ca3af' }}
                        >
                          14:20
                        </span>
                      </div>

                      {/* 1. 基础聊天气泡 (对方) */}
                      {(chatScenario === 'all' || chatScenario === 'basic') && (
                        <div className="flex items-start gap-1">
                          <Avatar src={demoFriend.avatar} className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs" size={9} />
                          <UnifiedBubble isUser={false} activeTheme={editingTheme} bubbleType="text">
                            新定制的微信主题真好看！所有气泡都支持自定义颜色、边框和点九图！✨
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 2. 转账气泡 (对方/自身) */}
                      {(chatScenario === 'all' || chatScenario === 'cards') && (
                        <div className="flex items-start gap-1">
                          <Avatar src={demoFriend.avatar} className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs" size={9} />
                          <UnifiedBubble
                            isUser={false}
                            activeTheme={editingTheme}
                            bubbleType="transfer"
                            defaultIcon={<Coins className="w-4 h-4 text-amber-800" />}
                            defaultTitle="微信转账"
                            extra={
                              <div className="flex justify-between items-center text-[9px]">
                                <span>微信安全支付</span>
                                <span>✅ 已收钱</span>
                              </div>
                            }
                            actions={
                              <div className="flex gap-1.5 w-full">
                                <button type="button" className="flex-1 py-1 rounded-lg text-white text-[7.5px] font-semibold bg-amber-600">
                                  收下
                                </button>
                                <button type="button" className="flex-1 py-1 rounded-lg text-[7.5px] font-semibold bg-amber-100 text-amber-900">
                                  退还
                                </button>
                              </div>
                            }
                          >
                            <div className="text-sm font-bold font-mono py-0.5">¥520.00</div>
                            <div className="text-[8.5px] opacity-90">“为你定制专属皮肤”</div>
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 3. 定位气泡 */}
                      {(chatScenario === 'all' || chatScenario === 'cards') && (
                        <div className="flex items-end justify-end gap-1">
                          <UnifiedBubble
                            isUser={true}
                            activeTheme={editingTheme}
                            bubbleType="location"
                            defaultTitle="位置分享"
                          >
                            <p className="text-[8.5px] font-medium">浪漫星空咖啡馆 (朝阳区三里屯路 88 号)</p>
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 4. 文件气泡 */}
                      {(chatScenario === 'all' || chatScenario === 'cards') && (
                        <div className="flex items-start gap-1">
                          <Avatar src={demoFriend.avatar} className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs" size={9} />
                          <UnifiedBubble
                            isUser={false}
                            activeTheme={editingTheme}
                            bubbleType="file"
                            defaultTitle="文件传送"
                            extra={
                              <div className="flex justify-between items-center text-[8.5px] opacity-75"><span>2.4 MB</span></div>
                            }
                          >
                            <p className="text-[8.5px] font-medium truncate">专属浪漫企划案.pdf</p>
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 4.5. 语音消息气泡 (对方) */}
                      {(chatScenario === 'all' || chatScenario === 'cards') && (
                        <div className="flex items-start gap-1">
                          <Avatar src={demoFriend.avatar} className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs" size={9} />
                          <UnifiedBubble
                            isUser={false}
                            activeTheme={editingTheme}
                            bubbleType="voice"
                            amount='5"'
                            style={{ width: '100px' }}
                          />
                        </div>
                      )}

                      {/* 4.6. 语音消息气泡 (自己) */}
                      {(chatScenario === 'all' || chatScenario === 'cards') && (
                        <div className="flex items-end justify-end gap-1">
                          <UnifiedBubble
                            isUser={true}
                            activeTheme={editingTheme}
                            bubbleType="voice"
                            amount='8"'
                            style={{ width: '120px' }}
                          />
                        </div>
                      )}

                      {/* 5. 基础聊天气泡 (自己) */}
                      {(chatScenario === 'all' || chatScenario === 'basic') && (
                        <div className="flex items-end justify-end gap-1">
                          <UnifiedBubble isUser={true} activeTheme={editingTheme} bubbleType="text">
                            喜欢就好，随时随地换肤~ 💕
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 6. 求婚气泡 (对方发送) */}
                      {(chatScenario === 'all' || chatScenario === 'marriage') && (
                        <div className="flex items-start gap-1">
                          <Avatar src={demoFriend.avatar} className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs" size={9} />
                          <UnifiedBubble
                            isUser={false}
                            activeTheme={editingTheme}
                            bubbleType="proposal"
                            title="浪漫求婚"
                            subtitle="余生请多指教"
                            defaultIcon={<CustomHeartSVG className="w-5 h-5 text-rose-500" />}
                            actions={
                              <div className="flex gap-1.5 w-full mt-1">
                                {editingTheme?.assets?.proposalOptionYes ? (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('您点击了【我愿意】！')}
                                    className="relative flex-1 shrink-0 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center min-h-[26px] active:scale-95 transition-transform"
                                  >
                                    <img
                                      src={editingTheme.assets.proposalOptionYes}
                                      alt="我愿意"
                                      className="h-6.5 w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-xs"
                                    />
                                    <span
                                      className="absolute inset-0 flex items-center justify-center font-bold text-[7.5px] px-1 pointer-events-none z-10 whitespace-nowrap"
                                      style={{ backgroundColor: editingTheme?.css?.['--gg-proposal-btn-yes-bg'] || '#f43f5e', color: editingTheme?.css?.['--gg-proposal-btn-yes-text'] || '#ffffff', border: editingTheme?.css?.['--gg-proposal-btn-yes-border'] || undefined }}
                                    >我愿意</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('您点击了【我愿意】！')}
                                    className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                                    style={{ backgroundColor: editingTheme?.css?.['--gg-proposal-btn-yes-bg'] || '#f43f5e', color: editingTheme?.css?.['--gg-proposal-btn-yes-text'] || '#ffffff', border: editingTheme?.css?.['--gg-proposal-btn-yes-border'] || undefined }}
                                  >我愿意</button>
                                )}

                                {editingTheme?.assets?.proposalOptionNo ? (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('💭 您点击了【再想想】！')}
                                    className="relative flex-1 shrink-0 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center min-h-[26px] active:scale-95 transition-transform"
                                  >
                                    <img
                                      src={editingTheme.assets.proposalOptionNo}
                                      alt="再想想"
                                      className="h-6.5 w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-xs"
                                    />
                                    <span
                                      className="absolute inset-0 flex items-center justify-center font-bold text-[7.5px] px-1 pointer-events-none z-10 whitespace-nowrap"
                                      style={{ backgroundColor: editingTheme?.css?.['--gg-proposal-btn-no-bg'] || '#e7e5e4', color: editingTheme?.css?.['--gg-proposal-btn-no-text'] || '#374151', border: editingTheme?.css?.['--gg-proposal-btn-no-border'] || undefined }}
                                    >再想想</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('💭 您点击了【再想想】！')}
                                    className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                                    style={{ backgroundColor: editingTheme?.css?.['--gg-proposal-btn-no-bg'] || '#e7e5e4', color: editingTheme?.css?.['--gg-proposal-btn-no-text'] || '#374151', border: editingTheme?.css?.['--gg-proposal-btn-no-border'] || undefined }}
                                  >再想想</button>
                                )}
                              </div>
                            }
                          >
                            <p className="text-[7.5px] leading-relaxed">遇见你是我最大的幸运，你愿意和我共度余生吗？</p>
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 6.5. 求婚气泡 (我发送) */}
                      {(chatScenario === 'all' || chatScenario === 'marriage') && (
                        <div className="flex items-end justify-end gap-1">
                          <UnifiedBubble
                            isUser={true}
                            activeTheme={editingTheme}
                            bubbleType="proposal"
                            title="浪漫求婚"
                            subtitle="余生请多指教"
                            defaultIcon={<CustomHeartSVG className="w-5 h-5 text-rose-500" />}
                          >
                            <p className="text-[7.5px] leading-relaxed">我想和你一起走过四季，你愿意嫁给我吗？</p>
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 7. 婚礼邀请气泡 */}
                      {(chatScenario === 'all' || chatScenario === 'marriage') && (
                        <div className="flex items-start gap-1">
                          <Avatar src={demoFriend.avatar} className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs" size={9} />
                          <UnifiedBubble
                            isUser={false}
                            activeTheme={editingTheme}
                            bubbleType="wedding"
                            title="婚礼邀请"
                            subtitle="携手步入神圣殿堂"
                            defaultIcon={<Sparkles className="w-5 h-5 text-pink-500" />}
                            actions={
                              <div className="w-full mt-1 flex flex-col gap-1">
                                {editingTheme?.assets?.weddingOptionEnter ? (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('您点击了【我愿意！进入婚礼仪式】！')}
                                    className="relative w-full p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center min-h-[26px] active:scale-95 transition-transform"
                                  >
                                    <img
                                      src={editingTheme.assets.weddingOptionEnter}
                                      alt="进入婚礼"
                                      className="h-6.5 w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-xs"
                                    />
                                    <span
                                      className="absolute inset-0 flex items-center justify-center font-bold text-[7.5px] px-1 pointer-events-none z-10 whitespace-nowrap"
                                      style={{ backgroundColor: editingTheme?.css?.['--gg-wedding-btn-enter-bg'] || '#ec4899', color: editingTheme?.css?.['--gg-wedding-btn-enter-text'] || '#ffffff', border: editingTheme?.css?.['--gg-wedding-btn-enter-border'] || undefined }}
                                    >我愿意！进入婚礼仪式</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('您点击了【我愿意！进入婚礼仪式】！')}
                                    className="w-full py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                                    style={{ backgroundColor: editingTheme?.css?.['--gg-wedding-btn-enter-bg'] || '#ec4899', color: editingTheme?.css?.['--gg-wedding-btn-enter-text'] || '#ffffff', border: editingTheme?.css?.['--gg-wedding-btn-enter-border'] || undefined }}
                                  >我愿意！进入婚礼仪式</button>
                                )}

                                <div className="flex gap-1 w-full">
                                  {editingTheme?.assets?.weddingOptionChinese ? (
                                    <button
                                      type="button"
                                      onClick={() => triggerToast('🏮 您点击了【中式婚礼】！')}
                                      className="relative flex-1 shrink-0 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center min-h-[26px] active:scale-95 transition-transform"
                                    >
                                      <img
                                        src={editingTheme.assets.weddingOptionChinese}
                                        alt="中式"
                                        className="h-6.5 w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-xs"
                                      />
                                      <span
                                        className="absolute inset-0 flex items-center justify-center font-bold text-[7.5px] px-1 pointer-events-none z-10 whitespace-nowrap"
                                        style={{ backgroundColor: editingTheme?.css?.['--gg-wedding-btn-chinese-bg'] || '#dc2626', color: editingTheme?.css?.['--gg-wedding-btn-chinese-text'] || '#ffffff', border: editingTheme?.css?.['--gg-wedding-btn-chinese-border'] || undefined }}
                                      >中式</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => triggerToast('🏮 您点击了【中式婚礼】！')}
                                      className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                                      style={{ backgroundColor: editingTheme?.css?.['--gg-wedding-btn-chinese-bg'] || '#dc2626', color: editingTheme?.css?.['--gg-wedding-btn-chinese-text'] || '#ffffff', border: editingTheme?.css?.['--gg-wedding-btn-chinese-border'] || undefined }}
                                    >中式</button>
                                  )}

                                  {editingTheme?.assets?.weddingOptionWestern ? (
                                    <button
                                      type="button"
                                      onClick={() => triggerToast('⛪ 您点击了【西式婚礼】！')}
                                      className="relative flex-1 shrink-0 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center min-h-[26px] active:scale-95 transition-transform"
                                    >
                                      <img
                                        src={editingTheme.assets.weddingOptionWestern}
                                        alt="西式"
                                        className="h-6.5 w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-xs"
                                      />
                                      <span
                                        className="absolute inset-0 flex items-center justify-center font-bold text-[7.5px] px-1 pointer-events-none z-10 whitespace-nowrap"
                                        style={{ backgroundColor: editingTheme?.css?.['--gg-wedding-btn-western-bg'] || '#2563eb', color: editingTheme?.css?.['--gg-wedding-btn-western-text'] || '#ffffff', border: editingTheme?.css?.['--gg-wedding-btn-western-border'] || undefined }}
                                      >西式</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => triggerToast('⛪ 您点击了【西式婚礼】！')}
                                      className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                                      style={{ backgroundColor: editingTheme?.css?.['--gg-wedding-btn-western-bg'] || '#2563eb', color: editingTheme?.css?.['--gg-wedding-btn-western-text'] || '#ffffff', border: editingTheme?.css?.['--gg-wedding-btn-western-border'] || undefined }}
                                    >西式</button>
                                  )}
                                </div>
                              </div>
                            }
                          >
                            <p className="text-[7.5px] leading-relaxed">良辰吉日，与你共赴永恒誓约！</p>
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 8. 离婚确认气泡 */}
                      {(chatScenario === 'marriage' || chatScenario === 'all') && (
                        <div className="flex items-start gap-1">
                          <Avatar src={demoFriend.avatar} className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs" size={9} />
                          <UnifiedBubble
                            isUser={false}
                            activeTheme={editingTheme}
                            bubbleType="divorce"
                            title="申请协议解除"
                            subtitle="婚姻关系确认"
                            defaultIcon={<LogOut className="w-5 h-5 text-stone-500" />}
                            actions={
                              <div className="flex gap-1.5 w-full mt-1">
                                {editingTheme?.assets?.divorceOptionYes ? (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('💔 您点击了【确定解除】！')}
                                    className="relative flex-1 shrink-0 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center min-h-[26px] active:scale-95 transition-transform"
                                  >
                                    <img
                                      src={editingTheme.assets.divorceOptionYes}
                                      alt="确定解除"
                                      className="h-6.5 w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-xs"
                                    />
                                    <span
                                      className="absolute inset-0 flex items-center justify-center font-bold text-[7.5px] px-1 pointer-events-none z-10 whitespace-nowrap"
                                      style={{ backgroundColor: editingTheme?.css?.['--gg-divorce-btn-yes-bg'] || '#ef4444', color: editingTheme?.css?.['--gg-divorce-btn-yes-text'] || '#ffffff', border: editingTheme?.css?.['--gg-divorce-btn-yes-border'] || undefined }}
                                    >确定解除</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('💔 您点击了【确定解除】！')}
                                    className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                                    style={{ backgroundColor: editingTheme?.css?.['--gg-divorce-btn-yes-bg'] || '#ef4444', color: editingTheme?.css?.['--gg-divorce-btn-yes-text'] || '#ffffff', border: editingTheme?.css?.['--gg-divorce-btn-yes-border'] || undefined }}
                                  >确定解除</button>
                                )}

                                {editingTheme?.assets?.divorceOptionNo ? (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('💕 您点击了【再想想/不离了】！')}
                                    className="relative flex-1 shrink-0 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center min-h-[26px] active:scale-95 transition-transform"
                                  >
                                    <img
                                      src={editingTheme.assets.divorceOptionNo}
                                      alt="再想想"
                                      className="h-6.5 w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-xs"
                                    />
                                    <span
                                      className="absolute inset-0 flex items-center justify-center font-bold text-[7.5px] px-1 pointer-events-none z-10 whitespace-nowrap"
                                      style={{ backgroundColor: editingTheme?.css?.['--gg-divorce-btn-no-bg'] || '#f5f5f4', color: editingTheme?.css?.['--gg-divorce-btn-no-text'] || '#374151', border: editingTheme?.css?.['--gg-divorce-btn-no-border'] || undefined }}
                                    >再想想</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => triggerToast('💕 您点击了【再想想/不离了】！')}
                                    className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                                    style={{ backgroundColor: editingTheme?.css?.['--gg-divorce-btn-no-bg'] || '#f5f5f4', color: editingTheme?.css?.['--gg-divorce-btn-no-text'] || '#374151', border: editingTheme?.css?.['--gg-divorce-btn-no-border'] || undefined }}
                                  >再想想</button>
                                )}
                              </div>
                            }
                          >
                            <p className="text-[7.5px] leading-relaxed">愿彼此安好，珍重前程。</p>
                          </UnifiedBubble>
                        </div>
                      )}

                      {/* 9. 线下见面邀请气泡 (支持工坊全维度美化与点九实时预览) */}
                      {(chatScenario === 'all' || chatScenario === 'invite') && (
                        <div className="flex items-start gap-1">
                          <Avatar src={demoFriend.avatar} className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs" size={9} />
                          <UnifiedBubble
                            isUser={false}
                            activeTheme={editingTheme}
                            bubbleType="meet_invite"
                            title="线下见面邀请"
                            subtitle="期待与你相聚"
                            amount="老街转角咖啡馆"
                            actions={
                              <div className="flex gap-1.5 w-full mt-1">
                                <button
                                  type="button"
                                  onClick={() => triggerToast('☕ 您接受了线下赴约邀请！')}
                                  className="flex-1 py-1 rounded-lg text-[8px] font-bold cursor-pointer active:scale-95 shadow-xs"
                                  style={{
                                    backgroundColor: editingTheme?.css?.['--gg-meetInvite-btn-accept-bg'] || '#f59e0b',
                                    color: editingTheme?.css?.['--gg-meetInvite-btn-accept-text'] || '#ffffff',
                                  }}
                                >
                                  欣然赴约
                                </button>
                                <button
                                  type="button"
                                  onClick={() => triggerToast('下次一定~')}
                                  className="flex-1 py-1 rounded-lg text-[8px] font-medium cursor-pointer active:scale-95 shadow-xs"
                                  style={{
                                    backgroundColor: editingTheme?.css?.['--gg-meetInvite-btn-decline-bg'] || 'rgba(0, 0, 0, 0.05)',
                                    color: editingTheme?.css?.['--gg-meetInvite-btn-decline-text'] || '#78350f',
                                  }}
                                >
                                  下次一定
                                </button>
                              </div>
                            }
                          >
                            今天天气特别好，要不要找个时间线下见一面？我发现了一家很不错的咖啡馆，想带你一起去。
                          </UnifiedBubble>
                        </div>
                      )}
                    </div>

                    {/* 加号拓展面板抽屉 (在聊天界面下方可展开/收起) */}
                    {showChatPlusDrawer && (
                      <div
                        className="p-1.5 border-t border-black/5 grid grid-cols-4 gap-1.5 shrink-0 animate-fadeIn"
                        style={{
                          backgroundColor: editingTheme.css['--gg-toolbar-bg'] || editingTheme.css['--gg-page-bg'] || '#f9fafb'
                        }}
                      >
                        {[
                          { name: '照片', icon: ImageIcon },
                          { name: '拍摄', icon: Camera },
                          { name: '转账', icon: CreditCard },
                          { name: '语音', icon: Mic },
                        ].map((item, idx) => {
                          const ItemIcon = item.icon;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-0.5">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center shadow-2xs border border-black/5"
                                style={{
                                  backgroundColor: editingTheme.css['--gg-plus-icon-bg'] || '#ffffff',
                                  color: editingTheme.css['--gg-plus-icon-color'] || '#374151',
                                }}
                              >
                                <ItemIcon className="w-3 h-3" />
                              </div>
                              <span
                                className="text-[7px]"
                                style={{ color: editingTheme.css['--gg-plus-item-text'] || editingTheme.css['--gg-text-primary'] || '#4b5563' }}
                              >
                                {item.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 完整聊天底部工具栏 (语音切换、输入框、表情、加号、发送) - 升级为 48px 充足高度以确保背景图完全包裹文字 */}
                    <div
                      className={`min-h-[48px] py-1.5 px-2.5 flex items-center gap-1.5 ${editingTheme.assets?.inputBg ? 'border-t-0 shadow-none' : 'border-t border-black/5 shadow-2xs'} shrink-0 select-none relative overflow-hidden`}
                      style={{
                        backgroundColor: editingTheme.assets?.inputBg ? 'transparent' : (editingTheme.css['--gg-toolbar-bg'] || '#f9fafb'),
                        border: editingTheme.assets?.inputBg ? 'none' : undefined,
                        borderTop: editingTheme.assets?.inputBg ? 'none' : undefined,
                        boxShadow: editingTheme.assets?.inputBg ? 'none' : undefined,
                      }}
                    >
                      {editingTheme.assets?.inputBg && (
                        <div
                          className="absolute inset-0 pointer-events-none z-0"
                          style={getBubbleBgStyle({
                            isUser: false,
                            prefix: 'input',
                            editingTheme,
                            bubbleBgUrl: editingTheme.assets.inputBg,
                            isDot9: editingTheme.css?.['--gg-is-dot9-inputBg'] !== 'false',
                          })}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between w-full h-full gap-1.5 my-auto">
                      {/* 🍥 AI Trigger Button (Preview) */}
                      <button
                        type="button"
                        className={`cursor-pointer shrink-0 transition-all flex items-center justify-center ${
                          editingTheme.assets?.aiBtn
                            ? 'p-0 bg-transparent border-none'
                            : 'w-6.5 h-6.5 rounded-lg shadow-2xs bg-emerald-50 border border-emerald-200/80'
                        }`}
                        title="AI发送"
                      >
                        {editingTheme.assets?.aiBtn ? (
                          <img src={editingTheme.assets.aiBtn} alt="AI" className="h-6.5 w-auto max-w-[28px] object-contain select-none" />
                        ) : (
                          <span className="inline-block select-none leading-none text-xs hover:scale-110 transition-transform">
                            🍥
                          </span>
                        )}
                      </button>
                      
                      {/* 语音/键盘切换按钮 */}
                      <button
                        type="button"
                        onClick={() => setChatInputMode(m => m === 'text' ? 'voice' : 'text')}
                        className={`cursor-pointer shrink-0 transition-all flex items-center justify-center ${
                          editingTheme.assets?.voiceBtn
                            ? 'p-0 bg-transparent border-none'
                            : 'w-6.5 h-6.5 rounded-full hover:opacity-80'
                        }`}
                        title="切换语音/键盘"
                        style={editingTheme.assets?.voiceBtn ? undefined : {
                          color: editingTheme.css['--gg-text-secondary'] || '#6b7280'
                        }}
                      >
                        {editingTheme.assets?.voiceBtn ? (
                          <img src={editingTheme.assets.voiceBtn} alt="voice" className="h-6.5 w-auto max-w-[28px] object-contain select-none" />
                        ) : chatInputMode === 'text' ? (
                          <Mic className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </button>

                      {/* 输入区域 / 按住说话条 */}
                      {chatInputMode === 'text' ? (
                        <div
                          className="min-h-[32px] py-1 flex-1 rounded-lg px-2.5 text-[9.5px] flex items-center border border-black/5 shadow-inner"
                          style={{
                            backgroundColor: editingTheme.css['--gg-input-bg'] || '#ffffff',
                            color: editingTheme.css['--gg-input-text'] || '#111827'
                          }}
                        >
                          输入消息...
                        </div>
                      ) : (
                        <div
                          className="min-h-[32px] py-1 flex-1 rounded-lg text-[9.5px] font-bold flex items-center justify-center border border-black/10 shadow-2xs cursor-pointer"
                          style={{
                            backgroundColor: editingTheme.css['--gg-voice-field-bg'] || '#e5e7eb',
                            color: editingTheme.css['--gg-voice-text'] || editingTheme.css['--gg-text-primary'] || '#111827'
                          }}
                        >
                          按住 说话
                        </div>
                      )}

                      {/* 表情图标 */}
                      <div
                        className={`cursor-pointer shrink-0 flex items-center justify-center ${
                          editingTheme.assets?.emojiBtn ? 'p-0' : 'w-6 h-6 opacity-70 hover:opacity-100'
                        }`}
                        style={editingTheme.assets?.emojiBtn ? undefined : { color: editingTheme.css['--gg-text-secondary'] || '#6b7280' }}
                      >
                        {editingTheme.assets?.emojiBtn ? (
                          <img src={editingTheme.assets.emojiBtn} alt="emoji" className="h-6 w-auto max-w-[26px] object-contain select-none" />
                        ) : (
                          <Smile className="w-4 h-4" />
                        )}
                      </div>

                      {/* 加号拓展按钮 */}
                      <button
                        type="button"
                        onClick={() => setShowChatPlusDrawer(prev => !prev)}
                        className={`cursor-pointer shrink-0 transition-all flex items-center justify-center ${
                          editingTheme.assets?.plusBtn
                            ? 'p-0 bg-transparent border-none'
                            : `w-6.5 h-6.5 rounded-full hover:opacity-80 ${showChatPlusDrawer ? 'bg-black/10' : ''}`
                        }`}
                        title="打开/关闭拓展菜单"
                        style={editingTheme.assets?.plusBtn ? undefined : {
                          color: editingTheme.css['--gg-plus-icon-color'] || editingTheme.css['--gg-text-secondary'] || '#6b7280'
                        }}
                      >
                        {editingTheme.assets?.plusBtn ? (
                          <img src={editingTheme.assets.plusBtn} alt="plus" className="h-6.5 w-auto max-w-[28px] object-contain select-none" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>

                      {/* 发送按钮 */}
                      <div
                        className={`cursor-pointer shrink-0 flex items-center justify-center ${
                          editingTheme.assets?.sendBtn
                            ? 'p-0 bg-transparent border-none'
                            : 'px-2 h-6.5 rounded-lg text-[8.5px] font-bold shadow-2xs'
                        }`}
                        style={editingTheme.assets?.sendBtn ? undefined : {
                          backgroundColor: editingTheme.css['--gg-send-btn-bg'] || editingTheme.css['--gg-accent-color'] || '#07c160',
                          color: editingTheme.css['--gg-send-btn-text'] || '#ffffff'
                        }}
                      >
                        {editingTheme.assets?.sendBtn ? (
                          <img src={editingTheme.assets.sendBtn} alt="send" className="h-6.5 w-auto max-w-[40px] object-contain select-none" />
                        ) : (
                          <span>发送</span>
                        )}
                      </div>
                      </div>
                    </div>
                    </div>
                  </div>
                )}

                {/* Tab: 通讯录列表与分组管理预览 */}
                {previewTab === 'contacts' && (
                  <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative" style={{ backgroundColor: editingTheme.css['--gg-page-bg'] || '#ededed' }}>
                    {/* 搜索条 */}
                    <div className="p-1.5 shrink-0 bg-stone-100/50">
                      <div
                        className="h-5 rounded-md px-2 flex items-center gap-1 text-[7.5px] border border-black/5 shadow-2xs"
                        style={{
                          backgroundColor: editingTheme.css['--gg-input-bg'] || 'rgba(0,0,0,0.05)',
                          color: editingTheme.css['--gg-text-secondary'] || '#9ca3af'
                        }}
                      >
                        <Search className="w-2.5 h-2.5 opacity-60" />
                        <span>搜索通讯录</span>
                      </div>
                    </div>

                    {/* 功能入口区 (含分组管理按钮) */}
                    <div className="px-2 py-1 bg-white border-b border-black/5 flex items-center justify-between shrink-0">
                      <span className="text-[7.5px] font-bold text-stone-600">联系人与分组</span>
                      <button
                        type="button"
                        onClick={() => triggerToast('点击打开了通讯录分组管理弹窗')}
                        className="px-2 py-0.5 rounded text-[7px] font-bold cursor-pointer transition-transform active:scale-95 shadow-2xs"
                        style={{
                          backgroundColor: editingTheme.css?.['--gg-group-btn-bg'] || '#07c160',
                          color: editingTheme.css?.['--gg-group-btn-text'] || '#ffffff',
                          border: editingTheme.css?.['--gg-group-btn-border'] || undefined,
                        }}
                      >
                        管理分组
                      </button>
                    </div>

                    {/* 联系人列表预览 */}
                    <div className="flex-1 overflow-y-auto divide-y divide-black/5 bg-white">
                      <div className="px-2 py-1.5 flex items-center gap-2">
                        <Avatar src={demoFriend.avatar} className="w-6 h-6 rounded-md shadow-2xs" size={12} />
                        <div className="flex-1">
                          <span className="font-bold text-[8.5px]" style={{ color: editingTheme.css['--gg-text-primary'] || '#111827' }}>
                            {demoFriend.remark || demoFriend.name}
                          </span>
                          <span className="block text-[6.5px] text-stone-400">分组: 特别关心, 挚友</span>
                        </div>
                      </div>
                      <div className="px-2 py-1.5 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shadow-2xs">
                          ⭐
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-[8.5px]" style={{ color: editingTheme.css['--gg-text-primary'] || '#111827' }}>
                            妈妈
                          </span>
                          <span className="block text-[6.5px] text-stone-400">分组: 家人</span>
                        </div>
                      </div>
                    </div>

                    {/* 分组管理弹窗实时预览浮层 (点击管理分组或默认展示效果) */}
                    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 bg-black/50 backdrop-blur-2xs">
                      <div
                        className="w-[220px] rounded-xl p-3 shadow-2xl text-[8px] space-y-2.5 max-h-[90vh] overflow-y-auto"
                        style={{
                          backgroundColor: editingTheme.css?.['--gg-group-modal-bg'] || '#ffffff',
                          color: editingTheme.css?.['--gg-group-modal-title-color'] || '#1f2937',
                        }}
                      >
                        <h4 className="font-bold text-[9px]" style={{ color: editingTheme.css?.['--gg-group-modal-title-color'] || '#1f2937' }}>
                          通讯录分组管理
                        </h4>
                        {/* 新建空白分组 */}
                        <div>
                          <label className="block text-[7px] mb-0.5 font-medium" style={{ color: editingTheme.css?.['--gg-group-modal-label-color'] || '#78716c' }}>
                            新建空白分组:
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              readOnly
                              value="死党群"
                              className="flex-1 p-1 rounded text-[7px] outline-none"
                              style={{
                                backgroundColor: editingTheme.css?.['--gg-group-modal-input-bg'] || '#ffffff',
                                color: editingTheme.css?.['--gg-group-modal-input-text'] || '#1f2937',
                                border: '1px solid ' + (editingTheme.css?.['--gg-group-modal-input-border'] || '#e5e7eb'),
                              }}
                            />
                            <button
                              type="button"
                              className="px-2 py-1 rounded font-semibold"
                              style={{
                                backgroundColor: editingTheme.css?.['--gg-group-modal-primary-btn-bg'] || '#07c160',
                                color: editingTheme.css?.['--gg-group-modal-primary-btn-text'] || '#ffffff',
                              }}
                            >
                              创建
                            </button>
                          </div>
                        </div>

                        {/* 将联系人移入分组 */}
                        <div className="pt-1 border-t border-black/5 space-y-1">
                          <label className="block text-[7px] font-medium" style={{ color: editingTheme.css?.['--gg-group-modal-label-color'] || '#78716c' }}>
                            将联系人移入分组:
                          </label>
                          <div className="p-1 rounded bg-stone-50 border border-stone-200 text-[6.5px] opacity-80 mb-1">
                            选择联系人 ➔ 选择分组
                          </div>
                          <button
                            type="button"
                            className="w-full py-1 rounded font-semibold text-[7px]"
                            style={{
                              backgroundColor: editingTheme.css?.['--gg-group-modal-primary-btn-bg'] || '#07c160',
                              color: editingTheme.css?.['--gg-group-modal-primary-btn-text'] || '#ffffff',
                            }}
                          >
                            确认移入分组
                          </button>
                        </div>

                        {/* 将联系人移出分组 */}
                        <div className="pt-1 border-t border-black/5 space-y-1">
                          <label className="block text-[7px] font-medium" style={{ color: editingTheme.css?.['--gg-group-modal-label-color'] || '#78716c' }}>
                            将联系人移出分组:
                          </label>
                          <div className="p-1 rounded bg-stone-50 border border-stone-200 text-[6.5px] opacity-80 mb-1">
                            选择联系人 ➔ 选择要移出的分组
                          </div>
                          <button
                            type="button"
                            className="w-full py-1 rounded font-semibold text-[7px]"
                            style={{
                              backgroundColor: editingTheme.css?.['--gg-group-modal-danger-btn-bg'] || '#ef4444',
                              color: editingTheme.css?.['--gg-group-modal-danger-btn-text'] || '#ffffff',
                            }}
                          >
                            确认移出分组
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerToast('关闭分组弹窗')}
                          className="w-full py-1 rounded font-medium cursor-pointer"
                          style={{
                            backgroundColor: editingTheme.css?.['--gg-group-modal-close-btn-bg'] || '#ffffff',
                            color: editingTheme.css?.['--gg-group-modal-close-btn-text'] || '#57534e',
                            border: '1px solid ' + (editingTheme.css?.['--gg-group-modal-close-btn-border'] || '#e5e7eb'),
                          }}
                        >
                          关闭
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: 微信聊天列表 (Chat List View) */}
                {previewTab === 'chatlist' && (
                  <div className="flex-1 flex flex-col overflow-hidden w-full h-full">
                    {/* 仅在顶栏与底栏之间的中间列表区域应用 chatlistBg（直接平铺） */}
                    <div 
                      className="flex-1 flex flex-col overflow-hidden relative bg-cover bg-center"
                      style={{
                        backgroundImage: editingTheme.assets?.chatlistBg ? `url('${editingTheme.assets.chatlistBg}')` : undefined,
                        backgroundColor: editingTheme.assets?.chatlistBg ? 'transparent' : (editingTheme.css['--gg-page-bg'] || '#ededed')
                      }}
                    >
                      <div className="relative z-10 flex-1 flex flex-col overflow-hidden w-full h-full">
                    {/* 搜索条 */}
                    <div className="p-1.5 shrink-0">
                      <div
                        className="h-5 rounded-md px-2 flex items-center gap-1 text-[7.5px] border border-black/5 shadow-2xs"
                        style={{
                          backgroundColor: editingTheme.css['--gg-input-bg'] || 'rgba(0,0,0,0.05)',
                          color: editingTheme.css['--gg-text-secondary'] || '#9ca3af'
                        }}
                      >
                        <Search className="w-2.5 h-2.5 opacity-60" />
                        <span>搜索</span>
                      </div>
                    </div>

                    {/* 对话列表 */}
                    <div className="flex-1 overflow-y-auto divide-y divide-black/5 scrollbar-none">
                      {/* 对话 1: 当前好友 (可点击进入私聊) */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chat')}
                        className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer"
                        title="点击进入私聊预览"
                      >
                        <div className="relative shrink-0">
                          <Avatar src={demoFriend.avatar} className="w-6 h-6 rounded-md shadow-2xs" size={12} />
                          <span
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                            style={{ backgroundColor: editingTheme.css['--gg-unread-bg'] || editingTheme.css['--gg-accent-color'] || '#ef4444' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[8.5px] truncate" style={{ color: editingTheme.css['--gg-text-primary'] || '#111827' }}>
                              {demoFriend.remark || demoFriend.name}
                            </span>
                            <span className="text-[7px]" style={{ color: editingTheme.css['--gg-text-secondary'] || '#9ca3af' }}>
                              14:20
                            </span>
                          </div>
                          <p className="text-[7.5px] truncate opacity-80" style={{ color: editingTheme.css['--gg-text-secondary'] || '#6b7280' }}>
                            喜欢就好，随时随地换肤~ 💕
                          </p>
                        </div>
                      </button>

                      {/* 对话 2: 特别关心的朋友 */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chat')}
                        className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer"
                        title="点击进入私聊预览"
                      >
                        <div className="relative shrink-0">
                          <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shadow-2xs">
                            ⭐
                          </div>
                          <span
                            className="absolute -top-0.5 -right-0.5 px-0.8 py-0 rounded-full text-[6px] font-bold leading-none border border-white"
                            style={{
                              backgroundColor: editingTheme.css['--gg-unread-bg'] || editingTheme.css['--gg-accent-color'] || '#ef4444',
                              color: editingTheme.css['--gg-unread-text'] || '#ffffff'
                            }}
                          >
                            2
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[8.5px] truncate" style={{ color: editingTheme.css['--gg-text-primary'] || '#111827' }}>
                              特别关心
                            </span>
                            <span className="text-[7px]" style={{ color: editingTheme.css['--gg-text-secondary'] || '#9ca3af' }}>
                              13:14
                            </span>
                          </div>
                          <p className="text-[7.5px] truncate opacity-80" style={{ color: editingTheme.css['--gg-text-secondary'] || '#6b7280' }}>
                            [微信转账] 微信转账 ￥520.00
                          </p>
                        </div>
                      </button>

                      {/* 对话 3: 相亲相爱一家人 */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chat')}
                        className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer"
                        title="点击进入私聊预览"
                      >
                        <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 shadow-2xs shrink-0">
                          🏡
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[8.5px] truncate" style={{ color: editingTheme.css['--gg-text-primary'] || '#111827' }}>
                              相亲相爱一家人 (4)
                            </span>
                            <span className="text-[7px]" style={{ color: editingTheme.css['--gg-text-secondary'] || '#9ca3af' }}>
                              11:30
                            </span>
                          </div>
                          <p className="text-[7.5px] truncate opacity-80" style={{ color: editingTheme.css['--gg-text-secondary'] || '#6b7280' }}>
                            妈妈：今晚做你最爱吃的糖醋排骨
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 底部 TabBar 全局标签栏 */}
                    <div
                      className={`min-h-[34px] py-1 px-2 flex items-center justify-around shrink-0 select-none relative overflow-hidden ${editingTheme.assets?.tabbarBg ? 'border-t-0 shadow-none' : 'border-t border-black/5 shadow-2xs'}`}
                      style={{
                        backgroundColor: editingTheme.assets?.tabbarBg ? 'transparent' : (editingTheme.css['--gg-tabbar-bg'] || '#f7f7f7'),
                        border: editingTheme.assets?.tabbarBg ? 'none' : undefined,
                        borderTop: editingTheme.assets?.tabbarBg ? 'none' : undefined,
                        boxShadow: editingTheme.assets?.tabbarBg ? 'none' : undefined,
                      }}
                    >
                      {editingTheme.assets?.tabbarBg && (
                        <div
                          className="absolute inset-0 pointer-events-none z-0"
                          style={getBubbleBgStyle({
                            isUser: false,
                            prefix: 'tabbar',
                            editingTheme,
                            bubbleBgUrl: editingTheme.assets.tabbarBg,
                            isDot9: editingTheme.css?.['--gg-is-dot9-tabbarBg'] !== 'false',
                          })}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-around w-full h-full">
                      {/* 微信 Tab */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chatlist')}
                        className="flex flex-col items-center gap-0.2 cursor-pointer active:scale-90 transition-transform"
                        style={{
                          color: (previewTab === 'chatlist' || previewTab === 'chat')
                            ? (editingTheme.css['--gg-tabbar-active-label-color'] || editingTheme.css['--gg-accent-color'] || '#07c160')
                            : (editingTheme.css['--gg-tabbar-label-color'] || '#78716c')
                        }}
                      >
                        <div className="relative flex items-center justify-center w-3.5 h-3.5">
                          {(previewTab === 'chatlist' || previewTab === 'chat') && (editingTheme.css['--gg-tabbar-icon-fog-color'] || editingTheme.assets?.tabIconChats) && (
                            <div
                              className="absolute rounded-full pointer-events-none"
                              style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: editingTheme.css['--gg-tabbar-icon-fog-color'] || 'rgba(7, 193, 96, 0.25)',
                                filter: 'blur(2.5px)',
                                opacity: 0.9,
                              }}
                            />
                          )}
                          {editingTheme.assets?.tabIconChats ? (
                            <img src={editingTheme.assets.tabIconChats} alt="微信" className="w-3.5 h-3.5 object-contain relative z-10 shrink-0 pointer-events-none" />
                          ) : (
                            <MessageSquare className="w-3 h-3 relative z-10" />
                          )}
                        </div>
                        <span className="text-[6.5px] font-bold">微信</span>
                      </button>

                      {/* 通讯录 Tab */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('contacts')}
                        className="flex flex-col items-center gap-0.2 cursor-pointer active:scale-90 transition-transform"
                        style={{
                          color: previewTab === 'contacts'
                            ? (editingTheme.css['--gg-tabbar-active-label-color'] || editingTheme.css['--gg-accent-color'] || '#07c160')
                            : (editingTheme.css['--gg-tabbar-label-color'] || '#78716c')
                        }}
                      >
                        <div className="relative flex items-center justify-center w-3.5 h-3.5">
                          {editingTheme.assets?.tabIconContacts ? (
                            <img src={editingTheme.assets.tabIconContacts} alt="通讯录" className="w-3.5 h-3.5 object-contain relative z-10 shrink-0 pointer-events-none" />
                          ) : (
                            <Users className="w-3 h-3 relative z-10" />
                          )}
                        </div>
                        <span className="text-[6.5px]">通讯录</span>
                      </button>

                      {/* 发现 Tab (带小红点，点击可进入朋友圈预览) */}
                      <button
                        type="button"
                        onClick={() => setPreviewTab('moments')}
                        className="flex flex-col items-center gap-0.2 relative cursor-pointer active:scale-90 transition-transform"
                        title="点击查看朋友圈预览"
                        style={{
                          color: previewTab === 'moments'
                            ? (editingTheme.css['--gg-tabbar-active-label-color'] || editingTheme.css['--gg-accent-color'] || '#07c160')
                            : (editingTheme.css['--gg-tabbar-label-color'] || '#78716c')
                        }}
                      >
                        <div className="relative flex items-center justify-center w-3.5 h-3.5">
                          {previewTab === 'moments' && (editingTheme.css['--gg-tabbar-icon-fog-color'] || editingTheme.assets?.tabIconMoments) && (
                            <div
                              className="absolute rounded-full pointer-events-none"
                              style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: editingTheme.css['--gg-tabbar-icon-fog-color'] || 'rgba(7, 193, 96, 0.25)',
                                filter: 'blur(2.5px)',
                                opacity: 0.9,
                              }}
                            />
                          )}
                          {editingTheme.assets?.tabIconMoments ? (
                            <img src={editingTheme.assets.tabIconMoments} alt="发现" className="w-3.5 h-3.5 object-contain relative z-10 shrink-0 pointer-events-none" />
                          ) : (
                            <Compass className="w-3 h-3 opacity-70 hover:opacity-100 relative z-10" />
                          )}
                          <span
                            className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full z-20"
                            style={{ backgroundColor: editingTheme.css['--gg-accent-color'] || '#ef4444' }}
                          />
                        </div>
                        <span className="text-[6.5px]">发现</span>
                      </button>

                      {/* 我 Tab */}
                      <div
                        className="flex flex-col items-center gap-0.2"
                        style={{
                          color: editingTheme.css['--gg-tabbar-label-color'] || '#78716c'
                        }}
                      >
                        <div className="relative flex items-center justify-center w-3.5 h-3.5">
                          {editingTheme.assets?.tabIconMe ? (
                            <img src={editingTheme.assets.tabIconMe} alt="我" className="w-3.5 h-3.5 object-contain relative z-10 shrink-0 pointer-events-none" />
                          ) : (
                            <User className="w-3 h-3 opacity-70 relative z-10" />
                          )}
                        </div>
                        <span className="text-[6.5px]">我</span>
                      </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: 朋友圈 (Moments View) */}
                {previewTab === 'moments' && (
                  <div 
                    className="flex-1 overflow-y-auto scrollbar-none relative flex flex-col"
                    style={{
                      backgroundColor: (editingTheme.assets?.momentsBg || editingTheme.assets?.chatlistBg || editingTheme.assets?.wechatBg) ? 'transparent' : (editingTheme.css['--gg-moments-feed-bg'] || '#f3f4f6')
                    }}
                  >
                    {editingTheme.assets?.momentsBg && (
                      <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={getBubbleBgStyle({
                          isUser: false,
                          prefix: 'moments',
                          editingTheme,
                          bubbleBgUrl: editingTheme.assets.momentsBg,
                          isDot9: editingTheme.css?.['--gg-is-dot9-momentsBg'] !== 'false',
                        })}
                      />
                    )}
                    
                    {/* 朋友圈顶部封面与操作栏 */}
                    <div
                      className="relative w-full h-20 bg-cover bg-center shrink-0 flex flex-col justify-between p-1.5 shadow-xs"
                      style={{
                        backgroundImage: editingTheme.assets?.momentsCoverBg ? `url('${editingTheme.assets.momentsCoverBg}')` : undefined,
                        backgroundColor: editingTheme.assets?.momentsCoverBg ? undefined : '#475569',
                      }}
                    >
                      {/* 右上角图标组 (发动态、AI发圈、设置) */}
                      <div className="flex items-center justify-end gap-1.5 z-10">
                        {editingTheme.assets?.momentsSettingsIcon ? (
                          <img src={editingTheme.assets.momentsSettingsIcon} alt="设置" className="w-3.5 h-3.5 object-contain drop-shadow-sm cursor-pointer" onClick={() => triggerToast('朋友圈设置')} />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-black/30 flex items-center justify-center text-white text-[7px] cursor-pointer" onClick={() => triggerToast('朋友圈设置')}>⚙️</div>
                        )}
                        {editingTheme.assets?.momentsAiPostIcon ? (
                          <img src={editingTheme.assets.momentsAiPostIcon} alt="AI发圈" className="w-3.5 h-3.5 object-contain drop-shadow-sm cursor-pointer" onClick={() => triggerToast('AI 智能发圈')} />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80 flex items-center justify-center text-white text-[7px] cursor-pointer" onClick={() => triggerToast('AI 智能发圈')}>✨</div>
                        )}
                        {editingTheme.assets?.momentsPostIcon ? (
                          <img src={editingTheme.assets.momentsPostIcon} alt="发圈" className="w-3.5 h-3.5 object-contain drop-shadow-sm cursor-pointer" onClick={() => triggerToast('发布新动态')} />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-black/30 flex items-center justify-center text-white text-[7px] cursor-pointer" onClick={() => triggerToast('发布新动态')}>📷</div>
                        )}
                      </div>

                      {/* 封面右下角用户头像和昵称 */}
                      <div className="flex items-center justify-end gap-1.5 z-10 translate-y-2">
                        <span className="text-white font-bold text-[9px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          我
                        </span>
                        <Avatar
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                          className="w-7 h-7 rounded-md border-2 border-white shadow-md"
                          size={14}
                        />
                      </div>
                    </div>

                    <div className="relative z-10 p-2 pt-3 space-y-2 w-full flex-1">
                      <div
                        className="p-2 rounded-xl shadow-2xs border border-black/5"
                        style={{
                          backgroundColor: editingTheme.css['--gg-moments-card-bg'] || '#ffffff',
                          color: editingTheme.css['--gg-moments-text'] || '#1f2937'
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Avatar src={demoFriend.avatar} className="w-4 h-4 rounded-full" size={8} />
                          <span className="font-bold text-[9px]" style={{ color: editingTheme.css['--gg-text-primary'] || '#111827' }}>
                            {demoFriend.name}
                          </span>
                          <span className="text-[7.5px]" style={{ color: editingTheme.css['--gg-text-secondary'] || '#9ca3af' }}>
                            刚刚
                          </span>
                        </div>
                        <p className="text-[9px] leading-relaxed" style={{ color: editingTheme.css['--gg-moments-text'] || '#1f2937' }}>
                          发布了一条动态：今天是个特别浪漫的日子，换上了新皮肤！
                        </p>
                        <span
                          className="text-[8px] font-semibold mt-1 inline-block"
                          style={{ color: '#576b95' }}
                        >
                          #我的工坊主题
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: + 拓展功能菜单专用预览 (Plus Menu Panel) */}
                {previewTab === 'pluspanel' && (
                  <div
                    className="flex-1 p-3 flex flex-col justify-between overflow-y-auto scrollbar-none relative"
                    style={{
                      backgroundColor: editingTheme.assets?.plusPanelBg ? 'transparent' : (editingTheme.css['--gg-toolbar-bg'] || editingTheme.css['--gg-page-bg'] || '#f9fafb'),
                      backgroundImage: editingTheme.assets?.plusPanelBg ? `url('${editingTheme.assets.plusPanelBg}')` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="text-center mb-1">
                      <span className="text-[8px] font-medium opacity-70" style={{ color: editingTheme.css['--gg-text-secondary'] || '#6b7280' }}>
                        点击聊天输入框右侧「+」展开的拓展面板
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 my-auto">
                      {[
                        { name: '照片', icon: ImageIcon, asset: editingTheme.assets?.plusAlbumIcon },
                        { name: '拍摄', icon: Camera, asset: editingTheme.assets?.plusCameraIcon },
                        { name: '转账', icon: CreditCard, asset: editingTheme.assets?.plusTransferIcon },
                        { name: '语音', icon: Mic, asset: editingTheme.assets?.plusVoiceIcon },
                        { name: '位置', icon: MapPin, asset: editingTheme.assets?.plusLocationIcon },
                        { name: '通话', icon: Phone, asset: editingTheme.assets?.plusCallIcon },
                        { name: '文件', icon: FolderOpen, asset: editingTheme.assets?.plusFileIcon },
                        { name: '见面', icon: Users, asset: editingTheme.assets?.plusOfflineIcon },
                      ].map((item, idx) => {
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={idx}
                            onClick={() => triggerToast(`点击了【${item.name}】拓展功能`)}
                            className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                          >
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs border border-black/5 hover:scale-105 transition-transform overflow-hidden"
                              style={{
                                backgroundColor: item.asset ? 'transparent' : (editingTheme.css['--gg-plus-icon-bg'] || '#ffffff'),
                                color: editingTheme.css['--gg-plus-icon-color'] || '#374151',
                              }}
                            >
                              {item.asset ? (
                                <img src={item.asset} alt={item.name} className="w-full h-full object-contain drop-shadow-xs" />
                              ) : (
                                <ItemIcon className="w-4 h-4" />
                              )}
                            </div>
                            <span
                              className="text-[7.5px]"
                              style={{ color: editingTheme.css['--gg-plus-item-text'] || editingTheme.css['--gg-text-primary'] || '#4b5563' }}
                            >
                              {item.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 5: 语音录制面板专用预览 (与实际 ChatRoom 的「发送微信语音」弹窗 1:1 像素级一致) */}
                {previewTab === 'voicepanel' && (
                  <div
                    className="flex-1 relative flex flex-col justify-between overflow-hidden"
                    style={{
                      backgroundColor: editingTheme.assets?.chatBg ? 'transparent' : (editingTheme.css['--gg-page-bg'] || '#ededed')
                    }}
                  >
                    {/* 背景：聊天室暗色遮罩 */}
                    {editingTheme.assets?.chatBg && (
                      <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={getBubbleBgStyle({
                          isUser: false,
                          prefix: 'chat',
                          editingTheme,
                          bubbleBgUrl: editingTheme.assets.chatBg,
                          isDot9: editingTheme.css?.['--gg-is-dot9-chatBg'] !== 'false',
                        })}
                      />
                    )}

                    {/* 模拟背后被遮盖的聊天气泡 */}
                    <div className="absolute inset-0 p-2 opacity-30 pointer-events-none flex flex-col justify-around z-0">
                      <div className="flex gap-1.5 items-start">
                        <Avatar src={demoFriend.avatar} className="w-5 h-5 rounded" size={10} />
                        <div className="p-1.5 rounded-lg bg-white text-[7px] max-w-[120px]">
                          晚上一起去吃饭吗？
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-start justify-end">
                        <div className="p-1.5 rounded-lg bg-emerald-500 text-white text-[7px] max-w-[120px]">
                          好呀，我发语音跟你说！
                        </div>
                        <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-5 h-5 rounded" size={10} />
                      </div>
                    </div>

                    {/* 弹窗遮罩层与居中弹窗 */}
                    <div className="relative z-10 flex-1 bg-black/40 flex items-center justify-center p-2">
                      <div
                        className="w-full max-w-[210px] rounded-xl p-2.5 shadow-2xl border border-black/10 text-[7.5px] space-y-2 relative overflow-hidden select-none animate-in zoom-in-95 duration-150"
                        style={{
                          backgroundImage: editingTheme.assets?.voiceModalBg ? `url('${editingTheme.assets.voiceModalBg}')` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: editingTheme.assets?.voiceModalBg ? 'transparent' : (editingTheme.css['--gg-voice-panel-bg'] || '#ffffff'),
                          color: editingTheme.css['--gg-voice-panel-text'] || '#1c1917',
                        }}
                      >
                        <div className="relative z-10 space-y-2">
                          {/* 弹窗标题栏 */}
                          <div className="flex items-center justify-between border-b border-black/5 pb-1">
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-4.5 h-4.5 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-xs"
                                style={{
                                  backgroundColor: editingTheme.css['--gg-voice-mic-bg'] || '#dcfce7',
                                  color: editingTheme.css['--gg-voice-mic-icon-color'] || '#07c160'
                                }}
                              >
                                <Mic className="w-2.5 h-2.5" />
                              </div>
                              <span
                                className="font-bold text-[8.5px]"
                                style={{ color: editingTheme.css['--gg-voice-panel-text'] || '#1c1917' }}
                              >
                                发送微信语音
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => triggerToast('点击了关闭')}
                              className="p-0.5 cursor-pointer opacity-60 hover:opacity-100"
                              style={{ color: editingTheme.css['--gg-voice-panel-text'] || '#1c1917' }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {/* 语音文字内容 */}
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium text-[7px]" style={{ color: editingTheme.css['--gg-voice-panel-text'] || '#57534e' }}>
                                语音文字内容
                              </span>
                              <span className="text-[6.5px] opacity-60" style={{ color: editingTheme.css['--gg-voice-panel-text'] || '#a8a29e' }}>
                                {previewVoiceContent.length} 字
                              </span>
                            </div>
                            <textarea
                              value={previewVoiceContent}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPreviewVoiceContent(val);
                                setPreviewVoiceDuration(Math.min(60, Math.max(2, Math.round(val.length / 3.2))));
                              }}
                              placeholder="输入你想以语音发送的内容..."
                              rows={2}
                              className="w-full p-1 border border-black/10 rounded-lg text-[7px] resize-none focus:outline-none"
                              style={{
                                backgroundColor: editingTheme.css['--gg-voice-field-bg'] || '#f5f5f4',
                                color: editingTheme.css['--gg-voice-field-text'] || editingTheme.css['--gg-voice-panel-text'] || '#1c1917'
                              }}
                            />
                            {/* 预设快捷文字 */}
                            <div className="flex flex-wrap gap-0.8 mt-0.8">
                              {['行，等会儿见！', '收到，马上到！', '哈哈哈哈笑死我了', '改天约~'].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => {
                                    setPreviewVoiceContent(preset);
                                    setPreviewVoiceDuration(Math.min(60, Math.max(2, Math.round(preset.length / 3.2))));
                                  }}
                                  className="px-1 py-0.2 rounded bg-black/5 hover:bg-black/10 text-[6.5px] cursor-pointer active:scale-95 transition-transform"
                                  style={{ color: editingTheme.css['--gg-voice-panel-text'] || '#57534e' }}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 语音时长控制 */}
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium text-[7px] flex items-center gap-0.5" style={{ color: editingTheme.css['--gg-voice-panel-text'] || '#57534e' }}>
                                <Clock className="w-2.5 h-2.5 opacity-60" />
                                <span>语音时长</span>
                              </span>
                              <span
                                className="font-mono text-[7.5px] font-bold"
                                style={{ color: editingTheme.css['--gg-voice-slider-color'] || editingTheme.css['--gg-accent-color'] || '#07c160' }}
                              >
                                {previewVoiceDuration}" 秒
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="range"
                                min={1}
                                max={60}
                                value={previewVoiceDuration}
                                onChange={(e) => setPreviewVoiceDuration(Number(e.target.value))}
                                className="flex-1 cursor-pointer h-1"
                                style={{ accentColor: editingTheme.css['--gg-voice-slider-color'] || editingTheme.css['--gg-accent-color'] || '#07c160' }}
                              />
                              <span
                                className="w-6 py-0.2 text-center font-mono text-[6.5px] border border-black/10 rounded bg-black/5"
                                style={{
                                  backgroundColor: editingTheme.css['--gg-voice-field-bg'] || '#f5f5f4',
                                  color: editingTheme.css['--gg-voice-field-text'] || editingTheme.css['--gg-voice-panel-text'] || '#1c1917'
                                }}
                              >
                                {previewVoiceDuration}s
                              </span>
                            </div>
                          </div>

                          {/* 底部按钮 */}
                          <div className="flex gap-1.5 pt-0.5 items-stretch">
                            <button
                              type="button"
                              onClick={() => triggerToast('已取消')}
                              className="relative flex-1 py-1 px-2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[26px] rounded-lg border border-black/10"
                              style={{
                                backgroundColor: editingTheme.css['--gg-voice-cancel-bg'] || '#f5f5f4',
                                color: editingTheme.css['--gg-voice-cancel-text'] || '#57534e'
                              }}
                            >
                              <span className="font-medium text-[7.5px]">取消</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => triggerToast(`已模拟发送语音「${previewVoiceContent}」(${previewVoiceDuration}")`)}
                              className="relative flex-1 py-1 px-2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[26px] rounded-lg shadow-xs"
                              style={{
                                backgroundColor: editingTheme.css['--gg-voice-submit-bg'] || '#07c160',
                                color: editingTheme.css['--gg-voice-submit-text'] || '#ffffff'
                              }}
                            >
                              <span className="font-bold text-[7.5px] flex items-center justify-center gap-0.8">
                                <Send className="w-2.5 h-2.5" />
                                <span>发送语音</span>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 7: 拍照描述面板专用预览 */}
                {previewTab === 'photopanel' && (
                  <div
                    className="flex-1 relative flex flex-col justify-between overflow-hidden"
                    style={{
                      backgroundColor: editingTheme.assets?.chatBg ? 'transparent' : (editingTheme.css['--gg-page-bg'] || '#ededed')
                    }}
                  >
                    {editingTheme.assets?.chatBg && (
                      <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={getBubbleBgStyle({
                          isUser: false,
                          prefix: 'chat',
                          editingTheme,
                          bubbleBgUrl: editingTheme.assets.chatBg,
                          isDot9: editingTheme.css?.['--gg-is-dot9-chatBg'] !== 'false',
                        })}
                      />
                    )}
                    <div className="relative z-10 flex-1 bg-black/40 flex items-center justify-center p-2">
                      <div
                        className="w-full max-w-[210px] rounded-xl p-2.5 shadow-2xl border border-black/10 text-[7.5px] space-y-2 relative overflow-hidden select-none animate-in zoom-in-95 duration-150"
                        style={{
                          backgroundImage: editingTheme.assets?.photoModalBg ? `url('${editingTheme.assets.photoModalBg}')` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: editingTheme.assets?.photoModalBg ? 'transparent' : (editingTheme.css['--gg-photo-panel-bg'] || '#ffffff'),
                          color: editingTheme.css['--gg-photo-panel-text'] || '#1c1917',
                        }}
                      >
                        <div className="relative z-10 space-y-2">
                          <div className="flex items-center justify-between border-b border-black/5 pb-1">
                            <div className="flex items-center gap-1 font-bold text-[8.5px]">
                              <Camera className="w-3.5 h-3.5" style={{ color: editingTheme.css['--gg-photo-icon-color'] || '#059669' }} />
                              <span style={{ color: editingTheme.css['--gg-photo-panel-text'] || '#1c1917' }}>拍摄并描述照片</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => triggerToast('点击了关闭')}
                              className="p-0.5 cursor-pointer opacity-60 hover:opacity-100"
                              style={{ color: editingTheme.css['--gg-photo-panel-text'] || '#1c1917' }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div>
                            <span className="block text-[6.5px] opacity-70 mb-0.5" style={{ color: editingTheme.css['--gg-photo-panel-text'] || '#57534e' }}>
                              照片内容文字描述
                            </span>
                            <textarea
                              defaultValue="我们一起在海边看日出，海风轻拂..."
                              rows={2}
                              className="w-full p-1 border border-black/10 rounded-lg text-[7px] resize-none focus:outline-none"
                              style={{
                                backgroundColor: editingTheme.css['--gg-photo-field-bg'] || '#ffffff',
                                color: editingTheme.css['--gg-photo-field-text'] || editingTheme.css['--gg-photo-panel-text'] || '#1c1917'
                              }}
                            />
                          </div>
                          <div className="flex gap-1.5 pt-0.5 items-stretch">
                            <button
                              type="button"
                              onClick={() => triggerToast('已取消')}
                              className="flex-1 py-1 px-2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[26px] rounded-lg border border-black/10"
                              style={{
                                backgroundColor: editingTheme.css['--gg-photo-cancel-bg'] || '#ffffff',
                                color: editingTheme.css['--gg-photo-cancel-text'] || '#57534e'
                              }}
                            >
                              <span className="font-medium text-[7.5px]">取消</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerToast('模拟发送照片')}
                              className="flex-1 py-1 px-2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[26px] rounded-lg shadow-xs"
                              style={{
                                backgroundColor: editingTheme.css['--gg-photo-submit-bg'] || '#07c160',
                                color: editingTheme.css['--gg-photo-submit-text'] || '#ffffff'
                              }}
                            >
                              <span className="font-bold text-[7.5px]">发送照片</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 8: 微信转账面板专用预览 */}
                {previewTab === 'transferpanel' && (
                  <div
                    className="flex-1 relative flex flex-col justify-between overflow-hidden"
                    style={{
                      backgroundColor: editingTheme.assets?.chatBg ? 'transparent' : (editingTheme.css['--gg-page-bg'] || '#ededed')
                    }}
                  >
                    {editingTheme.assets?.chatBg && (
                      <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={getBubbleBgStyle({
                          isUser: false,
                          prefix: 'chat',
                          editingTheme,
                          bubbleBgUrl: editingTheme.assets.chatBg,
                          isDot9: editingTheme.css?.['--gg-is-dot9-chatBg'] !== 'false',
                        })}
                      />
                    )}
                    <div className="relative z-10 flex-1 bg-black/40 flex items-center justify-center p-2">
                      <div
                        className="w-full max-w-[210px] rounded-xl p-2.5 shadow-2xl border border-black/10 text-[7.5px] space-y-2 relative overflow-hidden select-none animate-in zoom-in-95 duration-150"
                        style={{
                          backgroundImage: editingTheme.assets?.transferModalBg ? `url('${editingTheme.assets.transferModalBg}')` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: editingTheme.assets?.transferModalBg ? 'transparent' : (editingTheme.css['--gg-transfer-panel-bg'] || '#ffffff'),
                          color: editingTheme.css['--gg-transfer-panel-text'] || '#1c1917',
                        }}
                      >
                        <div className="relative z-10 space-y-2">
                          <div className="flex items-center justify-between border-b border-black/5 pb-1">
                            <div className="flex items-center gap-1 font-bold text-[8.5px]">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: editingTheme.css['--gg-transfer-icon-bg'] || '#fef3c7',
                                  color: editingTheme.css['--gg-transfer-icon-color'] || '#b45309'
                                }}
                              >
                                <Coins className="w-2.5 h-2.5" />
                              </div>
                              <span style={{ color: editingTheme.css['--gg-transfer-panel-text'] || '#1c1917' }}>微信转账给TA</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => triggerToast('点击了关闭')}
                              className="p-0.5 cursor-pointer opacity-60 hover:opacity-100"
                              style={{ color: editingTheme.css['--gg-transfer-panel-text'] || '#1c1917' }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div>
                            <span className="block text-[6.5px] opacity-70 mb-0.5" style={{ color: editingTheme.css['--gg-transfer-panel-text'] || '#57534e' }}>
                              转账金额 (元)
                            </span>
                            <div 
                              className="flex items-center gap-1 p-1 rounded-lg border border-black/10"
                              style={{ backgroundColor: editingTheme.css['--gg-transfer-field-bg'] || '#f5f5f4' }}
                            >
                              <span className="font-bold text-[9px]" style={{ color: editingTheme.css['--gg-transfer-icon-color'] || '#b45309' }}>¥</span>
                              <input
                                defaultValue="520.00"
                                className="w-full bg-transparent text-[8px] font-mono font-bold focus:outline-none"
                                style={{ color: editingTheme.css['--gg-transfer-field-text'] || editingTheme.css['--gg-transfer-panel-text'] || '#1c1917' }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-1.5 pt-0.5 items-stretch">
                            <button
                              type="button"
                              onClick={() => triggerToast('已取消')}
                              className="flex-1 py-1 px-2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[26px] rounded-lg border border-black/10"
                              style={{
                                backgroundColor: editingTheme.css['--gg-transfer-cancel-bg'] || '#ffffff',
                                color: editingTheme.css['--gg-transfer-cancel-text'] || '#57534e'
                              }}
                            >
                              <span className="font-medium text-[7.5px]">取消</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerToast('模拟转账成功')}
                              className="flex-1 py-1 px-2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[26px] rounded-lg shadow-xs"
                              style={{
                                backgroundColor: editingTheme.css['--gg-transfer-submit-bg'] || '#f59e0b',
                                color: editingTheme.css['--gg-transfer-submit-text'] || '#ffffff'
                              }}
                            >
                              <span className="font-bold text-[7.5px]">确认转账</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 9: 发送定位面板专用预览 */}
                {previewTab === 'locationpanel' && (
                  <div
                    className="flex-1 relative flex flex-col justify-between overflow-hidden"
                    style={{
                      backgroundColor: editingTheme.assets?.chatBg ? 'transparent' : (editingTheme.css['--gg-page-bg'] || '#ededed')
                    }}
                  >
                    {editingTheme.assets?.chatBg && (
                      <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={getBubbleBgStyle({
                          isUser: false,
                          prefix: 'chat',
                          editingTheme,
                          bubbleBgUrl: editingTheme.assets.chatBg,
                          isDot9: editingTheme.css?.['--gg-is-dot9-chatBg'] !== 'false',
                        })}
                      />
                    )}
                    <div className="relative z-10 flex-1 bg-black/40 flex items-center justify-center p-2">
                      <div
                        className="w-full max-w-[210px] rounded-xl p-2.5 shadow-2xl border border-black/10 text-[7.5px] space-y-2 relative overflow-hidden select-none animate-in zoom-in-95 duration-150"
                        style={{
                          backgroundImage: editingTheme.assets?.locationModalBg ? `url('${editingTheme.assets.locationModalBg}')` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: editingTheme.assets?.locationModalBg ? 'transparent' : (editingTheme.css['--gg-location-panel-bg'] || '#ffffff'),
                          color: editingTheme.css['--gg-location-panel-text'] || '#1c1917',
                        }}
                      >
                        <div className="relative z-10 space-y-2">
                          <div className="flex items-center justify-between border-b border-black/5 pb-1">
                            <div className="flex items-center gap-1 font-bold text-[8.5px]">
                              <MapPin className="w-3.5 h-3.5" style={{ color: editingTheme.css['--gg-location-icon-color'] || '#059669' }} />
                              <span style={{ color: editingTheme.css['--gg-location-panel-text'] || '#1c1917' }}>发送我的位置</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => triggerToast('点击了关闭')}
                              className="p-0.5 cursor-pointer opacity-60 hover:opacity-100"
                              style={{ color: editingTheme.css['--gg-location-panel-text'] || '#1c1917' }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div>
                            <input
                              defaultValue="星巴克臻选店 (滨江大道店)"
                              className="w-full p-1 border border-black/10 rounded-lg text-[7px] focus:outline-none"
                              style={{
                                backgroundColor: editingTheme.css['--gg-location-field-bg'] || '#ffffff',
                                color: editingTheme.css['--gg-location-field-text'] || editingTheme.css['--gg-location-panel-text'] || '#1c1917'
                              }}
                            />
                            <div className="flex gap-0.8 mt-1">
                              {['商场大门', '地铁出口', '电影院'].map((loc) => (
                                <span
                                  key={loc}
                                  className="px-1 py-0.2 rounded text-[6px] border border-black/5"
                                  style={{
                                    backgroundColor: editingTheme.css['--gg-location-chip-bg'] || '#f5f5f4',
                                    color: editingTheme.css['--gg-location-chip-text'] || '#57534e'
                                  }}
                                >
                                  {loc}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1.5 pt-0.5 items-stretch">
                            <button
                              type="button"
                              onClick={() => triggerToast('已取消')}
                              className="flex-1 py-1 px-2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[26px] rounded-lg border border-black/10"
                              style={{
                                backgroundColor: editingTheme.css['--gg-location-cancel-bg'] || '#ffffff',
                                color: editingTheme.css['--gg-location-cancel-text'] || '#57534e'
                              }}
                            >
                              <span className="font-medium text-[7.5px]">取消</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerToast('模拟发送定位')}
                              className="flex-1 py-1 px-2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform min-h-[26px] rounded-lg shadow-xs"
                              style={{
                                backgroundColor: editingTheme.css['--gg-location-submit-bg'] || '#07c160',
                                color: editingTheme.css['--gg-location-submit-text'] || '#ffffff'
                              }}
                            >
                              <span className="font-bold text-[7.5px]">发送定位</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 6: 语音通话界面 (Voice Call Preview - 与实际 VoiceCallModal 保持 1:1 像素级一致) */}
                {previewTab === 'call' && (
                  <div
                    className="flex-1 px-2.5 py-2 flex flex-col justify-between text-center relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-850 to-stone-950 text-white select-none"
                    style={{
                      backgroundColor: editingTheme.css?.['--gg-call-bg'] || undefined,
                      color: editingTheme.css?.['--gg-call-text'] || undefined
                    }}
                  >
                    {/* 专属通话背景图或动态弥散光影背景 */}
                    {editingTheme.assets?.callBg ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center pointer-events-none z-0"
                        style={{ backgroundImage: `url('${editingTheme.assets.callBg}')` }}
                      />
                    ) : (
                      <div
                        className="absolute inset-0 opacity-20 bg-cover bg-center filter blur-xl scale-125 pointer-events-none"
                        style={{ backgroundImage: `url(${demoFriend.avatar})` }}
                      />
                    )}

                    {/* 顶部栏：最小化减号按钮 + 呼吸绿点通话状态 + 通话记录胶囊 */}
                    <div className="relative z-10 flex items-center justify-between pt-0.5 px-0.5">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('chat')}
                        className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shadow-xs cursor-pointer active:scale-90 transition-transform"
                        style={{
                          backgroundColor: editingTheme.css?.['--gg-call-minimize-bg'] || undefined,
                          color: editingTheme.css?.['--gg-call-minimize-color'] || undefined
                        }}
                        title="点击最小化，返回聊天"
                      >
                        <Minus className="w-3 h-3" style={{ color: editingTheme.css?.['--gg-call-minimize-color'] || undefined }} />
                      </button>

                      <div className="flex items-center gap-1">
                        <span 
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" 
                          style={{ backgroundColor: editingTheme.css?.['--gg-call-dot-color'] || undefined }}
                        />
                        <span 
                          className="text-[7.5px] text-stone-300 font-medium tracking-wide"
                          style={{ color: editingTheme.css?.['--gg-call-subtext'] || (editingTheme.css?.['--gg-call-text'] ? `${editingTheme.css['--gg-call-text']}cc` : undefined) }}
                        >
                          通话中 · 02:15
                        </span>
                      </div>

                      <div 
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[7px] border border-white/10"
                        style={{
                          backgroundColor: editingTheme.css?.['--gg-call-history-bg'] || undefined,
                          color: editingTheme.css?.['--gg-call-history-text'] || undefined
                        }}
                      >
                        <History 
                          className="w-2.5 h-2.5 text-emerald-400" 
                          style={{ color: editingTheme.css?.['--gg-call-history-icon-color'] || undefined }}
                        />
                        <span style={{ color: editingTheme.css?.['--gg-call-history-text'] || undefined }}>记录 (2)</span>
                      </div>
                    </div>

                    {/* 最小化悬浮窗 - 实时预览浮态胶囊组件 */}
                    <div className="absolute right-1.5 top-9 z-30 pointer-events-none flex flex-col items-end gap-0.5">
                      <span className="text-[6.5px] text-stone-300 font-bold bg-black/60 px-1 py-0.2 rounded scale-90 origin-right">悬浮窗效果</span>
                      <div
                        className="flex items-center gap-1.5 px-2 py-1 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in fade-in"
                        style={{
                          backgroundColor: editingTheme.css?.['--gg-call-float-bg'] || '#059669',
                          borderColor: editingTheme.css?.['--gg-call-float-border'] || '#34d399',
                          color: editingTheme.css?.['--gg-call-float-text'] || '#ffffff'
                        }}
                      >
                        <div className="relative shrink-0">
                          <Avatar
                            src={demoFriend.avatar}
                            name={demoFriend.name}
                            className="w-5 h-5 rounded-full border shadow-xs"
                            style={{ borderColor: editingTheme.css?.['--gg-call-float-avatar-border'] || 'rgba(255, 255, 255, 0.4)' }}
                            size={12}
                          />
                          <span 
                            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full flex items-center justify-center ring-1 ring-white"
                            style={{ backgroundColor: editingTheme.css?.['--gg-call-dot-color'] || '#34d399' }}
                          >
                            <Phone className="w-1 h-1 text-stone-900" />
                          </span>
                        </div>
                        <div className="flex flex-col text-left min-w-0 pr-0.5 leading-none">
                          <span 
                            className="text-[8.5px] font-bold truncate max-w-[50px]"
                            style={{ color: editingTheme.css?.['--gg-call-float-text'] || '#ffffff' }}
                          >
                            {demoFriend.remark || demoFriend.name}
                          </span>
                          <span 
                            className="text-[6.5px] opacity-80 mt-0.5 font-mono"
                            style={{ color: editingTheme.css?.['--gg-call-float-text'] || '#ffffff' }}
                          >
                            02:15
                          </span>
                        </div>
                        <div className="flex items-end gap-0.5 h-2.5 shrink-0">
                          <span 
                            className="w-0.5 h-1.5 rounded-full animate-pulse" 
                            style={{ backgroundColor: editingTheme.css?.['--gg-call-wave-color'] || '#34d399' }}
                          />
                          <span 
                            className="w-0.5 h-2.5 rounded-full animate-bounce" 
                            style={{ backgroundColor: editingTheme.css?.['--gg-call-wave-color'] || '#34d399' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 中部舞台：声波环绕大头像 + 好友名 + 音色标签 + 实时语音字幕卡片 */}
                    <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1">
                      <div className="relative flex items-center justify-center mb-1.5">
                        <div 
                          className="absolute w-14 h-14 rounded-full bg-emerald-500/20 animate-ping" 
                          style={{ backgroundColor: editingTheme.css?.['--gg-call-wave-color'] ? `${editingTheme.css['--gg-call-wave-color']}33` : undefined }}
                        />
                        <div 
                          className="absolute w-16 h-16 rounded-full border border-emerald-500/30 animate-pulse" 
                          style={{ borderColor: editingTheme.css?.['--gg-call-wave-color'] ? `${editingTheme.css['--gg-call-wave-color']}66` : undefined }}
                        />
                        <Avatar
                          src={demoFriend.avatar}
                          name={demoFriend.name}
                          className="w-11 h-11 rounded-full border-2 border-emerald-400 shadow-xl relative z-10 scale-105"
                          style={{ borderColor: editingTheme.css?.['--gg-call-wave-color'] || undefined }}
                          size={16}
                        />
                      </div>

                      <span 
                        className="font-bold text-[10px] tracking-wide"
                        style={{ color: editingTheme.css?.['--gg-call-text'] || undefined }}
                      >
                        {demoFriend.remark || demoFriend.name}
                      </span>
                      <span 
                        className="text-[7px] text-stone-400 font-mono mt-0.2"
                        style={{ color: editingTheme.css?.['--gg-call-subtext'] || undefined }}
                      >
                        音色: 甜美治愈
                      </span>

                      {/* 实时语音字幕卡片 (与 VoiceCallModal 完全一致) */}
                      <div className="w-full max-w-[210px] mt-2">
                        <div 
                          className="p-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-center shadow-md"
                          style={{ backgroundColor: editingTheme.css?.['--gg-call-card-bg'] || undefined }}
                        >
                          <div 
                            className="flex items-center justify-center gap-1 text-[7.5px] text-emerald-400 mb-0.5 font-medium"
                            style={{ color: editingTheme.css?.['--gg-call-wave-color'] || undefined }}
                          >
                            <Volume2 className="w-2.5 h-2.5 animate-bounce" style={{ color: editingTheme.css?.['--gg-call-wave-color'] || undefined }} />
                            <span>对方正在说话...</span>
                          </div>
                          <p 
                            className="text-[8px] font-medium leading-relaxed"
                            style={{ color: editingTheme.css?.['--gg-call-card-text'] || undefined }}
                          >
                            “亲爱的，新换的工坊皮肤太好看了，我很喜欢！”
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 底部控制区：输入框 + 快捷短语 + 红色胶囊挂断按钮 */}
                    <div className="relative z-10 space-y-1.5 pb-1">
                      {/* 输入框胶囊 */}
                      <div 
                        className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15"
                        style={{ backgroundColor: editingTheme.css?.['--gg-call-input-bg'] || undefined }}
                      >
                        <span 
                          className="flex-1 text-left text-[7px] text-stone-400 truncate"
                          style={{ color: editingTheme.css?.['--gg-call-input-text'] ? `${editingTheme.css['--gg-call-input-text']}99` : undefined }}
                        >
                          输入你想对TA说的话...
                        </span>
                        <div 
                          className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs"
                          style={{ 
                            backgroundColor: editingTheme.css?.['--gg-call-send-btn-bg'] || undefined,
                          }}
                        >
                          <Send className="w-2.5 h-2.5" style={{ color: editingTheme.css?.['--gg-call-send-icon-color'] || undefined }} />
                        </div>
                      </div>

                      {/* 快捷短语胶囊 & 红色挂断按钮 */}
                      <div className="flex items-center justify-between px-0.5">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                          {['喂？', '在干嘛呢', '喜欢新皮肤'].map((phrase, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded-full bg-white/10 text-[6.5px] text-stone-300 border border-white/5 shrink-0"
                            >
                              {phrase}
                            </span>
                          ))}
                        </div>

                        {/* 挂断按钮 */}
                        <button
                          type="button"
                          onClick={() => setPreviewTab('chat')}
                          className="flex items-center gap-0.8 px-2 py-0.8 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 text-white font-bold text-[7.5px] shadow-md cursor-pointer transition-transform shrink-0"
                          style={{
                            backgroundColor: editingTheme.css?.['--gg-call-hangup-bg'] || undefined,
                            color: editingTheme.css?.['--gg-call-hangup-text'] || undefined
                          }}
                          title="挂断通话，返回聊天"
                        >
                          <PhoneOff className="w-2.5 h-2.5" style={{ color: editingTheme.css?.['--gg-call-hangup-text'] || undefined }} />
                          <span>挂断</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. 行程小弹窗实时预览浮层 (点击顶栏行程按钮或选择相应分类触发) */}
                {previewShowSchedule && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center p-2.5 bg-black/60 backdrop-blur-2xs animate-in fade-in">
                    <div
                      className="w-full max-w-[245px] max-h-[92%] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
                      style={{
                        backgroundColor: editingTheme.assets?.scheduleModalBg ? 'transparent' : (editingTheme.css['--gg-schedule-modal-bg'] || '#ffffff'),
                        color: editingTheme.css['--gg-schedule-modal-text'] || '#1c1917',
                        border: editingTheme.css['--gg-schedule-modal-border'] || '1px solid rgba(0,0,0,0.1)',
                        borderRadius: editingTheme.css['--gg-schedule-modal-radius'] || '18px',
                      }}
                    >
                      {/* 弹窗背景贴图 */}
                      {editingTheme.assets?.scheduleModalBg && (
                        <div
                          className="absolute inset-0 pointer-events-none z-0"
                          style={getBubbleBgStyle({
                            isUser: false,
                            prefix: 'scheduleModal',
                            editingTheme,
                            bubbleBgUrl: editingTheme.assets.scheduleModalBg,
                            isDot9: editingTheme.css?.['--gg-is-dot9-scheduleModalBg'] !== 'false',
                          })}
                        />
                      )}
                      {/* 弹窗顶栏 */}
                      <div className="relative z-10 px-2.5 py-2 border-b border-black/5 flex items-center justify-between">
                        <div className="flex items-center gap-1 font-bold text-[10px]">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>今日作息与行程</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewShowSchedule(false)}
                          className="p-0.5 rounded-full hover:bg-black/10 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      </div>
                      {/* 弹窗内容区 */}
                      <div className="relative z-10 p-2 space-y-1.5 overflow-y-auto text-[9px]">
                        {/* 当前进行中卡片 */}
                        <div
                          className="p-2 rounded-xl border flex flex-col gap-0.5 shadow-2xs"
                          style={{
                            backgroundColor: editingTheme.css['--gg-schedule-current-card-bg'] || 'rgba(245, 158, 11, 0.08)',
                            borderColor: editingTheme.css['--gg-schedule-current-card-border'] || 'rgba(245, 158, 11, 0.35)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[9px] text-amber-600">14:00 - 16:30</span>
                            <span
                              className="px-1.5 py-0.5 rounded-full text-[7.5px] font-bold"
                              style={{
                                backgroundColor: editingTheme.css['--gg-schedule-current-badge-bg'] || '#f59e0b',
                                color: editingTheme.css['--gg-schedule-current-badge-text'] || '#ffffff',
                              }}
                            >
                              正在进行
                            </span>
                          </div>
                          <div className="font-semibold text-stone-900 mt-0.5">在自习室复习功课 / 准备材料</div>
                        </div>
                        {/* 其他时段卡片 */}
                        <div
                          className="p-2 rounded-xl border flex flex-col gap-0.5"
                          style={{
                            backgroundColor: editingTheme.css['--gg-schedule-item-bg'] || 'rgba(0,0,0,0.03)',
                            borderColor: editingTheme.css['--gg-schedule-item-border'] || 'rgba(0,0,0,0.05)',
                          }}
                        >
                          <div className="text-[8px] opacity-60">17:00 - 18:30</div>
                          <div className="font-medium text-stone-800">散步觅食 & 线下赴约</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 下半部：分类编辑面板 */}
          <div className="flex-1 flex overflow-hidden bg-[#fcf8f2]">
            {/* 左侧分类 Tab */}
            <div className="w-24 bg-[#f5ede4]/70 border-r border-[#ebd2cb] overflow-y-auto p-1 space-y-0.5 shrink-0 scrollbar-none">
              {Object.keys(editableCategories).map((catName) => {
                const IconComp = editableCategories[catName].icon;
                const isSelected = selectedCategory === catName;
                return (
                  <button
                    key={catName}
                    onClick={() => {
                      setSelectedCategory(catName);
                      if (catName === '📱 桌面主屏幕壁纸') {
                        setPreviewTab('desktop');
                      } else if (catName === '💬 私聊背景壁纸') {
                        setPreviewTab('chat');
                      } else if (catName === '📋 微信界面壁纸/列表' || catName === '聊天列表' || catName === '底部标签栏') {
                        setPreviewTab('chatlist');
                      } else if (catName === '朋友圈') {
                        setPreviewTab('moments');
                      } else if (catName === '+拓展菜单') {
                        setPreviewTab('pluspanel');
                        setShowChatPlusDrawer(true);
                      } else if (catName === '发送语音面板') {
                        setPreviewTab('voicepanel');
                      } else if (catName === '拍照面板') {
                        setPreviewTab('photopanel');
                      } else if (catName === '转账面板') {
                        setPreviewTab('transferpanel');
                      } else if (catName === '发定位面板') {
                        setPreviewTab('locationpanel');
                      } else if (catName === '语音通话') {
                        setPreviewTab('call');
                      } else if (catName === '线下见面邀请') {
                        setPreviewTab('chat');
                        setChatScenario('invite');
                      } else if (catName === '行程按钮与弹窗') {
                        setPreviewTab('chat');
                        setPreviewShowSchedule(true);
                      } else {
                        setPreviewTab('chat');
                      }
                    }}
                    className={`w-full px-2 py-2 rounded-xl text-left text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#d9828b] to-[#c7727b] text-white shadow-xs font-bold'
                        : 'text-[#6e4348] hover:bg-white/60 hover:text-[#4a3b3d]'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{catName}</span>
                  </button>
                );
              })}
            </div>

            {/* 右侧属性调节表单 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 bg-[#fcf8f2]">
              {/* 主题基本信息配置 (仅在整体外观显示) */}
              {selectedCategory === '整体外观' && (
                <div className="space-y-2.5">
                  {/* 实时联动提示条 */}
                  <div className="p-2.5 bg-[#fae8eb] border border-[#e8cbd0] rounded-xl text-[11px] text-[#4a3b3d] space-y-1 shadow-2xs">
                    <div className="font-bold flex items-center gap-1.5 text-[#b85c67]">
                      <span>✨</span> 手机外壳与全局文字实时联动
                    </div>
                    <p className="text-[#7a585c] text-[10px] leading-relaxed">
                      调节下方色彩时，不仅上方迷你预览模型实时响应，外部真实手机壳底色及全局文字/强调色也已实现毫秒级同步变色。
                    </p>
                  </div>

                  {/* 一键预设整体风格 */}
                  <div className="p-2.5 bg-[#fffdfa] rounded-xl border border-[#ecdcd9] space-y-1.5">
                    <div className="text-[10px] font-bold text-[#8c6f72]">一键套用经典配色方案</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        {
                          name: '🌹 优雅豆沙',
                          shell: '#4a3b3d',
                          accent: '#d9828b',
                          text1: '#4a3b3d',
                          text2: '#8c6f72',
                          page: '#fcf8f2'
                        },
                        {
                          name: '🌸 樱花蜜桃',
                          shell: '#fbcfe8',
                          accent: '#ec4899',
                          text1: '#4a044e',
                          text2: '#9d174d',
                          page: '#fdf2f8'
                        },
                        {
                          name: '☕ 暖白奶咖',
                          shell: '#78350f',
                          accent: '#d97706',
                          text1: '#451a03',
                          text2: '#92400e',
                          page: '#fef3c7'
                        },
                        {
                          name: '🍵 抹茶青森',
                          shell: '#365314',
                          accent: '#65a30d',
                          text1: '#14532d',
                          text2: '#4d7c0f',
                          page: '#f7fee7'
                        },
                        {
                          name: '🖤 极简曜黑',
                          shell: '#18181b',
                          accent: '#10b981',
                          text1: '#18181b',
                          text2: '#71717a',
                          page: '#f4f4f5'
                        },
                        {
                          name: '🫐 莫兰迪雾蓝',
                          shell: '#334155',
                          accent: '#3b82f6',
                          text1: '#1e293b',
                          text2: '#64748b',
                          page: '#f1f5f9'
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setEditingTheme(prev => ({
                              ...prev,
                              css: {
                                ...prev.css,
                                '--gg-shell-bg': preset.shell,
                                '--gg-accent-color': preset.accent,
                                '--gg-text-primary': preset.text1,
                                '--gg-text-secondary': preset.text2,
                                '--gg-page-bg': preset.page,
                              }
                            }));
                          }}
                          className="flex items-center justify-between p-1.5 rounded-lg border border-[#ecdcd9] bg-white hover:border-[#d9828b] hover:shadow-2xs text-[10px] font-medium text-[#593c3f] cursor-pointer transition-all active:scale-95"
                        >
                          <span className="truncate">{preset.name}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: preset.shell }} title="外壳" />
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: preset.accent }} title="强调色" />
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: preset.page }} title="底色" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 主题基本信息配置 */}
                  <div className="p-2.5 bg-[#fffdfa] rounded-xl border border-[#ecdcd9] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-[#8c6f72]">主题信息与配置备份</div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleExportJSON(editingTheme)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#f5ede4] border border-[#ebd2cb] text-[#593c3f] hover:text-[#b85c67] hover:border-[#d9828b] flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all font-medium"
                          title="导出此主题为 JSON 文件"
                        >
                          <Download className="w-3 h-3 text-[#b85c67]" />
                          <span>导出 JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => jsonImportRef.current?.click()}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#f5ede4] border border-[#ebd2cb] text-[#593c3f] hover:text-[#b85c67] hover:border-[#d9828b] flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all font-medium"
                          title="导入主题 JSON 文件"
                        >
                          <Upload className="w-3 h-3 text-[#b85c67]" />
                          <span>导入 JSON</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-medium text-[#593c3f] shrink-0">主题名称</label>
                      <input
                        type="text"
                        value={editingTheme.name}
                        onChange={(e) => setEditingTheme(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1 px-2 py-1 text-xs bg-white rounded-lg border border-[#ebd2cb] focus:outline-none focus:border-[#d9828b] font-bold text-[#593c3f]"
                        placeholder="我的主题"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-medium text-[#593c3f] shrink-0">作者描述</label>
                      <input
                        type="text"
                        value={editingTheme.description || ''}
                        onChange={(e) => setEditingTheme(prev => ({ ...prev, description: e.target.value }))}
                        className="flex-1 px-2 py-1 text-xs bg-white rounded-lg border border-[#ebd2cb] focus:outline-none focus:border-[#d9828b] text-[#593c3f]"
                        placeholder="简短描述主题风格"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 选定分类下的所有字段 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#593c3f] font-serif">{selectedCategory} 调节</h4>
                  <span className="text-[10px] text-[#8c6f72]">实时双向同步</span>
                </div>

                {Object.entries(editableCategories[selectedCategory]?.fields || {}).map(([key, config]) => {
                  if (config.type === 'color') {
                    const currentColor = editingTheme.css[key] || '#ffffff';
                    return (
                      <div
                        key={key}
                        className="flex flex-col gap-2 p-2.5 bg-[#fffdfa] rounded-xl border border-[#ecdcd9] hover:border-[#d9828b]/60 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#593c3f]">{config.label}</span>
                            <span className="text-[9px] text-[#8c6f72] font-mono hidden sm:inline">{key}</span>
                          </div>

                          {/* 自定义颜色取色器 */}
                          <label className="flex items-center gap-1.5 px-2 py-1 bg-white hover:bg-[#f5ede4] border border-[#ebd2cb] rounded-lg cursor-pointer transition-all active:scale-95 shadow-2xs">
                            <div
                              className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
                              style={{ backgroundColor: currentColor === 'transparent' ? 'transparent' : currentColor }}
                            />
                            <span className="text-[11px] font-medium text-[#593c3f]">
                              {currentColor === 'transparent' ? '透明' : currentColor}
                            </span>
                            <span className="text-[10px] text-[#b85c67] font-bold ml-0.5">调色</span>
                            <input
                              type="color"
                              value={currentColor.startsWith('#') ? currentColor : '#000000'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingTheme(prev => ({
                                  ...prev,
                                  css: {
                                    ...prev.css,
                                    [key]: val
                                  }
                                }));
                              }}
                              className="sr-only"
                            />
                          </label>
                        </div>

                        {/* 常用色卡预设一键点选 */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] text-[#8c6f72] shrink-0">快捷色卡：</span>
                          {COLOR_PRESETS.map((preset) => {
                            const isSelected = currentColor.toLowerCase() === preset.color.toLowerCase();
                            return (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                  setEditingTheme(prev => ({
                                    ...prev,
                                    css: {
                                      ...prev.css,
                                      [key]: preset.color
                                    }
                                  }));
                                }}
                                title={`${preset.name} (${preset.color})`}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#d9828b] bg-[#fce8ea] text-[#8c3f47] font-bold shadow-2xs scale-105'
                                    : 'border-[#ecdcd9] bg-white text-[#593c3f] hover:border-[#e8b4b8]'
                                }`}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                  style={{
                                    backgroundColor: preset.color === 'transparent' ? 'transparent' : preset.color,
                                    backgroundImage: preset.color === 'transparent' ? 'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%)' : undefined,
                                    backgroundSize: '4px 4px'
                                  }}
                                />
                                <span>{preset.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (config.type === 'border') {
                    const currentVal = editingTheme.css[key] || '';
                    const parsed = parseBorderValue(currentVal, key.includes('self') ? '#d9828b' : '#ecdcd9');

                    const updateBorder = (newWidth: string, newStyle: string, newColor: string) => {
                      let result = '';
                      if (newWidth === '0px' || newStyle === 'none') {
                        result = 'none';
                      } else {
                        result = `${newWidth} ${newStyle} ${newColor}`;
                      }
                      setEditingTheme(prev => ({
                        ...prev,
                        css: {
                          ...prev.css,
                          [key]: result
                        }
                      }));
                    };

                    return (
                      <div
                        key={key}
                        className="flex flex-col gap-2.5 p-2.5 bg-[#fffdfa] rounded-xl border border-[#ecdcd9] hover:border-[#d9828b]/60 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#593c3f]">{config.label}</span>
                            <span className="text-[9px] text-[#8c6f72] font-mono hidden sm:inline">{key}</span>
                          </div>

                          {/* 实时边框预览条 */}
                          <div
                            className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-white text-[#593c3f] flex items-center gap-1 shadow-2xs"
                            style={{
                              border: parsed.isNone ? '1px dashed #d1d5db' : `${parsed.width} ${parsed.style} ${parsed.color}`
                            }}
                          >
                            <span>{parsed.isNone ? '无边框' : `${parsed.width} ${parsed.style}`}</span>
                            {!parsed.isNone && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: parsed.color }}
                              />
                            )}
                          </div>
                        </div>

                        {/* 粗细与线型选项 */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium text-[#8c6f72]">① 选择边框样式</span>
                          <div className="flex flex-wrap gap-1">
                            {BORDER_PRESET_STYLES.map((styleItem) => {
                              const isSelected = styleItem.style === 'none'
                                ? parsed.isNone
                                : !parsed.isNone && parsed.width === styleItem.width && parsed.style === styleItem.style;

                              return (
                                <button
                                  key={styleItem.label}
                                  type="button"
                                  onClick={() => {
                                    if (styleItem.style === 'none') {
                                      updateBorder('0px', 'none', parsed.color);
                                    } else {
                                      updateBorder(styleItem.width, styleItem.style, parsed.isNone ? (key.includes('self') ? '#d9828b' : '#ecdcd9') : parsed.color);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#d9828b] bg-[#fce8ea] text-[#8c3f47] font-bold shadow-2xs'
                                      : 'border-[#ecdcd9] bg-white text-[#593c3f] hover:border-[#e8b4b8]'
                                  }`}
                                >
                                  {styleItem.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 边框颜色选项 (有边框时显示) */}
                        {!parsed.isNone && (
                          <div className="flex flex-col gap-1.5 pt-1 border-t border-[#ecdcd9]/60">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium text-[#8c6f72]">② 选择边框颜色</span>
                              <label className="flex items-center gap-1 text-[10px] text-[#b85c67] font-bold cursor-pointer hover:underline">
                                <span>🎨 自定义调色</span>
                                <input
                                  type="color"
                                  value={parsed.color.startsWith('#') ? parsed.color : '#d9828b'}
                                  onChange={(e) => {
                                    updateBorder(parsed.width || '1px', parsed.style || 'solid', e.target.value);
                                  }}
                                  className="sr-only"
                                />
                              </label>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {BORDER_PRESET_COLORS.map((col) => {
                                const isColSelected = parsed.color.toLowerCase() === col.color.toLowerCase();
                                return (
                                  <button
                                    key={col.name}
                                    type="button"
                                    onClick={() => {
                                      updateBorder(parsed.width || '1px', parsed.style || 'solid', col.color);
                                    }}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] transition-all cursor-pointer ${
                                      isColSelected
                                        ? 'border-[#d9828b] bg-[#fce8ea] text-[#8c3f47] font-bold shadow-2xs'
                                        : 'border-[#ecdcd9] bg-white text-[#593c3f] hover:border-[#e8b4b8]'
                                    }`}
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                      style={{ backgroundColor: col.color }}
                                    />
                                    <span>{col.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (config.type === 'text') {
                    const currentVal = editingTheme.css[key] || '';
                    const isRadiusField = key.includes('radius');
                    const isShadowField = key.includes('shadow');
                    const isScaleField = key.includes('scale');

                    return (
                      <div
                        key={key}
                        className="flex flex-col gap-1.5 p-2 bg-[#fffdfa] rounded-xl border border-[#ecdcd9]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#593c3f]">{config.label}</span>
                          <span className="text-[9px] text-[#8c6f72] font-mono hidden sm:inline">{key}</span>
                        </div>

                        {/* 圆角常用预设 */}
                        {isRadiusField && (
                          <div className="flex flex-wrap gap-1 py-0.5">
                            {[
                              { label: '直角 (0px)', val: '0px' },
                              { label: '小圆角 (6px)', val: '6px' },
                              { label: '标准 (12px)', val: '12px' },
                              { label: '大圆角 (18px)', val: '18px' },
                              { label: '胶囊 (24px)', val: '24px' },
                              { label: '全圆 (50%)', val: '50%' },
                            ].map((r) => (
                              <button
                                key={r.label}
                                type="button"
                                onClick={() => {
                                  setEditingTheme(prev => ({
                                    ...prev,
                                    css: { ...prev.css, [key]: r.val }
                                  }));
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors ${
                                  currentVal === r.val
                                    ? 'bg-[#fce8ea] border-[#d9828b] text-[#8c3f47] font-bold'
                                    : 'bg-white border-[#ecdcd9] text-[#593c3f] hover:bg-[#f5ede4]'
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* 缩放常用预设 */}
                        {isScaleField && (
                          <div className="flex flex-wrap gap-1 py-0.5">
                            {[
                              { label: '0.85x 缩小', val: '0.85' },
                              { label: '1.0x 标准', val: '1.0' },
                              { label: '1.15x 放大', val: '1.15' },
                              { label: '1.25x 特大', val: '1.25' },
                            ].map((s) => (
                              <button
                                key={s.label}
                                type="button"
                                onClick={() => {
                                  setEditingTheme(prev => ({
                                    ...prev,
                                    css: { ...prev.css, [key]: s.val }
                                  }));
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors ${
                                  currentVal === s.val
                                    ? 'bg-[#fce8ea] border-[#d9828b] text-[#8c3f47] font-bold'
                                    : 'bg-white border-[#ecdcd9] text-[#593c3f] hover:bg-[#f5ede4]'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* 阴影常用预设 */}
                        {isShadowField && (
                          <div className="flex flex-wrap gap-1 py-0.5">
                            {[
                              { label: '无阴影', val: 'none' },
                              { label: '柔和微光', val: '0 1px 3px rgba(0,0,0,0.08)' },
                              { label: '立体悬浮', val: '0 4px 12px rgba(0,0,0,0.12)' },
                              { label: '氛围弥散', val: '0 8px 24px rgba(0,0,0,0.15)' },
                            ].map((sh) => (
                              <button
                                key={sh.label}
                                type="button"
                                onClick={() => {
                                  setEditingTheme(prev => ({
                                    ...prev,
                                    css: { ...prev.css, [key]: sh.val }
                                  }));
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors ${
                                  currentVal === sh.val
                                    ? 'bg-[#fce8ea] border-[#d9828b] text-[#8c3f47] font-bold'
                                    : 'bg-white border-[#ecdcd9] text-[#593c3f] hover:bg-[#f5ede4]'
                                }`}
                              >
                                {sh.label}
                              </button>
                            ))}
                          </div>
                        )}

                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingTheme(prev => ({
                              ...prev,
                              css: {
                                ...prev.css,
                                [key]: val
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 text-xs bg-white rounded-lg border border-[#ebd2cb] focus:outline-none focus:border-[#d9828b] font-mono text-[#593c3f]"
                          placeholder="例如: 14px 或 0 2px 8px rgba(0,0,0,0.1)"
                        />
                      </div>
                    );
                  }

                  if (config.type === 'image') {
                    const currentImg = editingTheme.assets?.[key as keyof typeof editingTheme.assets] as string || '';
                    const isWallpaper = ['homeWallpaper', 'wallpaper', 'chatBg', 'chatWallpaper', 'chatlistBg', 'wechatBg'].includes(key);
                    const isBubbleBg = !isWallpaper && (!!SPECIAL_BUBBLE_PREFIX_MAP[key] || key.endsWith('BgSelf') || key.endsWith('BgOther') || key.startsWith('bubbleBg'));
                    return (
                      <div
                        key={key}
                        className="flex flex-col gap-2 p-2.5 bg-[#fffdfa] rounded-xl border border-[#ecdcd9]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#593c3f]">{config.label}</span>
                          <div className="flex items-center gap-2">
                            {(key === 'proposalIcon' || key === 'weddingIcon' || key === 'divorceIcon') && currentImg !== 'none' && (
                              <button
                                onClick={() => {
                                  setEditingTheme(prev => ({
                                    ...prev,
                                    assets: {
                                      ...prev.assets,
                                      [key]: 'none'
                                    }
                                  }));
                                  triggerToast('🗑️ 已删除左上角图标');
                                }}
                                className="text-[10px] text-rose-500 hover:underline cursor-pointer font-bold"
                              >
                                删除图标
                              </button>
                            )}
                            {currentImg && currentImg !== 'none' && (
                              <button
                                onClick={() => {
                                  setEditingTheme(prev => {
                                    const nextAssets = { ...prev.assets, [key]: '' };
                                    if (key === 'homeWallpaper' || key === 'wallpaper') {
                                      nextAssets.homeWallpaper = '';
                                      nextAssets.wallpaper = '';
                                    } else if (key === 'chatBg' || key === 'chatWallpaper') {
                                      nextAssets.chatBg = '';
                                      nextAssets.chatWallpaper = '';
                                    } else if (key === 'chatlistBg' || key === 'wechatBg') {
                                      nextAssets.chatlistBg = '';
                                      nextAssets.wechatBg = '';
                                    }
                                    return {
                                      ...prev,
                                      assets: nextAssets
                                    };
                                  });
                                }}
                                className="text-[10px] text-[#8c6f72] hover:text-[#b85c67] hover:underline cursor-pointer"
                              >
                                清除贴图
                              </button>
                            )}
                          </div>
                        </div>

                        {currentImg === 'none' ? (
                          <div className="flex flex-col gap-1.5 items-center justify-center p-3 bg-[#f5ede4] rounded-lg text-[#8c6f72] text-xs">
                            <span>图标已删除（不显示）</span>
                            <button
                              onClick={() => {
                                setEditingTheme(prev => ({
                                  ...prev,
                                  assets: {
                                    ...prev.assets,
                                    [key]: ''
                                  }
                                }));
                              }}
                              className="text-[10px] text-[#b85c67] hover:underline cursor-pointer font-bold"
                            >
                              恢复默认图标
                            </button>
                          </div>
                        ) : currentImg ? (
                          <div className="flex flex-col gap-1">
                            <div className="relative h-20 w-full rounded-lg overflow-hidden border border-[#ebd2cb] shadow-inner group bg-stone-800">
                              <img
                                src={currentImg}
                                alt={config.label}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setUploadTargetKey(key);
                                    fileInputRef.current?.click();
                                  }}
                                  className="px-2 py-1 rounded bg-white/90 text-[#593c3f] text-[10px] font-bold shadow-xs cursor-pointer"
                                >
                                  更换
                                </button>
                              </div>
                            </div>
                            {isBubbleBg && (
                              <button
                                onClick={() => handleOpenSliceEditor(key, currentImg)}
                                className="w-full py-1.5 mt-1 bg-[#fce8ea] hover:bg-[#fad8dc] text-[#b85c67] text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                              >
                                ✂️ 编辑 9 宫格拉伸
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setUploadTargetKey(key);
                                fileInputRef.current?.click();
                              }}
                              className="flex-1 py-2 bg-white hover:bg-[#f5ede4] rounded-lg border border-dashed border-[#d9b8b0] text-[#593c3f] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#b85c67]" />
                              <span>上传图片</span>
                            </button>
                            <button
                              onClick={() => {
                                setUploadTargetKey(key);
                                fileInputRef.current?.click();
                              }}
                              className="flex-1 py-2 bg-[#fae8eb] hover:bg-[#fce8ea] rounded-lg border border-[#e8cbd0] text-[#b85c67] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#b85c67]" />
                              <span>上传文件</span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={currentImg}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingTheme(prev => {
                                const nextAssets = { ...prev.assets, [key]: val };
                                if (key === 'homeWallpaper' || key === 'wallpaper') {
                                  nextAssets.homeWallpaper = val;
                                  nextAssets.wallpaper = val;
                                } else if (key === 'chatBg' || key === 'chatWallpaper') {
                                  nextAssets.chatBg = val;
                                  nextAssets.chatWallpaper = val;
                                } else if (key === 'chatlistBg' || key === 'wechatBg') {
                                  nextAssets.chatlistBg = val;
                                  nextAssets.wechatBg = val;
                                }
                                return {
                                  ...prev,
                                  assets: nextAssets
                                };
                              });
                            }}
                            placeholder="或粘贴图片 URL"
                            className="w-full px-2 py-1 text-[10px] bg-white rounded-lg border border-[#ebd2cb] focus:outline-none focus:border-[#d9828b] text-[#593c3f]"
                          />
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9 宫格切片编辑器弹窗 */}
      {sliceEditorConfig && sliceEditorConfig.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[340px] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-stone-800 flex items-center gap-1.5">
                <span>✂️</span> 气泡 9 宫格拉伸编辑器
              </h3>
              <button onClick={() => setSliceEditorConfig(null)} className="p-1 hover:bg-stone-200 rounded-full text-stone-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto flex flex-col">
              <div className="text-[11px] text-stone-600 mb-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 space-y-1">
                <p className="text-stone-800 font-semibold flex items-center gap-1">
                  <span>💡</span> 点九拉伸与安全区原理：
                </p>
                <p className="text-stone-600 leading-relaxed">
                  • <b>蓝色拉伸带</b>：两条蓝线之间为拉伸区。请将拉伸带<span className="text-blue-600 font-bold">尽量拉窄靠拢（2~6px）</span>并置于平坦纯色区，四角及两端装饰将完全固定不拉伸！
                </p>
                <p className="text-stone-600 leading-relaxed">
                  • <b>黄色安全区</b>：四条黄虚线框出文字区域，文字将严格限制在黄框内部排版，绝不遮挡装饰。
                </p>
              </div>

              {/* 顶部状态与快捷操作栏 */}
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center justify-between text-[11px] bg-blue-50/80 border border-blue-200/70 p-2 rounded-xl text-blue-900">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>📐</span>
                    <span>原尺寸高保真渲染（推荐选用 Retina 级别图片）</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-mono bg-white/80 px-1.5 py-0.5 rounded border border-blue-200/50">
                    {sliceEditorConfig.naturalWidth} × {sliceEditorConfig.naturalHeight}px
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const w = sliceEditorConfig.naturalWidth;
                      const h = sliceEditorConfig.naturalHeight;
                      const sLeft = Math.max(1, Math.floor(w / 2));
                      const sTop = Math.max(1, Math.floor(h / 2));
                      // 仅调整蓝色拉伸线为居中 1px，完全保留玩家自己设定的黄色文字安全区
                      setSliceEditorConfig(prev => !prev ? prev : ({
                        ...prev,
                        stretch: {
                          top: sTop,
                          bottom: Math.max(1, h - sTop - 1),
                          left: sLeft,
                          right: Math.max(1, w - sLeft - 1),
                        },
                      }));
                      triggerToast('🎯 已将拉伸线设为居中 1px（黄色文字安全区保留由您自由调整）');
                    }}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors active:scale-95"
                  >
                    <span>🎯 居中 1px 极窄拉伸（仅调蓝色拉伸线，四周不拉伸形变）</span>
                  </button>
                </div>
              </div>

              {/* 编辑器交互画布（等比放大至 260px 宽度以便精准拖拽，底层坐标严格映射） */}
              <div className="flex justify-center mb-3">
                <div
                  ref={sliceContainerRef}
                  className="relative select-none touch-none shadow-sm rounded border border-stone-200/80 bg-stone-50 overflow-hidden"
                  style={{
                    width: '260px',
                    height: `${Math.round(260 * (sliceEditorConfig.naturalHeight / sliceEditorConfig.naturalWidth))}px`
                  }}
                >
                  <img
                    src={sliceEditorConfig.imageUrl}
                    alt="bg-preview"
                    className="w-full h-full object-fill pointer-events-none opacity-60 block"
                  />

                  {/* 水平拉伸带阴影（两条垂直蓝线之间的区域） */}
                  <div
                    className="absolute top-0 bottom-0 bg-blue-500/20 pointer-events-none border-x border-blue-500/40 z-0"
                    style={{
                      left: `${(sliceEditorConfig.stretch.left / sliceEditorConfig.naturalWidth) * 100}%`,
                      right: `${(sliceEditorConfig.stretch.right / sliceEditorConfig.naturalWidth) * 100}%`,
                    }}
                  />

                  {/* 垂直拉伸带阴影（两条水平蓝线之间的区域） */}
                  <div
                    className="absolute left-0 right-0 bg-blue-500/20 pointer-events-none border-y border-blue-500/40 z-0"
                    style={{
                      top: `${(sliceEditorConfig.stretch.top / sliceEditorConfig.naturalHeight) * 100}%`,
                      bottom: `${(sliceEditorConfig.stretch.bottom / sliceEditorConfig.naturalHeight) * 100}%`,
                    }}
                  />

                  {/* 黄色文字安全区 */}
                  <div
                    className="absolute border-2 border-dashed border-amber-400 bg-amber-300/25 pointer-events-none z-[5] flex items-center justify-center overflow-hidden"
                    style={{
                      top: `${(sliceEditorConfig.content.top / sliceEditorConfig.naturalHeight) * 100}%`,
                      bottom: `${(sliceEditorConfig.content.bottom / sliceEditorConfig.naturalHeight) * 100}%`,
                      left: `${(sliceEditorConfig.content.left / sliceEditorConfig.naturalWidth) * 100}%`,
                      right: `${(sliceEditorConfig.content.right / sliceEditorConfig.naturalWidth) * 100}%`,
                    }}
                  >
                    <span className="text-[9px] text-amber-950 font-bold bg-amber-100/90 px-1 py-0.5 rounded shadow-sm whitespace-nowrap">
                      ★ 文字安全区
                    </span>
                  </div>

                  {/* Stretch (Blue) Guides */}
                  <div
                    className="absolute left-0 right-0 h-6 -translate-y-3 cursor-ns-resize flex items-center justify-center z-10 touch-none"
                    style={{ top: `${(sliceEditorConfig.stretch.top / sliceEditorConfig.naturalHeight) * 100}%` }}
                    onPointerDown={(e) => { e.preventDefault(); setDraggingSlice('stretchTop'); }}
                  >
                    <div className="w-full h-[2px] bg-blue-600 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                  </div>
                  <div
                    className="absolute left-0 right-0 h-6 translate-y-3 cursor-ns-resize flex items-center justify-center z-10 touch-none"
                    style={{ bottom: `${(sliceEditorConfig.stretch.bottom / sliceEditorConfig.naturalHeight) * 100}%` }}
                    onPointerDown={(e) => { e.preventDefault(); setDraggingSlice('stretchBottom'); }}
                  >
                    <div className="w-full h-[2px] bg-blue-600 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-6 -translate-x-3 cursor-ew-resize flex items-center justify-center z-10 touch-none"
                    style={{ left: `${(sliceEditorConfig.stretch.left / sliceEditorConfig.naturalWidth) * 100}%` }}
                    onPointerDown={(e) => { e.preventDefault(); setDraggingSlice('stretchLeft'); }}
                  >
                    <div className="h-full w-[2px] bg-blue-600 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-6 translate-x-3 cursor-ew-resize flex items-center justify-center z-10 touch-none"
                    style={{ right: `${(sliceEditorConfig.stretch.right / sliceEditorConfig.naturalWidth) * 100}%` }}
                    onPointerDown={(e) => { e.preventDefault(); setDraggingSlice('stretchRight'); }}
                  >
                    <div className="h-full w-[2px] bg-blue-600 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                  </div>

                  {/* Content (Yellow) Guides */}
                  <div
                    className="absolute left-0 right-0 h-6 -translate-y-3 cursor-ns-resize flex items-center justify-center z-20 touch-none"
                    style={{ top: `${(sliceEditorConfig.content.top / sliceEditorConfig.naturalHeight) * 100}%` }}
                    onPointerDown={(e) => { e.preventDefault(); setDraggingSlice('contentTop'); }}
                  >
                    <div className="w-full h-[2px] border-t border-dashed border-amber-500 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                  </div>
                  <div
                    className="absolute left-0 right-0 h-6 translate-y-3 cursor-ns-resize flex items-center justify-center z-20 touch-none"
                    style={{ bottom: `${(sliceEditorConfig.content.bottom / sliceEditorConfig.naturalHeight) * 100}%` }}
                    onPointerDown={(e) => { e.preventDefault(); setDraggingSlice('contentBottom'); }}
                  >
                    <div className="w-full h-[2px] border-b border-dashed border-amber-500 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-6 -translate-x-3 cursor-ew-resize flex items-center justify-center z-20 touch-none"
                    style={{ left: `${(sliceEditorConfig.content.left / sliceEditorConfig.naturalWidth) * 100}%` }}
                    onPointerDown={(e) => { e.preventDefault(); setDraggingSlice('contentLeft'); }}
                  >
                    <div className="h-full w-[2px] border-l border-dashed border-amber-500 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-6 translate-x-3 cursor-ew-resize flex items-center justify-center z-20 touch-none"
                    style={{ right: `${(sliceEditorConfig.content.right / sliceEditorConfig.naturalWidth) * 100}%` }}
                    onPointerDown={(e) => { e.preventDefault(); setDraggingSlice('contentRight'); }}
                  >
                    <div className="h-full w-[2px] border-r border-dashed border-amber-500 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                  </div>
                </div>
              </div>

              {/* 尺寸状态指示器 & 位置微调按钮 */}
              <div className="flex flex-col gap-2 mb-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70 text-[11px] text-stone-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold text-blue-700">水平拉伸带: </span>
                    <span className="font-mono text-stone-800 font-semibold">{Math.max(0, Math.round(sliceEditorConfig.naturalWidth - sliceEditorConfig.stretch.left - sliceEditorConfig.stretch.right))}px</span>
                    <div className="text-[10px] text-stone-400 mt-0.5">左角: {Math.round(sliceEditorConfig.stretch.left)}px | 右角: {Math.round(sliceEditorConfig.stretch.right)}px</div>
                  </div>
                  <div>
                    <span className="font-bold text-blue-700">垂直拉伸带: </span>
                    <span className="font-mono text-stone-800 font-semibold">{Math.max(0, Math.round(sliceEditorConfig.naturalHeight - sliceEditorConfig.stretch.top - sliceEditorConfig.stretch.bottom))}px</span>
                    <div className="text-[10px] text-stone-400 mt-0.5">顶角: {Math.round(sliceEditorConfig.stretch.top)}px | 底角: {Math.round(sliceEditorConfig.stretch.bottom)}px</div>
                  </div>
                </div>

                {/* 避让微调按键（防宽装饰被拉伸） */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                  <span className="text-[10px] text-stone-500 font-medium">拉伸缝位置微调:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="拉伸线向左微调2px，避开右侧装饰"
                      onClick={() => {
                        setSliceEditorConfig(prev => {
                          if (!prev) return prev;
                          const band = Math.max(1, prev.naturalWidth - prev.stretch.left - prev.stretch.right);
                          const newLeft = Math.max(1, prev.stretch.left - 2);
                          const newRight = Math.max(1, prev.naturalWidth - newLeft - band);
                          return { ...prev, stretch: { ...prev.stretch, left: newLeft, right: newRight } };
                        });
                      }}
                      className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono hover:bg-stone-100 active:scale-95"
                    >
                      ← 左移2px
                    </button>
                    <button
                      type="button"
                      title="拉伸线向右微调2px，避开左侧装饰"
                      onClick={() => {
                        setSliceEditorConfig(prev => {
                          if (!prev) return prev;
                          const band = Math.max(1, prev.naturalWidth - prev.stretch.left - prev.stretch.right);
                          const newLeft = Math.min(prev.naturalWidth - band - 1, prev.stretch.left + 2);
                          const newRight = Math.max(1, prev.naturalWidth - newLeft - band);
                          return { ...prev, stretch: { ...prev.stretch, left: newLeft, right: newRight } };
                        });
                      }}
                      className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono hover:bg-stone-100 active:scale-95"
                    >
                      右移2px →
                    </button>
                    <button
                      type="button"
                      title="拉伸线向上微调2px"
                      onClick={() => {
                        setSliceEditorConfig(prev => {
                          if (!prev) return prev;
                          const band = Math.max(1, prev.naturalHeight - prev.stretch.top - prev.stretch.bottom);
                          const newTop = Math.max(1, prev.stretch.top - 2);
                          const newBottom = Math.max(1, prev.naturalHeight - newTop - band);
                          return { ...prev, stretch: { ...prev.stretch, top: newTop, bottom: newBottom } };
                        });
                      }}
                      className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono hover:bg-stone-100 active:scale-95"
                    >
                      ↑ 上移
                    </button>
                    <button
                      type="button"
                      title="拉伸线向下微调2px"
                      onClick={() => {
                        setSliceEditorConfig(prev => {
                          if (!prev) return prev;
                          const band = Math.max(1, prev.naturalHeight - prev.stretch.top - prev.stretch.bottom);
                          const newTop = Math.min(prev.naturalHeight - band - 1, prev.stretch.top + 2);
                          const newBottom = Math.max(1, prev.naturalHeight - newTop - band);
                          return { ...prev, stretch: { ...prev.stretch, top: newTop, bottom: newBottom } };
                        });
                      }}
                      className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono hover:bg-stone-100 active:scale-95"
                    >
                      下移 ↓
                    </button>
                  </div>
                </div>
              </div>

              {/* 气泡大小缩放（基于原生标准气泡大小锁定比例，支持等比微调） */}
              {(() => {
                const scalePrefix = SPECIAL_BUBBLE_PREFIX_MAP[sliceEditorConfig.bgKey] || (sliceEditorConfig.bgKey === 'bubbleBgSelf' ? 'self' : 'other');
                const scaleKey = SPECIAL_BUBBLE_PREFIX_MAP[sliceEditorConfig.bgKey]
                  ? `--gg-${SPECIAL_BUBBLE_PREFIX_MAP[sliceEditorConfig.bgKey]}-scale`
                  : `--gg-bubble-scale-${scalePrefix}`;
                const currentScale = parseFloat(editingTheme.css[scaleKey] || '1.28') || 1.28;

                return (
                  <div className="flex flex-col gap-2 mb-3 text-[11px] bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-700">四周装饰物等比放大</span>
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-bold">
                          {currentScale.toFixed(2)}x
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400">去留白后等比放大，更显精致醒目</span>
                    </div>

                    {/* 平滑滑块 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-400">紧致</span>
                      <input
                        type="range"
                        min="0.80"
                        max="1.60"
                        step="0.05"
                        value={currentScale}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingTheme(prev => ({
                            ...prev,
                            css: {
                              ...prev.css,
                              [scaleKey]: val,
                            }
                          }));
                        }}
                        className="flex-1 accent-blue-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-400">大尺寸</span>
                    </div>

                    {/* 快捷档位 */}
                    <div className="flex items-center justify-between gap-1.5 mt-0.5">
                      {[
                        { label: '1.0x 紧致', val: '1.00' },
                        { label: '1.18x 适中', val: '1.18' },
                        { label: '1.30x 饱满放大(荐)', val: '1.30' },
                        { label: '1.45x 超大醒目', val: '1.45' },
                      ].map((item) => {
                        const isSelected = Math.abs(currentScale - parseFloat(item.val)) < 0.03;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => {
                              setEditingTheme(prev => ({
                                ...prev,
                                css: {
                                  ...prev.css,
                                  [scaleKey]: item.val
                                }
                              }));
                            }}
                            className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold shadow-xs'
                                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 active:scale-95'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-stone-500 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-200/60 leading-tight">
                      ✨ 已彻底剔除文字与装饰物之间原本的多余留白，文字紧贴装饰物！根据需求推荐选 <span className="font-bold text-emerald-900">“1.30x 饱满放大”</span> 或 <span className="font-bold text-emerald-900">“1.45x 超大醒目”</span>，四周装饰物立即生动饱满！
                    </div>
                  </div>
                );
              })()}

              {/* 实时预览区（短句与长句双重验证） */}
              <div className="bg-stone-100/80 p-3 rounded-xl flex flex-col gap-2 relative overflow-hidden border border-stone-200/50">
                <span className="text-[10px] text-stone-400 font-medium">真实拉伸预览</span>
                <div className="flex flex-col gap-2 items-start w-full">
                  {/* 短消息 */}
                  <div
                    style={getBubbleContainerStyle({
                      isUser: sliceEditorConfig.bgKey === 'bubbleBgSelf',
                      prefix: SPECIAL_BUBBLE_PREFIX_MAP[sliceEditorConfig.bgKey] || (sliceEditorConfig.bgKey === 'bubbleBgSelf' ? 'self' : 'other'),
                      editingTheme,
                      bubbleBgUrl: sliceEditorConfig.imageUrl,
                      customText: sliceEditorConfig.bgKey === 'bubbleBgSelf' ? editingTheme.css['--gg-bubble-self-text'] : editingTheme.css['--gg-bubble-other-text'],
                      defaultText: '#1c1917',
                      isDot9: false,
                      stretchTop: sliceEditorConfig.stretch.top,
                      stretchRight: sliceEditorConfig.stretch.right,
                      stretchBottom: sliceEditorConfig.stretch.bottom,
                      stretchLeft: sliceEditorConfig.stretch.left,
                      contentTop: sliceEditorConfig.content.top,
                      contentRight: sliceEditorConfig.content.right,
                      contentBottom: sliceEditorConfig.content.bottom,
                      contentLeft: sliceEditorConfig.content.left,
                    })}
                    className="text-[11px] relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={getBubbleBgStyle({
                        isUser: sliceEditorConfig.bgKey === 'bubbleBgSelf',
                        prefix: SPECIAL_BUBBLE_PREFIX_MAP[sliceEditorConfig.bgKey] || (sliceEditorConfig.bgKey === 'bubbleBgSelf' ? 'self' : 'other'),
                        editingTheme,
                        bubbleBgUrl: sliceEditorConfig.imageUrl,
                        customText: sliceEditorConfig.bgKey === 'bubbleBgSelf' ? editingTheme.css['--gg-bubble-self-text'] : editingTheme.css['--gg-bubble-other-text'],
                        defaultText: '#1c1917',
                        isDot9: false,
                        stretchTop: sliceEditorConfig.stretch.top,
                        stretchRight: sliceEditorConfig.stretch.right,
                        stretchBottom: sliceEditorConfig.stretch.bottom,
                        stretchLeft: sliceEditorConfig.stretch.left,
                        contentTop: sliceEditorConfig.content.top,
                        contentRight: sliceEditorConfig.content.right,
                        contentBottom: sliceEditorConfig.content.bottom,
                        contentLeft: sliceEditorConfig.content.left,
                      })}
                    />
                    <span className="relative z-10">好呀！✨</span>
                  </div>

                  {/* 长消息 */}
                  <div
                    style={getBubbleContainerStyle({
                      isUser: sliceEditorConfig.bgKey === 'bubbleBgSelf',
                      prefix: SPECIAL_BUBBLE_PREFIX_MAP[sliceEditorConfig.bgKey] || (sliceEditorConfig.bgKey === 'bubbleBgSelf' ? 'self' : 'other'),
                      editingTheme,
                      bubbleBgUrl: sliceEditorConfig.imageUrl,
                      customText: sliceEditorConfig.bgKey === 'bubbleBgSelf' ? editingTheme.css['--gg-bubble-self-text'] : editingTheme.css['--gg-bubble-other-text'],
                      defaultText: '#1c1917',
                      isDot9: false,
                      stretchTop: sliceEditorConfig.stretch.top,
                      stretchRight: sliceEditorConfig.stretch.right,
                      stretchBottom: sliceEditorConfig.stretch.bottom,
                      stretchLeft: sliceEditorConfig.stretch.left,
                      contentTop: sliceEditorConfig.content.top,
                      contentRight: sliceEditorConfig.content.right,
                      contentBottom: sliceEditorConfig.content.bottom,
                      contentLeft: sliceEditorConfig.content.left,
                    })}
                    className="text-[11px] relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={getBubbleBgStyle({
                        isUser: sliceEditorConfig.bgKey === 'bubbleBgSelf',
                        prefix: SPECIAL_BUBBLE_PREFIX_MAP[sliceEditorConfig.bgKey] || (sliceEditorConfig.bgKey === 'bubbleBgSelf' ? 'self' : 'other'),
                        editingTheme,
                        bubbleBgUrl: sliceEditorConfig.imageUrl,
                        customText: sliceEditorConfig.bgKey === 'bubbleBgSelf' ? editingTheme.css['--gg-bubble-self-text'] : editingTheme.css['--gg-bubble-other-text'],
                        defaultText: '#1c1917',
                        isDot9: false,
                        stretchTop: sliceEditorConfig.stretch.top,
                        stretchRight: sliceEditorConfig.stretch.right,
                        stretchBottom: sliceEditorConfig.stretch.bottom,
                        stretchLeft: sliceEditorConfig.stretch.left,
                        contentTop: sliceEditorConfig.content.top,
                        contentRight: sliceEditorConfig.content.right,
                        contentBottom: sliceEditorConfig.content.bottom,
                        contentLeft: sliceEditorConfig.content.left,
                      })}
                    />
                    <span className="relative z-10">四周装饰完好保护，文字在黄色安全区内排版，绝不溢出！</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex gap-2">
              <button
                onClick={() => setSliceEditorConfig(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white border border-stone-200 text-stone-700 active:bg-stone-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveSliceEditor}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-500 text-white active:bg-green-600 shadow-md shadow-green-500/20 cursor-pointer flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名主题弹窗 */}
      {renamingTheme && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setRenamingTheme(null)}
        >
          <div 
            className="w-80 bg-[#fffdfa] rounded-2xl p-4 shadow-2xl space-y-3 border border-[#ebd2cb] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ebd2cb]/60 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[#593c3f] text-xs font-serif">
                <Pencil className="w-3.5 h-3.5 text-[#b85c67]" />
                <span>修改主题名称</span>
              </div>
              <button
                onClick={() => setRenamingTheme(null)}
                className="p-1 rounded-full text-[#8c6f72] hover:text-[#593c3f] hover:bg-[#f5ede4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#593c3f]">新主题名称</label>
              <input
                type="text"
                autoFocus
                value={renamingTheme.name}
                onChange={(e) => setRenamingTheme(prev => prev ? { ...prev, name: e.target.value } : null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') setRenamingTheme(null);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-[#ebd2cb] focus:outline-none focus:border-[#d9828b] font-bold text-[#593c3f]"
                placeholder="输入主题名称..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenamingTheme(null)}
                className="px-3 py-1 text-xs rounded-xl bg-[#f5ede4] hover:bg-[#ebdcd3] text-[#593c3f] font-medium cursor-pointer transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={!renamingTheme.name.trim()}
                className="px-3.5 py-1 text-xs rounded-xl bg-gradient-to-r from-[#d9828b] to-[#b85c67] hover:from-[#c7727b] hover:to-[#a74f59] disabled:opacity-50 text-white font-bold cursor-pointer shadow-xs transition-colors"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 恢复出厂设置确认弹窗 */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white border border-stone-200 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-center animate-in zoom-in-95 duration-150">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">确定要恢复出厂设置吗？</h3>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                这将删除所有自定义 DIY 主题，并恢复系统默认出厂主题。
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer border border-stone-200 transition-all active:scale-95"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmResetFactory}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-red-950/20"
              >
                确定重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Store Modal */}
      <ThemeStoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        breadBalance={breadBalance}
        purchasedThemeIds={purchasedThemeIds}
        activeThemeId={settings.activeDIYThemeId}
        onOpenRedeemModal={() => setIsRedeemOpen(true)}
        onBuyThemeSuccess={handleBuyThemeSuccess}
        onApplyTheme={handleApplyThemeFromStore}
      />

      {/* Redeem Activation Code Modal */}
      <RedeemCodeModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        onSuccess={handleRedeemSuccess}
      />
    </div>
  );
};
