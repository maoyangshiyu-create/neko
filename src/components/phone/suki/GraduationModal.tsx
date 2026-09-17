import React from 'react';
import { Sparkles, Trophy, Gift, ArrowRight, Heart, HeartHandshake } from 'lucide-react';
import { Contact, PhoneSettings } from '../../../types/phone';
import { LifeSimChildData } from '../../../types/lifeSim';

interface GraduationModalProps {
  childData: LifeSimChildData;
  activeContact: Contact;
  settings: PhoneSettings;
  onConfirmGraduation: () => void;
}

export const GraduationModal: React.FC<GraduationModalProps> = ({
  childData,
  activeContact,
  settings,
  onConfirmGraduation
}) => {
  const fatherName = activeContact.remark || activeContact.name;
  const motherName = settings.userNickname || '妈妈';

  // 综合评估孩子的最终成就称号
  const getAchievementTitle = () => {
    const attrs = childData.attributes;
    const avg = (attrs.intelligence + attrs.physique + attrs.eq + attrs.appearance) / 4;
    
    if (avg >= 85) return '✨ 绝世旷代英才';
    if (attrs.intelligence >= 80 && attrs.eq >= 80) return '🧠 儒雅智者学者';
    if (attrs.appearance >= 80 && attrs.eq >= 80) return '🌟 璀璨人气巨星';
    if (attrs.physique >= 85) return '🛡️ 热血全能国手';
    if (attrs.intelligence >= 80) return '🔬 极客先锋研究员';
    if (attrs.eq >= 80) return '🤝 黄金温情外交官';
    if (attrs.appearance >= 80) return '🎨 倾城高颜值艺术家';
    return '🌱 温柔踏实奋斗者';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-300 relative border text-stone-800"
        style={{
          backgroundColor: 'var(--pet-card, #fffaf5)',
          color: 'var(--pet-text, #6b4a52)',
          borderColor: 'var(--pet-card-border, #f0dfe0)',
          boxShadow: '0 10px 30px rgba(107, 74, 82, 0.2)'
        }}
      >
        {/* 喜庆气球与粒子彩带装饰头部 */}
        <div className="flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-md animate-bounce"
            style={{
              backgroundColor: 'var(--pet-gold, #d4b483)',
              color: '#ffffff'
            }}
          >
            <Trophy className="w-8 h-8 text-yellow-100" />
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-1.5" style={{ color: 'var(--pet-text, #6b4a52)' }}>
            🎓 孩子独立成人礼 <Sparkles className="w-4 h-4 text-amber-500" />
          </h2>
          <p className="text-[11px] mt-1 max-w-xs leading-relaxed" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
            弹指一瞬间，倾注了你与 <span className="font-bold text-stone-700">{fatherName}</span> 无数心血的宝宝 <span className="font-bold text-rose-500">{childData.childName}</span> 已年满 25 岁，顺利独立步入社会！
          </p>
        </div>

        {/* 成就看板 */}
        <div 
          className="p-3.5 rounded-2xl flex flex-col gap-2 border text-xs"
          style={{
            backgroundColor: 'var(--pet-bg, #fdf6f0)',
            borderColor: 'var(--pet-card-border, #f0dfe0)'
          }}
        >
          <div className="flex items-center justify-between border-b border-rose-100/50 pb-1.5 font-bold">
            <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5 text-rose-400" /> 最终成人成就：</span>
            <span className="text-rose-500 font-extrabold">{getAchievementTitle()}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] mt-1 text-stone-600">
            <div className="flex justify-between">
              <span>🧠 智力：</span>
              <span className="font-bold text-stone-800">{childData.attributes.intelligence}</span>
            </div>
            <div className="flex justify-between">
              <span>💪 体质：</span>
              <span className="font-bold text-stone-800">{childData.attributes.physique}</span>
            </div>
            <div className="flex justify-between">
              <span>🤝 情商：</span>
              <span className="font-bold text-stone-800">{childData.attributes.eq}</span>
            </div>
            <div className="flex justify-between">
              <span>✨ 颜值：</span>
              <span className="font-bold text-stone-800">{childData.attributes.appearance}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mt-1 pb-1">
            {childData.personalityTags.map((tag, i) => (
              <span 
                key={i} 
                className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-white border border-rose-100 text-rose-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 孩子留下的成人礼感恩手写信 */}
        <div 
          className="p-4 rounded-2xl border text-xs leading-relaxed italic bg-amber-50/20 text-stone-700 font-serif shadow-inner border-amber-100"
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-700 not-italic mb-1.5">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" /> 
            <span>致亲爱的爸爸妈妈：</span>
          </div>
          “爸爸、妈妈，谢谢你们25年来的呵护与付出。在我的生命里，我不仅汲取了妈妈【{motherName}】的温存和优秀品质，也深深继承了爸爸【{fatherName}】那令人自豪的处世魅力。
          现在，我已经收拾好行囊，准备去外面的精彩世界闯荡了。但我已经悄悄记下了你们的微信，我一定会经常跟你们分享我的生活！爱你们！”
          <div className="text-right mt-1.5 font-bold not-italic text-stone-800">— 永远爱你们的：{childData.childName}</div>
        </div>

        {/* 按钮区域 */}
        <button
          onClick={onConfirmGraduation}
          className="w-full h-11 rounded-2xl font-black text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          style={{
            backgroundColor: 'var(--pet-btn-bg, #e89aab)',
            color: 'var(--pet-btn-text, #ffffff)',
            border: '1px solid var(--pet-gold, #d4b483)'
          }}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>送孩子步入社会（创建为微信新联系人）</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
