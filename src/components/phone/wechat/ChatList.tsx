import React, { useState, useRef } from 'react';
import { Contact, ChatMessage, PhoneSettings } from '../../../types/phone';
import { Search, UserPlus, Users, Pin, PinOff, Trash2 } from 'lucide-react';
import { CreateGroupModal } from './CreateGroupModal';
import { Avatar } from '../Avatar';
import { getBubbleBgStyle } from '../../../utils/bubbleStyle';
import { extractAndStripInnerVoice } from '../../../services/aiService';

interface ChatListProps {
  contacts: Contact[];
  messages: Record<string, ChatMessage[]>;
  onSelectContact: (contactId: string) => void;
  onAddContact: (contact: Partial<Contact>) => void;
  onUpdateContact: (contactId: string, updates: Partial<Contact>) => void;
  onDeleteContact: (contactId: string) => void;
  showAddMenu: boolean;
  onCloseAddMenu: () => void;
  settings: PhoneSettings;
}

export const ChatList: React.FC<ChatListProps> = ({
  contacts,
  messages,
  onSelectContact,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  showAddMenu,
  onCloseAddMenu,
  settings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  const activeTheme = settings.activeDIYThemeId && settings.diyThemes
    ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
    : undefined;
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPersona, setNewFriendPersona] = useState('');

  // Swipe state for each item (stores swiped contact id)
  const [swipedContactId, setSwipedContactId] = useState<string | null>(null);

  // Custom confirmation modal state to prevent iframe confirm bugs
  const [pendingDeleteContact, setPendingDeleteContact] = useState<{ id: string; name: string } | null>(null);
  
  // Touch / Mouse drag tracking
  const touchStartXRef = useRef<number>(0);
  const currentSwipedIdRef = useRef<string | null>(null);

  // Sort contacts: pinned first, then by lastMessageTime
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
  });

  const filteredContacts = sortedContacts.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.remark && c.remark.toLowerCase().includes(q)) ||
      c.group.toLowerCase().includes(q)
    );
  });

  const handleConfirmAddFriend = async () => {
    if (!newFriendName.trim()) return;
    
    let initialAffection = 10;
    let initialRelationship = 'friend';
    
    // 调用 AI 解析人设
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `你是一个关系分析专家。根据以下人物设定，判断"我"与这个角色的关系。

人物设定：${newFriendPersona.trim() || '新认识的朋友'}

请返回 JSON 格式：
{
  "affection": 数字(0-100),
  "relationship": "friend" 或 "dating" 或 "engaged" 或 "married"
}

判断标准：
- 陌生人、刚认识、普通朋友、同事、同学、发小、闺蜜、死党 → relationship 为 "friend"
- 恋人、女友、男友、喜欢的人、暗恋对象 → relationship 为 "dating"
- 未婚夫、未婚妻、已订婚 → relationship 为 "engaged"
- 丈夫、妻子、老公、老婆、爱人 → relationship 为 "married"

好感度参考：
- 0-20：陌生人
- 20-40：普通朋友
- 40-60：好朋友/发小
- 60-80：恋人或家人
- 80-100：灵魂伴侣

只返回 JSON，不要其他文字。`,
          messages: [{ role: 'user', content: '分析这段人物设定' }],
          temperature: 0.3
        })
      });
      
      const data = await res.json();
      
      // Clean potential markdown backticks from AI reply
      let replyText = data?.reply || '{}';
      if (replyText.includes('```')) {
        const match = replyText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
          replyText = match[1];
        }
      }
      
      const result = JSON.parse(replyText.trim());
      if (result.affection !== undefined && !isNaN(Number(result.affection))) {
        initialAffection = Math.min(100, Math.max(0, Number(result.affection)));
      }
      if (['friend', 'dating', 'engaged', 'married'].includes(result.relationship)) {
        initialRelationship = result.relationship;
      }
    } catch (e) {
      console.warn('AI 解析人设失败:', e);
    }
    
    console.log('[好感度] AI 解析结果 - 好感度:', initialAffection, '关系:', initialRelationship);
    console.log('[好感度] 创建联系人时传入:', { affection: initialAffection, relationship: initialRelationship });

    onAddContact({
      name: newFriendName.trim(),
      remark: newFriendName.trim(),
      avatar: '',
      group: '好友',
      persona: newFriendPersona.trim() || '你是一名微信好友，善解人意，说话自然生活化。',
      voiceTimbre: '',
      enableInnerVoice: true,
      replySpeed: 30,
      replyStyle: 'balanced',
      shortTermMemory: 10,
      longTermMemory: 50,
      worldBookIds: ['wb_common'],
      unreadCount: 0,
      affection: Math.round(initialAffection),
      relationship: initialRelationship as 'friend' | 'dating' | 'engaged' | 'married'
    });
    setNewFriendName('');
    setNewFriendPersona('');
    setIsAddingFriend(false);
    onCloseAddMenu();
  };

  const handleCreateGroup = ({
    name,
    avatar,
    memberIds,
    notice
  }: {
    name: string;
    avatar: string;
    memberIds: string[];
    notice?: string;
  }) => {
    const groupId = `group_${Date.now()}`;
    const selectedFriends = contacts.filter(c => memberIds.includes(c.id));
    const memberNames = selectedFriends.map(f => f.remark || f.name).join('、');

    onAddContact({
      id: groupId,
      name,
      remark: name,
      avatar,
      group: '群聊',
      isGroup: true,
      groupMemberIds: memberIds,
      groupNotice: notice,
      persona: `这是一个由【${memberNames}】等好友组成的微信群聊。成员们性格各具特色，在群里会积极交流互动、互相吐槽、日常闲聊。`,
      voiceTimbre: '',
      enableInnerVoice: false,
      replySpeed: 30,
      replyStyle: 'creative',
      shortTermMemory: 15,
      longTermMemory: 50,
      isOfflineMode: false,
      unreadCount: 0,
      lastMessageTime: Date.now()
    });

    setIsCreatingGroup(false);

    setTimeout(() => {
      onSelectContact(groupId);
    }, 80);
  };

  const effectiveChatlistBg = activeTheme?.assets?.chatlistBg || activeTheme?.assets?.wechatBg;

  return (
    <div 
      className="h-full w-full flex flex-col select-none relative overflow-hidden bg-cover bg-center"
      onClick={() => {
        if (swipedContactId) setSwipedContactId(null);
      }}
      style={{
        backgroundImage: effectiveChatlistBg ? `url(${effectiveChatlistBg})` : undefined,
        backgroundColor: effectiveChatlistBg ? 'transparent' : 'var(--gg-page-bg, #ededed)'
      }}
    >
      <div className="relative z-10 flex flex-col w-full h-full overflow-hidden">
      {/* Search Bar */}
      <div className="p-2" style={{ backgroundColor: effectiveChatlistBg ? 'transparent' : 'var(--gg-page-bg, #ededed)' }}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200/60 shadow-xs">
          <Search className="w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="搜索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-stone-800 placeholder:text-stone-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-stone-400 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Contacts Chat List */}
      <div 
        className={`flex-1 overflow-y-auto divide-y ${
          effectiveChatlistBg ? 'divide-black/10 bg-transparent' : 'divide-stone-200/60 bg-white'
        }`}
      >
        {filteredContacts.map((contact) => {
          const chatMsgs = messages[contact.id] || [];
          const lastMsg = chatMsgs[chatMsgs.length - 1];
          const lastMsgContent = lastMsg
            ? lastMsg.type === 'image'
              ? '[图片]'
              : lastMsg.type === 'transfer'
              ? `[转账 ¥${lastMsg.transferAmount}]`
              : extractAndStripInnerVoice(lastMsg.content).cleanText || lastMsg.content
            : '暂无消息，点击开始聊天';

          const isSwiped = swipedContactId === contact.id;

          return (
            <div
              key={contact.id}
              className={`relative overflow-hidden ${
                effectiveChatlistBg ? 'bg-transparent' : 'bg-white'
              }`}
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
                currentSwipedIdRef.current = contact.id;
              }}
               onTouchEnd={(e) => {
                const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
                if (diffX < -40 && contact.id !== 'assistant') {
                  setSwipedContactId(contact.id);
                } else if (diffX > 40 && swipedContactId === contact.id) {
                  setSwipedContactId(null);
                }
              }}
              onMouseDown={(e) => {
                touchStartXRef.current = e.clientX;
              }}
              onMouseUp={(e) => {
                const diffX = e.clientX - touchStartXRef.current;
                if (diffX < -40 && contact.id !== 'assistant') {
                  setSwipedContactId(contact.id);
                } else if (diffX > 40 && swipedContactId === contact.id) {
                  setSwipedContactId(null);
                }
              }}
            >
              {/* Background Action Buttons (Revealed only when isSwiped is true) */}
              {isSwiped && (
                <div className="absolute inset-y-0 right-0 flex items-center z-0 animate-fadeIn">
                  {contact.id !== 'assistant' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateContact(contact.id, { isPinned: !contact.isPinned });
                        setSwipedContactId(null);
                      }}
                      className="h-full px-4 font-medium text-xs flex flex-col items-center justify-center cursor-pointer transition-colors"
                      style={{
                        backgroundColor: activeTheme?.css?.['--gg-swipe-pin-bg'] || '#f59e0b',
                        color: activeTheme?.css?.['--gg-swipe-pin-text'] || '#ffffff'
                      }}
                      title={contact.isPinned ? '取消置顶' : '置顶'}
                    >
                      {contact.isPinned ? (
                        activeTheme?.assets?.swipePinOffIcon ? (
                          <img src={activeTheme.assets.swipePinOffIcon} alt="pinOff" className="w-4 h-4 mb-0.5 object-contain" />
                        ) : (
                          <PinOff className="w-4 h-4 mb-0.5" />
                        )
                      ) : (
                        activeTheme?.assets?.swipePinIcon ? (
                          <img src={activeTheme.assets.swipePinIcon} alt="pin" className="w-4 h-4 mb-0.5 object-contain" />
                        ) : (
                          <Pin className="w-4 h-4 mb-0.5" />
                        )
                      )}
                      <span>{contact.isPinned ? '取消' : '置顶'}</span>
                    </button>
                  )}
                  {contact.id !== 'assistant' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteContact({ id: contact.id, name: contact.remark || contact.name });
                        setSwipedContactId(null);
                      }}
                      className="h-full px-4 font-medium text-xs flex flex-col items-center justify-center cursor-pointer transition-colors"
                      style={{
                        backgroundColor: activeTheme?.css?.['--gg-swipe-delete-bg'] || '#ef4444',
                        color: activeTheme?.css?.['--gg-swipe-delete-text'] || '#ffffff'
                      }}
                      title="删除"
                    >
                      {activeTheme?.assets?.swipeDeleteIcon ? (
                        <img src={activeTheme.assets.swipeDeleteIcon} alt="delete" className="w-4 h-4 mb-0.5 object-contain" />
                      ) : (
                        <Trash2 className="w-4 h-4 mb-0.5" />
                      )}
                      <span>删除</span>
                    </button>
                  )}
                </div>
              )}

              {/* Foreground Chat Item */}
              <div
                onClick={() => {
                  if (isSwiped) {
                    setSwipedContactId(null);
                  } else {
                    onSelectContact(contact.id);
                  }
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-transform duration-200 relative z-10 ${
                  contact.isPinned 
                    ? effectiveChatlistBg ? 'bg-black/15' : 'bg-[#e8e8e8]'
                    : effectiveChatlistBg ? 'hover:bg-black/5 active:bg-black/10' : 'bg-white hover:bg-stone-100 active:bg-stone-200'
                } ${isSwiped ? '-translate-x-32' : 'translate-x-0'}`}
              >
                {/* Avatar + Badge */}
                <div className="relative shrink-0">
                  <Avatar
                    src={contact.avatar}
                    className="w-11 h-11 rounded-lg shadow-xs"
                    size={20}
                  />
                  {(contact.unreadCount || 0) > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center border border-white"
                      style={{
                        backgroundColor: activeTheme?.css?.['--gg-unread-bg'] || 'var(--gg-accent-color, #ef4444)',
                        color: activeTheme?.css?.['--gg-unread-text'] || '#ffffff',
                      }}
                    >
                      {contact.unreadCount}
                    </span>
                  )}
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {contact.isPinned && (
                        activeTheme?.assets?.pinnedIcon ? (
                          <img 
                            src={activeTheme.assets.pinnedIcon} 
                            alt="pinned" 
                            className="shrink-0 object-contain"
                            style={{ 
                              width: 'var(--gg-pinned-icon-size, 12px)', 
                              height: 'var(--gg-pinned-icon-size, 12px)' 
                            }} 
                          />
                        ) : (
                          <Pin 
                            className="shrink-0"
                            style={{ 
                              width: 'var(--gg-pinned-icon-size, 12px)', 
                              height: 'var(--gg-pinned-icon-size, 12px)',
                              color: 'var(--gg-pinned-icon-color, #f59e0b)',
                              fill: 'var(--gg-pinned-icon-color, #f59e0b)'
                            }} 
                          />
                        )
                      )}
                      <span
                        className="font-bold text-xs truncate"
                        style={{ color: 'var(--gg-text-primary, #1c1917)' }}
                      >
                        {contact.remark || contact.name}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-mono shrink-0 ml-1"
                      style={{ color: 'var(--gg-text-secondary, #9ca3af)' }}
                    >
                      {lastMsg ? '刚刚' : ''}
                    </span>
                  </div>
                  <p
                    className="text-[11px] truncate"
                    style={{ color: 'var(--gg-text-secondary, #78716c)' }}
                  >
                    {lastMsgContent}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Right "+" Dropdown Menu */}
      {showAddMenu && (
        <div
          className="absolute top-1 right-2 z-50 w-36 rounded-xl bg-[#4c4c4c] text-white shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow indicator */}
          <div className="absolute -top-1 right-3.5 w-2 h-2 bg-[#4c4c4c] rotate-45"></div>

          <button
            onClick={() => { setIsAddingFriend(true); onCloseAddMenu(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-black/20 text-left cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>添加好友</span>
          </button>
          <button
            onClick={() => {
              setIsCreatingGroup(true);
              onCloseAddMenu();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-black/20 text-left border-t border-white/10 cursor-pointer"
          >
            <Users className="w-4 h-4 text-white" />
            <span>发起群聊</span>
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreatingGroup}
        contacts={contacts}
        onClose={() => setIsCreatingGroup(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* Add Friend Dialog */}
      {isAddingFriend && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            className="w-72 rounded-2xl p-4 shadow-2xl text-xs space-y-3 transition-all border border-stone-200/50"
            style={{
              backgroundColor: activeTheme?.css?.['--gg-group-modal-bg'] || '#ffffff',
              color: activeTheme?.css?.['--gg-group-modal-title-color'] || '#1f2937'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 
              className="font-bold text-sm"
              style={{ color: activeTheme?.css?.['--gg-group-modal-title-color'] || '#1f2937' }}
            >
              添加新好友 (AI角色)
            </h4>
            <div>
              <label 
                className="block text-[11px] mb-1"
                style={{ color: activeTheme?.css?.['--gg-group-modal-label-color'] || '#78716c' }}
              >
                好友昵称:
              </label>
              <input
                type="text"
                placeholder="例如: 小红 / 侦探夏洛克"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="w-full p-2 rounded-lg border focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-group-modal-input-bg'] || '#ffffff',
                  color: activeTheme?.css?.['--gg-group-modal-input-text'] || '#1f2937',
                  borderColor: activeTheme?.css?.['--gg-group-modal-input-border'] || '#e5e7eb'
                }}
              />
            </div>
            <div>
              <label 
                className="block text-[11px] mb-1"
                style={{ color: activeTheme?.css?.['--gg-group-modal-label-color'] || '#78716c' }}
              >
                人设描述 (性格、说话风格):
              </label>
              <textarea
                placeholder="例如: 热情幽默的小伙伴，爱聊八卦"
                value={newFriendPersona}
                onChange={(e) => setNewFriendPersona(e.target.value)}
                className="w-full p-2 rounded-lg h-16 resize-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all border"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-group-modal-input-bg'] || '#ffffff',
                  color: activeTheme?.css?.['--gg-group-modal-input-text'] || '#1f2937',
                  borderColor: activeTheme?.css?.['--gg-group-modal-input-border'] || '#e5e7eb'
                }}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsAddingFriend(false)}
                className="flex-1 py-1.5 rounded-lg border font-medium cursor-pointer transition-all active:scale-95"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-group-modal-close-btn-bg'] || '#ffffff',
                  color: activeTheme?.css?.['--gg-group-modal-close-btn-text'] || '#57534e',
                  borderColor: activeTheme?.css?.['--gg-group-modal-close-btn-border'] || '#e5e7eb'
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddFriend}
                disabled={!newFriendName.trim()}
                className="flex-1 py-1.5 rounded-lg font-semibold disabled:opacity-50 cursor-pointer transition-all active:scale-95 shadow-xs"
                style={{
                  backgroundColor: activeTheme?.css?.['--gg-group-modal-primary-btn-bg'] || '#a8b39c',
                  color: activeTheme?.css?.['--gg-group-modal-primary-btn-text'] || '#ffffff'
                }}
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Custom Delete Contact Modal */}
      {pendingDeleteContact && (
        <div className="fixed inset-0 z-50 bg-black/40 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[280px] bg-white rounded-2xl p-4 shadow-xl text-center animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-stone-900 mb-2">删除会话</h3>
            <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">确定要删除与【{pendingDeleteContact.name}】的会话及聊天记录吗？</p>
            <div className="flex items-center gap-2.5">
              <button
                className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => setPendingDeleteContact(null)}
              >
                取消
              </button>
              <button
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => {
                  onDeleteContact(pendingDeleteContact.id);
                  setPendingDeleteContact(null);
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
