import { Contact } from '../../../types/phone';

// 亲属关系关键词
const FAMILY_KEYWORDS = [
  '妈妈', '母亲', '老妈', '妈咪', '阿妈', '娘亲',
  '爸爸', '父亲', '老爸', '爹爹', '阿爸',
  '姐姐', '阿姐', '大姐', '二姐', '老姐',
  '妹妹', '小妹', '阿妹',
  '哥哥', '长兄', '阿哥', '大哥', '二哥', '老哥',
  '弟弟', '小弟', '阿弟',
  '奶奶', '爷爷', '外婆', '外公', '姥姥', '姥爷', '祖母', '祖父',
  '叔叔', '阿姨', '舅舅', '舅妈', '姑姑', '姑父', '伯父', '伯母',
  '表姐', '表妹', '表哥', '表弟', '堂哥', '堂姐', '堂弟', '堂妹',
  '女儿', '儿子', '闺女', '孩子', '千金', '犬子', '侄子', '侄女', '外甥', '外甥女',
  '家人', '亲人', '长辈', '亲属', '至亲', '发小', '世交'
];

// 情侣/伴侣关系关键词
const ROMANTIC_KEYWORDS = [
  '老公', '老婆', '爱人', '伴侣', '恋人', '情侣', '男友', '女友', '先生', '妻子',
  '对象', '未婚夫', '未婚妻', '心上人', '宝贝', '亲爱的', '夫人', '相公'
];

/**
 * 判断联系人是否属于亲人/家庭角色（基于人设、备注、姓名、关系）
 */
export function isFamilyContact(contact: Contact): boolean {
  if (contact.isGroup || contact.isAssistant || (contact as any).isTool) return false;

  const textToCheck = [
    contact.name,
    contact.remark,
    contact.persona,
    contact.relationship
  ].filter(Boolean).join(' ').toLowerCase();

  return FAMILY_KEYWORDS.some(kw => textToCheck.includes(kw));
}

/**
 * 判断联系人是否属于婚后/伴侣角色
 */
export function isRomanticContact(contact: Contact): boolean {
  if (contact.isGroup || contact.isAssistant || (contact as any).isTool) return false;

  // 1. 系统关系已婚/订婚/恋爱优先
  if (contact.relationship === 'married' || contact.relationship === 'engaged' || contact.relationship === 'dating') {
    return true;
  }

  // 2. 如果包含明确亲人词汇，则归为亲人
  if (isFamilyContact(contact)) {
    return false;
  }

  // 3. 检查情侣关键词
  const textToCheck = [
    contact.name,
    contact.remark,
    contact.persona
  ].filter(Boolean).join(' ').toLowerCase();

  if (ROMANTIC_KEYWORDS.some(kw => textToCheck.includes(kw))) {
    return true;
  }

  // 4. 高好感度默认为婚后伴侣潜力角色
  return (contact.affection || 0) >= 60;
}

/**
 * 自动分类联系人
 */
export function getRecommendedContactsForHome(
  contacts: Contact[],
  homeType: 'marital' | 'family'
): Contact[] {
  return contacts.filter(c => {
    if (c.isGroup || c.isAssistant || (c as any).isTool) return false;
    if (homeType === 'family') {
      return isFamilyContact(c);
    } else {
      return isRomanticContact(c);
    }
  });
}
