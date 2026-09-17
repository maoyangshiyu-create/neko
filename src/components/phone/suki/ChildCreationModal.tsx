import React, { useState } from 'react';
import { Baby, Sparkles, Check, AlertCircle, X, Home } from 'lucide-react';
import { Contact, PhoneSettings } from '../../../types/phone';
import { getWeddingRoles } from '../../../utils/genderHelper';

interface ChildCreationModalProps {
  contact: Contact;
  settings: PhoneSettings;
  familyBackground: { financial: string; atmosphere: string; customDesc?: string };
  onCreateChild: (
    childName: string,
    gender: 'male' | 'female'
  ) => void;
  onClose?: () => void;
}

export const ChildCreationModal: React.FC<ChildCreationModalProps> = ({
  contact,
  settings,
  familyBackground,
  onCreateChild,
  onClose
}) => {
  const roles = getWeddingRoles(contact, settings);
  const contactName = contact.remark || contact.name;
  
  // 智能推荐名字（尝试用联系人的姓氏，或暖心昵称）
  const defaultSurname = contactName.charAt(0) || '小';
  const recommendedName = `${defaultSurname}念安`;

  const [childName, setChildName] = useState<string>(recommendedName);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [touchError, setTouchError] = useState<string | null>(null);

  // 校验名字
  const trimmedName = childName.trim();
  const isValidName = trimmedName.length >= 2 && trimmedName.length <= 8;

  const handleConfirm = () => {
    if (!isValidName) {
      setTouchError('娃的名字长度须在 2 ~ 8 个字之间且不能全为空格');
      return;
    }
    if (!gender) {
      setTouchError('请为即将出生的宝宝选择性别');
      return;
    }
    onCreateChild(trimmedName, gender);
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-4 select-none">
      <div
        className="rounded-3xl p-6 shadow-xl flex flex-col gap-5 transition-all my-auto relative"
        style={{
          backgroundColor: 'var(--pet-card, #fffaf5)',
          color: 'var(--pet-text, #6b4a52)',
          border: '1px solid var(--pet-card-border, #f0dfe0)',
          boxShadow: 'var(--pet-shadow, 0 4px 20px rgba(212, 165, 175, 0.15))'
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-[#fdf0ec] transition-colors"
            style={{ color: 'var(--pet-text-soft, #b398a0)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 仪式感头部 */}
        <div className="flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mb-3 shadow-md animate-bounce"
            style={{
              backgroundColor: 'var(--pet-btn-bg, #e89aab)',
              color: 'var(--pet-btn-text, #ffffff)',
              border: '1px solid var(--pet-gold, #d4b483)'
            }}
          >
            <Baby className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            迎育新生命
          </h2>
          <p className="text-xs mt-1 max-w-xs leading-relaxed" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
            你与 <span className="font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>{contactName}</span> 即将迎来属于你们的结晶，共同开启人生重开养成之旅。
          </p>
        </div>

        {/* 优雅的已定义家庭理念看板 */}
        <div 
          className="p-3.5 rounded-2xl flex flex-col gap-1.5 border text-xs"
          style={{
            backgroundColor: 'var(--pet-bg, #fdf6f0)',
            borderColor: 'var(--pet-card-border, #f0dfe0)'
          }}
        >
          <div className="flex items-center gap-1.5 font-bold mb-0.5" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            <Home className="w-3.5 h-3.5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
            <span>已建立的家庭背景：</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="px-2.5 py-1 rounded-full font-bold text-[10px]"
              style={{ backgroundColor: 'var(--pet-card-border, #f0dfe0)', color: 'var(--pet-text, #6b4a52)' }}
            >
              💰 {familyBackground.financial}
            </span>
            <span 
              className="px-2.5 py-1 rounded-full font-bold text-[10px]"
              style={{ backgroundColor: 'var(--pet-card-border, #f0dfe0)', color: 'var(--pet-text, #6b4a52)' }}
            >
              🌟 {familyBackground.atmosphere}
            </span>
          </div>
          {familyBackground.customDesc && (
            <p className="text-[10px] italic opacity-85 leading-relaxed mt-1" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
              “{familyBackground.customDesc}”
            </p>
          )}
        </div>

        {/* 字段 1：娃的名字 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold flex items-center justify-between" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            <span>宝宝的名字 <span style={{ color: 'var(--pet-down, #d68a8a)' }}>*</span></span>
            <span className="text-[10px] font-normal" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>2 ~ 8 个字</span>
          </label>
          <input
            type="text"
            value={childName}
            maxLength={8}
            onChange={(e) => {
              setChildName(e.target.value);
              setTouchError(null);
            }}
            placeholder="例如：念安、小太阳、语晨..."
            className="w-full px-4 py-2.5 rounded-2xl text-sm font-semibold focus:outline-none transition-all"
            style={{
              backgroundColor: 'var(--pet-bg, #fdf6f0)',
              color: 'var(--pet-text, #6b4a52)',
              border: '1px solid var(--pet-card-border, #f0dfe0)'
            }}
          />
        </div>

        {/* 字段 2：性别选择 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            宝宝的性别 <span style={{ color: 'var(--pet-down, #d68a8a)' }}>*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setGender('male');
                setTouchError(null);
              }}
              className="p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                backgroundColor: gender === 'male' ? 'var(--pet-option-hover, #fdf0ec)' : 'var(--pet-bg, #fdf6f0)',
                color: 'var(--pet-text, #6b4a52)',
                border: gender === 'male' ? '1.5px solid var(--pet-btn-bg, #e89aab)' : '1px solid var(--pet-card-border, #f0dfe0)',
                boxShadow: gender === 'male' ? '0 2px 8px rgba(232, 154, 171, 0.2)' : 'none'
              }}
            >
              <span className="text-base">👦</span>
              <span>小男孩</span>
              {gender === 'male' && <Check className="w-3.5 h-3.5 ml-1" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />}
            </button>

            <button
              type="button"
              onClick={() => {
                setGender('female');
                setTouchError(null);
              }}
              className="p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                backgroundColor: gender === 'female' ? 'var(--pet-option-hover, #fdf0ec)' : 'var(--pet-bg, #fdf6f0)',
                color: 'var(--pet-text, #6b4a52)',
                border: gender === 'female' ? '1.5px solid var(--pet-btn-bg, #e89aab)' : '1px solid var(--pet-card-border, #f0dfe0)',
                boxShadow: gender === 'female' ? '0 2px 8px rgba(232, 154, 171, 0.2)' : 'none'
              }}
            >
              <span className="text-base">👧</span>
              <span>小女孩</span>
              {gender === 'female' && <Check className="w-3.5 h-3.5 ml-1" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />}
            </button>
          </div>
        </div>

        {/* 提示/错误提示 */}
        {touchError && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-1 animate-fadeIn" style={{ color: 'var(--pet-down, #d68a8a)' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{touchError}</span>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValidName || !gender}
          className="w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          style={{
            backgroundColor: 'var(--pet-btn-bg, #e89aab)',
            color: 'var(--pet-btn-text, #ffffff)'
          }}
        >
          <Sparkles className="w-4 h-4" />
          开始养育
        </button>
      </div>
    </div>
  );
};
