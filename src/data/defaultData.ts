import { Contact, WorldBookItem, MomentPost, PhoneSettings, ChatMessage, UserPersona, StickerItem } from '../types/phone';

export const DEFAULT_SETTINGS: PhoneSettings = {
  appName: 'WePhone',
  wallpaperUrl: '',
  momentsCoverUrl: '',
  userAvatar: '',
  userNickname: '旅行者',
  userSignature: '保持好奇，热爱生活 ☕',

  apiConfigName: 'OpenAI 兼容接口',
  apiProvider: 'openai',
  apiUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelName: 'gpt-4o-mini',

  themeStyle: 'morandi',

  ttsConfigName: 'OpenAI 兼容 TTS',
  ttsProvider: 'openai',
  minimaxSite: 'china',
  ttsApiUrl: 'https://api.openai.com/v1',
  ttsModel: 'tts-1',
  ttsApiKey: '',
  ttsGroupId: '',
  ttsVoiceId: '',

  aiAutoPostEnabled: false,
  aiAutoPostInterval: 'daily',
  aiAutoPostLastTime: 0,
  aiAutoPostTargetContactId: 'random',
  enableMessagePopup: true,
  enableProactiveMessages: true,
  proactiveMessageFrequency: 'medium',
  enableTimeAwareness: true,
  enableWeatherAwareness: true,
  diyThemes: [],
  activeDIYThemeId: null,
  breadBalance: 0,
  purchasedThemeIds: []
};

export const DEFAULT_CONTACTS: Contact[] = [];

export const DEFAULT_MESSAGES: Record<string, ChatMessage[]> = {};

export const DEFAULT_WORLDBOOKS: WorldBookItem[] = [
  {
    id: 'wb_common',
    name: '日常现代生活常识',
    content: '背景为现代繁华都市，大家普遍使用手机和微信沟通，日常交流自然生活化。',
    scope: 'global'
  },
  {
    id: 'wb_cyber',
    name: '夜莺绝密档案库',
    content: '艾丽卡拥有仿生神经元与高速分析能力，服从最高指挥官命令，视保护指挥官为最高准则。',
    scope: 'local'
  },
  {
    id: 'wb_office',
    name: '创新科技商务圈',
    content: '涉及云服务、产品上线、敏捷开发与季度目标冲刺等工作事项。',
    scope: 'local'
  }
];

export const DEFAULT_MOMENTS: MomentPost[] = [];

export const DEFAULT_MASKS: UserPersona[] = [
  {
    id: 'mask_1',
    name: '默认 - 旅行者',
    avatar: '',
    nickname: '旅行者',
    signature: '保持好奇，热爱生活 ☕',
    personaDescription: '一位充满好奇心的旅行者，性格温柔随和，喜欢探索未知的世界，和每个人都能聊得来。',
    isActive: true
  },
  {
    id: 'mask_2',
    name: '傲娇少爷/大小姐',
    avatar: '',
    nickname: '言秋',
    signature: '哼，无聊。',
    personaDescription: '出身名门大户，性格傲娇，嘴硬心软。说话有些居高临下，习惯冷哼，但如果被真心对待会变得极度害羞和纯情。',
    isActive: false
  },
  {
    id: 'mask_3',
    name: '高冷精英',
    avatar: '',
    nickname: '陆沉',
    signature: '时间就是最昂贵的资产。',
    personaDescription: '雷厉风行、极度自律的商业精英。说话专业、冷静、有压迫感，极其在乎工作效率，但面对认定的人会流露出难得的温柔和周到。',
    isActive: false
  },
  {
    id: 'mask_4',
    name: '软萌粘人精',
    avatar: '',
    nickname: '小桃子 🥤',
    signature: '今天也要吃甜甜的糖果！🍬',
    personaDescription: '单纯可爱、情绪价值拉满的软萌粘人精。说话经常带波浪号和软萌语气，超级容易依赖对方，像个小跟屁虫。',
    isActive: false
  }
];

export const DEFAULT_STICKERS: StickerItem[] = [];

