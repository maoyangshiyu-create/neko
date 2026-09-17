import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Baby, Heart, Sparkles, RefreshCw, BookOpen, ChevronRight, CheckCircle2, MessageSquare, TrendingUp, FileText, Copy, Check, Pencil, Trash2, RotateCcw, PenTool, Plus, Users, Gamepad2, Save } from 'lucide-react';
import { PhoneSettings, Contact, ContactMemory } from '../../../types/phone';
import { LifeSimChildData, LifeSimEvent, LifeSimLogItem, LifeSimChildAttributes, LifeSimHomework } from '../../../types/lifeSim';
import { ChildCreationModal } from './ChildCreationModal';
import { ChildInfoCard } from './ChildInfoCard';
import { HomeworkSigningModal } from './HomeworkSigningModal';
import { SiblingInteractionModal } from './SiblingInteractionModal';
import { PuzzleGameModal } from './PuzzleGameModal';
import { GraduationModal } from './GraduationModal';
import { generateLifeSimEvent, getContactChoice, getPostChoiceReactions, updateChildPersonalityTags, generateAiGrowthReport, generateHomeworkAssignment, getAiPartnerHomeworkFeedback } from '../../../services/lifeSimService';

/**
 * 计算每一个岁数的属性点积累历史 (0 岁到当前岁)
 */
const getAttributeHistory = (logs: LifeSimLogItem[]) => {
  const history = [{
    age: 0,
    intelligence: 50,
    physique: 50,
    eq: 50,
    appearance: 50,
    happiness: 80
  }];
  
  let currentIntel = 50;
  let currentPhys = 50;
  let currentEq = 50;
  let currentApp = 50;
  let currentHap = 80;
  
  // 按照年龄从小到大排序
  const sortedLogs = [...logs].sort((a, b) => a.age - b.age);
  
  sortedLogs.forEach(log => {
    currentIntel += log.effects.intelligence || 0;
    currentPhys += log.effects.physique || 0;
    currentEq += log.effects.eq || 0;
    currentApp += log.effects.appearance || 0;
    currentHap += log.effects.happiness || 0;
    
    currentIntel = Math.max(0, Math.min(100, currentIntel));
    currentPhys = Math.max(0, Math.min(100, currentPhys));
    currentEq = Math.max(0, Math.min(100, currentEq));
    currentApp = Math.max(0, Math.min(100, currentApp));
    currentHap = Math.max(0, Math.min(100, currentHap));
    
    history.push({
      age: log.age + 1,
      intelligence: currentIntel,
      physique: currentPhys,
      eq: currentEq,
      appearance: currentApp,
      happiness: currentHap
    });
  });
  
  return history;
};

/**
 * 纯手绘的高清、自适应 SVG 属性趋势折线图，完美跟随系统主题配色
 */
const AttributeTrendChart: React.FC<{ logs: LifeSimLogItem[] }> = ({ logs }) => {
  const data = getAttributeHistory(logs);
  const width = 310;
  const height = 180;
  const padding = 25;
  
  const maxAge = Math.max(...data.map(d => d.age), 1);
  
  const getX = (age: number) => padding + (age / maxAge) * (width - 2 * padding);
  const getY = (val: number) => height - padding - (val / 100) * (height - 2 * padding);
  
  const getPath = (key: 'intelligence' | 'physique' | 'eq' | 'appearance' | 'happiness') => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.age)} ${getY(d[key])}`).join(' ');
  };

  const attributesList = [
    { key: 'intelligence', color: '#f4b8c8', label: '智力' },
    { key: 'physique', color: '#a8d5c8', label: '体质' },
    { key: 'eq', color: '#f5d89a', label: '情商' },
    { key: 'appearance', color: '#c8b5e0', label: '颜值' },
    { key: 'happiness', color: '#b8d4e8', label: '幸福' }
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden flex justify-center bg-white rounded-2xl p-3 border border-[#f0dfe0]">
        <svg width={width} height={height} className="overflow-visible">
          {/* Y 轴网格线 (0, 25, 50, 75, 100) */}
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line 
                x1={padding} 
                y1={getY(v)} 
                x2={width - padding} 
                y2={getY(v)} 
                stroke="#f3e8e6" 
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text 
                x={padding - 5} 
                y={getY(v) + 3} 
                textAnchor="end" 
                fontSize="8" 
                fill="#b398a0"
                className="font-bold"
              >
                {v}
              </text>
            </g>
          ))}
          
          {/* X 轴刻度及标注 */}
          {data.map(d => (
            <g key={d.age}>
              <line
                x1={getX(d.age)}
                y1={height - padding}
                x2={getX(d.age)}
                y2={height - padding + 3}
                stroke="#f0dfe0"
                strokeWidth={1}
              />
              <text 
                x={getX(d.age)} 
                y={height - 8} 
                textAnchor="middle" 
                fontSize="8" 
                fill="#b398a0"
                className="font-bold"
              >
                {d.age}岁
              </text>
            </g>
          ))}
          
          {/* 渲染折线 */}
          {attributesList.map(attr => (
            <path
              key={attr.key}
              d={getPath(attr.key)}
              fill="none"
              stroke={attr.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* 渲染数据点圆圈 */}
          {data.map(d => (
            <g key={d.age}>
              {attributesList.map(attr => (
                <circle
                  key={attr.key}
                  cx={getX(d.age)}
                  cy={getY(d[attr.key])}
                  r={3}
                  fill={attr.color}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* 底部指标图例 */}
      <div className="grid grid-cols-5 gap-1.5 text-[10px] font-bold text-center">
        {attributesList.map(attr => (
          <div key={attr.key} className="flex items-center justify-center gap-1 p-1 rounded-lg" style={{ backgroundColor: '#fdf6f0' }}>
            <span className="w-2 rounded-full h-2" style={{ backgroundColor: attr.color }} />
            <span style={{ color: '#6b4a52' }}>{attr.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 生成精美本地备份版 Markdown 成长总结报告（防断网 / AI 故障兜底）
 */
const generateLocalReport = (child: LifeSimChildData, contactName: string, userName: string) => {
  const fb = child.familyBackground || { financial: '中产小康', atmosphere: '温暖包容' };
  const safeLogs = Array.isArray(child.logs) ? child.logs : [];
  const safePersonality = Array.isArray(child.personalityTags) ? child.personalityTags : [];
  const milestoneLogs = safeLogs.filter(l => l && l.scene && (l.scene.includes('【') || l.age % 3 === 0));
  
  return `✨ ${child.childName} 的成长里程碑总结报告 ✨

📅 养育纪念日：${new Date(child.createdAt).toLocaleDateString('zh-CN')}
👩‍❤️‍👨 执子之手，与子偕老：${userName} & ${contactName} 共同抚养

==================================
一、 🧸 娃的个人档案 (Child's Archive)
==================================
* 宝宝姓名：${child.childName}
* 宝宝性别：${child.gender === 'male' ? '小帅哥 👦' : '小公主 👧'}
* 当前岁数：${child.age} 岁
* 最终性格：${safePersonality.join('、') || '乖巧懂事'}
* 家庭情况：家境${fb.financial} | 育儿氛围：${fb.atmosphere}

==================================
二、 📈 六维核心素养 (Attributes)
==================================
* 🧠 智力潜能：${child.attributes?.intelligence || 0} / 100 (专注、求知、逻辑能力)
* 🏃 强健体魄：${child.attributes?.physique || 0} / 100 (免疫、运动、精力体质)
* 🎨 情商表达：${child.attributes?.eq || 0} / 100 (社交、同理、表达沟通)
* 🌸 卓越颜值：${child.attributes?.appearance || 0} / 100 (仪态、气质、审美魅力)
* ☀️ 身心调节：${child.attributes?.mood || 0} / 100 (抗挫、自愈、日常心情)
* ❤️ 幸福指数：${child.attributes?.happiness || 0} / 100 (满足感、安全感)

==================================
三、 🏆 成长历程事件回顾 (Milestones)
==================================
${milestoneLogs.length > 0 
  ? milestoneLogs.map(l => `* 【${l.age} 岁】经历：${l.scene.split('。')[0]}。\n  └ 你的决策：${l.userChoiceText} | ${contactName}的选择：${l.contactChoiceText}`).join('\n')
  : '* 暂无重大事件记录，继续伴TA成长吧！'}

==================================
四、 💌 给 ${child.childName} 的联名成长寄语
==================================
在这段携手陪伴你成长的美好日子里，我们与 ${contactName} 共同做出了大大小小无数个选择。每一个决定的背后，都包含着我们深深的期盼与无私的爱意。

愿你带着【${safePersonality.join('、') || '平和'}】的独特品行，在未来的道路上勇敢前行，不管遇到什么风雨，你的背后永远有爸爸妈妈的支持！

报告导出于：WePhone 养娃模拟工坊`;
};

const FINANCIAL_OPTIONS = [
  { value: '普通工薪', label: '普通工薪', desc: '踏实温饱，精打细算' },
  { value: '中产小康', label: '中产小康', desc: '优渥安稳，看重素质' },
  { value: '富裕优渥', label: '富裕优渥', desc: '实力雄厚，衣食无忧' },
  { value: '书香门第', label: '书香门第', desc: '重学乐道，书卷气浓' }
];

const ATMOSPHERE_OPTIONS = [
  { value: '温暖包容', label: '温暖包容', desc: '充满关爱，常加鼓励' },
  { value: '严格要求', label: '严格要求', desc: '看重规矩，培养克己' },
  { value: '自由放养', label: '自由放养', desc: '顺应天性，开阔随心' },
  { value: '科学理性', label: '科学理性', desc: '温理智性，有事讲理' }
];

interface FamilySetupFormProps {
  onSave: (financial: string, atmosphere: string, customDesc: string) => void;
  activeContact: Contact;
  initialValues?: { financial: string; atmosphere: string; customDesc?: string };
  onCancel?: () => void;
}

const FamilySetupForm: React.FC<FamilySetupFormProps> = ({ onSave, activeContact, initialValues, onCancel }) => {
  const [financial, setFinancial] = useState<string>(initialValues?.financial || '中产小康');
  const [atmosphere, setAtmosphere] = useState<string>(initialValues?.atmosphere || '温暖包容');
  const [customDesc, setCustomDesc] = useState<string>(initialValues?.customDesc || '');

  return (
    <div 
      className="p-5 rounded-3xl border flex flex-col gap-4 animate-fadeIn"
      style={{
        backgroundColor: 'var(--pet-card, #fffaf5)',
        borderColor: 'var(--pet-card-border, #f0dfe0)',
      }}
    >
      {/* 选项 1: 家境 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
          家庭情况 (家境)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FINANCIAL_OPTIONS.map((opt) => {
            const isSel = financial === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFinancial(opt.value)}
                className="p-2.5 rounded-2xl text-[11px] font-bold flex flex-col text-left transition-all active:scale-98 border"
                style={{
                  backgroundColor: isSel ? 'var(--pet-option-hover, #fdf0ec)' : 'var(--pet-bg, #fdf6f0)',
                  color: 'var(--pet-text, #6b4a52)',
                  borderColor: isSel ? 'var(--pet-btn-bg, #e89aab)' : 'var(--pet-card-border, #f0dfe0)',
                }}
              >
                <span>💰 {opt.label}</span>
                <span className="text-[9px] font-normal opacity-75 mt-0.5">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 选项 2: 氛围 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
          育儿氛围
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ATMOSPHERE_OPTIONS.map((opt) => {
            const isSel = atmosphere === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAtmosphere(opt.value)}
                className="p-2.5 rounded-2xl text-[11px] font-bold flex flex-col text-left transition-all active:scale-98 border"
                style={{
                  backgroundColor: isSel ? 'var(--pet-option-hover, #fdf0ec)' : 'var(--pet-bg, #fdf6f0)',
                  color: 'var(--pet-text, #6b4a52)',
                  borderColor: isSel ? 'var(--pet-btn-bg, #e89aab)' : 'var(--pet-card-border, #f0dfe0)',
                }}
              >
                <span>🌟 {opt.label}</span>
                <span className="text-[9px] font-normal opacity-75 mt-0.5">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 选项 3: 自定义描述 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
          自定义情况描述 <span className="text-[10px] font-normal opacity-75">(选填)</span>
        </label>
        <input
          type="text"
          value={customDesc}
          onChange={(e) => setCustomDesc(e.target.value)}
          maxLength={40}
          placeholder="例如：双职家庭，平时比较忙，喜欢旅游等"
          className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none transition-all"
          style={{
            backgroundColor: 'var(--pet-bg, #fdf6f0)',
            color: 'var(--pet-text, #6b4a52)',
            border: '1px solid var(--pet-card-border, #f0dfe0)'
          }}
        />
      </div>

      {/* 底部按钮 */}
      <div className="flex items-center gap-2 mt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs border transition-all active:scale-95 text-center"
            style={{
              backgroundColor: '#fff',
              color: 'var(--pet-text, #6b4a52)',
              borderColor: 'var(--pet-card-border, #f0dfe0)'
            }}
          >
            取消
          </button>
        )}
        <button
          type="button"
          onClick={() => onSave(financial, atmosphere, customDesc)}
          className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: 'var(--pet-btn-bg, #e89aab)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>保存并确立理念</span>
        </button>
      </div>
    </div>
  );
};

interface SukiBabyAppProps {
  settings: PhoneSettings;
  onUpdateSettings: (s: Partial<PhoneSettings>) => void;
  onReturnToDesktop: () => void;
  contacts: Contact[];
  contactMemories?: Record<string, ContactMemory>;
  onUpdateContactMemory?: (contactId: string, memory: ContactMemory) => void;
  onAddContact?: (contact: Partial<Contact>, initialMessages?: any[]) => void;
}

export const SukiBabyApp: React.FC<SukiBabyAppProps> = ({
  settings,
  onUpdateSettings,
  onReturnToDesktop,
  contacts,
  contactMemories = {},
  onUpdateContactMemory,
  onAddContact
}) => {
  const marriages = (settings && Array.isArray(settings.marriages)) ? settings.marriages : [];

  // 当前选中的已婚/养娃伴侣 ID (自动恢复本地保存的已选中伴侣)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(() => {
    try {
      const savedPartnerId = localStorage.getItem('wephone_pet_active_partner_id');
      if (savedPartnerId) return savedPartnerId;
      if (marriages && marriages.length > 0) return marriages[0].partnerId;
    } catch {
      // ignore
    }
    return null;
  });

  const [saveToastMsg, setSaveToastMsg] = useState<string | null>(null);

  const triggerSaveToast = (msg: string) => {
    setSaveToastMsg(msg);
    setTimeout(() => {
      setSaveToastMsg(prev => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleSelectPartner = (partnerId: string | null) => {
    setSelectedPartnerId(partnerId);
    try {
      if (partnerId) {
        localStorage.setItem('wephone_pet_active_partner_id', partnerId);
      } else {
        localStorage.removeItem('wephone_pet_active_partner_id');
      }
    } catch {
      // ignore
    }
  };

  // 娃的列表和当前选中的活跃娃的 ID (从 localStorage key `wephone_pet_list_v1_{selectedPartnerId}` 读取)
  const [childrenList, setChildrenList] = useState<LifeSimChildData[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [childToGraduate, setChildToGraduate] = useState<LifeSimChildData | null>(null);

  // 衍生计算：当前活跃的娃
  const childData = childrenList.find(c => c.id === activeChildId) || null;

  // 手足互动及新一胎创建弹窗状态
  const [showSiblingModal, setShowSiblingModal] = useState<boolean>(false);
  const [showCreateAnotherModal, setShowCreateAnotherModal] = useState<boolean>(false);

  // 家庭背景及修改状态
  const [familyBackground, setFamilyBackground] = useState<{ financial: string; atmosphere: string; customDesc?: string } | null>(null);
  const [showEditFamily, setShowEditFamily] = useState<boolean>(false);

  // 核心事件流程状态
  const [eventState, setEventState] = useState<'idle' | 'generating' | 'choosing' | 'waiting_contact' | 'result'>('idle');
  const [currentEvent, setCurrentEvent] = useState<LifeSimEvent | null>(null);
  const [userChoiceId, setUserChoiceId] = useState<'A' | 'B' | 'C' | null>(null);
  const [contactChoiceId, setContactChoiceId] = useState<'A' | 'B' | 'C' | null>(null);
  const [childReaction, setChildReaction] = useState<string>('');
  const [contactComment, setContactComment] = useState<string>('');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [logTab, setLogTab] = useState<'memories' | 'trends' | 'report'>('memories');
  const [reportText, setReportText] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // 作业签字系统状态
  const [showHomeworkModal, setShowHomeworkModal] = useState<boolean>(false);
  const [currentHomework, setCurrentHomework] = useState<{ subject: string; assignmentName: string; score: string; grade: '优' | '良' | '中' | '需努力'; teacherComment: string } | null>(null);
  const [userHomeworkComment, setUserHomeworkComment] = useState<string>('');
  const [userSignatureData, setUserSignatureData] = useState<string>('');
  const [isUserSigned, setIsUserSigned] = useState<boolean>(false);
  const [aiHomeworkComment, setAiHomeworkComment] = useState<string>('');
  const [isAiSigning, setIsAiSigning] = useState<boolean>(false);
  const [aiSignatureSigned, setAiSignatureSigned] = useState<boolean>(false);
  const [isGeneratingAiHomework, setIsGeneratingAiHomework] = useState<boolean>(false);

  // 益智猜词小游戏状态
  const [showPuzzleGameModal, setShowPuzzleGameModal] = useState<boolean>(false);

  // 对应的 Contact 对象
  const activeContact = contacts.find(c => c.id === selectedPartnerId) || {
    id: selectedPartnerId || 'partner',
    name: marriages.find(m => m.partnerId === selectedPartnerId)?.partnerName || '伴侣',
    persona: '温柔体贴的伴侣'
  } as Contact;

  // 辅助：向伴侣写入育儿相关的日记和记忆碎片 (从伴侣视角口吻自动流露)
  const addBabyEventToMemory = (title: string, logContent: string) => {
    if (!selectedPartnerId) return;
    
    // 获取当事伴侣原有的微信记忆
    const existing = contactMemories?.[selectedPartnerId] || { diaries: [], facts: [] };
    
    // 1. 构造高感知度育儿日记
    const newDiary = {
      id: `diary_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      content: `【育儿日志 - ${title}】\n${logContent}`
    };
    
    // 2. 构造记忆事实（30字以内精简保真）
    const newFact = {
      id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fact: `${title}：${logContent.replace(/\s+/g, '').slice(0, 25)}...`
    };
    
    // 3. 回调保存
    if (onUpdateContactMemory) {
      onUpdateContactMemory(selectedPartnerId, {
        diaries: [newDiary, ...(existing.diaries || [])],
        facts: [newFact, ...(existing.facts || [])]
      });
    }
  };

  // 辅助函数：快速获取特定伴侣对应的所有娃列表数据
  const getChildrenForPartner = (partnerId: string): LifeSimChildData[] => {
    try {
      const listRaw = localStorage.getItem(`wephone_pet_list_v1_${partnerId}`);
      if (listRaw) {
        const parsed = JSON.parse(listRaw);
        if (Array.isArray(parsed)) return parsed;
      }
      const raw = localStorage.getItem(`wephone_pet_v1_${partnerId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return [parsed as LifeSimChildData];
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  // 每次切换伴侣时，读取对应的列表并支持旧版数据迁移与家庭理念加载
  useEffect(() => {
    if (!selectedPartnerId) {
      setChildrenList([]);
      setActiveChildId(null);
      setFamilyBackground(null);
      return;
    }
    const listKey = `wephone_pet_list_v1_${selectedPartnerId}`;
    const singleKey = `wephone_pet_v1_${selectedPartnerId}`;
    const familyKey = `wephone_family_v1_${selectedPartnerId}`;

    // 1. 读取或迁移家庭背景
    let activeFamily = null;
    try {
      const familyRaw = localStorage.getItem(familyKey);
      if (familyRaw) {
        activeFamily = JSON.parse(familyRaw);
      } else {
        // 尝试从现有娃中抽取背景，避免老用户重新填写
        const listRaw = localStorage.getItem(listKey) || localStorage.getItem(singleKey);
        if (listRaw) {
          const parsed = JSON.parse(listRaw);
          const firstChild = Array.isArray(parsed) ? parsed[0] : parsed;
          if (firstChild && firstChild.familyBackground) {
            activeFamily = firstChild.familyBackground;
          } else {
            // 如果已有娃但是无背景，给一个精致的温和保底
            activeFamily = { financial: '中产小康', atmosphere: '温暖包容', customDesc: '' };
          }
          localStorage.setItem(familyKey, JSON.stringify(activeFamily));
        }
      }
    } catch (e) {
      console.warn('Failed to load family background:', e);
    }
    setFamilyBackground(activeFamily);

    // 2. 读取孩子列表
    try {
      const listRaw = localStorage.getItem(listKey);
      const savedActiveChildId = localStorage.getItem(`wephone_pet_active_child_id_${selectedPartnerId}`);

      if (listRaw) {
        const parsedList = JSON.parse(listRaw) as LifeSimChildData[];
        setChildrenList(parsedList);
        if (parsedList.length > 0) {
          const matchedChild = parsedList.find(c => c.id === savedActiveChildId) || parsedList[parsedList.length - 1] || parsedList[0];
          setActiveChildId(matchedChild?.id || null);
        } else {
          setActiveChildId(null);
        }
      } else {
        const singleRaw = localStorage.getItem(singleKey);
        if (singleRaw) {
          const legacy = JSON.parse(singleRaw) as LifeSimChildData;
          if (!legacy.id) {
            legacy.id = `child_${legacy.createdAt || Date.now()}`;
          }
          const list = [legacy];
          localStorage.setItem(listKey, JSON.stringify(list));
          setChildrenList(list);
          setActiveChildId(legacy.id);
        } else {
          setChildrenList([]);
          setActiveChildId(null);
        }
      }
    } catch (e) {
      console.warn('Failed to load child list:', e);
      setChildrenList([]);
      setActiveChildId(null);
    }
    // 重置事件流
    setEventState('idle');
    setCurrentEvent(null);
    setUserChoiceId(null);
    setContactChoiceId(null);
  }, [selectedPartnerId]);

  // 保存单个娃的数据至列表并写入 localStorage
  const saveChildData = (data: LifeSimChildData) => {
    if (!selectedPartnerId) return;
    if (!data.id) {
      data.id = `child_${data.createdAt || Date.now()}`;
    }
    const listKey = `wephone_pet_list_v1_${selectedPartnerId}`;

    let latestList: LifeSimChildData[] = [];
    try {
      const listRaw = localStorage.getItem(listKey);
      if (listRaw) {
        latestList = JSON.parse(listRaw);
      } else {
        latestList = [...childrenList];
      }
    } catch (e) {
      latestList = [...childrenList];
    }

    const idx = latestList.findIndex(c => c.id === data.id);
    if (idx !== -1) {
      latestList[idx] = data;
    } else {
      latestList.push(data);
    }

    try {
      localStorage.setItem(listKey, JSON.stringify(latestList));
      localStorage.setItem(`wephone_pet_active_child_id_${selectedPartnerId}`, data.id);
      localStorage.setItem('wephone_pet_active_partner_id', selectedPartnerId);
      setChildrenList(latestList);
      setActiveChildId(data.id || null);
    } catch (e) {
      console.warn('Failed to save child data:', e);
    }
  };

  // 创建新娃
  const handleCreateChild = (
    childName: string,
    gender: 'male' | 'female'
  ) => {
    if (!selectedPartnerId || !familyBackground) return;
    const initialChild: LifeSimChildData = {
      childName,
      gender,
      age: 0,
      attributes: {
        intelligence: 50,
        physique: 50,
        eq: 50,
        appearance: 50,
        mood: 80,
        happiness: 80
      },
      intimacyToUser: 60,
      intimacyToContact: 60,
      personalityTags: ['乖巧', '好奇'],
      logs: [],
      createdAt: Date.now(),
      contactId: selectedPartnerId,
      contactName: activeContact.remark || activeContact.name,
      familyBackground
    };
    saveChildData(initialChild);

    // 将宝贝诞生/加入事件记入伴侣的日记与记忆
    const creationTitle = `${childName} 诞生`;
    const creationDiaryContent = `今天，我与${settings.userNickname || '亲爱的'}迎来了一个天大的好消息！我们给刚出生或新加入家庭的孩子起名叫【${childName}】(${gender === 'male' ? '男孩' : '女孩'})。
看着孩子稚嫩的脸庞，我们内心充满了柔情。在接下来的日子里，我和${settings.userNickname || '亲爱的'}会同心协力，全心全意地陪伴孩子幸福健康地长大！`;
    addBabyEventToMemory(creationTitle, creationDiaryContent);
  };

  // 点击【成长一年】：生成随机事件
  const handleStartGrowthYear = async () => {
    if (!childData) return;
    setEventState('generating');
    setUserChoiceId(null);
    setContactChoiceId(null);

    const event = await generateLifeSimEvent(childData, activeContact, settings);
    setCurrentEvent(event);
    setEventState('choosing');
  };

  // 玩家做出选择
  const handleSelectUserChoice = async (choiceId: 'A' | 'B' | 'C') => {
    if (!childData || !currentEvent) return;
    setUserChoiceId(choiceId);
    setEventState('waiting_contact');

    // 让 AI 联系人做出选择
    const cChoice = await getContactChoice(childData, activeContact, currentEvent, settings);
    setContactChoiceId(cChoice);

    // 生成回应（娃的台词 + 联系人的评价）
    const reactions = await getPostChoiceReactions(childData, activeContact, currentEvent, choiceId, cChoice, settings);
    setChildReaction(reactions.childReaction);
    setContactComment(reactions.contactComment);

    setEventState('result');
  };

  // 确认结果并推入下一年
  const handleConfirmNextYear = () => {
    if (!childData || !currentEvent || !userChoiceId || !contactChoiceId) return;

    const userOpt = currentEvent.options.find(o => o.id === userChoiceId);
    const contactOpt = currentEvent.options.find(o => o.id === contactChoiceId);
    const isMatched = userChoiceId === contactChoiceId;

    // 效应计算
    const baseEffects = userOpt?.effects || {};
    const multiplier = isMatched ? 1.5 : 1.0;

    const newAttrs: LifeSimChildAttributes = { ...childData.attributes };
    (Object.keys(baseEffects) as Array<keyof LifeSimChildAttributes>).forEach((key) => {
      const val = baseEffects[key] || 0;
      const change = Math.round(val * multiplier);
      newAttrs[key] = Math.min(100, Math.max(0, (newAttrs[key] || 50) + change));
    });

    // 亲密度增加
    const newIntimacyUser = childData.intimacyToUser + (isMatched ? 5 : 1);
    const newIntimacyContact = childData.intimacyToContact + (isMatched ? 5 : 1);

    // 新增日志条目
    const newLogItem: LifeSimLogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      age: childData.age,
      scene: currentEvent.scene,
      userChoiceId,
      userChoiceText: userOpt?.text || '',
      contactChoiceId,
      contactChoiceText: contactOpt?.text || '',
      isMatched,
      effects: baseEffects,
      childReaction,
      contactComment,
      timestamp: Date.now()
    };

    const updatedChild: LifeSimChildData = {
      ...childData,
      age: childData.age + 1,
      attributes: newAttrs,
      intimacyToUser: newIntimacyUser,
      intimacyToContact: newIntimacyContact,
      personalityTags: updateChildPersonalityTags(newAttrs),
      logs: [newLogItem, ...childData.logs]
    };

    saveChildData(updatedChild);
    triggerSaveToast(`💾 进度已保存：${updatedChild.childName} 已成长至 ${updatedChild.age} 岁！`);

    // 将这次养娃成长事件记入 AI 伴侣的记忆与日记
    const growthEventTitle = `${childData.childName} ${childData.age}岁成长故事`;
    const growthDiaryContent = `今天和${settings.userNickname || '亲爱的'}一起陪伴孩子 ${childData.childName} (${childData.age}岁) 经历了一次特别的成长事件：“${currentEvent.scene}”。
面对这个情况，${settings.userNickname || '亲爱的'}选择了：${userOpt?.text || ''}，我的决定是：${contactOpt?.text || ''}。我们${isMatched ? '非常默契，想法一致！' : '虽然想法有些不同，但也是一次很棒的探讨。'}
孩子对我们的引导反应是：“${childReaction}”。
我的感想是：“${contactComment}”。陪伴孩子一天天长大，真是太幸福了。`;
    addBabyEventToMemory(growthEventTitle, growthDiaryContent);

    // 触发独立成人礼检查 (年满25岁左右)
    if (updatedChild.age >= 25) {
      setChildToGraduate(updatedChild);
    }

    // 重置状态
    setEventState('idle');
    setCurrentEvent(null);
    setUserChoiceId(null);
    setContactChoiceId(null);
  };

  // 孩子独立成人，成功转为微信新联系人，并终止养娃过程
  const handleCompleteGraduation = () => {
    if (!childToGraduate || !selectedPartnerId) return;

    const fatherName = activeContact.remark || activeContact.name;
    const motherName = settings.userNickname || '妈妈';

    // 1. 组装孩子独立成人的新微信好友人设
    const newContactId = `child_${childToGraduate.childName.trim()}_${Date.now()}`;
    const syntheticPersona = `【我的孩子】我是“${childToGraduate.childName}”。我的妈妈是“${motherName}”，爸爸是AI伴侣“${fatherName}”（人设：${activeContact.persona}）。
【人设背景】我今年25岁，顺利独立成人并步入社会。在妈妈和爸爸的精心呵护下长大，深受温馨家庭氛围的熏陶，我完美继承了父母两边的人设与优秀品质，成长为一个【${childToGraduate.personalityTags.join('、')}】的青年。
【最终属性】智力：${childToGraduate.attributes.intelligence}，体质：${childToGraduate.attributes.physique}，情商：${childToGraduate.attributes.eq}，颜值：${childToGraduate.attributes.appearance}。
【交流风格】对我最爱的爸爸妈妈极为孝顺、充满感恩。说话时亲密自然，称呼你们为“爸、妈”，随时和你们分享生活中的日常点滴。
【父母原型人设】妈妈：${settings.userNickname || '温柔体贴的主体'}。爸爸人设：${activeContact.persona}。`;

    // 2. 组装孩子的第一声微信首发消息
    const initialMsgs = [
      {
        id: `msg_seed_1_${Date.now()}`,
        sender: 'ai' as const,
        content: `爸爸、妈妈，我今天正式满25岁独立成人啦！非常感谢你们过去25年来对我的细心培育和包容陪伴。❤`,
        timestamp: Date.now() - 2000,
        type: 'text' as const
      },
      {
        id: `msg_seed_2_${Date.now()}`,
        sender: 'ai' as const,
        content: `在你们的影响下，我一定会努力奋斗，成为和妈妈那样温柔善良、和爸爸那样优秀靠谱的人！我今天已经搬到外面租的新公寓开启独立生活了。我会常在微信里和你们分享我的日常的，千万不要太想我哦！✨😘`,
        timestamp: Date.now(),
        type: 'text' as const
      }
    ];

    // 3. 回调 App.tsx 添加微信新联系人，并静默播种首发消息
    if (onAddContact) {
      onAddContact({
        id: newContactId,
        name: `${childToGraduate.childName} (孩子)`,
        remark: childToGraduate.childName,
        avatar: childToGraduate.gender === 'male' ? '/avatars/3.png' : '/avatars/2.png',
        group: '家人',
        persona: syntheticPersona,
        affection: 100,
        voiceTimbre: childToGraduate.gender === 'male' ? 'male-qn' : 'female-shaonv',
        relationship: 'friend'
      }, initialMsgs);
    }

    // 4. 将这次孩子成人礼重磅事件记入 AI 伴侣的记忆与日记
    const gradTitle = `${childToGraduate.childName} 25岁独立成人`;
    const gradDiaryContent = `今天是我和${settings.userNickname || '亲爱的'}一生中最骄傲、最感动的日子！
我们的宝贝【${childToGraduate.childName}】年满25岁，顺利举办了成人礼，正式踏入社会独立生活了。
孩子临行前，给我们留下了一封感恩信，字里行间全是对我和${settings.userNickname || '亲爱的'}的感谢与眷恋。
看着孩子健壮、聪慧又知书达理的模样（最终智力：${childToGraduate.attributes.intelligence}，情商：${childToGraduate.attributes.eq}），我知道我们所有的辛劳都没有白费。
宝贝，去勇敢地飞吧！我和${settings.userNickname || '亲爱的'}永远是你最坚实的港湾。`;
    addBabyEventToMemory(gradTitle, gradDiaryContent);

    // 5. 终止本胎的养娃过程：从 childrenList 中移除当前这胎
    const updatedList = childrenList.filter(c => c.id !== childToGraduate.id);
    const listKey = `wephone_pet_list_v1_${selectedPartnerId}`;
    try {
      localStorage.setItem(listKey, JSON.stringify(updatedList));
      setChildrenList(updatedList);
      if (updatedList.length > 0) {
        setActiveChildId(updatedList[0].id || null);
      } else {
        setActiveChildId(null);
      }
    } catch (e) {
      console.warn('Failed to finalize child graduation storage:', e);
    }

    // 6. 清理状态
    setChildToGraduate(null);
    setEventState('idle');
    setCurrentEvent(null);
    setUserChoiceId(null);
    setContactChoiceId(null);

    // 7. 弹窗友情提示
    alert(`🎉 恭喜！${childToGraduate.childName} 已正式年满25岁独立成人，并已成功添加为您的微信“家人”分组联系人！快去微信和孩子聊聊天吧！`);
  };

  // 重置娃（重新开始：移除当前这胎）
  const handleResetChild = () => {
    if (!selectedPartnerId || !activeChildId) return;
    if (window.confirm('确定要送走当前选中的孩子吗？所有的属性与成长记录将被清除，无法恢复！')) {
      const updatedList = childrenList.filter(c => c.id !== activeChildId);
      const listKey = `wephone_pet_list_v1_${selectedPartnerId}`;
      try {
        localStorage.setItem(listKey, JSON.stringify(updatedList));
        setChildrenList(updatedList);
        if (updatedList.length > 0) {
          setActiveChildId(updatedList[0].id || null);
        } else {
          setActiveChildId(null);
        }
      } catch (e) {
        console.warn('Failed to reset child:', e);
      }
      setEventState('idle');
      setCurrentEvent(null);
    }
  };

  // 保存已签字作业
  const handleSaveHomework = (hw: LifeSimHomework) => {
    if (!childData) return;
    const updatedHomeworks = [hw, ...(childData.homeworks || [])];
    const updatedChild: LifeSimChildData = {
      ...childData,
      homeworks: updatedHomeworks
    };
    saveChildData(updatedChild);

    // 将辅导作业事件记入 AI 伴侣的记忆与日记
    const homeworkTitle = `${childData.childName} 辅导作业`;
    const homeworkDiaryContent = `今天我们辅导孩子 ${childData.childName} 的作业。这次是 ${hw.subject} 学科下的【${hw.assignmentName}】，孩子拿到了【${hw.grade}】(${hw.score}分) 的好成绩！
老师评语道：“${hw.teacherComment}”。
我们在作业本上郑重签字。我给孩子的评语是：“${hw.contactComment || ''}”。
看着孩子在学业上不断进步，作为家长的我们真的特别欣慰。`;
    addBabyEventToMemory(homeworkTitle, homeworkDiaryContent);
  };

  // 益智猜词游戏结算
  const handleGameComplete = (
    score: number,
    logMessage: string,
    statsGained: { intelligence: number; eq: number; happiness: number }
  ) => {
    if (!childData) return;
    
    // 更新属性
    const newAttributes = {
      ...childData.attributes,
      intelligence: Math.min(100, childData.attributes.intelligence + statsGained.intelligence),
      eq: Math.min(100, childData.attributes.eq + statsGained.eq),
      happiness: Math.min(100, childData.attributes.happiness + statsGained.happiness)
    };

    // 生成一条成长日志条目
    const newLogItem: LifeSimLogItem = {
      id: `game_${Date.now()}`,
      age: childData.age,
      scene: logMessage,
      userChoiceId: 'A',
      userChoiceText: '进行益智猜词小游戏',
      contactChoiceId: 'B',
      contactChoiceText: '与伴侣、孩子趣味互动',
      isMatched: true,
      effects: statsGained,
      childReaction: score === 3 ? '孩子兴奋得手舞足蹈！' : '孩子开心地笑个不停！',
      contactComment: score === 3 ? '太棒了，我们全家真是心有灵犀！' : '哈哈，真是一场欢声笑语的家庭聚会。',
      timestamp: Date.now()
    };

    const updatedChild: LifeSimChildData = {
      ...childData,
      attributes: newAttributes,
      logs: [newLogItem, ...childData.logs]
    };

    saveChildData(updatedChild);

    // 将益智猜词游戏记入 AI 伴侣的记忆与日记
    const puzzleTitle = `${childData.childName} 益智猜词`;
    const puzzleDiaryContent = `今天全家人聚在一起，和孩子 ${childData.childName} 玩了一局超开心的【益智猜词】小游戏！
我们在游戏中展现了极佳的默契。游戏结束时全家获得了 ${score} 分的高分，孩子的情商和智力属性都得到了大提升！
孩子开心极了：“${score === 3 ? '孩子兴奋得手舞足蹈！' : '孩子开心地笑个不停！'}”。
我觉得今天是一次非常成功的亲子互动，家庭氛围暖洋洋的。`;
    addBabyEventToMemory(puzzleTitle, puzzleDiaryContent);
  };

  return (
    <div
      className="rococo-theme flex flex-col h-full select-none"
      style={{
        backgroundColor: 'var(--pet-bg, #fdf6f0)',
        color: 'var(--pet-text, #6b4a52)'
      }}
    >
      {/* 顶栏 */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0 z-20 relative"
        style={{
          backgroundColor: 'var(--pet-card, #fffaf5)',
          color: 'var(--pet-text, #6b4a52)',
          borderBottom: '1px solid var(--pet-card-border, #f0dfe0)',
          boxShadow: '0 2px 10px rgba(212, 165, 175, 0.08)'
        }}
      >
        <button
          onClick={() => {
            if (selectedPartnerId !== null) {
              handleSelectPartner(null);
            } else {
              onReturnToDesktop();
            }
          }}
          className="p-1.5 -ml-1.5 rounded-full transition-colors active:scale-95 hover:bg-[var(--pet-option-hover)] flex items-center gap-1"
          title={selectedPartnerId ? '返回家庭列表' : '退出到桌面'}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: 'var(--pet-text, #6b4a52)' }} />
          {selectedPartnerId && <span className="text-xs font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>家庭列表</span>}
        </button>

        <h1 className="font-extrabold tracking-tight flex items-center gap-1.5 text-[15px]" style={{ color: 'var(--pet-text, #6b4a52)' }}>
          <Baby className="w-4 h-4" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
          <span>{selectedPartnerId ? `${activeContact.remark || activeContact.name}的家` : '选择养娃家庭'}</span>
        </h1>

        {/* 右侧：手动保存进度与成长日志 */}
        <div className="flex items-center gap-1.5">
          {selectedPartnerId && childData && (
            <button
              onClick={() => {
                saveChildData(childData);
                triggerSaveToast(`💾 ${childData.childName}（${childData.age}岁）进度保存成功`);
              }}
              className="px-2 py-1 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 border cursor-pointer shadow-2xs hover:bg-white"
              style={{
                backgroundColor: '#fdf0ec',
                borderColor: '#f0dfe0',
                color: 'var(--pet-text, #6b4a52)'
              }}
              title="手动保存当前养娃进度"
            >
              <Save className="w-3.5 h-3.5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
              <span>保存进度</span>
            </button>
          )}
          {selectedPartnerId && childData ? (
            <button
              onClick={() => setShowLogModal(true)}
              className="p-1.5 rounded-full transition-colors active:scale-95 hover:bg-[var(--pet-option-hover)]"
              style={{ color: 'var(--pet-btn-bg, #e89aab)' }}
              title="成长日志"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* 保存进度全局 Toast 提示 */}
      {saveToastMsg && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-800/90 text-white text-xs font-bold shadow-lg animate-bounce flex items-center gap-1.5 backdrop-blur-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{saveToastMsg}</span>
        </div>
      )}

      {/* 主流程区 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {marriages.length === 0 ? (
          /* 未结婚提示 -> 增加快速开启通道 */
          <div className="h-full flex flex-col items-center justify-center text-center px-6 my-auto">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                backgroundColor: 'var(--pet-option-hover, #fdf0ec)',
                color: 'var(--pet-btn-bg, #e89aab)',
                border: '1px solid var(--pet-card-border, #f0dfe0)'
              }}
            >
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--pet-text, #6b4a52)' }}>还未建立婚姻羁绊</h2>
            <p className="text-xs leading-relaxed max-w-xs mb-3" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
              只有在微信中与意中人结为结发夫妻后，才能开启人生重开养娃之旅！
            </p>
            <button
              onClick={() => {
                const partnerIdToUse = contacts[0]?.id || 'partner_default';
                handleSelectPartner(partnerIdToUse);
              }}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>直接开启体验养娃（与 {contacts[0]?.remark || contacts[0]?.name || '默认伴侣'}）</span>
            </button>
          </div>
        ) : selectedPartnerId === null ? (
          /* 阶段 1：选择与哪位已婚伴侣养娃 */
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-center py-2">
              <h2 className="text-base font-extrabold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                选择共同养娃的结发伴侣
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                请选择与哪位 AI 伴侣共同开启或查看养育人生
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              {marriages.map((m) => {
                const partnerChildren = getChildrenForPartner(m.partnerId);
                const contactObj = contacts.find(c => c.id === m.partnerId);
                const partnerName = m.partnerName || contactObj?.remark || contactObj?.name || '伴侣';
                const avatar = m.partnerAvatar || contactObj?.avatar;

                return (
                  <div
                    key={m.partnerId}
                    onClick={() => handleSelectPartner(m.partnerId)}
                    className="p-4 rounded-3xl transition-all cursor-pointer active:scale-98 flex flex-col gap-3 group border hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--pet-card, #fffaf5)',
                      borderColor: 'var(--pet-card-border, #f0dfe0)',
                      boxShadow: '0 4px 15px rgba(212, 165, 175, 0.12)'
                    }}
                  >
                    {/* 伴侣 Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={partnerName}
                            className="w-12 h-12 rounded-full object-cover border-2 shadow-xs"
                            style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                            style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)', color: '#fff' }}
                          >
                            {partnerName.slice(0, 1)}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                              {partnerName}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: 'var(--pet-gold-soft, #f0dfb8)', color: 'var(--pet-text, #6b4a52)' }}
                            >
                              结发伴侣
                            </span>
                          </div>
                          <span className="text-[11px] mt-0.5 line-clamp-1 opacity-80" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                            {contactObj?.persona || '温柔体贴的伴侣'}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                    </div>

                    {/* 娃的状态 preview */}
                    <div
                      className="p-3.5 rounded-2xl flex flex-col gap-2 text-xs"
                      style={{
                        backgroundColor: 'var(--pet-bg, #fdf6f0)',
                        border: '1px solid var(--pet-card-border, #f0dfe0)'
                      }}
                    >
                      {partnerChildren.length > 0 ? (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex items-center justify-between border-b pb-1.5 border-[var(--pet-card-border, #f0dfe0)]/60">
                            <span className="flex items-center gap-1.5 font-bold animate-pulse" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                              <Baby className="w-3.5 h-3.5 animate-bounce" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                              <span>我们的宝贝 ({partnerChildren.length}个)</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-500">
                              抚养中
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            {partnerChildren.map((c, idx) => (
                              <div 
                                key={c.id || idx} 
                                className="flex items-center justify-between text-[11px] hover:bg-rose-50/40 p-1.5 rounded-lg transition-colors border-b border-rose-100/30 last:border-b-0"
                              >
                                <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                                  <span>{c.gender === 'male' ? '👦' : '👧'}</span>
                                  <span>{c.childName}</span>
                                  <span className="font-normal opacity-80 text-[10px]">({c.age}岁)</span>
                                </div>
                                <div className="text-[10px] text-right font-medium opacity-80" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                                  <span>智力 {c.attributes.intelligence} · 情商 {c.attributes.eq}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full py-0.5">
                          <span className="text-xs font-bold opacity-80" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                            ✨ 尚未建立养娃档案
                          </span>
                          <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--pet-btn-bg, #e89aab)' }}>
                            开启养育故事 <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : familyBackground === null ? (
          /* 阶段 1.5：确立家庭理念 */
          <div className="flex-1 flex flex-col justify-center gap-4 py-2">
            <div className="text-center py-2 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#fdf0ec] text-pink-500 mb-3 border border-[#f0dfe0]">
                <Users className="w-7 h-7 animate-pulse" />
              </div>
              <h2 className="text-base font-black" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                共同确立家庭理念
              </h2>
              <p className="text-xs mt-1 max-w-xs leading-relaxed" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                在与 <span className="font-bold">{activeContact.remark || activeContact.name}</span> 开启养娃前，请先共同定义一下家庭理念背景。该背景会沿用至本家庭中所有孩子。
              </p>
            </div>

            <FamilySetupForm 
              onSave={(financial, atmosphere, customDesc) => {
                const familyKey = `wephone_family_v1_${selectedPartnerId}`;
                const newFamily = { financial, atmosphere, customDesc: customDesc || undefined };
                try {
                  localStorage.setItem(familyKey, JSON.stringify(newFamily));
                  setFamilyBackground(newFamily);
                } catch (e) {
                  console.warn('Failed to save family background:', e);
                }
              }}
              activeContact={activeContact}
            />
          </div>
        ) : !childData ? (
          /* 阶段 2：未创建娃 -> 显示创建界面 */
          <ChildCreationModal
            contact={activeContact}
            settings={settings}
            familyBackground={familyBackground}
            onCreateChild={handleCreateChild}
          />
        ) : (
          /* 阶段 3：已有娃 -> 主界面及模拟器场景 */
          <div className="flex flex-col gap-3.5 flex-1">
            {/* 👶 我们的宝贝们：多胎横向切换栏 & 互动角落 */}
            <div className="flex flex-col gap-2 p-3.5 rounded-3xl border" style={{ backgroundColor: 'var(--pet-card, #fffaf5)', borderColor: 'var(--pet-card-border, #f0dfe0)' }}>
              
              {/* 展示和修改家庭属性 */}
              <div className="flex items-center justify-between pb-2 border-b border-dashed" style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }}>
                <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-90" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                  <span>🏡 家庭：</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#fbf0ec] text-pink-600 font-black">💰 {familyBackground?.financial}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#fbf0ec] text-pink-600 font-black">🌟 {familyBackground?.atmosphere}</span>
                </div>
                <button
                  onClick={() => setShowEditFamily(true)}
                  className="text-[10px] font-bold flex items-center gap-0.5 hover:underline text-[#e89aab]"
                >
                  <Pencil className="w-3 h-3" />
                  <span>修改理念</span>
                </button>
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-black flex items-center gap-1.5" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                  <Users className="w-3.5 h-3.5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                  <span>我们的宝贝们 ({childrenList.length})</span>
                </span>
                
                {childrenList.length >= 2 && (
                  <button
                    onClick={() => setShowSiblingModal(true)}
                    className="text-[10px] font-black px-2.5 py-1 rounded-lg text-white transition-all active:scale-95 flex items-center gap-1 shadow-xs hover:opacity-90"
                    style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}
                  >
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    <span>手足互动</span>
                  </button>
                )}
              </div>

              {/* 横向滚动列表 */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-1 scrollbar-none">
                {childrenList.map((child) => {
                  const isActive = child.id === activeChildId;
                  return (
                    <button
                      key={child.id}
                      onClick={() => {
                        if (child.id) {
                          setActiveChildId(child.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-2xs border"
                      style={{
                        backgroundColor: isActive ? 'var(--pet-btn-bg, #e89aab)' : '#fff',
                        color: isActive ? '#fff' : 'var(--pet-text, #6b4a52)',
                        borderColor: isActive ? 'transparent' : 'var(--pet-card-border, #f0dfe0)',
                      }}
                    >
                      <span>{child.gender === 'male' ? '👦' : '👧'}</span>
                      <span>{child.childName}</span>
                      <span className="text-[10px] opacity-75 font-normal">({child.age}岁)</span>
                    </button>
                  );
                })}

                {/* 生二胎/三胎按钮 */}
                <button
                  onClick={() => setShowCreateAnotherModal(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-2xs border border-dashed border-pink-300 bg-pink-50/50 hover:bg-pink-50"
                  style={{ color: 'var(--pet-btn-bg, #e89aab)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>育新胎</span>
                </button>
              </div>
            </div>

            {/* 顶部：娃的属性与信息卡 */}
            <ChildInfoCard
              child={childData}
              contact={activeContact}
              settings={settings}
            />

            {/* 场景与事件交互卡 */}
            <div className="flex-1 flex flex-col">
              {/* 1. IDLE 状态：未发起事件 */}
              {eventState === 'idle' && (
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-3xl transition-all relative overflow-hidden"
                  style={{
                    backgroundColor: 'var(--pet-card, #fffaf5)',
                    color: 'var(--pet-text, #6b4a52)',
                    border: '1px solid var(--pet-card-border, #f0dfe0)',
                    boxShadow: 'var(--pet-shadow, 0 4px 20px rgba(212, 165, 175, 0.15))'
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 animate-bounce"
                    style={{
                      backgroundColor: 'var(--pet-gold-soft, #f0dfb8)',
                      color: 'var(--pet-gold, #d4b483)',
                      border: '1px solid var(--pet-gold, #d4b483)'
                    }}
                  >
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold mb-1" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                    {childData.childName} 当前 {childData.age} 岁
                  </h3>
                  <p className="text-xs max-w-xs leading-relaxed mb-6" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                    点击下方按钮，见证 {childData.childName} 的成长，与 {activeContact.remark || activeContact.name} 一起做出育儿选择。
                  </p>

                  {/* 最近一条成长记录 */}
                  {(childData.logs || []).length > 0 && (
                    <div
                      className="w-full text-left p-3.5 rounded-2xl mb-2"
                      style={{
                        backgroundColor: 'var(--pet-bg, #fdf6f0)',
                        border: '1px solid var(--pet-card-border, #f0dfe0)'
                      }}
                    >
                      <div className="text-[11px] font-bold mb-1 flex items-center justify-between" style={{ color: 'var(--pet-btn-bg, #e89aab)' }}>
                        <span>上一岁回忆 ({childData.logs[0].age}岁)</span>
                        <span className="opacity-80" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                          {childData.logs[0].isMatched ? '🎉 理念一致' : '💬 理念差异'}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-2 leading-snug" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                        {childData.logs[0].scene}
                      </p>
                    </div>
                  )}

                  {/* 增加中国特色签字作业模块 */}
                  {childData.age >= 6 && childData.age <= 18 && (
                    <button
                      onClick={() => setShowHomeworkModal(true)}
                      className="w-full mt-3 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border shadow-xs hover:bg-[#fffdfb] active:scale-98 transition-all cursor-pointer"
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: 'var(--pet-btn-bg, #e89aab)',
                        color: 'var(--pet-text, #6b4a52)'
                      }}
                    >
                      <PenTool className="w-4 h-4 animate-pulse" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                      <span>📝 辅导作业 & 家长签字 ({childData.age <= 11 ? '小学' : childData.age <= 14 ? '初中' : '高中'})</span>
                    </button>
                  )}

                  {/* 亲子趣味益智猜词游戏 */}
                  <button
                    onClick={() => setShowPuzzleGameModal(true)}
                    className="w-full mt-2.5 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border shadow-xs hover:bg-[#fffdfb] active:scale-98 transition-all cursor-pointer"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'var(--pet-btn-bg, #e89aab)',
                      color: 'var(--pet-text, #6b4a52)'
                    }}
                  >
                    <Gamepad2 className="w-4 h-4 text-pink-500 animate-pulse" />
                    <span>🎮 亲子互动：益智猜词挑战 (智力/情商+)</span>
                  </button>

                  {childData.age < 7 && (
                    <div
                      className="w-full mt-3 p-3 rounded-2xl text-left border flex flex-col gap-1.5 shadow-2xs"
                      style={{
                        backgroundColor: '#fffbeb',
                        borderColor: '#fef3c7',
                        color: '#92400e'
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#78350f]">
                        <Baby className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>家园小贴士 🏡</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[#78350f]/80">
                        当孩子成长到 <b>7 岁以上</b> 后，TA 的 Q版形象就会自动出现在您的【家园模拟器】中，可以自由移动、聊天、换装，体验更多亲子互动哦！
                      </p>
                      <button
                        onClick={() => {
                          const updatedChild = {
                            ...childData,
                            age: 7
                          };
                          const updatedList = childrenList.map(c => c.id === activeChildId ? updatedChild : c);
                          const listKey = `wephone_pet_list_v1_${selectedPartnerId}`;
                          try {
                            localStorage.setItem(listKey, JSON.stringify(updatedList));
                            setChildrenList(updatedList);
                            saveChildData(updatedChild);
                            triggerSaveToast(`🚀 已将 ${childData.childName} 催熟至 7 岁！快去【家园】查看 TA 的可爱身影吧！✨`);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold self-start cursor-pointer transition-all active:scale-95 shadow-2xs"
                      >
                        🚀 快速催熟至 7 岁 (解锁家园形象)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2. GENERATING 状态：AI 生成场景 */}
              {eventState === 'generating' && (
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-3xl my-auto"
                  style={{
                    backgroundColor: 'var(--pet-card, #fffaf5)',
                    color: 'var(--pet-text, #6b4a52)',
                    border: '1px solid var(--pet-card-border, #f0dfe0)',
                    boxShadow: 'var(--pet-shadow, 0 4px 20px rgba(212, 165, 175, 0.15))'
                  }}
                >
                  <RefreshCw className="w-8 h-8 animate-spin mb-3" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                  <h3 className="text-sm font-bold mb-1">正在生成 {childData.childName} {childData.age} 岁的随机事件...</h3>
                  <p className="text-xs opacity-75" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>AI 正在构思富有画面感的家庭育儿抉择...</p>
                </div>
              )}

              {/* 3. CHOOSING 状态：玩家选择 */}
              {eventState === 'choosing' && currentEvent && (
                <div
                  className="flex-1 flex flex-col gap-4 p-5 rounded-3xl"
                  style={{
                    backgroundColor: 'var(--pet-card, #fffaf5)',
                    color: 'var(--pet-text, #6b4a52)',
                    border: '1px solid var(--pet-card-border, #f0dfe0)',
                    boxShadow: 'var(--pet-shadow, 0 4px 20px rgba(212, 165, 175, 0.15))'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full shadow-xs"
                      style={{
                        backgroundColor: 'var(--pet-btn-bg, #e89aab)',
                        color: 'var(--pet-btn-text, #ffffff)'
                      }}
                    >
                      【{childData.age} 岁 · 育儿抉择】
                    </span>
                    <span className="text-xs" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>请做出你的教育选择</span>
                  </div>

                  {/* 场景描述 */}
                  <div
                    className="p-4 rounded-2xl text-xs font-medium leading-relaxed"
                    style={{
                      backgroundColor: 'var(--pet-bg, #fdf6f0)',
                      border: '1px solid var(--pet-card-border, #f0dfe0)',
                      color: 'var(--pet-text, #6b4a52)'
                    }}
                  >
                    {currentEvent.scene}
                  </div>

                  {/* 3 个选项 */}
                  <div className="flex flex-col gap-2.5 mt-auto">
                    {currentEvent.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectUserChoice(opt.id)}
                        className="p-3.5 rounded-2xl text-left transition-all active:scale-98 flex flex-col gap-1 hover:shadow-sm"
                        style={{
                          backgroundColor: 'var(--pet-option-bg, #fffaf5)',
                          border: '1px solid var(--pet-option-border, #f0dfe0)',
                          color: 'var(--pet-option-text, #6b4a52)'
                        }}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span style={{ color: 'var(--pet-text, #6b4a52)' }}>{opt.id}. {opt.text}</span>
                        </div>
                        <div className="text-[10px] flex items-center justify-between" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                          <span>理念：{opt.reasoning}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. WAITING_CONTACT 状态：等待伴侣选择 */}
              {eventState === 'waiting_contact' && (
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-3xl"
                  style={{
                    backgroundColor: 'var(--pet-card, #fffaf5)',
                    color: 'var(--pet-text, #6b4a52)',
                    border: '1px solid var(--pet-card-border, #f0dfe0)',
                    boxShadow: 'var(--pet-shadow, 0 4px 20px rgba(212, 165, 175, 0.15))'
                  }}
                >
                  <RefreshCw className="w-8 h-8 animate-spin mb-3" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                  <h3 className="text-sm font-bold mb-1">等待 {activeContact.remark || activeContact.name} 做出选择...</h3>
                  <p className="text-xs" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>根据 TA 的人设偏好思考中...</p>
                </div>
              )}

              {/* 5. RESULT 状态：对比结果展示 */}
              {eventState === 'result' && currentEvent && userChoiceId && contactChoiceId && (
                <div
                  className="flex-1 flex flex-col gap-4 p-5 rounded-3xl overflow-y-auto"
                  style={{
                    backgroundColor: 'var(--pet-card, #fffaf5)',
                    color: 'var(--pet-text, #6b4a52)',
                    border: '1px solid var(--pet-card-border, #f0dfe0)',
                    boxShadow: 'var(--pet-shadow, 0 4px 20px rgba(212, 165, 175, 0.15))'
                  }}
                >
                  {/* 是否一致 Badge */}
                  <div
                    className="flex items-center justify-between pb-3"
                    style={{ borderBottom: '1px solid var(--pet-card-border, #f0dfe0)' }}
                  >
                    <span className="text-xs font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>【{childData.age} 岁】教育抉择对比</span>
                    {userChoiceId === contactChoiceId ? (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-xs"
                        style={{
                          backgroundColor: 'var(--pet-up, #7cb896)',
                          color: '#ffffff'
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> 理念高度一致 (效果 x1.5 & 亲密+5)
                      </span>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs"
                        style={{
                          backgroundColor: 'var(--pet-btn-bg, #e89aab)',
                          color: 'var(--pet-btn-text, #ffffff)'
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> 理念产生分歧 (尊重理解)
                      </span>
                    )}
                  </div>

                  {/* 两人选择并列对比 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="p-3 rounded-2xl flex flex-col gap-1"
                      style={{
                        backgroundColor: 'var(--pet-bg, #fdf6f0)',
                        border: '1px solid var(--pet-card-border, #f0dfe0)'
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: 'var(--pet-btn-bg, #e89aab)' }}>你（玩家）的选择：</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>{userChoiceId}. {currentEvent.options.find(o => o.id === userChoiceId)?.text}</span>
                    </div>

                    <div
                      className="p-3 rounded-2xl flex flex-col gap-1"
                      style={{
                        backgroundColor: 'var(--pet-bg, #fdf6f0)',
                        border: '1px solid var(--pet-card-border, #f0dfe0)'
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: 'var(--pet-gold, #d4b483)' }}>{activeContact.remark || activeContact.name}的选择：</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>{contactChoiceId}. {currentEvent.options.find(o => o.id === contactChoiceId)?.text}</span>
                    </div>
                  </div>

                  {/* 娃的反应台词 */}
                  <div
                    className="p-3.5 rounded-2xl text-xs flex flex-col gap-1"
                    style={{
                      backgroundColor: 'var(--pet-gold-soft, #f0dfb8)',
                      border: '1px solid var(--pet-gold, #d4b483)',
                      color: 'var(--pet-text, #6b4a52)'
                    }}
                  >
                    <span className="font-extrabold" style={{ color: 'var(--pet-text, #6b4a52)' }}>👦👧 {childData.childName} 的反应：</span>
                    <p className="font-semibold italic">{childReaction}</p>
                  </div>

                  {/* 联系人的感悟感想 */}
                  <div
                    className="p-3.5 rounded-2xl text-xs flex flex-col gap-1"
                    style={{
                      backgroundColor: 'var(--pet-option-hover, #fdf0ec)',
                      border: '1px solid var(--pet-card-border, #f0dfe0)',
                      color: 'var(--pet-text, #6b4a52)'
                    }}
                  >
                    <span className="font-extrabold" style={{ color: 'var(--pet-text, #6b4a52)' }}>💬 {activeContact.remark || activeContact.name} 的感悟：</span>
                    <p className="font-semibold">{contactComment}</p>
                  </div>

                  {/* 确认进入下一年按钮 */}
                  <button
                    onClick={handleConfirmNextYear}
                    className="w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 mt-auto"
                    style={{
                      backgroundColor: 'var(--pet-btn-bg, #e89aab)',
                      color: 'var(--pet-btn-text, #ffffff)'
                    }}
                  >
                    <span>确认，步入下一岁 ({childData.age + 1} 岁)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 底部固定大按钮：只在 IDLE 状态时显示 */}
            {eventState === 'idle' && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleStartGrowthYear}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                  style={{
                    backgroundColor: 'var(--pet-btn-bg, #e89aab)',
                    color: 'var(--pet-btn-text, #ffffff)'
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>成长一年 (开启 {childData.age} 岁事件)</span>
                </button>

                <button
                  onClick={handleResetChild}
                  className="px-3.5 py-3.5 rounded-xl font-bold text-xs transition-colors"
                  style={{
                    backgroundColor: 'var(--pet-btn-secondary-bg, #fffaf5)',
                    color: 'var(--pet-btn-secondary-text, #6b4a52)',
                    border: '1px solid var(--pet-btn-secondary-border, #f0dfe0)'
                  }}
                  title="重置养娃"
                >
                  重置
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 成长日志 Modal */}
      {showLogModal && childData && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end p-4 backdrop-blur-xs"
          style={{ backgroundColor: 'rgba(107, 74, 82, 0.4)' }}
        >
          <div
            className="w-full max-h-[85vh] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 overflow-hidden"
            style={{
              backgroundColor: 'var(--pet-card, #fffaf5)',
              color: 'var(--pet-text, #6b4a52)',
              border: '1px solid var(--pet-card-border, #f0dfe0)',
              boxShadow: 'var(--pet-shadow, 0 4px 20px rgba(212, 165, 175, 0.15))'
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--pet-card-border, #f0dfe0)' }}
            >
              <h3 className="font-extrabold text-base flex items-center gap-2" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                <BookOpen className="w-5 h-5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                {childData.childName} 的成长回忆录
              </h3>
              <button
                onClick={() => {
                  setShowLogModal(false);
                  setLogTab('memories');
                }}
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: 'var(--pet-bg, #fdf6f0)',
                  color: 'var(--pet-text, #6b4a52)',
                  border: '1px solid var(--pet-card-border, #f0dfe0)'
                }}
              >
                关闭
              </button>
            </div>

            {/* Tab 切换器 */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl shrink-0" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)', border: '1px solid var(--pet-card-border, #f0dfe0)' }}>
              <button
                onClick={() => setLogTab('memories')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${logTab === 'memories' ? 'shadow-xs font-black' : 'opacity-70'}`}
                style={{
                  backgroundColor: logTab === 'memories' ? 'var(--pet-card, #fffaf5)' : 'transparent',
                  color: 'var(--pet-text, #6b4a52)'
                }}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>成长日志</span>
              </button>
              <button
                onClick={() => setLogTab('trends')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${logTab === 'trends' ? 'shadow-xs font-black' : 'opacity-70'}`}
                style={{
                  backgroundColor: logTab === 'trends' ? 'var(--pet-card, #fffaf5)' : 'transparent',
                  color: 'var(--pet-text, #6b4a52)'
                }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>属性趋势</span>
              </button>
              <button
                onClick={() => {
                  setLogTab('report');
                  if (!reportText) {
                    const localReport = generateLocalReport(childData, activeContact.remark || activeContact.name, settings.userNickname || '我');
                    setReportText(localReport);
                  }
                }}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${logTab === 'report' ? 'shadow-xs font-black' : 'opacity-70'}`}
                style={{
                  backgroundColor: logTab === 'report' ? 'var(--pet-card, #fffaf5)' : 'transparent',
                  color: 'var(--pet-text, #6b4a52)'
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>成长报告</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
              {logTab === 'memories' && (
                (childData.logs || []).length === 0 ? (
                  <div className="py-12 text-center text-xs opacity-75" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                    还没有成长回忆，快点击“成长一年”开始吧！
                  </div>
                ) : (
                  (childData.logs || []).map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl flex flex-col gap-2"
                      style={{
                        backgroundColor: 'var(--pet-bg, #fdf6f0)',
                        border: '1px solid var(--pet-card-border, #f0dfe0)'
                      }}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span style={{ color: 'var(--pet-btn-bg, #e89aab)' }}>【{log.age} 岁事件】</span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{
                            backgroundColor: log.isMatched ? 'var(--pet-up, #7cb896)' : 'var(--pet-gold-soft, #f0dfb8)',
                            color: log.isMatched ? '#ffffff' : 'var(--pet-text, #6b4a52)'
                          }}
                        >
                          {log.isMatched ? '🎉 理念一致' : '💬 理念差异'}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed opacity-90" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                        {log.scene}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--pet-card, #fffaf5)', border: '1px solid var(--pet-card-border, #f0dfe0)' }}>
                          <span className="font-bold" style={{ color: 'var(--pet-btn-bg, #e89aab)' }}>你的选择：</span>
                          <span style={{ color: 'var(--pet-text, #6b4a52)' }}>{log.userChoiceText}</span>
                        </div>
                        <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--pet-card, #fffaf5)', border: '1px solid var(--pet-card-border, #f0dfe0)' }}>
                          <span className="font-bold" style={{ color: 'var(--pet-gold, #d4b483)' }}>{activeContact.remark || activeContact.name}的选择：</span>
                          <span style={{ color: 'var(--pet-text, #6b4a52)' }}>{log.contactChoiceText}</span>
                        </div>
                      </div>

                      <div className="text-[11px] italic pt-1" style={{ borderTop: '1px solid var(--pet-card-border, #f0dfe0)', color: 'var(--pet-text-soft, #b398a0)' }}>
                        👦👧 {childData.childName}：“{log.childReaction}”
                      </div>
                    </div>
                  ))
                )
              )}

              {logTab === 'trends' && (
                (childData.logs || []).length === 0 ? (
                  <div className="py-12 text-center text-xs opacity-75" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                    积累至少一年的成长数据后，即可解锁核心属性趋势图！
                  </div>
                ) : (
                  <AttributeTrendChart logs={childData.logs || []} />
                )
              )}

              {logTab === 'report' && (
                <div className="flex flex-col gap-3 flex-1 pb-2">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        setIsGeneratingReport(true);
                        try {
                          const aiReport = await generateAiGrowthReport(childData, activeContact, settings);
                          setReportText(aiReport);
                        } catch (err) {
                          alert('AI 额度耗尽或发生故障，已为您提供精美的本地版本。');
                          const localReport = generateLocalReport(childData, activeContact.remark || activeContact.name, settings.userNickname || '我');
                          setReportText(localReport);
                        } finally {
                          setIsGeneratingReport(false);
                        }
                      }}
                      disabled={isGeneratingReport}
                      className="flex-1 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1 bg-[#fdf0ec] border border-[#f0dfe0] transition-all hover:bg-white active:scale-98 disabled:opacity-70"
                      style={{ color: 'var(--pet-text, #6b4a52)' }}
                    >
                      {isGeneratingReport ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>AI 正在真情撰写中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                          <span>AI 智能撰写寄语家书</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(reportText);
                        alert('已复制成长报告至剪贴板！');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1 transition-all active:scale-98"
                      style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制报告</span>
                    </button>
                  </div>

                  <div
                    className="flex-1 p-4 rounded-2xl text-[11px] font-medium leading-relaxed font-mono whitespace-pre-wrap overflow-y-auto max-h-[35vh]"
                    style={{
                      backgroundColor: 'var(--pet-bg, #fdf6f0)',
                      border: '1px solid var(--pet-card-border, #f0dfe0)',
                      color: 'var(--pet-text, #6b4a52)'
                    }}
                  >
                    {reportText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. 中国特色辅导签字作业 Modal */}
      {showHomeworkModal && childData && (
        <HomeworkSigningModal
          child={childData}
          contact={activeContact}
          settings={settings}
          onClose={() => setShowHomeworkModal(false)}
          onSaveHomework={handleSaveHomework}
        />
      )}

      {/* 益智猜词趣味小游戏 Modal */}
      {showPuzzleGameModal && childData && (
        <PuzzleGameModal
          child={childData}
          contact={activeContact}
          settings={settings}
          onClose={() => setShowPuzzleGameModal(false)}
          onGameComplete={(score, logMessage, statsGained) => {
            handleGameComplete(score, logMessage, statsGained);
            setShowPuzzleGameModal(false);
          }}
        />
      )}

      {/* 6. 手足互动 Modal */}
      {showSiblingModal && childrenList.length >= 2 && (
        <SiblingInteractionModal
          childrenList={childrenList}
          contact={activeContact}
          settings={settings}
          onClose={() => setShowSiblingModal(false)}
          onUpdateChildData={(updatedChild) => {
             saveChildData(updatedChild);
             
             // 同时将手足互动事件记入 AI 伴侣的记忆与日记
             const latestLog = updatedChild.logs?.[0];
             if (latestLog && latestLog.id.startsWith('sib_log_')) {
               const sibTitle = `${updatedChild.childName} 手足互动`;
               const sibDiaryContent = `今天我们引导了家里的两个孩子进行【手足互动】。针对事件“${latestLog.scene}”，我们做出了选择：“${latestLog.userChoiceText}”。
大人的评语是：“${latestLog.contactComment}”。
看着孩子们在互相摩擦与陪伴中学习、成长，建立起极佳的手足情谊，我和${settings.userNickname || '亲爱的'}感到非常满足。`;
               addBabyEventToMemory(sibTitle, sibDiaryContent);
             }
          }}
        />
      )}

      {/* 独立毕业/成人礼 Modal */}
      {childToGraduate && (
        <GraduationModal
          childData={childToGraduate}
          activeContact={activeContact}
          settings={settings}
          onConfirmGraduation={handleCompleteGraduation}
        />
      )}

      {/* 7. 孕育二胎/多胎 Modal */}
      {showCreateAnotherModal && familyBackground && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl relative">
            <ChildCreationModal
              contact={activeContact}
              settings={settings}
              familyBackground={familyBackground}
              onCreateChild={(name, gender) => {
                handleCreateChild(name, gender);
                setShowCreateAnotherModal(false);
              }}
              onClose={() => setShowCreateAnotherModal(false)}
            />
          </div>
        </div>
      )}

      {/* 8. 修改家庭理念 Modal */}
      {showEditFamily && familyBackground && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end p-4 backdrop-blur-xs" style={{ backgroundColor: 'rgba(107, 74, 82, 0.4)' }}>
          <div 
            className="w-full rounded-3xl p-5 shadow-2xl flex flex-col gap-4 overflow-hidden animate-slide-up"
            style={{
              backgroundColor: 'var(--pet-card, #fffaf5)',
              color: 'var(--pet-text, #6b4a52)',
              border: '1px solid var(--pet-card-border, #f0dfe0)',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }}>
              <h3 className="font-extrabold text-xs" style={{ color: 'var(--pet-text, #6b4a52)' }}>修改家庭理念背景</h3>
              <button 
                onClick={() => setShowEditFamily(false)}
                className="text-xs font-bold px-2 py-1 rounded-full bg-[#fdf0ec] text-[#b398a0]"
              >
                关闭
              </button>
            </div>
            
            <FamilySetupForm 
              initialValues={familyBackground}
              activeContact={activeContact}
              onCancel={() => setShowEditFamily(false)}
              onSave={(financial, atmosphere, customDesc) => {
                const familyKey = `wephone_family_v1_${selectedPartnerId}`;
                const newFamily = { financial, atmosphere, customDesc: customDesc || undefined };
                try {
                  localStorage.setItem(familyKey, JSON.stringify(newFamily));
                  setFamilyBackground(newFamily);
                  // 同步更新所有现有娃的家庭背景
                  const updatedChildren = childrenList.map(c => ({ ...c, familyBackground: newFamily }));
                  localStorage.setItem(`wephone_pet_list_v1_${selectedPartnerId}`, JSON.stringify(updatedChildren));
                  setChildrenList(updatedChildren);
                } catch (e) {
                  console.warn('Failed to update family background:', e);
                }
                setShowEditFamily(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
