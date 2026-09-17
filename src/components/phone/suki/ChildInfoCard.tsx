import React from 'react';
import { LifeSimChildData } from '../../../types/lifeSim';
import { Contact, PhoneSettings } from '../../../types/phone';
import { getWeddingRoles } from '../../../utils/genderHelper';
import { Brain, Heart, Activity, Sparkles, Smile, Sun, UserCheck } from 'lucide-react';

interface ChildInfoCardProps {
  child: LifeSimChildData;
  contact: Contact;
  settings: PhoneSettings;
}

export const ChildInfoCard: React.FC<ChildInfoCardProps> = ({
  child,
  contact,
  settings
}) => {
  const roles = getWeddingRoles(contact, settings);
  const contactGender = roles.contactGender;
  const contactRoleTitle = contactGender === 'female' ? '妈妈' : '爸爸';
  const userRoleTitle = contactGender === 'female' ? '爸爸' : '妈妈';

  // 成长阶段标签
  const getStageLabel = (age: number) => {
    if (age <= 3) return '婴幼儿期';
    if (age <= 12) return '童年期';
    if (age <= 18) return '少年期';
    return '成年独立期';
  };

  const attrs = child.attributes;

  return (
    <div
      className="rounded-3xl p-4 flex flex-col gap-3 transition-all"
      style={{
        backgroundColor: 'var(--pet-card, #fffaf5)',
        color: 'var(--pet-text, #6b4a52)',
        border: '1px solid var(--pet-card-border, #f0dfe0)',
        boxShadow: 'var(--pet-shadow, 0 4px 20px rgba(212, 165, 175, 0.15))'
      }}
    >
      {/* 头部：娃的基本信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs"
            style={{
              backgroundColor: 'var(--pet-bg, #fdf6f0)',
              border: '1px solid var(--pet-gold-soft, #f0dfb8)'
            }}
          >
            {child.gender === 'male' ? '👦' : '👧'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                {child.childName}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--pet-gold-soft, #f0dfb8)',
                  color: 'var(--pet-text, #6b4a52)',
                  border: '1px solid var(--pet-gold, #d4b483)'
                }}
              >
                <span>✨</span>
                <span>{child.age} 岁 · {getStageLabel(child.age)}</span>
              </span>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
              {userRoleTitle}：{settings.userNickname || '我'} | {contactRoleTitle}：{contact.remark || contact.name}
            </div>
          </div>
        </div>

        {/* 性格标签 */}
        <div className="flex flex-wrap gap-1 justify-end max-w-[110px]">
          {child.personalityTags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-md font-bold"
              style={{
                backgroundColor: 'var(--pet-bg, #fdf6f0)',
                color: 'var(--pet-text, #6b4a52)',
                border: '1px solid var(--pet-card-border, #f0dfe0)'
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 6 维数值网格 */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {/* 智力 */}
        <div className="flex flex-col gap-1 p-2 rounded-xl" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)' }}>
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" style={{ color: 'var(--pet-text, #6b4a52)' }} /> 智力
            </span>
            <span>{attrs.intelligence}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pet-bar-track, #f5e8e5)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, attrs.intelligence)}%`,
                backgroundColor: 'var(--pet-bar-1, #f4b8c8)'
              }}
            />
          </div>
        </div>

        {/* 体质 */}
        <div className="flex flex-col gap-1 p-2 rounded-xl" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)' }}>
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" style={{ color: 'var(--pet-text, #6b4a52)' }} /> 体质
            </span>
            <span>{attrs.physique}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pet-bar-track, #f5e8e5)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, attrs.physique)}%`,
                backgroundColor: 'var(--pet-bar-2, #a8d5c8)'
              }}
            />
          </div>
        </div>

        {/* 情商 */}
        <div className="flex flex-col gap-1 p-2 rounded-xl" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)' }}>
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--pet-text, #6b4a52)' }} /> 情商
            </span>
            <span>{attrs.eq}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pet-bar-track, #f5e8e5)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, attrs.eq)}%`,
                backgroundColor: 'var(--pet-bar-3, #f5d89a)'
              }}
            />
          </div>
        </div>

        {/* 颜值 */}
        <div className="flex flex-col gap-1 p-2 rounded-xl" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)' }}>
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            <span className="flex items-center gap-1">
              <Smile className="w-3 h-3" style={{ color: 'var(--pet-text, #6b4a52)' }} /> 颜值
            </span>
            <span>{attrs.appearance}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pet-bar-track, #f5e8e5)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, attrs.appearance)}%`,
                backgroundColor: 'var(--pet-bar-4, #c8b5e0)'
              }}
            />
          </div>
        </div>

        {/* 心情 */}
        <div className="flex flex-col gap-1 p-2 rounded-xl" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)' }}>
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            <span className="flex items-center gap-1">
              <Sun className="w-3 h-3" style={{ color: 'var(--pet-text, #6b4a52)' }} /> 心情
            </span>
            <span>{attrs.mood}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pet-bar-track, #f5e8e5)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, attrs.mood)}%`,
                backgroundColor: 'var(--pet-bar-5, #f4c8a8)'
              }}
            />
          </div>
        </div>

        {/* 幸福感 */}
        <div className="flex flex-col gap-1 p-2 rounded-xl" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)' }}>
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} /> 幸福感
            </span>
            <span>{attrs.happiness}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pet-bar-track, #f5e8e5)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, attrs.happiness)}%`,
                backgroundColor: 'var(--pet-bar-6, #b8d4e8)'
              }}
            />
          </div>
        </div>
      </div>

      {/* 亲密度状态栏 */}
      <div
        className="flex items-center justify-between text-xs pt-2 mt-0.5 font-semibold"
        style={{
          borderTop: '1px solid var(--pet-card-border, #f0dfe0)',
          color: 'var(--pet-text, #6b4a52)'
        }}
      >
        <div className="flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
          <span>娃 ↔ 我 亲密: <strong style={{ color: 'var(--pet-btn-bg, #e89aab)' }}>{child.intimacyToUser}</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--pet-gold, #d4b483)' }} />
          <span>娃 ↔ {contact.remark || contact.name} 亲密: <strong style={{ color: 'var(--pet-gold, #d4b483)' }}>{child.intimacyToContact}</strong></span>
        </div>
      </div>
    </div>
  );
};
