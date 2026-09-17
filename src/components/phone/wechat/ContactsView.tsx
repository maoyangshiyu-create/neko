import React, { useState, useRef } from 'react';
import { Contact } from '../../../types/phone';
import { Search, FolderPlus, MoreHorizontal, UserCheck, ChevronRight, Users, X, MessageSquare, Trash2 } from 'lucide-react';
import { Avatar } from '../Avatar';

interface ContactsViewProps {
  contacts: Contact[];
  onSelectContact: (contactId: string) => void;
  onUpdateContact: (contactId: string, updates: Partial<Contact>) => void;
  onDeleteContact?: (contactId: string) => void;
  hasWechatBg?: boolean;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  onSelectContact,
  onUpdateContact,
  onDeleteContact,
  hasWechatBg = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupListModal, setShowGroupListModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Swipe state for contacts
  const [swipedContactId, setSwipedContactId] = useState<string | null>(null);
  const [pendingDeleteContact, setPendingDeleteContact] = useState<{ id: string; name: string } | null>(null);
  const touchStartXRef = useRef<number>(0);
  const currentSwipedIdRef = useRef<string | null>(null);
  
  // Contacts book strictly displays individual friends only (群聊不是联系人)
  const isIndividualFriend = (c: Contact) => !c.isGroup && c.group !== '群聊' && !c.id.startsWith('group_');
  const nonGroupContacts = contacts.filter(isIndividualFriend);
  const groupChats = contacts.filter(c => !isIndividualFriend(c));

  const [selectedContactForMove, setSelectedContactForMove] = useState<string>(nonGroupContacts[0]?.id || '');
  const [targetGroup, setTargetGroup] = useState('');

  // Remove from group state
  const [selectedContactForRemove, setSelectedContactForRemove] = useState<string>(nonGroupContacts[0]?.id || '');
  const [removeGroupTarget, setRemoveGroupTarget] = useState('');

  // Explicitly managed empty/all custom groups state
  const [customGroups, setCustomGroups] = useState<string[]>([]);

  // Synchronize dropdown selections when contacts change
  React.useEffect(() => {
    if (!nonGroupContacts.some(c => c.id === selectedContactForMove)) {
      setSelectedContactForMove(nonGroupContacts[0]?.id || '');
    }
    if (!nonGroupContacts.some(c => c.id === selectedContactForRemove)) {
      setSelectedContactForRemove(nonGroupContacts[0]?.id || '');
    }
  }, [contacts]);

  // Helper to get contact's groups list (fallback to primary group string)
  const getContactGroups = (c: Contact) => {
    if (!c) return ['未分组'];
    if (c.groups && c.groups.length > 0) return c.groups.filter(g => g !== '群聊');
    return c.group && c.group !== '群聊' ? [c.group] : ['未分组'];
  };

  // All contact groups = strictly union of friend groups, never including '群聊'
  const allGroups = Array.from(new Set([
    ...nonGroupContacts.flatMap(c => getContactGroups(c)),
    ...customGroups
  ])).filter(g => g !== '群聊');

  // Filter individual contacts
  const filteredContacts = nonGroupContacts.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.remark && c.remark.toLowerCase().includes(q)) ||
      getContactGroups(c).some(g => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`h-full w-full flex flex-col select-none relative ${hasWechatBg ? 'bg-transparent' : 'bg-[#ededed]'}`}>
      {/* Search Bar */}
      <div className={`p-2 ${hasWechatBg ? 'bg-transparent' : 'bg-[#ededed]'}`}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200/60 shadow-xs">
          <Search className="w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="搜索联系人"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-stone-800 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Top action: 微信标准功能行 (群聊入口) */}
      <div className={`${hasWechatBg ? 'bg-white/85 backdrop-blur-xs' : 'bg-white'} divide-y divide-stone-100 border-b border-stone-200/60`}>
        <div
          onClick={() => setShowGroupListModal(true)}
          className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-stone-50 active:bg-stone-100 cursor-pointer transition-colors"
        >
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0 transition-colors"
            style={{ backgroundColor: 'var(--gg-group-btn-color, #a8b39c)' }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 font-medium text-xs text-stone-900 flex items-center justify-between pr-1">
            <span>群聊</span>
            <span className="text-[11px] text-stone-400 font-normal">
              {groupChats.length} 个群聊
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
        </div>
      </div>

      {/* Action: 分组管理 trigger */}
      <div className={`${hasWechatBg ? 'bg-white/70 backdrop-blur-xs' : 'bg-[#f7f7f7]'} px-3.5 py-1.5 border-b border-stone-200/60 flex items-center justify-between text-xs text-stone-700`}>
        <span className="font-semibold text-stone-500 text-[11px]">通讯录分组 ({allGroups.length} 个)</span>
        <button
          onClick={() => setShowGroupModal(true)}
          className="flex items-center gap-1 font-medium cursor-pointer transition-opacity hover:opacity-80"
          style={{
            color: 'var(--gg-group-btn-color, #a8b39c)'
          }}
        >
          <FolderPlus className="w-3.5 h-3.5" style={{ color: 'var(--gg-group-btn-color, #a8b39c)' }} />
          <span>分组管理</span>
        </button>
      </div>

      {/* Grouped Contacts List (Only individual friends, never groups) */}
      <div className={`flex-1 overflow-y-auto ${hasWechatBg ? 'bg-transparent' : 'bg-white'}`}>
        {allGroups.map((group) => {
          const inGroup = filteredContacts.filter(c => {
            const grps = getContactGroups(c);
            return grps.includes(group);
          });

          return (
            <div key={group}>
              <div className={`px-3.5 py-1 text-[11px] font-semibold text-stone-500 uppercase flex items-center justify-between ${hasWechatBg ? 'bg-black/10 backdrop-blur-xs' : 'bg-stone-100'}`}>
                <span>{group} ({inGroup.length})</span>
                {inGroup.length === 0 && (
                  <span className="text-[10px] text-stone-400 font-normal lowercase">空分组</span>
                )}
              </div>
              {inGroup.length > 0 && (
                <div className={`divide-y ${hasWechatBg ? 'divide-black/10' : 'divide-stone-100'}`}>
                  {inGroup.map((contact) => {
                    const isSwiped = swipedContactId === contact.id;
                    return (
                      <div
                        key={`${group}_${contact.id}`}
                        className={`relative overflow-hidden ${hasWechatBg ? 'bg-transparent' : 'bg-white'}`}
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
                        {/* Background Delete Button (Only rendered when swiped) */}
                        {isSwiped && contact.id !== 'assistant' && (
                          <div className="absolute inset-y-0 right-0 flex items-center z-0 animate-fadeIn">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDeleteContact({ id: contact.id, name: contact.remark || contact.name });
                                setSwipedContactId(null);
                              }}
                              className="h-full px-4 bg-red-500 hover:bg-red-600 text-white font-medium text-xs flex flex-col items-center justify-center cursor-pointer"
                              title="删除联系人"
                            >
                              <Trash2 className="w-4 h-4 mb-0.5" />
                              <span>删除</span>
                            </button>
                          </div>
                        )}

                        {/* Foreground Contact Item */}
                        <div
                          onClick={() => {
                            if (isSwiped) {
                              setSwipedContactId(null);
                            } else {
                              onSelectContact(contact.id);
                            }
                          }}
                          className={`flex items-center gap-3 px-3.5 py-2 cursor-pointer transition-transform duration-200 relative z-10 ${
                            hasWechatBg
                              ? 'hover:bg-black/5 active:bg-black/10'
                              : 'bg-white hover:bg-stone-50 active:bg-stone-100'
                          } ${
                            isSwiped ? '-translate-x-16' : 'translate-x-0'
                          }`}
                        >
                          <Avatar
                            src={contact.avatar}
                            className="w-9 h-9 rounded-lg shadow-xs"
                            size={18}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-stone-900 truncate">
                              {contact.remark || contact.name}
                            </div>
                            <div className="text-[10px] text-stone-400 truncate">
                              {contact.persona ? (contact.persona.slice(0, 24) + '...') : '暂无个性签名'}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 群聊列表查看弹窗 (微信原生群聊聚合列表) */}
      {showGroupListModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div 
            className="w-80 rounded-2xl shadow-2xl text-xs flex flex-col max-h-[85vh] overflow-hidden border transition-colors"
            style={{
              backgroundColor: 'var(--gg-group-modal-bg, #ffffff)',
              color: 'var(--gg-group-modal-title-color, #1f2937)',
              borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
            }}
          >
            <div 
              className="p-3.5 border-b flex items-center justify-between transition-colors"
              style={{
                backgroundColor: 'var(--gg-group-modal-bg, #f9fafb)',
                borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
              }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: 'var(--gg-group-btn-color, #a8b39c)' }} />
                <span 
                  className="font-bold text-sm"
                  style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}
                >
                  所有群聊 ({groupChats.length})
                </span>
              </div>
              <button
                onClick={() => setShowGroupListModal(false)}
                className="p-1 hover:opacity-80 rounded-full cursor-pointer transition-opacity"
                style={{ color: 'var(--gg-group-modal-close-btn-text, #57534e)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 divide-y divide-stone-100">
              {groupChats.length === 0 ? (
                <div 
                  className="py-12 text-center text-xs opacity-70"
                  style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
                >
                  暂无加入的群聊，可在聊天列表中点击右上角「+」发起群聊
                </div>
              ) : (
                groupChats.map(grp => (
                  <div
                    key={grp.id}
                    onClick={() => {
                      setShowGroupListModal(false);
                      onSelectContact(grp.id);
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-black/5 active:bg-black/10 rounded-xl cursor-pointer transition-colors"
                  >
                    <Avatar
                      src={grp.avatar}
                      className="w-10 h-10 rounded-lg shadow-xs"
                      size={20}
                    />
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-bold text-xs truncate"
                        style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}
                      >
                        {grp.name}
                      </div>
                      <div 
                        className="text-[10px] truncate mt-0.5 opacity-80"
                        style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
                      >
                        {grp.groupMemberIds?.length || 0} 位群成员
                      </div>
                    </div>
                    <div 
                      className="text-[10px] font-medium shrink-0 flex items-center gap-0.5"
                      style={{ color: 'var(--gg-group-btn-color, #a8b39c)' }}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>进入</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 分组管理弹窗 (四、通讯录功能) */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
          <div 
            className="w-80 rounded-2xl p-4 shadow-2xl text-xs space-y-3.5 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--gg-group-modal-bg, #ffffff)',
              color: 'var(--gg-group-modal-title-color, #1f2937)',
            }}
          >
            <h4 
              className="font-bold text-sm"
              style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}
            >
              通讯录分组管理
            </h4>
            
            {/* 新建分组 (独立创建空白分组) */}
            <div>
              <label 
                className="block text-[11px] mb-1 font-medium"
                style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
              >
                新建空白分组:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例如: 同事 / 密友"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 p-1.5 rounded-lg text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                    color: 'var(--gg-group-modal-input-text, #1f2937)',
                    borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)',
                  }}
                />
                <button
                  onClick={() => {
                    const trimmed = newGroupName.trim();
                    if (!trimmed) return;
                    if (allGroups.includes(trimmed)) {
                      alert(`分组【${trimmed}】已存在！`);
                      return;
                    }
                    setCustomGroups(prev => [...prev, trimmed]);
                    alert(`成功创建空白分组【${trimmed}】！`);
                    setNewGroupName('');
                  }}
                  className="px-3 py-1.5 rounded-lg font-semibold cursor-pointer active:scale-95 transition-transform"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)',
                    color: 'var(--gg-group-modal-primary-btn-text, #ffffff)',
                  }}
                >
                  创建
                </button>
              </div>
            </div>

            {/* 将联系人移入分组 (支持多分组共存) */}
            <div className="pt-2 border-t border-stone-200/40 space-y-2">
              <label 
                className="block text-[11px] font-medium"
                style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
              >
                将联系人移入分组 (可多重分组):
              </label>
              <div>
                <select
                  value={selectedContactForMove}
                  onChange={(e) => setSelectedContactForMove(e.target.value)}
                  className="w-full p-1.5 rounded-lg mb-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                    color: 'var(--gg-group-modal-input-text, #1f2937)',
                    borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)',
                  }}
                >
                  {nonGroupContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.remark || c.name} (当前组: {getContactGroups(c).join(', ')})
                    </option>
                  ))}
                </select>

                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full p-1.5 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                    color: 'var(--gg-group-modal-input-text, #1f2937)',
                    borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)',
                  }}
                >
                  <option value="">选择目标分组...</option>
                  {allGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (selectedContactForMove && targetGroup) {
                    const contact = nonGroupContacts.find(c => c.id === selectedContactForMove);
                    if (contact) {
                      const currentGrps = getContactGroups(contact);
                      if (!currentGrps.includes(targetGroup)) {
                        const updatedGrps = [...currentGrps, targetGroup];
                        onUpdateContact(selectedContactForMove, {
                          group: targetGroup, // Keep primary group updated
                          groups: updatedGrps
                        });
                        alert(`已成功将【${contact.remark || contact.name}】移入分组【${targetGroup}】（保留原有分组）！`);
                      } else {
                        alert(`该联系人已经在此分组中了！`);
                      }
                      setShowGroupModal(false);
                    }
                  }
                }}
                disabled={!targetGroup || !selectedContactForMove}
                className="w-full py-1.5 rounded-lg font-semibold disabled:opacity-50 cursor-pointer active:scale-95 transition-transform"
                style={{
                  backgroundColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)',
                  color: 'var(--gg-group-modal-primary-btn-text, #ffffff)',
                }}
              >
                确认移入分组
              </button>
            </div>

            {/* 将联系人移出分组 */}
            <div className="pt-2 border-t border-stone-200/40 space-y-2">
              <label 
                className="block text-[11px] font-medium"
                style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
              >
                将联系人移出分组:
              </label>
              <div>
                <select
                  value={selectedContactForRemove}
                  onChange={(e) => setSelectedContactForRemove(e.target.value)}
                  className="w-full p-1.5 rounded-lg mb-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                    color: 'var(--gg-group-modal-input-text, #1f2937)',
                    borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)',
                  }}
                >
                  {nonGroupContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.remark || c.name} (当前组: {getContactGroups(c).join(', ')})
                    </option>
                  ))}
                </select>

                <select
                  value={removeGroupTarget}
                  onChange={(e) => setRemoveGroupTarget(e.target.value)}
                  className="w-full p-1.5 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                    color: 'var(--gg-group-modal-input-text, #1f2937)',
                    borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)',
                  }}
                >
                  <option value="">选择要移出的分组...</option>
                  {selectedContactForRemove && getContactGroups(nonGroupContacts.find(c => c.id === selectedContactForRemove) || nonGroupContacts[0]).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (selectedContactForRemove && removeGroupTarget) {
                    const contact = nonGroupContacts.find(c => c.id === selectedContactForRemove);
                    if (contact) {
                      const currentGrps = getContactGroups(contact);
                      if (currentGrps.length <= 1) {
                        alert('联系人至少需要保留一个分组，无法全部移出！');
                        return;
                      }
                      const updatedGrps = currentGrps.filter(g => g !== removeGroupTarget);
                      onUpdateContact(selectedContactForRemove, {
                        group: updatedGrps[0],
                        groups: updatedGrps
                      });
                      alert(`已将【${contact.remark || contact.name}】移出分组【${removeGroupTarget}】！`);
                      setShowGroupModal(false);
                    }
                  }
                }}
                disabled={!removeGroupTarget || !selectedContactForRemove}
                className="w-full py-1.5 rounded-lg font-semibold disabled:opacity-50 cursor-pointer active:scale-95 transition-transform"
                style={{
                  backgroundColor: 'var(--gg-group-modal-danger-btn-bg, #ef4444)',
                  color: 'var(--gg-group-modal-danger-btn-text, #ffffff)',
                }}
              >
                确认移出分组
              </button>
            </div>

            <button
              onClick={() => setShowGroupModal(false)}
              className="w-full py-1.5 rounded-lg cursor-pointer transition-colors active:scale-95"
              style={{
                backgroundColor: 'var(--gg-group-modal-close-btn-bg, #ffffff)',
                color: 'var(--gg-group-modal-close-btn-text, #57534e)',
                border: '1px solid var(--gg-group-modal-close-btn-border, #e5e7eb)',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Safe Custom Delete Contact Modal */}
      {pendingDeleteContact && (
        <div className="fixed inset-0 z-50 bg-black/40 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[280px] bg-white rounded-2xl p-4 shadow-xl text-center animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-stone-900 mb-2">删除联系人</h3>
            <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">确定要从通讯录中删除【{pendingDeleteContact.name}】吗？相关的聊天记录与婚书也将一并清除。</p>
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
                  if (onDeleteContact) {
                    onDeleteContact(pendingDeleteContact.id);
                  }
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
  );
};
