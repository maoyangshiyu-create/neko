import React, { useState, useRef } from 'react';
import { Contact, WorldBookItem } from '../../../types/phone';
import { ArrowLeft, UserCheck, Sparkles, MessageCircle, Camera } from 'lucide-react';
import { Avatar } from '../Avatar';
import { compressImage } from '../../../utils/image';

interface CharacterCardAppProps {
  contacts: Contact[];
  worldBooks: WorldBookItem[];
  onUpdateContact: (id: string, updates: Partial<Contact>) => void;
  onSelectContactToChat: (id: string) => void;
  onReturnToDesktop: () => void;
}

export const CharacterCardApp: React.FC<CharacterCardAppProps> = ({
  contacts,
  worldBooks,
  onUpdateContact,
  onSelectContactToChat,
  onReturnToDesktop
}) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(contacts[0] || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedContact) return;
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[Avatar] 角色卡选择头像文件:', file.name, file.size);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImage(raw, 160, 160, 0.8);
        onUpdateContact(selectedContact.id, { avatar: compressed });
        setSelectedContact({ ...selectedContact, avatar: compressed });
        console.log('[Avatar] 角色卡头像更新成功:', selectedContact.id);
      } catch (err) {
        console.error('[Avatar] 角色卡头像压缩或保存失败:', err);
        const fallback = reader.result as string;
        onUpdateContact(selectedContact.id, { avatar: fallback });
        setSelectedContact({ ...selectedContact, avatar: fallback });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      className="rococo-theme h-full w-full flex flex-col select-none relative overflow-hidden font-serif"
      style={{
        backgroundColor: '#faf6fc',
        color: '#482852'
      }}
    >
      {/* Header - Soft Rococo Pastel Purple */}
      <div className="h-11 px-3 bg-gradient-to-r from-[#eddff2] via-[#e4d3eb] to-[#d8c0e2] border-b border-[#caa6d6] flex items-center justify-between shrink-0 z-10 shadow-xs">
        <button
          onClick={onReturnToDesktop}
          className="flex items-center gap-0.5 text-[#482852] text-xs font-semibold cursor-pointer active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-[#61366e]" />
          <span>桌面</span>
        </button>
        <span className="font-bold text-xs text-[#482852] flex items-center gap-1 font-serif">
          <UserCheck className="w-3.5 h-3.5 text-[#61366e]" />
          <span>角色卡</span>
        </span>
        <div className="w-10"></div>
      </div>

      {/* Horizontal Avatar Selector */}
      <div className="p-2.5 bg-[#f5eef8] border-b border-[#e5d5ea] flex items-center gap-2 overflow-x-auto shrink-0 font-sans">
        {contacts.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedContact(c)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 cursor-pointer transition-all ${
              selectedContact?.id === c.id
                ? 'bg-[#ebdcf2] border-[#cdaedb] text-[#552163] shadow-xs font-bold ring-1 ring-[#cdaedb]/40'
                : 'bg-white/80 border-[#e5d5ea] text-[#63426d] hover:bg-white'
            }`}
          >
            <Avatar src={c.avatar} name={c.name} className="w-5 h-5 rounded-full" size={12} />
            <span>{c.remark || c.name}</span>
          </button>
        ))}
      </div>

      {/* Selected Card Details */}
      {selectedContact && (
        <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3 font-sans">
          <div className="p-4 bg-white rounded-2xl border border-[#e7daec] shadow-xs space-y-3">
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <div
                onClick={() => {
                  console.log('[Avatar] 点击角色卡头像，触发文件选择');
                  avatarInputRef.current?.click();
                }}
                className="relative group cursor-pointer active:scale-95 transition-transform shrink-0"
                title="点击更换角色头像"
              >
                <Avatar
                  src={selectedContact.avatar}
                  name={selectedContact.name}
                  className="w-16 h-16 rounded-2xl border-2 border-[#caa6d6] shadow-xs"
                  size={32}
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#7a3e87] text-white shadow-xs pointer-events-none">
                  <Camera className="w-2.5 h-2.5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#482852] font-serif">
                  {selectedContact.name}
                </h4>
                <p className="text-[11px] text-[#74507d] mt-0.5">
                  备注: {selectedContact.remark || '无'} · 所属分组: {selectedContact.group}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f4e8f7] text-[#582166] border border-[#dfc3e5] font-medium">
                    音色: {selectedContact.voiceTimbre}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f7edf9] text-[#653f6e] border border-[#e7d4ec] font-medium">
                    {selectedContact.replyStyle}风格
                  </span>
                </div>
              </div>
            </div>

            {/* Persona Editor */}
            <div>
              <label className="block text-[11px] text-[#6b4774] font-medium mb-1">
                AI 核心人设设定 (Personality & Prompt):
              </label>
              <textarea
                value={selectedContact.persona}
                onChange={(e) => {
                  onUpdateContact(selectedContact.id, { persona: e.target.value });
                  setSelectedContact({ ...selectedContact, persona: e.target.value });
                }}
                className="w-full p-2.5 border border-[#e7daec] rounded-xl h-28 resize-none leading-relaxed text-[#3d2042] bg-[#fbf7fc] focus:outline-hidden focus:border-[#7a3e87]"
              />
            </div>

            {/* Bound World Books */}
            <div>
              <span className="block text-[11px] text-[#6b4774] font-medium mb-1">
                当前绑定世界书:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedContact.worldBookIds || []).map((wId) => {
                  const wb = worldBooks.find(w => w.id === wId);
                  return (
                    <span
                      key={wId}
                      className="px-2 py-0.5 rounded-md bg-[#f4ecf7] text-[#5a2866] border border-[#dec7e3] text-[10px]"
                    >
                      {wb ? wb.name : wId}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Jump to Chat button */}
            <div className="pt-2">
              <button
                onClick={() => onSelectContactToChat(selectedContact.id)}
                className="w-full py-2 bg-gradient-to-r from-[#884b96] to-[#71377d] hover:from-[#7a4087] hover:to-[#632c6f] text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>进入与 {selectedContact.remark || selectedContact.name} 的微信聊天</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
