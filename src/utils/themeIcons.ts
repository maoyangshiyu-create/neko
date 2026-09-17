import { ThemeStyle } from '../types/phone';

export interface AppIconStyle {
  boxClass: string;
  iconClass: string;
  iconFill?: boolean;
}

export interface TakeawayButtonStyle {
  buttonClass: string;
  textColor: string;
  iconBoxClass: string;
  badgeClass: string;
  btnActionClass: string;
}

export interface DockStyle {
  wrapperClass: string;
  settings?: AppIconStyle;
  music?: AppIconStyle;
  homestead?: AppIconStyle;
  phone?: AppIconStyle;
  novel?: AppIconStyle;
}

export interface ThemeIconSet {
  name: string;
  wechat: AppIconStyle;       // 1. 绿色系
  takeawayApp: AppIconStyle;  // 2. 黄色系
  worldbook: AppIconStyle;    // 3. 蓝色系
  marriage: AppIconStyle;     // 4. 粉色系
  settings: AppIconStyle;     // 5. 灰色/银色系
  masks: AppIconStyle;        // 6. 紫色系
  twitter: AppIconStyle;      // 7. 黑色系
  diy: AppIconStyle;          // 8. 品红/赤红系
  sukiBaby: AppIconStyle;     // 9. 暖橙/杏色系
  pomodoro: AppIconStyle;     // 10. 番茄钟 (红色系)
  music: AppIconStyle;        // 11. 网易云音乐 (赤红系)
  luckin: AppIconStyle;       // 12. 瑞幸咖啡 (深蓝系)
  bilibili: AppIconStyle;     // 13. 哔哩哔哩 (粉色系)
  homestead: AppIconStyle;    // 14. 我的家园 (青绿/木色系)
  defaultApp: AppIconStyle;   // 15. 未来新应用保底样式
  takeaway: TakeawayButtonStyle;
  dock: DockStyle;
}

export const THEME_ICON_SETS: Record<ThemeStyle, ThemeIconSet> = {
  // 1. 🟤 莫兰迪风格 - 低饱和柔和大地与灰调 (全应用色彩独立无重复)
  morandi: {
    name: '莫兰迪',
    wechat: {
      boxClass: 'bg-gradient-to-tr from-[#5B7B61] to-[#7A9A80] shadow-[0_5px_15px_-2px_rgba(91,123,97,0.45)] border border-[#8DAF92]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]',
      iconFill: true
    },
    takeawayApp: {
      boxClass: 'bg-gradient-to-tr from-[#B58D3D] to-[#D4A95B] shadow-[0_5px_15px_-2px_rgba(181,141,61,0.45)] border border-[#E3CDA8]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]',
      iconFill: false
    },
    worldbook: {
      boxClass: 'bg-gradient-to-tr from-[#4B6B8A] to-[#6A8AA9] shadow-[0_5px_15px_-2px_rgba(75,107,138,0.45)] border border-[#8AA9C8]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    marriage: {
      boxClass: 'bg-gradient-to-tr from-[#B07B83] to-[#C8969E] shadow-[0_5px_15px_-2px_rgba(176,123,131,0.45)] border border-[#DCB3BB]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    settings: {
      boxClass: 'bg-gradient-to-tr from-[#6E6B68] to-[#8C8885] shadow-[0_5px_15px_-2px_rgba(110,107,104,0.45)] border border-[#A8A4A1]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    masks: {
      boxClass: 'bg-gradient-to-tr from-[#6C5B7B] to-[#8B7A9A] shadow-[0_5px_15px_-2px_rgba(108,91,123,0.45)] border border-[#AA99B9]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    twitter: {
      boxClass: 'bg-[#222225] shadow-[0_5px_15px_-2px_rgba(0,0,0,0.5)] border border-[#3F3F46]/60 rounded-[15px]',
      iconClass: 'text-white'
    },
    diy: {
      boxClass: 'bg-gradient-to-tr from-[#A04E60] to-[#BF6B7D] shadow-[0_5px_15px_-2px_rgba(160,78,96,0.45)] border border-[#D98A9C]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    sukiBaby: {
      boxClass: 'bg-gradient-to-tr from-[#B56E4A] to-[#D48B67] shadow-[0_5px_15px_-2px_rgba(181,110,74,0.45)] border border-[#E3A988]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    pomodoro: {
      boxClass: 'bg-gradient-to-tr from-[#9B4B4B] to-[#B96A6A] shadow-[0_5px_15px_-2px_rgba(155,75,75,0.45)] border border-[#C88A8A]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    music: {
      boxClass: 'bg-gradient-to-tr from-[#A63A3A] to-[#C45959] shadow-[0_5px_15px_-2px_rgba(166,58,58,0.45)] border border-[#D57A7A]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    luckin: {
      boxClass: 'bg-gradient-to-tr from-[#2D4B8A] to-[#4C6A9B] shadow-[0_5px_15px_-2px_rgba(45,75,138,0.45)] border border-[#6D8AB9]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    bilibili: {
      boxClass: 'bg-gradient-to-tr from-[#B07B83] to-[#C8969E] shadow-[0_5px_15px_-2px_rgba(176,123,131,0.45)] border border-[#DCB3BB]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    homestead: {
      boxClass: 'bg-gradient-to-tr from-[#7B8B6F] to-[#9AA88E] shadow-[0_5px_15px_-2px_rgba(123,139,111,0.45)] border border-[#ADC0A0]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    defaultApp: {
      boxClass: 'bg-gradient-to-tr from-[#5C6B73] to-[#7B8A92] shadow-[0_5px_15px_-2px_rgba(92,107,115,0.45)] border border-[#9AA9B1]/40 rounded-[15px]',
      iconClass: 'text-[#FAF6F0]'
    },
    takeaway: {
      buttonClass: 'bg-gradient-to-r from-[#BFA071] to-[#D2B68A] text-[#2D261E] shadow-[0_6px_18px_-3px_rgba(191,160,113,0.4)] border border-[#E3CDA8]/50 rounded-2xl',
      textColor: 'text-[#2D261E]',
      iconBoxClass: 'bg-[#3A3228] text-[#EADEC7]',
      badgeClass: 'bg-[#3A3228] text-[#EADEC7]',
      btnActionClass: 'bg-[#3A3228] text-[#EADEC7]'
    },
    dock: {
      wrapperClass: 'bg-[#E5DCD3]/30 backdrop-blur-xl border border-[#FAF7F2]/30 shadow-lg rounded-[24px]',
      phone: {
        boxClass: 'bg-gradient-to-tr from-[#5B7B61] to-[#7A9A80] text-[#FAF6F0] rounded-[15px]',
        iconClass: 'text-[#FAF6F0]',
        iconFill: true
      },
      novel: {
        boxClass: 'bg-gradient-to-tr from-[#4B6B8A] to-[#6A8AA9] text-[#FAF6F0] rounded-[15px]',
        iconClass: 'text-[#FAF6F0]'
      }
    }
  },

  // 2. 🍬 马卡龙风格 - 柔和粉嫩甜美奶油糖果调 (9应用9种甜美单色)
  macaron: {
    name: '马卡龙',
    wechat: {
      boxClass: 'bg-gradient-to-tr from-[#10B981] to-[#6EE7B7] shadow-[0_6px_18px_-2px_rgba(16,185,129,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#064E3B]',
      iconFill: true
    },
    takeawayApp: {
      boxClass: 'bg-gradient-to-tr from-[#F59E0B] to-[#FCD34D] shadow-[0_6px_18px_-2px_rgba(245,158,11,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#78350F]',
      iconFill: false
    },
    worldbook: {
      boxClass: 'bg-gradient-to-tr from-[#0284C7] to-[#7DD3FC] shadow-[0_6px_18px_-2px_rgba(2,132,199,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#0C4A6E]'
    },
    marriage: {
      boxClass: 'bg-gradient-to-tr from-[#EC4899] to-[#FBCFE8] shadow-[0_6px_18px_-2px_rgba(236,72,153,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#831843]'
    },
    settings: {
      boxClass: 'bg-gradient-to-tr from-[#64748B] to-[#CBD5E1] shadow-[0_6px_18px_-2px_rgba(100,116,139,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#0F172A]'
    },
    masks: {
      boxClass: 'bg-gradient-to-tr from-[#6366F1] to-[#C7D2FE] shadow-[0_6px_18px_-2px_rgba(99,102,241,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#312E81]'
    },
    twitter: {
      boxClass: 'bg-[#1E293B] shadow-[0_6px_18px_-2px_rgba(30,41,59,0.5)] border border-white/60 rounded-[20px]',
      iconClass: 'text-white'
    },
    diy: {
      boxClass: 'bg-gradient-to-tr from-[#D946EF] to-[#F5D0FE] shadow-[0_6px_18px_-2px_rgba(217,70,239,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#701A75]'
    },
    sukiBaby: {
      boxClass: 'bg-gradient-to-tr from-[#F97316] to-[#FFEDD5] shadow-[0_6px_18px_-2px_rgba(249,115,22,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#7C2D12]'
    },
    pomodoro: {
      boxClass: 'bg-gradient-to-tr from-[#EF4444] to-[#FCA5A5] shadow-[0_6px_18px_-2px_rgba(239,68,68,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#7F1D1D]'
    },
    music: {
      boxClass: 'bg-gradient-to-tr from-[#DC2626] to-[#F87171] shadow-[0_6px_18px_-2px_rgba(220,38,38,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-white'
    },
    luckin: {
      boxClass: 'bg-gradient-to-tr from-[#1E3A8A] to-[#3B82F6] shadow-[0_6px_18px_-2px_rgba(30,58,138,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-white'
    },
    bilibili: {
      boxClass: 'bg-gradient-to-tr from-[#EC4899] to-[#FBCFE8] shadow-[0_6px_18px_-2px_rgba(236,72,153,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-white'
    },
    homestead: {
      boxClass: 'bg-gradient-to-tr from-[#10B981] to-[#A7F3D0] shadow-[0_6px_18px_-2px_rgba(16,185,129,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#064E3B]'
    },
    defaultApp: {
      boxClass: 'bg-gradient-to-tr from-[#06B6D4] to-[#A5F3FC] shadow-[0_6px_18px_-2px_rgba(6,182,212,0.45)] border border-white/70 rounded-[20px]',
      iconClass: 'text-[#164E63]'
    },
    takeaway: {
      buttonClass: 'bg-gradient-to-r from-[#FDE047] via-[#FCD34D] to-[#FBBF24] text-[#78350F] shadow-[0_6px_20px_-3px_rgba(253,224,71,0.5)] border border-white/80 rounded-[22px]',
      textColor: 'text-[#78350F]',
      iconBoxClass: 'bg-[#FB7185] text-white',
      badgeClass: 'bg-[#FB7185] text-white',
      btnActionClass: 'bg-[#FB7185] text-white shadow-xs'
    },
    dock: {
      wrapperClass: 'bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_8px_24px_rgba(255,182,193,0.35)] rounded-[26px]',
      phone: {
        boxClass: 'bg-gradient-to-tr from-[#10B981] to-[#6EE7B7] text-[#064E3B] shadow-sm rounded-[18px]',
        iconClass: 'text-[#064E3B]',
        iconFill: true
      },
      novel: {
        boxClass: 'bg-gradient-to-tr from-[#0284C7] to-[#7DD3FC] text-[#0C4A6E] shadow-sm rounded-[18px]',
        iconClass: 'text-[#0C4A6E]'
      }
    }
  },

  // 3. 🧊 玻璃拟态风格 - 纯净透亮毛玻璃与微光折射 (9色彩玻璃透光)
  glass: {
    name: '玻璃拟态',
    wechat: {
      boxClass: 'bg-emerald-400/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(16,185,129,0.35)] border border-emerald-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]',
      iconFill: true
    },
    takeawayApp: {
      boxClass: 'bg-amber-400/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(245,158,11,0.35)] border border-amber-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]',
      iconFill: false
    },
    worldbook: {
      boxClass: 'bg-sky-400/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(56,189,248,0.35)] border border-sky-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    marriage: {
      boxClass: 'bg-rose-400/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(244,114,182,0.35)] border border-rose-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    settings: {
      boxClass: 'bg-slate-300/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(255,255,255,0.25)] border border-white/70 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    masks: {
      boxClass: 'bg-indigo-400/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(129,140,248,0.35)] border border-indigo-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    twitter: {
      boxClass: 'bg-black/60 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-white/30 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    diy: {
      boxClass: 'bg-fuchsia-400/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(232,121,249,0.35)] border border-fuchsia-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    sukiBaby: {
      boxClass: 'bg-orange-400/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(251,146,60,0.35)] border border-orange-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    pomodoro: {
      boxClass: 'bg-red-400/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(239,68,68,0.35)] border border-red-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    music: {
      boxClass: 'bg-rose-500/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(244,63,94,0.35)] border border-rose-300/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    luckin: {
      boxClass: 'bg-blue-600/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(37,99,235,0.35)] border border-blue-400/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    bilibili: {
      boxClass: 'bg-rose-400/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(244,114,182,0.35)] border border-rose-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    homestead: {
      boxClass: 'bg-teal-400/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(45,212,191,0.35)] border border-teal-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    defaultApp: {
      boxClass: 'bg-cyan-400/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(34,211,238,0.35)] border border-cyan-200/60 rounded-[16px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:to-transparent',
      iconClass: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
    },
    takeaway: {
      buttonClass: 'bg-white/25 backdrop-blur-2xl text-white shadow-[0_8px_25px_rgba(251,191,36,0.25)] border border-white/60 rounded-2xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent',
      textColor: 'text-white',
      iconBoxClass: 'bg-amber-400/35 text-amber-100 border border-amber-300/50',
      badgeClass: 'bg-amber-400/35 text-amber-100 border border-amber-300/50',
      btnActionClass: 'bg-white/30 text-white border border-white/50 backdrop-blur-xs'
    },
    dock: {
      wrapperClass: 'bg-white/20 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.35)] rounded-[24px]',
      phone: {
        boxClass: 'bg-emerald-400/30 backdrop-blur-md border border-emerald-200/60 text-white rounded-[16px] shadow-sm',
        iconClass: 'text-white',
        iconFill: true
      },
      novel: {
        boxClass: 'bg-sky-400/30 backdrop-blur-md border border-sky-200/60 text-white rounded-[16px] shadow-sm',
        iconClass: 'text-white'
      }
    }
  },

  // 4. ⬛ 黑白简约风格 - 极简高质感微调区分 (各图标微调专属深色色效与色线)
  mono: {
    name: '黑白简约',
    wechat: {
      boxClass: 'bg-[#12281D] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#225238] rounded-[10px]',
      iconClass: 'text-[#4ADE80]',
      iconFill: true
    },
    takeawayApp: {
      boxClass: 'bg-[#2A2210] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#544320] rounded-[10px]',
      iconClass: 'text-[#FACC15]',
      iconFill: false
    },
    worldbook: {
      boxClass: 'bg-[#101F30] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#203E60] rounded-[10px]',
      iconClass: 'text-[#60A5FA]'
    },
    marriage: {
      boxClass: 'bg-[#2B121A] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#572434] rounded-[10px]',
      iconClass: 'text-[#FB7185]'
    },
    settings: {
      boxClass: 'bg-[#18181B] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#3F3F46] rounded-[10px]',
      iconClass: 'text-[#E4E4E7]'
    },
    masks: {
      boxClass: 'bg-[#1E122A] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#3E2454] rounded-[10px]',
      iconClass: 'text-[#C084FC]'
    },
    twitter: {
      boxClass: 'bg-[#000000] shadow-[0_4px_14px_rgba(0,0,0,0.8)] border border-[#27272A] rounded-[10px]',
      iconClass: 'text-[#FFFFFF]'
    },
    diy: {
      boxClass: 'bg-[#2E1020] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#5C1F40] rounded-[10px]',
      iconClass: 'text-[#F472B6]'
    },
    sukiBaby: {
      boxClass: 'bg-[#2B1910] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#543220] rounded-[10px]',
      iconClass: 'text-[#FB923C]'
    },
    pomodoro: {
      boxClass: 'bg-[#2A1010] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#542020] rounded-[10px]',
      iconClass: 'text-[#F87171]'
    },
    music: {
      boxClass: 'bg-[#301010] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#602020] rounded-[10px]',
      iconClass: 'text-[#EF4444]'
    },
    luckin: {
      boxClass: 'bg-[#101930] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#203260] rounded-[10px]',
      iconClass: 'text-[#3B82F6]'
    },
    bilibili: {
      boxClass: 'bg-[#2B121A] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#572434] rounded-[10px]',
      iconClass: 'text-[#FB7185]'
    },
    homestead: {
      boxClass: 'bg-[#15251C] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#2B4E38] rounded-[10px]',
      iconClass: 'text-[#5EEAD4]'
    },
    defaultApp: {
      boxClass: 'bg-[#0F2628] shadow-[0_4px_14px_rgba(0,0,0,0.65)] border border-[#1F4A4E] rounded-[10px]',
      iconClass: 'text-[#2DD4BF]'
    },
    takeaway: {
      buttonClass: 'bg-[#FAFAFA] text-[#09090B] shadow-[0_4px_16px_rgba(0,0,0,0.6)] border border-[#E4E4E7] rounded-xl',
      textColor: 'text-[#09090B]',
      iconBoxClass: 'bg-[#09090B] text-[#FAFAFA]',
      badgeClass: 'bg-[#09090B] text-[#FAFAFA]',
      btnActionClass: 'bg-[#09090B] text-[#FAFAFA]'
    },
    dock: {
      wrapperClass: 'bg-[#09090B]/80 backdrop-blur-xl border border-[#27272A] shadow-xl rounded-xl',
      phone: {
        boxClass: 'bg-[#12281D] border border-[#225238] text-[#4ADE80] rounded-[10px]',
        iconClass: 'text-[#4ADE80]',
        iconFill: true
      },
      novel: {
        boxClass: 'bg-[#101F30] border border-[#203E60] text-[#60A5FA] rounded-[10px]',
        iconClass: 'text-[#60A5FA]'
      }
    }
  },

  // 5. 🎀 洛可可风格 - 奶油粉嫩宫廷梦幻调 (9应用9种宫廷粉彩，100%无重复)
  rococo: {
    name: '洛可可',
    wechat: {
      boxClass: 'bg-gradient-to-tr from-[#8ecdb8] to-[#b8ebd8] shadow-[0_6px_18px_-2px_rgba(142,205,184,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#254A3E]',
      iconFill: true
    },
    takeawayApp: {
      boxClass: 'bg-gradient-to-tr from-[#f5d89a] to-[#fde68a] shadow-[0_6px_18px_-2px_rgba(245,216,154,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#5C4515]',
      iconFill: false
    },
    worldbook: {
      boxClass: 'bg-gradient-to-tr from-[#a3c9e8] to-[#cbe2f5] shadow-[0_6px_18px_-2px_rgba(163,201,232,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#204360]'
    },
    marriage: {
      boxClass: 'bg-gradient-to-tr from-[#e89aab] to-[#f4b8c8] shadow-[0_6px_18px_-2px_rgba(232,154,171,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-white'
    },
    settings: {
      boxClass: 'bg-gradient-to-tr from-[#d1cad4] to-[#e8e2eb] shadow-[0_6px_18px_-2px_rgba(209,202,212,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#4A3E4D]'
    },
    masks: {
      boxClass: 'bg-gradient-to-tr from-[#c8b5e0] to-[#e2d8f0] shadow-[0_6px_18px_-2px_rgba(200,181,224,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#452D5E]'
    },
    twitter: {
      boxClass: 'bg-[#2D2426] shadow-[0_6px_18px_-2px_rgba(45,36,38,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-white'
    },
    diy: {
      boxClass: 'bg-gradient-to-tr from-[#e67385] to-[#f8b8c2] shadow-[0_6px_18px_-2px_rgba(230,115,133,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#5E202B]'
    },
    sukiBaby: {
      boxClass: 'bg-gradient-to-tr from-[#f4ae82] to-[#fdd5bd] shadow-[0_6px_18px_-2px_rgba(244,174,130,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#5E3B20]'
    },
    pomodoro: {
      boxClass: 'bg-gradient-to-tr from-[#f47272] to-[#fbcaca] shadow-[0_6px_18px_-2px_rgba(244,114,114,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#5E2020]'
    },
    music: {
      boxClass: 'bg-gradient-to-tr from-[#ef4444] to-[#fca5a5] shadow-[0_6px_18px_-2px_rgba(239,68,68,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-white'
    },
    luckin: {
      boxClass: 'bg-gradient-to-tr from-[#3b82f6] to-[#93c5fd] shadow-[0_6px_18px_-2px_rgba(59,130,246,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-white'
    },
    bilibili: {
      boxClass: 'bg-gradient-to-tr from-[#e89aab] to-[#f4b8c8] shadow-[0_6px_18px_-2px_rgba(232,154,171,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-white'
    },
    homestead: {
      boxClass: 'bg-gradient-to-tr from-[#A8D5BA] to-[#C8E8D5] shadow-[0_6px_18px_-2px_rgba(168,213,186,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#204E38]'
    },
    defaultApp: {
      boxClass: 'bg-gradient-to-tr from-[#b2e2e8] to-[#d8f2f5] shadow-[0_6px_18px_-2px_rgba(178,226,232,0.5)] border border-white/70 rounded-[18px]',
      iconClass: 'text-[#205258]'
    },
    takeaway: {
      buttonClass: 'bg-gradient-to-r from-[#e89aab] to-[#f4b8c8] text-white shadow-[0_6px_20px_-3px_rgba(232,154,171,0.4)] border border-white/80 rounded-[18px]',
      textColor: 'text-[#6b4a52]',
      iconBoxClass: 'bg-[#e89aab] text-white',
      badgeClass: 'bg-[#e89aab] text-white',
      btnActionClass: 'bg-[#e89aab] text-white'
    },
    dock: {
      wrapperClass: 'bg-[#fffaf5]/60 backdrop-blur-2xl border border-[#f0dfe0] shadow-[0_8px_24px_rgba(212,165,175,0.25)] rounded-[22px]',
      phone: {
        boxClass: 'bg-gradient-to-tr from-[#8ecdb8] to-[#b8ebd8] text-[#254A3E] shadow-sm rounded-[16px]',
        iconClass: 'text-[#254A3E]',
        iconFill: true
      },
      novel: {
        boxClass: 'bg-gradient-to-tr from-[#a3c9e8] to-[#cbe2f5] text-[#204360] shadow-sm rounded-[16px]',
        iconClass: 'text-[#204360]'
      }
    }
  }
};

/**
 * 通用获取应用图标主题样式的函数：
 * 如果应用有专属定义则返回专属定义，否则自动返回 currentTheme 的 defaultApp 样式，
 * 确保未来新增任何新应用图标都能完美跟随当前主题！
 */
export function getAppIconStyle(iconSet: ThemeIconSet, appKey: string): AppIconStyle {
  if (appKey && appKey in iconSet) {
    const val = (iconSet as unknown as Record<string, unknown>)[appKey];
    if (val && typeof val === 'object' && 'boxClass' in val) {
      return val as AppIconStyle;
    }
  }
  return iconSet.defaultApp;
}
