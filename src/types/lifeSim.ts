export interface LifeSimChildAttributes {
  intelligence: number; // 智力
  physique: number;     // 体质
  eq: number;           // 情商
  appearance: number;   // 颜值
  mood: number;         // 心情
  happiness: number;    // 幸福感
}

export interface LifeSimEventOption {
  id: 'A' | 'B' | 'C';
  text: string;
  effects: Partial<LifeSimChildAttributes>;
  reasoning: string;
}

export interface LifeSimEvent {
  scene: string;
  age: number;
  options: LifeSimEventOption[];
  isMilestone?: boolean;
  milestoneTitle?: string;
}

export interface LifeSimLogItem {
  id: string;
  age: number;
  scene: string;
  userChoiceId: 'A' | 'B' | 'C';
  userChoiceText: string;
  contactChoiceId: 'A' | 'B' | 'C';
  contactChoiceText: string;
  isMatched: boolean;
  effects: Partial<LifeSimChildAttributes>;
  childReaction: string;
  contactComment: string;
  timestamp: number;
}

export interface LifeSimChildData {
  id?: string;
  childName: string;
  gender: 'male' | 'female';
  age: number;
  birthTimestamp?: number;
  attributes: LifeSimChildAttributes;
  intimacyToUser: number;
  intimacyToContact: number;
  personalityTags: string[];
  logs: LifeSimLogItem[];
  createdAt: number;
  contactId: string;
  contactName: string;
  familyBackground?: {
    financial: string;    // 家庭家境 (e.g. 普通工薪, 中产小康, 富裕家庭, 书香门第)
    atmosphere: string;   // 育儿氛围 (e.g. 温暖包容, 严格要求, 自由放养, 科学理性)
    customDesc?: string;  // 自定义补充描述
  };
  homeworks?: LifeSimHomework[];
}

export interface LifeSimHomework {
  id: string;
  age: number;
  subject: string;
  assignmentName: string;
  score: string;
  grade: '优' | '良' | '中' | '需努力';
  teacherComment: string;
  userComment?: string;
  userSignature?: string; // base64 image data URL or point array
  contactComment?: string;
  contactSignaturePath?: string; // SVG path animation
  signedAt?: number;
}

export interface LifeSimSiblingEventOption {
  id: 'A' | 'B' | 'C';
  text: string;
  effectsA: Partial<LifeSimChildAttributes>;
  effectsB: Partial<LifeSimChildAttributes>;
  reasoning: string;
}

export interface LifeSimSiblingEvent {
  childAId: string;
  childBId: string;
  childAName: string;
  childBName: string;
  scene: string;
  options: LifeSimSiblingEventOption[];
}


