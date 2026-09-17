import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, RefreshCw, Users, Heart } from 'lucide-react';
import { Contact, PhoneSettings } from '../../../types/phone';
import { LifeSimChildData, LifeSimSiblingEvent, LifeSimSiblingEventOption } from '../../../types/lifeSim';
import { generateSiblingEvent, getSiblingPostChoiceReaction } from '../../../services/lifeSimService';

interface SiblingInteractionModalProps {
  childrenList: LifeSimChildData[];
  contact: Contact;
  settings: PhoneSettings;
  onClose: () => void;
  onUpdateChildData: (updatedChild: LifeSimChildData) => void;
}

export const SiblingInteractionModal: React.FC<SiblingInteractionModalProps> = ({
  childrenList,
  contact,
  settings,
  onClose,
  onUpdateChildData
}) => {
  // 选中的参与人 A 和 参与人 B
  const [selectedAId, setSelectedAId] = useState<string>('');
  const [selectedBId, setSelectedBId] = useState<string>('');

  // 核心事件流程
  const [step, setStep] = useState<'select' | 'generating' | 'choosing' | 'result'>('select');
  const [currentEvent, setCurrentEvent] = useState<LifeSimSiblingEvent | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<'A' | 'B' | 'C' | null>(null);
  const [partnerReaction, setPartnerReaction] = useState<string>('');
  const [isReactionLoading, setIsReactionLoading] = useState<boolean>(false);

  // 初始化时，如果只有两个孩子，直接默认选择
  useEffect(() => {
    if (childrenList.length >= 2) {
      setSelectedAId(childrenList[0].id || '');
      setSelectedBId(childrenList[1].id || '');
    }
  }, [childrenList]);

  const childA = childrenList.find(c => c.id === selectedAId);
  const childB = childrenList.find(c => c.id === selectedBId);

  // 启动互动生成
  const handleStartInteraction = async () => {
    if (!childA || !childB) return;
    setStep('generating');

    try {
      const event = await generateSiblingEvent(childA, childB, contact, settings);
      setCurrentEvent(event);
      setStep('choosing');
    } catch (e) {
      console.error(e);
      setStep('select');
    }
  };

  // 选择选项并进行属性、日志双向修正
  const handleMakeChoice = async (choice: LifeSimSiblingEventOption) => {
    if (!currentEvent || !childA || !childB) return;
    setSelectedChoiceId(choice.id);
    setIsReactionLoading(true);
    setStep('result');

    try {
      // 1. 获取伴侣点评
      const reaction = await getSiblingPostChoiceReaction(currentEvent, choice.id, contact, settings);
      setPartnerReaction(reaction);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReactionLoading(false);
    }

    // 2. 双向孩子属性和成长日志更新
    const applyEffects = (child: LifeSimChildData, effects: any, role: 'A' | 'B', otherName: string) => {
      const currentAttrs = { ...child.attributes };
      Object.entries(effects).forEach(([key, val]) => {
        const k = key as keyof typeof currentAttrs;
        if (typeof val === 'number') {
          currentAttrs[k] = Math.max(0, Math.min(100, (currentAttrs[k] || 50) + val));
        }
      });

      // 追加专属成长日志
      const choiceDesc = `在和手足 ${otherName} 的互动中，父母选择了：【${choice.text}】。理由：${choice.reasoning}`;
      const newLog = {
        id: `sib_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        age: child.age,
        scene: currentEvent.scene,
        userChoiceId: choice.id,
        userChoiceText: choice.text,
        contactChoiceId: choice.id,
        contactChoiceText: choice.text,
        isMatched: true,
        effects: effects,
        childReaction: `和 ${otherName} 一起经历了这次互动，各方面属性发生了变化。`,
        contactComment: partnerReaction || '家长的选择非常关键。',
        timestamp: Date.now()
      };

      const updatedLogs = [newLog, ...(child.logs || [])];
      return {
        ...child,
        attributes: currentAttrs,
        logs: updatedLogs
      };
    };

    const updatedChildA = applyEffects(childA, choice.effectsA, 'A', childB.childName);
    const updatedChildB = applyEffects(childB, choice.effectsB, 'B', childA.childName);

    // 触发保存到父级
    onUpdateChildData(updatedChildA);
    onUpdateChildData(updatedChildB);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end p-4 backdrop-blur-xs" style={{ backgroundColor: 'rgba(107, 74, 82, 0.4)' }}>
      <div 
        className="w-full max-h-[85vh] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 overflow-hidden"
        style={{
          backgroundColor: 'var(--pet-card, #fffaf5)',
          color: 'var(--pet-text, #6b4a52)',
          border: '1px solid var(--pet-card-border, #f0dfe0)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--pet-card-border, #f0dfe0)' }}>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
            <div>
              <h3 className="font-extrabold text-sm">👦👧 手足互动角落</h3>
              <p className="text-[10px] opacity-75">让大宝、二宝、三宝们在爱里共同成长</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#fdf0ec]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* content window */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {step === 'select' && (
            <div className="flex flex-col gap-4 py-4">
              <div className="bg-[#fef9f6] p-3.5 rounded-2xl border border-[#f0dfe0] text-xs leading-relaxed">
                <p className="font-bold">💡 互动规则：</p>
                <p className="opacity-80 mt-1">
                  选择家里的任意两个宝贝，开启专属于他们的生活小事件。你和 {contact.remark || contact.name} 作为家长所做出的抉择，将会<strong>同时影响两个宝贝</strong>的对应属性，并记录在各自的《成长日记》中！
                </p>
              </div>

              {/* 宝贝 A 选择 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold opacity-80">👦 选择第一个孩子：</label>
                <select
                  value={selectedAId}
                  onChange={(e) => {
                    setSelectedAId(e.target.value);
                    if (e.target.value === selectedBId) {
                      // 自动避开重复
                      const other = childrenList.find(c => c.id !== e.target.value);
                      if (other) setSelectedBId(other.id || '');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-hidden"
                  style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }}
                >
                  {childrenList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.childName} (智力:{c.attributes.intelligence} | {c.age}岁)
                    </option>
                  ))}
                </select>
              </div>

              {/* 宝贝 B 选择 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold opacity-80">👧 选择第二个孩子：</label>
                <select
                  value={selectedBId}
                  onChange={(e) => {
                    setSelectedBId(e.target.value);
                    if (e.target.value === selectedAId) {
                      const other = childrenList.find(c => c.id !== e.target.value);
                      if (other) setSelectedAId(other.id || '');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-hidden"
                  style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }}
                >
                  {childrenList.map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === selectedAId}>
                      {c.childName} (体质:{c.attributes.physique} | {c.age}岁)
                    </option>
                  ))}
                </select>
              </div>

              {/* 激活按钮 */}
              <button
                onClick={handleStartInteraction}
                disabled={!selectedAId || !selectedBId || selectedAId === selectedBId}
                className="w-full py-3 mt-4 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-50"
                style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}
              >
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>开启手足专属互动</span>
              </button>
            </div>
          )}

          {step === 'generating' && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
              <div>
                <p className="font-extrabold text-sm text-[#4c1d95]">正在呼唤小天使们...</p>
                <p className="text-[10px] opacity-75 mt-1">AI 正在为 {childA?.childName} 和 {childB?.childName} 构思专属互动故事</p>
              </div>
            </div>
          )}

          {step === 'choosing' && currentEvent && childA && childB && (
            <div className="flex flex-col gap-3">
              {/* 故事场景 */}
              <div className="p-4 rounded-2xl bg-white border border-[#f0dfe0] flex flex-col gap-2 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-pink-600 bg-pink-100 px-2 py-0.5 rounded-md">
                    手足相处瞬间
                  </span>
                  <span className="text-[10px] opacity-75">
                    {childA.childName} ({childA.age}岁) & {childB.childName} ({childB.age}岁)
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 font-medium indent-4">
                  {currentEvent.scene}
                </p>
              </div>

              {/* 选项 */}
              <div className="flex flex-col gap-2 mt-1">
                <span className="text-[11px] font-extrabold opacity-80">🎯 你们作为父母打算如何引导？</span>
                {currentEvent.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleMakeChoice(opt)}
                    className="w-full p-3.5 rounded-xl border bg-white hover:bg-[#fffdfb] active:scale-99 transition-all text-left flex flex-col gap-1.5 shadow-2xs group"
                    style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center font-black text-white text-[10px]" style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}>
                        {opt.id}
                      </span>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-pink-600 transition-colors">
                        {opt.text}
                      </p>
                    </div>

                    {/* 选项属性影响快照 */}
                    <div className="flex flex-wrap gap-2 pl-7">
                      <div className="text-[9px] text-[#6b4a52] bg-[#fdf0ec] px-1.5 py-0.5 rounded-md font-semibold">
                        {childA.childName}: {Object.entries(opt.effectsA).map(([k, v]) => `${k === 'eq' ? '情商' : k === 'happiness' ? '幸福' : k === 'intelligence' ? '智力' : k === 'physique' ? '体质' : '心情'}${v as number > 0 ? '+' : ''}${v}`).join(', ')}
                      </div>
                      <div className="text-[9px] text-[#2c4e3f] bg-[#e8f6f0] px-1.5 py-0.5 rounded-md font-semibold">
                        {childB.childName}: {Object.entries(opt.effectsB).map(([k, v]) => `${k === 'eq' ? '情商' : k === 'happiness' ? '幸福' : k === 'intelligence' ? '智力' : k === 'physique' ? '体质' : '心情'}${v as number > 0 ? '+' : ''}${v}`).join(', ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'result' && currentEvent && childA && childB && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="p-4 rounded-2xl bg-white border border-[#f0dfe0] opacity-80 text-[11px] leading-relaxed">
                <span className="font-bold block">📖 回顾场景：</span>
                <p className="mt-1">{currentEvent.scene}</p>
                <div className="mt-2 text-pink-600 font-extrabold flex items-center gap-1">
                  <span>已做出选择：</span>
                  <span>{currentEvent.options.find(o => o.id === selectedChoiceId)?.text}</span>
                </div>
              </div>

              {/* AI 伴侣态度反馈 */}
              <div className="p-4 rounded-2xl border border-pink-200 bg-[#fff9f6] flex flex-col gap-2 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                  <span className="text-xs font-black" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                    {contact.remark || contact.name}（家长 2）的实时感想
                  </span>
                </div>

                {isReactionLoading ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
                    <p className="opacity-70">正在凝神倾听...</p>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed font-bold italic text-purple-900 bg-white p-3 rounded-xl border border-purple-50">
                    “{partnerReaction}”
                  </p>
                )}
              </div>

              {/* 关闭按钮 */}
              {!isReactionLoading && (
                <button
                  onClick={onClose}
                  className="w-full py-3 mt-4 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center justify-center gap-1 transition-all active:scale-98"
                  style={{ backgroundColor: '#7cb896' }}
                >
                  <Check className="w-4 h-4" />
                  <span>记录在案，手足感情升温！</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
