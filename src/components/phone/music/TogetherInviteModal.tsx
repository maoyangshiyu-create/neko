import React, { useState } from 'react';
import { Contact } from '../../../types/phone';
import { X, Search, Headphones, Heart, Sparkles, UserCheck } from 'lucide-react';

interface TogetherInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  currentSelectedContactId?: string;
  onSelectContact: (contact: Contact) => void;
}

// 预设伴听好友（在玩家暂未添加自定义角色时提供无缝体验）
const PRESET_COMPANIONS: Contact[] = [
  {
    id: 'companion_sunian',
    name: '苏念',
    remark: '音乐知音',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    group: '好友',
    persona: '温柔细腻的青梅竹马，喜欢民谣和流行抒情歌，共情能力极强，会细心记住你喜欢的每首歌',
    worldBookIds: [],
    replySpeed: 30,
    replyStyle: 'balanced',
    shortTermMemory: 10,
    longTermMemory: 50,
    voiceTimbre: 'female-shaonv',
    enableInnerVoice: true,
    isOfflineMode: false,
    relationship: 'dating'
  },
  {
    id: 'companion_linshen',
    name: '林深',
    remark: '专属歌友',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    group: '好友',
    persona: '热爱独立摇滚与流行金曲的阳光好友，懂很多音乐冷知识，说话风趣幽默，总是能把你逗笑',
    worldBookIds: [],
    replySpeed: 20,
    replyStyle: 'creative',
    shortTermMemory: 10,
    longTermMemory: 50,
    voiceTimbre: 'male-qn',
    enableInnerVoice: false,
    isOfflineMode: false,
    relationship: 'friend'
  }
];

export const TogetherInviteModal: React.FC<TogetherInviteModalProps> = ({
  isOpen,
  onClose,
  contacts,
  currentSelectedContactId,
  onSelectContact
}) => {
  const [keyword, setKeyword] = useState('');

  if (!isOpen) return null;

  // 严格过滤：群聊不可以，工具不可以，助手不可以
  const eligibleContacts = contacts.filter(c => {
    if (c.isGroup) return false;
    if (c.isAssistant) return false;
    if (c.group === '工具') return false;
    if (c.id === 'assistant') return false;
    return true;
  });

  // 如果没有自定义联系人，合并预设伴听角色
  const allCandidateContacts = eligibleContacts.length > 0 ? eligibleContacts : PRESET_COMPANIONS;

  const displayList = allCandidateContacts.filter(c => {
    if (!keyword.trim()) return true;
    const kw = keyword.toLowerCase();
    return (
      c.name.toLowerCase().includes(kw) ||
      (c.remark && c.remark.toLowerCase().includes(kw)) ||
      (c.persona && c.persona.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn select-none">
      {/* 遮罩点击关闭 */}
      <div className="flex-1" onClick={onClose} />

      {/* 抽屉弹窗主体 */}
      <div 
        className="rounded-t-3xl border-t shadow-2xl flex flex-col max-h-[82%] animate-slideUp overflow-hidden"
        style={{
          backgroundColor: 'var(--app-card, #fffaf5)',
          borderColor: 'var(--app-card-border, #f0dfe0)',
          color: 'var(--app-text, #6b4a52)'
        }}
      >
        {/* 顶部标题区 */}
        <div className="px-4 pt-3.5 pb-2 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--app-divider, #f0dfe0)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold leading-none" style={{ color: 'var(--app-text, #6b4a52)' }}>
                邀请联系人一起听
              </h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                选择一位好友，耳机分你一半，共享同一首歌
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-200/50 cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="px-4 py-2 border-b shrink-0" style={{ borderColor: 'var(--app-divider, #f0dfe0)' }}>
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索联系人昵称、备注..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs outline-hidden border"
              style={{
                backgroundColor: 'var(--app-bg, #fdf6f0)',
                borderColor: 'var(--app-card-border, #f0dfe0)',
                color: 'var(--app-text, #6b4a52)'
              }}
            />
          </div>
        </div>

        {/* 联系人列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {displayList.length === 0 ? (
            <div className="py-10 text-center text-xs" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
              未找到匹配的联系人
            </div>
          ) : (
            displayList.map(contact => {
              const isSelected = currentSelectedContactId === contact.id;
              const displayName = contact.remark || contact.name;

              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    onSelectContact(contact);
                    onClose();
                  }}
                  className={`p-2.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer group active:scale-98 ${
                    isSelected ? 'bg-rose-50/80 border-rose-300 shadow-xs' : 'hover:bg-stone-50/60'
                  }`}
                  style={!isSelected ? {
                    backgroundColor: 'var(--app-item-bg, #fffaf5)',
                    borderColor: 'var(--app-item-border, #f0dfe0)'
                  } : {}}
                >
                  {/* 头像 */}
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={displayName}
                      className="w-11 h-11 rounded-full object-cover border border-rose-200 shadow-2xs"
                    />
                    {contact.relationship === 'dating' || contact.relationship === 'engaged' || contact.relationship === 'married' ? (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xs">
                        <Heart className="w-2.5 h-2.5 fill-current" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                        <Headphones className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold truncate" style={{ color: 'var(--app-text, #6b4a52)' }}>
                        {displayName}
                      </h4>
                      {contact.relationship && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-600 font-medium shrink-0">
                          {contact.relationship === 'dating' ? '情侣' : contact.relationship === 'married' ? '伴侣' : '好友'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
                      {contact.persona || contact.bio || '随时准备和你一起听好歌'}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1 shadow-xs">
                        <UserCheck className="w-3 h-3" />
                        <span>听歌中</span>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectContact(contact);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer active:scale-95 transition-transform flex items-center gap-1 shadow-xs"
                        style={{
                          backgroundColor: 'var(--app-btn-bg, #e89aab)',
                          color: 'var(--app-btn-text, #ffffff)'
                        }}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>邀请一起听</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
