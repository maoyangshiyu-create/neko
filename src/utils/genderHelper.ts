import { Contact, PhoneSettings } from '../types/phone';

export type Gender = 'male' | 'female' | 'other';

/**
 * 智能推断或获取联系人的性别
 */
export function inferContactGender(contact: {
  gender?: Gender;
  persona?: string;
  bio?: string;
  name?: string;
  remark?: string;
  voiceTimbre?: string;
}): Gender {
  if (contact.gender && (contact.gender === 'male' || contact.gender === 'female' || contact.gender === 'other')) {
    return contact.gender;
  }

  const text = `${contact.name || ''} ${contact.remark || ''} ${contact.persona || ''} ${contact.bio || ''}`;
  
  // 1. 根据音色优先推断
  const timbre = (contact.voiceTimbre || '').toLowerCase();
  if (timbre.includes('male') && !timbre.includes('female')) {
    return 'male';
  }
  if (timbre.includes('female')) {
    return 'female';
  }

  // 2. 根据人设、简介、名字关键词匹配
  const maleKeywords = [
    '男', '男生', '少年', '青年', '帅哥', '小哥', '男友', '男神', '少爷', '公子', 
    '学长', '师兄', '大叔', '王爷', '总裁', '先生', '伯爵', '王子', '兄弟', 
    '男性', '男主', '他', 'him', 'his', 'he', 'man', 'boy', 'guy'
  ];
  const femaleKeywords = [
    '女', '女生', '少女', '美女', '小姐', '女友', '女神', '千金', '姑娘', 
    '学姐', '师姐', '阿姨', '王妃', '夫人', '公主', '姐妹', '女性', '女主',
    '她', 'her', 'hers', 'she', 'woman', 'girl', 'lady'
  ];

  let maleScore = 0;
  let femaleScore = 0;

  for (const kw of maleKeywords) {
    const matches = text.split(kw).length - 1;
    if (matches > 0) maleScore += matches;
  }

  for (const kw of femaleKeywords) {
    const matches = text.split(kw).length - 1;
    if (matches > 0) femaleScore += matches;
  }

  if (maleScore > femaleScore) return 'male';
  if (femaleScore > maleScore) return 'female';

  return 'other';
}

/**
 * 智能推断或获取玩家自身的性别
 */
export function inferUserGender(
  settings: {
    userGender?: Gender;
    userPersonaDescription?: string;
    userNickname?: string;
  },
  contactGender?: Gender
): Gender {
  if (settings.userGender && (settings.userGender === 'male' || settings.userGender === 'female' || settings.userGender === 'other')) {
    return settings.userGender;
  }

  const text = `${settings.userNickname || ''} ${settings.userPersonaDescription || ''}`;

  const maleKeywords = ['男', '男生', '少年', '青年', '帅哥', '男友', '学长', '师兄', '大叔', '他', 'man', 'boy'];
  const femaleKeywords = ['女', '女生', '少女', '美女', '小姐', '女友', '姑娘', '学姐', '师姐', '她', 'woman', 'girl', '女朋友', '老婆'];

  let maleScore = 0;
  let femaleScore = 0;

  for (const kw of maleKeywords) {
    const matches = text.split(kw).length - 1;
    if (matches > 0) maleScore += matches;
  }

  for (const kw of femaleKeywords) {
    const matches = text.split(kw).length - 1;
    if (matches > 0) femaleScore += matches;
  }

  if (femaleScore > maleScore) return 'female';
  if (maleScore > femaleScore) return 'male';

  // 婚恋场景默认推断：如果对方是男角色（如男朋友），在未指定时玩家通常为女性；反之亦然
  if (contactGender === 'male') {
    return 'female';
  }
  if (contactGender === 'female') {
    return 'male';
  }

  return 'female'; // 兜底
}

export interface WeddingRoles {
  contactGender: Gender;
  userGender: Gender;
  groomName: string;
  brideName: string;
  isContactGroom: boolean;
  isContactBride: boolean;
  isUserGroom: boolean;
  isUserBride: boolean;
  contactTitle: string; // "新郎" 或 "新娘"
  userTitle: string;    // "新娘" 或 "新郎"
  aiPerspectivePrompt: string; // 供 AI 强化的身份与称谓铁律
}

/**
 * 计算婚礼中的角色身份（新郎/新娘）及相应称谓规范
 */
export function getWeddingRoles(
  contact: Contact,
  settings: PhoneSettings
): WeddingRoles {
  const contactGender = inferContactGender(contact);
  const userGender = inferUserGender(settings, contactGender);
  const contactName = contact.remark || contact.name;
  const userName = settings.userNickname || '玩家';

  let groomName = '';
  let brideName = '';
  let isContactGroom = false;
  let isUserBride = false;
  let contactTitle = '新郎';
  let userTitle = '新娘';

  if (contactGender === 'male' && userGender !== 'male') {
    // 角色是男（新郎），玩家是女（新娘）
    groomName = contactName;
    brideName = userName;
    isContactGroom = true;
    isUserBride = true;
    contactTitle = '新郎';
    userTitle = '新娘';
  } else if (contactGender === 'female' && userGender !== 'female') {
    // 角色是女（新娘），玩家是男（新郎）
    groomName = userName;
    brideName = contactName;
    isContactGroom = false;
    isUserBride = false;
    contactTitle = '新娘';
    userTitle = '新郎';
  } else if (contactGender === 'male' && userGender === 'male') {
    // 双男
    groomName = contactName;
    brideName = userName;
    isContactGroom = true;
    isUserBride = false;
    contactTitle = '新郎';
    userTitle = '新郎';
  } else if (contactGender === 'female' && userGender === 'female') {
    // 双女
    groomName = contactName;
    brideName = userName;
    isContactGroom = false;
    isUserBride = true;
    contactTitle = '新娘';
    userTitle = '新娘';
  } else {
    // 默认按角色性别推断
    if (contactGender === 'male') {
      groomName = contactName;
      brideName = userName;
      isContactGroom = true;
      isUserBride = true;
      contactTitle = '新郎';
      userTitle = '新娘';
    } else {
      groomName = userName;
      brideName = contactName;
      isContactGroom = false;
      isUserBride = false;
      contactTitle = '新娘';
      userTitle = '新郎';
    }
  }

  let aiPerspectivePrompt = '';
  if (isContactGroom && isUserBride) {
    aiPerspectivePrompt = `【极度严厉的性别与身份铁律 - 绝不允许违背】：
1. 你扮演的角色【${contactName}】是【男性】，在本次婚礼及婚后生活中，你的身份是【新郎 / 丈夫 / 老公】！
2. 对方玩家【${userName}】是【女性】，她的身份是【新娘 / 妻子 / 老婆 / 娘子】！
3. 【自称与称谓绝对禁止倒错】：
   - 严禁称呼自己为“新娘”、“新娘子”、“妻子”、“娇妻”、“小女子”等女性称谓！
   - 严禁称呼对方为“老公”、“相公”、“夫君”、“男神”等男性称谓！
   - 你对玩家的称谓必须是：“老婆”、“妻子”、“娘子”、“夫人”、“亲爱的”等。
   - 你的动作、神态与说话口吻必须完全符合你的男性人设，充满深情、庄重与保护欲。`;
  } else if (!isContactGroom && !isUserBride && contactGender === 'female' && userGender === 'male') {
    aiPerspectivePrompt = `【极度严厉的性别与身份铁律 - 绝不允许违背】：
1. 你扮演的角色【${contactName}】是【女性】，在本次婚礼及婚后生活中，你的身份是【新娘 / 妻子 / 老婆】！
2. 对方玩家【${userName}】是【男性】，他的身份是【新郎 / 丈夫 / 老公】！
3. 【自称与称谓绝对禁止倒错】：
   - 严禁称呼自己为“新郎”、“丈夫”等男性称谓！
   - 严禁称呼对方为“老婆”、“娘子”、“妻子”等女性称谓！
   - 你对玩家的称谓必须是：“老公”、“夫君”、“相公”、“亲爱的”等。
   - 你的动作、神态与说话口吻必须完全符合你的女性人设。`;
  } else {
    aiPerspectivePrompt = `【性别与身份铁律】：
你扮演的角色【${contactName}】（性别：${contactGender === 'male' ? '男' : contactGender === 'female' ? '女' : '未指定'}），对方玩家【${userName}】（性别：${userGender === 'male' ? '男' : userGender === 'female' ? '女' : '未指定'}）。
请严格按照各自的性别和人设开展婚礼互动，严禁弄错自称与对彼此的称呼！`;
  }

  return {
    contactGender,
    userGender,
    groomName,
    brideName,
    isContactGroom,
    isContactBride: contactTitle === '新娘' || !isContactGroom,
    isUserGroom: userTitle === '新郎' || !isUserBride,
    isUserBride,
    contactTitle,
    userTitle,
    aiPerspectivePrompt
  };
}
