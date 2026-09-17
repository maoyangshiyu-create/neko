import React, { useState, useMemo } from 'react';
import { Contact } from '../../../types/phone';
import { X, Check, Search, Upload, Users, Sparkles } from 'lucide-react';
import { compressImage } from '../../../utils/image';
import { Avatar } from '../Avatar';

interface CreateGroupModalProps {
  isOpen: boolean;
  contacts: Contact[];
  onClose: () => void;
  onCreateGroup: (groupData: {
    name: string;
    avatar: string;
    memberIds: string[];
    notice?: string;
  }) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  contacts,
  onClose,
  onCreateGroup
}) => {
  // Only individual friends can be selected into group
  const friendList = useMemo(() => contacts.filter(c => !c.isGroup), [contacts]);

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isCustomNameEdited, setIsCustomNameEdited] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  if (!isOpen) return null;

  // Filtered friends
  const filteredFriends = friendList.filter(f => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      (f.remark && f.remark.toLowerCase().includes(q)) ||
      f.group.toLowerCase().includes(q)
    );
  });

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    const newSelected = selectedMemberIds.includes(id)
      ? selectedMemberIds.filter(item => item !== id)
      : [...selectedMemberIds, id];

    setSelectedMemberIds(newSelected);

    // Auto update suggested group name if user hasn't manually customized it
    if (!isCustomNameEdited) {
      const selectedNames = friendList
        .filter(f => newSelected.includes(f.id))
        .map(f => f.remark || f.name);
      if (selectedNames.length > 0) {
        setGroupName(`${selectedNames.slice(0, 3).join('、')} 的群聊`);
      } else {
        setGroupName('');
      }
    }
  };

  // Upload image from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result, 120, 120, 0.7);
          setSelectedAvatarUrl(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmCreate = () => {
    if (selectedMemberIds.length === 0) {
      alert('请至少选择 1 位好友加入群聊！');
      return;
    }

    const finalName = groupName.trim() || `${friendList.find(f => f.id === selectedMemberIds[0])?.name || '好友'} 等人的群聊`;
    const finalAvatar = customAvatarInput.trim() || selectedAvatarUrl;

    onCreateGroup({
      name: finalName,
      avatar: finalAvatar,
      memberIds: selectedMemberIds,
      notice: `欢迎各位加入【${finalName}】，请遵守群秩序，友善交流！`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border transition-all text-xs"
        style={{
          backgroundColor: 'var(--gg-group-modal-bg, #ffffff)',
          color: 'var(--gg-group-modal-title-color, #1f2937)',
          borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 border-b flex items-center justify-between shrink-0 transition-colors"
          style={{
            backgroundColor: 'var(--gg-group-modal-bg, #ededed)',
            borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs transition-colors"
              style={{
                backgroundColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)',
                color: 'var(--gg-group-modal-primary-btn-text, #ffffff)'
              }}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 
                className="font-bold text-sm"
                style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}
              >
                发起群聊
              </h3>
              <p 
                className="text-[10px]"
                style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
              >
                挑选好友组成多角色微信群聊
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full cursor-pointer transition-colors opacity-80 hover:opacity-100"
            style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Step 1: Group Name & Avatar Customization */}
          <div 
            className="border rounded-xl p-3 space-y-3 transition-colors"
            style={{
              backgroundColor: 'var(--gg-group-modal-input-bg, #f9fafb)',
              borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
            }}
          >
            <div className="flex items-center gap-3">
              {/* Group Avatar Preview & Picker */}
              <div className="relative group shrink-0">
                <Avatar 
                  src={selectedAvatarUrl} 
                  name="群头像"
                  className="w-13 h-13 rounded-xl border shadow-xs transition-colors"
                  style={{
                    borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)',
                    backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)'
                  }}
                  size={24}
                />
                <label 
                  htmlFor="group-avatar-upload"
                  className="absolute inset-0 bg-black/40 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  title="上传自定义群头像"
                >
                  <Upload className="w-4 h-4" />
                </label>
                <input 
                  type="file" 
                  id="group-avatar-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Group Name Input */}
              <div className="flex-1 min-w-0">
                <label 
                  className="block text-[11px] font-semibold mb-1"
                  style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
                >
                  自定义群聊名称
                </label>
                <input 
                  type="text"
                  placeholder="输入群聊名称，如：摸鱼交流群"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setIsCustomNameEdited(true);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                    color: 'var(--gg-group-modal-input-text, #1f2937)',
                    borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
                  }}
                />
              </div>
            </div>

            {/* Custom Group Avatar Upload Button */}
            <div 
              className="pt-1 flex items-center justify-between text-[11px]"
              style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
            >
              <span>自定义群头像</span>
              <label 
                htmlFor="group-avatar-upload" 
                className="px-2.5 py-1 rounded-lg font-medium text-[11px] cursor-pointer flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                style={{
                  backgroundColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)',
                  color: 'var(--gg-group-modal-primary-btn-text, #ffffff)'
                }}
              >
                <Upload className="w-3 h-3" />
                <span>上传图片</span>
              </label>
            </div>
          </div>

          {/* Step 2: Friend Selection (可以选择几个好友) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span 
                className="font-bold text-xs flex items-center gap-1.5"
                style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}
              >
                <span>选择好友进群</span>
                <span 
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)',
                    color: 'var(--gg-group-modal-primary-btn-text, #ffffff)',
                    opacity: 0.9
                  }}
                >
                  已选 {selectedMemberIds.length} 人
                </span>
              </span>
              {selectedMemberIds.length > 0 && (
                <button 
                  onClick={() => setSelectedMemberIds([])}
                  className="text-[10px] cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
                >
                  清空已选
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }} />
              <input 
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索好友昵称、备注或分组..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs placeholder:opacity-60 focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black border transition-all"
                style={{
                  backgroundColor: 'var(--gg-group-modal-input-bg, #f3f4f6)',
                  color: 'var(--gg-group-modal-input-text, #1f2937)',
                  borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
                }}
              />
            </div>

            {/* Friend List with Checkboxes */}
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs">
                  未匹配到相关好友
                </div>
              ) : (
                filteredFriends.map(friend => {
                  const isSelected = selectedMemberIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => handleToggleSelect(friend.id)}
                      className="flex items-center justify-between p-2 rounded-xl cursor-pointer border transition-all"
                      style={{
                        backgroundColor: isSelected ? 'var(--gg-group-modal-input-bg, #f3f4f6)' : 'var(--gg-group-modal-input-bg, #ffffff)',
                        borderColor: isSelected ? 'var(--gg-group-modal-primary-btn-bg, #a8b39c)' : 'var(--gg-group-modal-input-border, #e5e7eb)',
                        color: 'var(--gg-group-modal-input-text, #1f2937)'
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Checkbox circle */}
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center border transition-all"
                          style={{
                            backgroundColor: isSelected ? 'var(--gg-group-modal-primary-btn-bg, #a8b39c)' : 'var(--gg-group-modal-input-bg, #ffffff)',
                            borderColor: isSelected ? 'var(--gg-group-modal-primary-btn-bg, #a8b39c)' : 'var(--gg-group-modal-input-border, #e5e7eb)',
                            color: 'var(--gg-group-modal-primary-btn-text, #ffffff)'
                          }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>

                        {/* Avatar */}
                        <Avatar
                          src={friend.avatar}
                          className="w-8 h-8 rounded-full border border-stone-200 shrink-0"
                          size={16}
                        />

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-stone-900 truncate flex items-center gap-1.5">
                            <span>{friend.remark || friend.name}</span>
                            {friend.remark && friend.remark !== friend.name && (
                              <span className="text-[10px] font-normal text-stone-400">({friend.name})</span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-400 truncate max-w-[170px]">
                            {friend.persona?.slice(0, 24) || '微信好友'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 shrink-0">
                        {friend.group || '好友'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="px-4 py-3 border-t flex items-center justify-between shrink-0 transition-colors"
          style={{
            backgroundColor: 'var(--gg-group-modal-bg, #f9fafb)',
            borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
          }}
        >
          <div 
            className="text-[11px]"
            style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
          >
            {selectedMemberIds.length > 0 ? (
              <span>包含你共 <strong style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}>{selectedMemberIds.length + 1}</strong> 人进群</span>
            ) : (
              <span>请至少勾选 1 位好友</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--gg-group-modal-close-btn-bg, #ffffff)',
                color: 'var(--gg-group-modal-close-btn-text, #57534e)',
                borderColor: 'var(--gg-group-modal-close-btn-border, #d8d3c9)'
              }}
            >
              取消
            </button>
            <button
              onClick={handleConfirmCreate}
              disabled={selectedMemberIds.length === 0}
              className="px-4 py-1.5 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-95 transition-all"
              style={{
                backgroundColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)',
                color: 'var(--gg-group-modal-primary-btn-text, #ffffff)'
              }}
            >
              立即创建 ({selectedMemberIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
