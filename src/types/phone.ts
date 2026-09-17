import { LuckinOrderData } from './luckin';

export type ActiveApp = 'desktop' | 'wechat' | 'settings' | 'worldbook' | 'characters' | 'phone_call' | 'novel' | 'masks' | 'twitter' | 'marriage' | 'diy' | 'suki_baby' | 'pomodoro' | 'music' | 'luckin' | 'bilibili' | 'homestead' | 'theater';

export interface DIYTheme {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  css: Record<string, string>;
  assets: {
    homeWallpaper?: string; // 1. 手机主屏幕壁纸（桌面背景图）
    wallpaper?: string; // 兼容旧版手机桌面壁纸
    chatBg?: string; // 2. 私聊界面壁纸（聊天房间背景图）
    chatWallpaper?: string; // 兼容旧版私聊壁纸别名
    chatlistBg?: string; // 3. 微信界面壁纸（微信主页面/聊天列表背景图）
    wechatBg?: string; // 兼容微信界面壁纸别名
    headerBg?: string;
    tabbarBg?: string;
    primaryBg?: string;
    secondaryBg?: string;
    scheduleIcon?: string;
    transferCardBg?: string;
    transferBg?: string;
    transferIcon?: string;
    locationBg?: string;
    locationNavBg?: string;
    locationIcon?: string;
    fileBg?: string;
    fileIcon?: string;
    proposalBg?: string;
    proposalIcon?: string;
    weddingBg?: string;
    weddingIcon?: string;
    divorceBg?: string;
    divorceIcon?: string;
    plusPanelBg?: string;
    bubbleBgSelf?: string;
    bubbleBgOther?: string;
    bubbleDecorSelf?: string;
    bubbleDecorOther?: string;
    voiceBtn?: string;
    plusBtn?: string;
    bubbleDecor?: {
      topLeft?: string;
      topRight?: string;
      bottomLeft?: string;
      bottomRight?: string;
    };
    tabIcons?: Record<string, string>;
    tabIconChats?: string;
    tabIconContacts?: string;
    tabIconMoments?: string;
    tabIconMe?: string;
    plusVoiceIcon?: string;
    plusCameraIcon?: string;
    plusAlbumIcon?: string;
    plusFileIcon?: string;
    plusTransferIcon?: string;
    plusLocationIcon?: string;
    plusCallIcon?: string;
    plusOfflineIcon?: string;
    callBg?: string;
    callMinimizeIcon?: string;
    callHistoryIcon?: string;
    callSpeakerIcon?: string;
    callSendIcon?: string;
    callHangupIcon?: string;
    callAnswerIcon?: string;
    callFloatIcon?: string;
    voiceModalBg?: string;
    photoModalBg?: string;
    transferModalBg?: string;
    locationModalBg?: string;
    momentsSettingsIcon?: string;
    momentsAiPostIcon?: string;
    momentsPostIcon?: string;
    momentsCoverBg?: string;
    [key: string]: any;
  };
  variants?: Record<string, { label: string; css: Record<string, string>; assets?: any }>;
  createdAt: number;
}

export interface UserPersona {
  id: string;
  name: string; // 设定别名或人设名字，例如：开朗学弟、冰山总裁、青梅竹马
  avatar?: string; // 头像 base64 或 url
  nickname: string; // 微信昵称
  signature?: string; // 微信个性签名
  personaDescription?: string; // 自身人设，例如：“你是他的男朋友，性格温柔，很宠她...” 会在 AI 提示词中加入
  isActive: boolean; // 是否当前启用
}

export type WeChatTab = 'chats' | 'contacts' | 'moments' | 'me';

export type ThemeStyle = 'morandi' | 'macaron' | 'glass' | 'mono' | 'rococo';

export interface TakeawayOrder {
  id: string;
  foodName: string;
  storeName: string;
  price: number;
  image: string;
  aiContactId: string;
  aiContactName: string;
  aiContactAvatar: string;
  status: 'delivering' | 'arrived';
  orderTime: number; // 下单时间戳
  durationSeconds: number; // 配送总耗时(秒)
  riderName: string;
  riderPhone: string;
  customNote?: string;
  hasNotifiedArrival?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'photo_desc' | 'transfer' | 'location' | 'file' | 'voice' | 'offline_scene' | 'sticker' | 'forwarded_tweet' | 'proposal' | 'proposal_response' | 'wedding_invite' | 'divorce_request' | 'divorce_confirm' | 'wedding_offline_invite' | 'meet_invite' | 'luckin_order_preview' | 'luckin_payment' | 'luckin_treat' | 'pat';
  imageUrl?: string;
  photoDesc?: string;
  fileName?: string;
  fileSize?: string;
  transferAmount?: number;
  transferStatus?: 'pending' | 'accepted' | 'refunded';
  transferTo?: string; // 群聊转账目标角色ID/名字
  transferNote?: string; // 转账备注
  meetLocation?: string; // 见面邀请地点
  meetTime?: string;     // 见面邀请时间
  meetStatus?: 'pending' | 'accepted' | 'declined'; // 见面邀请状态
  luckinOrder?: LuckinOrderData; // 瑞幸咖啡订单数据
  innerVoice?: string; // [心声: xxx]
  voiceDuration?: number; // 语音秒数 (例如 3")
  isVoiceListened?: boolean;
  senderName?: string; // 群聊或线下模式中的角色名
  senderAvatar?: string; // 说话者头像
  senderId?: string; // 说话者的真实联系人ID (用于在群聊中动态获取其最新头像 and 昵称)
  actionDesc?: string; // 角色动作描写
  sceneNote?: string; // 场景氛围描写
  authorName?: string; // 转发帖子原作者名字
  forwardedAt?: number; // 转发时间戳
}

export interface Contact {
  id: string;
  name: string;
  remark?: string;
  avatar: string;
  group: string; // 兼容旧版主分组
  groups?: string[]; // 多分组支持
  bio?: string;
  persona: string; // AI 人设
  worldBookIds: string[]; // 绑定的世界书 IDs
  replySpeed: number; // 0 (快速) - 100 (深思熟虑)
  replyStyle: 'creative' | 'balanced' | 'precise'; // 发散/中等/严谨
  shortTermMemory: number; // 例如 10 条
  longTermMemory: number; // 例如 50 条
  voiceTimbre: string; // male-qn, male-mature, female-shaonv, female-yujie, female-lively, child-joyful, custom
  customVoiceId?: string;
  enableInnerVoice: boolean; // 心声开关
  isOfflineMode: boolean; // 线下模式开关
  offlineScene?: string; // 线下模式当前场景描述
  unreadCount?: number;
  lastMessageTime?: number;
  isGroup?: boolean; // 是否是微信群聊
  groupMemberIds?: string[]; // 群成员联系人ID列表
  groupNotice?: string; // 群公告
  memberInnerVoiceEnabled?: Record<string, boolean>; // 群聊中各成员心声独立开关 { [contactId]: boolean }
  isPinned?: boolean; // 是否置顶
  backgroundUrl?: string; // 自定义聊天背景
  isAssistant?: boolean; // 是否为助手/工具账号
  isTool?: boolean; // 是否为开发工具账号
  intimacyScore?: number; // 瑞幸咖啡/亲密度好感度 0-100
  affection?: number; // 好感度 0-100
  relationship?: 'friend' | 'dating' | 'engaged' | 'married' | 'family' | 'child'; // 关系状态
  gender?: 'male' | 'female' | 'other'; // 角色性别：男 / 女 / 其它或自动推断
  customSchedule?: DailyScheduleItem[]; // 角色专属今日行程
  scheduleLastUpdated?: number; // 行程更新时间戳
  scheduleDate?: string; // 行程对应日期，如 "2026-09-11"
  lastLuckinTreatTime?: number; // 上次AI主动请喝咖啡时间戳
  lastLuckinOrderTime?: number; // 上次帮玩家点咖啡时间戳
  patSuffix?: string; // 拍一拍后缀 (如 "的小脑袋")
  favoriteCoffee?: string; // 该联系人偏好或推荐的咖啡
}

export interface DailyScheduleItem {
  id: string;
  timeRange: string; // 如 "07:00 - 09:00"
  startHour: number; // 7
  endHour: number;   // 9
  periodName: string; // "清晨唤醒", "上午工作/学业", "午餐小憩", "午后时光", "黄昏日落", "晚间放松", "深夜静谧"
  activity: string;   // 正在做什么
  location: string;   // 当前地点
  mood?: string;      // 状态与心情
  isCurrent?: boolean;// 当前时刻
}

export interface MomentPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: number;
  content: string;
  images?: string[];
  likes: string[]; // user names
  comments: Array<{
    id: string;
    authorName: string;
    content: string;
  }>;
}

export interface MarriageRecord {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  marryDate: string;
  certificateId: string;
}

export interface BabyRecord {
  id: string;
  name: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  birthDate: number;
  level: number;
  exp: number; // 成长值/经验值
  hunger: number; // 饱食度 0~100
  mood: number; // 心情值 0~100
  energy: number; // 体力值 0~100
  cleanliness: number; // 清洁度 0~100
  health: number; // 健康值 0~100
  growth: number; // 累计总成长值
  stage: 'infant' | 'toddler' | 'child' | 'teen' | 'adult';
  lastUpdated: number; // 真实时间戳（用于离线衰减计算）
  gender?: 'boy' | 'girl';
  avatar?: string;
  outfit?: string; // 装备套系
}

export interface WorldBookItem {
  id: string;
  name: string;
  content: string;
  scope: 'global' | 'local';
}

export interface WeatherData {
  city: string;
  temperature: number;
  weather: string;
  windSpeed: number;
}

export interface PhoneSettings {
  appName: string;
  wallpaperUrl: string;
  momentsCoverUrl: string;
  userAvatar: string;
  userNickname: string;
  userSignature: string;
  userGender?: 'male' | 'female' | 'other'; // 用户自身性别：女 / 男 / 其它或自动推断
  userPersonaDescription?: string; // 当前启用的自身人设设定
  userPatSuffix?: string; // 玩家自己的拍一拍后缀 (如 "的小脑袋")
  
  // API Config
  apiConfigName: string;
  apiProvider: string;
  apiUrl: string;
  apiKey: string;
  modelName: string;

  // Features
  enableJailbreakMode?: boolean;
  customJailbreakPrompt?: string; // 自定义破甲提示词内容
  enableProactiveMessages?: boolean;
  proactiveMessageFrequency?: 'low' | 'medium' | 'high';
  allowProactivePat?: boolean; // 是否允许AI主动拍一拍 (默认关闭，避免老是拍一拍而不发文字)
  enableMessagePopup?: boolean; // 新消息弹窗通知开关

  // Perception Settings (Time & Weather)
  enableTimeAwareness?: boolean;
  enableWeatherAwareness?: boolean;
  userCity?: string;
  userLatitude?: number;
  userLongitude?: number;
  weatherCache?: {
    data: WeatherData;
    updatedAt: number;
  };
  
  // Theme & Appearance
  themeStyle: ThemeStyle;
  customFontFamily?: string;
  customFontUrl?: string;

  // TTS Config
  ttsConfigName?: string;
  ttsProvider: 'minimax' | 'openai' | 'azure' | 'elevenlabs' | 'webspeech' | 'custom';
  minimaxSite: 'china' | 'intl';
  ttsApiUrl?: string;
  ttsModel: string;
  ttsApiKey: string;
  ttsGroupId: string;
  ttsVoiceId: string;

  // Marriage Records
  marriages?: MarriageRecord[];
  
  // Baby Records
  babies?: BabyRecord[];

  // DIY Workshop Themes
  diyThemes?: DIYTheme[];
  activeDIYThemeId?: string | null;
  breadBalance?: number;
  purchasedThemeIds?: string[];

  // AI Moments Auto-post Config
  aiAutoPostEnabled?: boolean;
  aiAutoPostInterval?: 'daily' | 'alternate'; // daily: 每天一条, alternate: 隔天一条
  aiAutoPostLastTime?: number; // 上次自动发圈的时间戳
  aiAutoPostTargetContactId?: string; // 指定由哪个AI发圈，留空或 'random' 表示随机

  // Luckin Coffee Config
  luckinDefaultFlavor?: string; // 默认口味（可选，AI帮点时优先使用，如：生椰拿铁 标准冰 不加糖）
  luckinAllowProactiveTreat?: boolean; // 是否允许 AI 主动请客（默认开启 true）
  luckinTreatFrequency?: 'weekly' | 'biweekly' | 'monthly'; // 主动请客频率（每周/每两周/每月，默认每周 weekly）
  luckinStoreName?: string; // 常用附近门店
  luckinCity?: string; // 常用城市
  luckinOrders?: LuckinOrderData[]; // 历史与进行中瑞幸订单列表
}

export interface FavoriteItem {
  id: string;
  type: 'text' | 'image' | 'voice' | 'sticker' | 'location' | 'transfer' | 'file' | 'photo_desc' | 'offline_scene' | 'forwarded_tweet' | 'proposal' | 'proposal_response' | 'wedding_invite' | 'divorce_request' | 'divorce_confirm' | 'wedding_offline_invite' | 'meet_invite' | 'luckin_order_preview' | 'luckin_payment' | 'luckin_treat' | 'pat';
  content: string; // The text content, or image/sticker URL, or other details
  senderName: string;
  senderAvatar: string;
  timestamp: number;
}

export interface StickerItem {
  id: string;
  name: string;
  url: string;
  group?: string;
}

export interface DiaryEntry {
  id: string;
  timestamp: number;
  content: string; // 500字以内
}

export interface MemoryFact {
  id: string;
  fact: string; // 30字以内
}

export interface TwitterPost {
  id: string;
  authorId: string; // 'me' 或联系人 ID
  authorName: string;
  authorAvatar: string;
  timestamp: number;
  content: string;
  likesCount?: number;
  commentsCount?: number;
  likes?: string[]; // Optional: list of user IDs who liked
}

export interface TwitterComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  parentId?: string;
}

export interface ContactMemory {
  diaries: DiaryEntry[];
  facts: MemoryFact[];
}

