import React, { useState } from 'react';
import { ArrowLeft, Heart, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import { MarriageRecord, PhoneSettings } from '../../types/phone';
import { Avatar } from './Avatar';
import { MarriageCertificateModal } from './MarriageCertificateModal';

interface MarriageCertificateAppProps {
  settings: PhoneSettings;
  onReturnToDesktop: () => void;
  contacts: any[];
}

export const MarriageCertificateApp: React.FC<MarriageCertificateAppProps> = ({
  settings,
  onReturnToDesktop,
  contacts
}) => {
  // Only display marriage records where partner contact is currently present
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const safeMarriages = (settings && Array.isArray(settings.marriages)) ? settings.marriages : [];
  const marriages = safeMarriages.filter(m =>
    m && safeContacts.some(c => c && (c.id === m.partnerId || c.name === m.partnerName || (c.remark && c.remark === m.partnerName)))
  );
  const [selectedCertificate, setSelectedCertificate] = useState<MarriageRecord | null>(null);

  const selectedContact = selectedCertificate
    ? safeContacts.find(c => c && c.id === selectedCertificate.partnerId)
    : undefined;

  // Calculate row matrix for 3-column wooden display shelf
  const totalRows = Math.max(4, Math.ceil((marriages.length || 1) / 3));
  const rows = [];

  for (let r = 0; r < totalRows; r++) {
    const rowSlots = [];
    for (let c = 0; c < 3; c++) {
      const slotIndex = r * 3 + c;
      const record = marriages[slotIndex];
      rowSlots.push({ slotIndex, record });
    }
    rows.push(rowSlots);
  }

  return (
    <div className="h-full w-full flex flex-col select-none overflow-hidden bg-[#24110a] text-amber-100 font-sans relative">
      {/* Header Bar */}
      <div className="h-11 px-3 bg-[#190a05]/90 backdrop-blur-md border-b border-amber-900/60 flex items-center justify-between shrink-0 z-10 shadow-md relative">
        <button 
          onClick={onReturnToDesktop} 
          className="flex items-center gap-1 text-amber-200/90 text-xs font-medium cursor-pointer hover:text-amber-100 transition-colors z-10"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>桌面</span>
        </button>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-serif font-bold text-sm text-amber-200 tracking-wider">
          <span>婚书展示架</span>
        </div>

        <div className="text-[10.5px] font-mono text-amber-400/80 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full z-10">
          珍藏 {marriages.length} 卷
        </div>
      </div>

      {/* Main Wooden Cabinet Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-5 bg-gradient-to-b from-[#2d150c] via-[#210d07] to-[#170804] relative">
        {/* Subtle Wooden Texture Overlay Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-black/40 pointer-events-none" />

        {marriages.length === 0 && (
          <div className="p-3 bg-[#180a05]/80 border border-amber-900/40 rounded-xl text-center space-y-1 my-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 font-serif">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>暂无珍藏婚书</span>
            </div>
            <p className="text-[10px] text-amber-200/60 leading-relaxed">
              在微信中与好友求婚成功后，结婚证书将展示在下方木架展位上。
            </p>
          </div>
        )}

        {/* Shelves Rows */}
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="relative z-10">
            {/* 3 Columns Grid of Certificates / Slots */}
            <div className="grid grid-cols-3 gap-3 px-1">
              {row.map(({ slotIndex, record }) => {
                if (record) {
                  const partner = contacts.find(c => c.id === record.partnerId);
                  return (
                    <div
                      key={record.certificateId || slotIndex}
                      onClick={() => setSelectedCertificate(record)}
                      className="group relative aspect-[3/4.2] bg-gradient-to-br from-[#9c1b1b] via-[#851313] to-[#5e0909] rounded-lg p-2 shadow-xl border border-amber-300/60 hover:border-amber-200 transition-all cursor-pointer flex flex-col items-center justify-between text-center select-none transform hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-950/80 active:scale-95"
                    >
                      {/* Leather Book Spine Binding Effect */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-black/50 via-black/20 to-transparent rounded-l-lg border-r border-amber-950/40" />

                      {/* Gold Foil Corner Accents */}
                      <div className="absolute top-1 left-1.5 w-1.5 h-1.5 border-t border-l border-amber-300/80" />
                      <div className="absolute top-1 right-1.5 w-1.5 h-1.5 border-t border-r border-amber-300/80" />
                      <div className="absolute bottom-1 left-1.5 w-1.5 h-1.5 border-b border-l border-amber-300/80" />
                      <div className="absolute bottom-1 right-1.5 w-1.5 h-1.5 border-b border-r border-amber-300/80" />

                      {/* Emblem Header */}
                      <div className="mt-0.5 flex items-center justify-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400/20 border border-amber-300/60 flex items-center justify-center">
                          <ShieldCheck className="w-2.5 h-2.5 text-amber-300" />
                        </div>
                      </div>

                      {/* Title: 结婚证 */}
                      <div className="my-0.5">
                        <span className="block font-serif text-xs font-black tracking-widest text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                          结婚证
                        </span>
                        <span className="block text-[6.5px] tracking-tighter text-amber-300/70 font-mono -mt-0.5 scale-90">
                          MARRIAGE
                        </span>
                      </div>

                      {/* Center Partner Avatar & Name */}
                      <div className="w-full bg-black/30 rounded-md p-1 border border-amber-400/30 flex flex-col items-center shadow-inner">
                        <Avatar 
                          src={partner?.avatar || record.partnerAvatar} 
                          className="w-7 h-7 rounded-full border border-amber-300/80 shadow-xs" 
                        />
                        <span className="text-[10px] font-bold text-amber-100 truncate w-full mt-0.5">
                          {record.partnerName}
                        </span>
                      </div>

                      {/* Date Footer */}
                      <div className="w-full text-center my-0.5">
                        <span className="text-[8px] text-amber-300/90 font-mono block truncate">
                          {record.marryDate}
                        </span>
                      </div>
                    </div>
                  );
                }

                /* Empty Wooden Shelf Slot */
                return (
                  <div 
                    key={`empty_${slotIndex}`}
                    className="aspect-[3/4.2] bg-[#140704]/70 border border-amber-900/25 rounded-lg flex flex-col items-center justify-center text-amber-900/40 p-2 shadow-inner"
                  >
                    <div className="w-7 h-7 rounded-full border border-amber-900/30 flex items-center justify-center mb-1 bg-black/20">
                      <BookOpen className="w-3.5 h-3.5 text-amber-900/40" />
                    </div>
                    <span className="text-[9px] font-serif text-amber-900/50 tracking-wider">待缔结</span>
                  </div>
                );
              })}
            </div>

            {/* Wooden Shelf Ledge Plank */}
            <div className="mt-2.5 h-3.5 w-full bg-gradient-to-r from-[#3a1b10] via-[#592b1a] to-[#3a1b10] border-t border-[#7a3b23] border-b border-[#1f0b05] shadow-xl rounded-xs flex items-center justify-between px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-950/80 border border-amber-800/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-950/80 border border-amber-800/40" />
            </div>
          </div>
        ))}
      </div>

      {/* 婚书详情弹窗 */}
      {selectedCertificate && (
        <MarriageCertificateModal
          certificate={selectedCertificate}
          settings={settings}
          contact={selectedContact}
          onClose={() => setSelectedCertificate(null)}
          actionText="收纳婚书"
        />
      )}
    </div>
  );
};
