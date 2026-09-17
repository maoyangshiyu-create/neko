import React from 'react';
import { X } from 'lucide-react';
import { MarriageRecord, PhoneSettings, Contact } from '../../types/phone';
import { Avatar } from './Avatar';
import { getWeddingRoles } from '../../utils/genderHelper';

interface MarriageCertificateModalProps {
  certificate: MarriageRecord;
  settings: PhoneSettings;
  contact?: Contact;
  onClose: () => void;
  actionText?: string;
  onAction?: () => void;
}

export const MarriageCertificateModal: React.FC<MarriageCertificateModalProps> = ({
  certificate,
  settings,
  contact,
  onClose,
  actionText = '收纳婚书',
  onAction
}) => {
  // If contact is provided, calculate roles; otherwise construct a minimal contact representation
  const targetContact: Contact = contact || {
    id: certificate.partnerId,
    name: certificate.partnerName,
    remark: certificate.partnerName,
    avatar: certificate.partnerAvatar,
    persona: '',
    gender: 'male',
    relationship: 'married'
  };

  const roles = getWeddingRoles(targetContact, settings);

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 select-none"
      onClick={onClose}
    >
      <div 
        className="rococo-theme relative w-full max-w-sm bg-gradient-to-b from-red-800 via-rose-900 to-red-950 text-amber-100 rounded-3xl p-6 shadow-2xl border-2 border-amber-400/80 text-center overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景喜庆金色光晕 */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-amber-400/20 to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* 右上角关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-full bg-black/30 text-amber-200 hover:text-white cursor-pointer transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 顶端徽章与大红囍字 */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-amber-400 text-sm">✦</span>
          <span className="text-[11px] tracking-widest text-amber-300 font-serif font-bold uppercase">
            Happy Marriage Certificate
          </span>
          <span className="text-amber-400 text-sm">✦</span>
        </div>

        <div className="text-4xl my-1 font-serif text-amber-300 drop-shadow-md">囍</div>
        <h2 className="text-2xl font-bold tracking-wider text-amber-200 font-serif mb-1">
          结 发 良 缘 · 婚 书
        </h2>
        <div className="h-0.5 w-32 mx-auto bg-gradient-to-r from-transparent via-amber-400 to-transparent my-2" />

        {/* 新郎新娘头像与称谓 */}
        <div className="bg-black/35 backdrop-blur-xs rounded-2xl p-4 my-3 border border-amber-400/30 shadow-inner">
          <div className="flex items-center justify-around">
            {/* 左侧：新郎/伴侣1 */}
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-amber-200 shadow-md">
                <Avatar 
                  src={roles.isContactGroom ? (certificate.partnerAvatar || targetContact.avatar) : settings.userAvatar} 
                  className="w-full h-full rounded-full" 
                  size={28} 
                />
              </div>
              <span className="text-[12px] font-bold text-amber-300 mt-1.5 truncate max-w-[80px]">
                {roles.isContactGroom ? certificate.partnerName : (settings.userNickname || '我')}
              </span>
              <span className="text-[10px] text-amber-200/90 bg-red-950/80 px-2 py-0.5 rounded-full border border-amber-400/40 mt-0.5">
                {roles.isContactGroom ? roles.contactTitle : roles.userTitle}
              </span>
            </div>

            {/* 中间爱心与祝福 */}
            <div className="flex flex-col items-center px-1">
              <span className="text-2xl animate-pulse">❤️</span>
              <span className="text-[10px] text-amber-300 font-serif mt-1 tracking-wider">喜结良缘</span>
            </div>

            {/* 右侧：新娘/伴侣2 */}
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-amber-200 shadow-md">
                <Avatar 
                  src={roles.isUserBride ? settings.userAvatar : (certificate.partnerAvatar || targetContact.avatar)} 
                  className="w-full h-full rounded-full" 
                  size={28} 
                />
              </div>
              <span className="text-[12px] font-bold text-amber-300 mt-1.5 truncate max-w-[80px]">
                {roles.isUserBride ? (settings.userNickname || '我') : certificate.partnerName}
              </span>
              <span className="text-[10px] text-amber-200/90 bg-red-950/80 px-2 py-0.5 rounded-full border border-amber-400/40 mt-0.5">
                {roles.isUserBride ? roles.userTitle : roles.contactTitle}
              </span>
            </div>
          </div>

          {/* 婚誓铭言 */}
          <div className="mt-3 pt-3 border-t border-amber-400/20 text-[11px] leading-relaxed text-amber-100/90 font-serif italic text-center px-2">
            “喜今日嘉礼初成，良缘遂缔。<br />
            诗咏关雎，雅歌麟趾。<br />
            结发为夫妻，恩爱两不疑。<br />
            执子之手，与子偕老。”
          </div>
        </div>

        {/* 证书元信息 */}
        <div className="flex items-center justify-between text-[10px] text-amber-300/80 px-2 mb-4 font-mono">
          <span>编号: {certificate.certificateId}</span>
          <span>立约日期: {certificate.marryDate}</span>
        </div>

        {/* 底部操作按钮 */}
        <button
          onClick={handleAction}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-stone-900 font-bold text-xs shadow-lg cursor-pointer active:scale-95 transition-transform"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
};
