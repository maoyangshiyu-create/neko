import React, { useState, useRef } from 'react';
import { PhoneSettings, FavoriteItem, StickerItem, ChatMessage, MarriageRecord, Contact } from '../../../types/phone';
import { 
  QrCode, 
  ChevronRight, 
  CreditCard, 
  Bookmark, 
  Smile, 
  Camera,
  Search,
  Trash2,
  X,
  PlusCircle,
  FileText,
  Heart,
  Plus,
  Edit,
  Volume2,
  VolumeX,
  FolderOpen,
  FolderHeart
} from 'lucide-react';
import { compressImage } from '../../../utils/image';
import { Avatar } from '../Avatar';
import { MarriageCertificateModal } from '../MarriageCertificateModal';
import { playVoice, isTtsConfigured, stopAllActiveAudio } from '../../../services/aiService';

interface MeViewProps {
  settings: PhoneSettings;
  onUpdateSettings: (s: Partial<PhoneSettings>) => void;
  onOpenSettingsApp?: () => void;
  favorites?: FavoriteItem[];
  stickers?: StickerItem[];
  onUpdateStickers?: (stickers: StickerItem[]) => void;
  onToggleFavorite?: (msg: ChatMessage, senderName: string, senderAvatar: string) => void;
  hasWechatBg?: boolean;
  contacts?: Contact[];
}

export const MeView: React.FC<MeViewProps> = ({
  settings,
  onUpdateSettings,
  favorites = [],
  stickers = [],
  onUpdateStickers,
  onToggleFavorite,
  hasWechatBg = false,
  contacts = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(settings.userNickname);
  const [signature, setSignature] = useState(settings.userSignature);
  const [userPatSuffix, setUserPatSuffix] = useState(settings.userPatSuffix || '');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Modal control states
  const [showFavorites, setShowFavorites] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showMarriages, setShowMarriages] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<MarriageRecord | null>(null);

  // Search filter states
  const [favSearchQuery, setFavSearchQuery] = useState('');
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');

  // Voice playback state
  const [playingFavId, setPlayingFavId] = useState<string | null>(null);

  // Sticker grouping states
  const [activeStickerGroup, setActiveStickerGroup] = useState<string>('全部');
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [customGroups, setCustomGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wechat_sticker_custom_groups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Batch import state
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importGroup, setImportGroup] = useState('未分组');

  // Gather existing groups from stickers and customGroups
  const stickerAssignedGroups = stickers
    .map(s => s.group)
    .filter((g): g is string => Boolean(g && g.trim() !== ''));

  const existingGroups = Array.from(
    new Set([...stickerAssignedGroups, ...customGroups])
  );

  const handleAvatarClick = () => {
    console.log('[Avatar] 点击微信个人头像，触发文件选择');
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[Avatar] 微信选择个人头像文件:', file.name, file.size);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImage(raw, 160, 160, 0.8);
        onUpdateSettings({ userAvatar: compressed });
        console.log('[Avatar] 个人头像更新成功并已保存');
      } catch (err) {
        console.error('[Avatar] 个人头像压缩或保存失败:', err);
        onUpdateSettings({ userAvatar: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Play voice message from favorites
  const handlePlayFavoriteVoice = async (fav: FavoriteItem) => {
    if (playingFavId === fav.id) {
      stopAllActiveAudio();
      setPlayingFavId(null);
      return;
    }

    if (!isTtsConfigured(settings)) {
      alert('未设置TTS语音服务，无法播放声音。可前往【系统设置 → TTS】配置API接口。');
      return;
    }

    setPlayingFavId(fav.id);
    try {
      let timbreToUse = '';
      if (fav.senderName === settings.userNickname) {
        timbreToUse = (settings.ttsVoiceId || '').trim();
      } else if (contacts && contacts.length > 0) {
        const match = contacts.find(c => (c.remark || c.name) === fav.senderName || c.name === fav.senderName);
        timbreToUse = (match?.voiceTimbre || '').trim();
      }

      if (!timbreToUse) {
        timbreToUse = 'male-pure'; // Default fallback
      }

      await playVoice({
        text: fav.content,
        voiceTimbre: timbreToUse,
        settings
      });
    } catch (err: any) {
      console.error('TTS playback error inside favorites:', err);
    } finally {
      setPlayingFavId(null);
    }
  };

  // Handle batch import logic with grouping support
  const handleBatchImportSubmit = () => {
    setImportError('');
    if (!importText.trim()) {
      setImportError('请输入导入文本');
      return;
    }

    const lines = importText.split('\n');
    const newStickers: StickerItem[] = [];
    let successCount = 0;

    const targetGroup = importGroup === '未分组' ? undefined : importGroup;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Split by space
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const name = parts[0];
        const url = parts.slice(1).join('');
        if (url.startsWith('http://') || url.startsWith('https://')) {
          newStickers.push({
            id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name,
            url,
            group: targetGroup
          });
          successCount++;
        }
      }
    });

    if (newStickers.length > 0) {
      onUpdateStickers?.([...stickers, ...newStickers]);
      setImportText('');
      setIsImporting(false);
    } else {
      setImportError('未找到符合格式 "名称 http(s)://图片链接" 的行');
    }
  };

  // Create a new empty group (can be assigned later or used in import)
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const name = newGroupName.trim();
    if (name === '全部' || name === '未分组') {
      alert('无法创建系统保留字的分组名称');
      return;
    }
    if (!customGroups.includes(name)) {
      const updated = [...customGroups, name];
      setCustomGroups(updated);
      localStorage.setItem('wechat_sticker_custom_groups', JSON.stringify(updated));
    }
    // Set active group to it so they can view/import to it
    setActiveStickerGroup(name);
    setNewGroupName('');
    setShowAddGroupInput(false);
  };

  // Rename a sticker group
  const handleRenameGroup = () => {
    if (!renameInputValue.trim() || !editingGroupName) return;
    const oldName = editingGroupName;
    const newName = renameInputValue.trim();
    if (newName === '全部' || newName === '未分组') {
      alert('不能重命名为系统保留字名称');
      return;
    }

    const updatedCustom = customGroups.map(g => g === oldName ? newName : g);
    if (!updatedCustom.includes(newName)) {
      updatedCustom.push(newName);
    }
    const finalCustom = Array.from(new Set(updatedCustom));
    setCustomGroups(finalCustom);
    localStorage.setItem('wechat_sticker_custom_groups', JSON.stringify(finalCustom));

    const updated = stickers.map(s => 
      s.group === oldName ? { ...s, group: newName } : s
    );
    onUpdateStickers?.(updated);
    setActiveStickerGroup(newName);
    setEditingGroupName(null);
    setRenameInputValue('');
  };

  // Delete a group (stickers are moved back to ungrouped)
  const handleDeleteGroup = (groupName: string) => {
    if (groupName === '全部' || groupName === '未分组') return;
    if (confirm(`确定要解散分组【${groupName}】吗？组内表情包将被归类到【未分组】。`)) {
      const updatedCustom = customGroups.filter(g => g !== groupName);
      setCustomGroups(updatedCustom);
      localStorage.setItem('wechat_sticker_custom_groups', JSON.stringify(updatedCustom));

      const updated = stickers.map(s => 
        s.group === groupName ? { ...s, group: undefined } : s
      );
      onUpdateStickers?.(updated);
      setActiveStickerGroup('全部');
    }
  };

  // Move a specific sticker to another group
  const handleMoveSticker = (stickerId: string, destGroup: string) => {
    if (destGroup === '_CREATE_NEW_') {
      const name = prompt('输入要创建的新分组名称:');
      if (!name || !name.trim()) return;
      const trimmed = name.trim();
      if (trimmed === '全部' || trimmed === '未分组') {
        alert('无法创建系统保留字的分组名称');
        return;
      }
      if (!customGroups.includes(trimmed)) {
        const updatedCustom = [...customGroups, trimmed];
        setCustomGroups(updatedCustom);
        localStorage.setItem('wechat_sticker_custom_groups', JSON.stringify(updatedCustom));
      }
      const updated = stickers.map(s => 
        s.id === stickerId ? { ...s, group: trimmed } : s
      );
      onUpdateStickers?.(updated);
      setActiveStickerGroup(trimmed);
      return;
    }
    const updated = stickers.map(s => 
      s.id === stickerId ? { ...s, group: destGroup === '未分组' ? undefined : destGroup } : s
    );
    onUpdateStickers?.(updated);
  };

  // Filtered lists
  const filteredFavorites = favorites.filter(fav => 
    fav.content.toLowerCase().includes(favSearchQuery.toLowerCase()) ||
    fav.senderName.toLowerCase().includes(favSearchQuery.toLowerCase())
  );

  // Filter stickers by active group and search query
  const filteredStickers = stickers.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(stickerSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeStickerGroup === '全部') {
      return true;
    } else if (activeStickerGroup === '未分组') {
      return !st.group;
    } else {
      return st.group === activeStickerGroup;
    }
  });

  return (
    <div className={`h-full w-full select-none overflow-y-auto ${hasWechatBg ? 'bg-transparent' : 'bg-[#ededed]'}`}>
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Card */}
      <div className={`${hasWechatBg ? 'bg-white/85 backdrop-blur-xs' : 'bg-white'} p-4 mb-2 flex items-center gap-3.5`}>
        <div 
          onClick={handleAvatarClick}
          className="relative group cursor-pointer active:scale-95 transition-transform shrink-0"
          title="点击更换我的头像"
        >
          <Avatar
            src={settings.userAvatar}
            name={settings.userNickname}
            className="w-14 h-14 rounded-xl border border-stone-200 shadow-xs"
            size={28}
          />
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-stone-800/80 text-white shadow-xs pointer-events-none">
            <Camera className="w-2.5 h-2.5" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-stone-900 truncate">
            {settings.userNickname}
          </h4>
          <p className="text-[11px] text-stone-400 mt-0.5">
            微信号: we_ai_traveler
          </p>
          <p className="text-[10px] text-stone-500 truncate mt-1">
            {settings.userSignature || '暂无个性签名'}
          </p>
        </div>
        <div className="flex items-center gap-1 text-stone-400">
          <QrCode className="w-4 h-4" />
          <button
            onClick={() => setIsEditing(true)}
            className="text-[11px] font-medium ml-1 cursor-pointer hover:underline transition-colors"
            style={{ color: 'var(--gg-group-btn-color, #a8b39c)' }}
          >
            编辑
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-72 bg-white rounded-2xl p-4 shadow-2xl text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-bold text-sm text-stone-800">编辑个人名片</h4>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">昵称:</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">个性签名:</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full p-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">我的拍一拍后缀 (如: 的小脑袋):</label>
              <input
                type="text"
                value={userPatSuffix}
                placeholder="留空则只显示名字"
                onChange={(e) => setUserPatSuffix(e.target.value)}
                className="w-full p-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onUpdateSettings({ userNickname: nickname, userSignature: signature, userPatSuffix: userPatSuffix.trim() });
                  setIsEditing(false);
                }}
                className="flex-1 py-1.5 rounded-lg text-white font-semibold cursor-pointer transition-colors active:scale-95"
                style={{ backgroundColor: 'var(--gg-group-btn-color, #a8b39c)' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Group 1: 微信支付 */}
      <div className={`${hasWechatBg ? 'bg-white/85 backdrop-blur-xs' : 'bg-white'} mb-2 divide-y divide-stone-100`}>
        <div className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 cursor-pointer">
          <div className="flex items-center gap-3 text-xs text-stone-800">
            <CreditCard className="w-4 h-4" style={{ color: 'var(--gg-group-btn-color, #a8b39c)' }} />
            <span>服务 (微信支付 / 钱包)</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        </div>
      </div>

      {/* Item Group 2: 收藏、表情 (已完全移除婚姻档案与婚书一栏) */}
      <div className={`${hasWechatBg ? 'bg-white/85 backdrop-blur-xs' : 'bg-white'} mb-2 divide-y divide-stone-100`}>
        <div 
          onClick={() => setShowFavorites(true)}
          className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 cursor-pointer"
        >
          <div className="flex items-center gap-3 text-xs text-stone-800">
            <Bookmark className="w-4 h-4 text-orange-500" />
            <span>收藏与笔记</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        </div>
        <div 
          onClick={() => setShowStickers(true)}
          className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 cursor-pointer"
        >
          <div className="flex items-center gap-3 text-xs text-stone-800">
            <Smile className="w-4 h-4 text-amber-500" />
            <span>表情与动态包</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        </div>
      </div>

      {/* Favorites Modal (支持语音播放) */}
      {showFavorites && (
        <div className="fixed inset-0 z-50 bg-stone-100 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="h-11 px-3 bg-[#ededed] border-b border-stone-300 flex items-center justify-between shrink-0">
            <button 
              onClick={() => { setShowFavorites(false); setFavSearchQuery(''); stopAllActiveAudio(); setPlayingFavId(null); }}
              className="flex items-center gap-0.5 text-stone-800 text-xs font-medium cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>关闭</span>
            </button>
            <span className="font-bold text-xs text-stone-900">我的收藏</span>
            <div className="w-8"></div>
          </div>

          {/* Search Bar */}
          <div className="p-2 bg-white border-b border-stone-200">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={favSearchQuery}
                onChange={(e) => setFavSearchQuery(e.target.value)}
                placeholder="搜索收藏内容或发送人"
                className="w-full bg-stone-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:bg-stone-100/60"
              />
            </div>
          </div>

          {/* Favorites List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredFavorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">暂无收藏内容</p>
              </div>
            ) : (
              filteredFavorites.map(fav => (
                <div key={fav.id} className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar src={fav.senderAvatar} name={fav.senderName} className="w-5 h-5 rounded-md" size={12} />
                      <span className="text-[11px] font-semibold text-stone-700">{fav.senderName}</span>
                    </div>
                    <button
                      onClick={() => onToggleFavorite?.({ id: fav.id } as ChatMessage, '', '')}
                      className="text-stone-400 hover:text-red-500 cursor-pointer p-1 rounded-lg hover:bg-stone-50 transition-colors"
                      title="取消收藏"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-stone-950 whitespace-pre-wrap break-all bg-stone-50/50 p-2 rounded-lg border border-stone-100">
                    {fav.type === 'sticker' || fav.type === 'image' ? (
                      <div className="space-y-1">
                        {fav.content ? (
                          <img 
                            src={fav.content} 
                            alt="收藏图片" 
                            className="max-h-24 rounded-lg object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <p className="text-[10px] text-stone-400">[图片/表情]</p>
                      </div>
                    ) : fav.type === 'voice' ? (
                      <div 
                        onClick={() => handlePlayFavoriteVoice(fav)}
                        className={`flex items-center justify-between p-2 rounded-lg border border-stone-200 bg-stone-100/50 hover:bg-stone-100 active:scale-98 transition-all cursor-pointer ${playingFavId === fav.id ? 'border-amber-300 ring-2 ring-amber-200' : ''}`}
                        title="点击播放/停止语音"
                      >
                        <div className="flex items-center gap-2 text-stone-700">
                          {playingFavId === fav.id ? (
                            <>
                              <Volume2 className="w-4 h-4 text-rose-500 animate-bounce" />
                              <span className="text-xs font-semibold text-rose-600">正在播放...</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4 text-[#a8b39c]" />
                              <span className="text-xs">播放语音消息</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">({fav.content || '语音'})</span>
                      </div>
                    ) : (
                      fav.content
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400 text-right">
                    收藏于 {new Date(fav.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stickers Management Modal (支持高级分组管理与组命名) */}
      {showStickers && (
        <div className="fixed inset-0 z-50 bg-stone-100 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="h-11 px-3 bg-[#ededed] border-b border-stone-300 flex items-center justify-between shrink-0">
            <button 
              onClick={() => { setShowStickers(false); setStickerSearchQuery(''); setIsImporting(false); }}
              className="flex items-center gap-0.5 text-stone-800 text-xs font-medium cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>关闭</span>
            </button>
            <span className="font-bold text-xs text-stone-900">表情包管理</span>
            <button
              onClick={() => { setIsImporting(!isImporting); setImportError(''); }}
              className="text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
              style={{ color: 'var(--gg-group-btn-color, #a8b39c)' }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>导入</span>
            </button>
          </div>

          {/* Import Panel */}
          {isImporting && (
            <div className="p-3 bg-white border-b border-stone-200 space-y-2.5 animate-in slide-in-from-top duration-150">
              <h5 className="font-bold text-[11px] text-stone-800">批量导入表情包</h5>
              <p className="text-[10px] text-stone-400 leading-tight">
                格式：一行一个，名称与URL之间用空格隔开。例如：<br />
                <code className="bg-stone-50 px-1 py-0.5 rounded text-stone-600 font-mono">
                  大笑 https://example.com/laugh.gif
                </code>
              </p>
              
              {/* Import Group Choice */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500 text-[10px]">导入到分组:</span>
                <select
                  value={importGroup}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '_CREATE_NEW_') {
                      const name = prompt('输入要创建的新分组名称:');
                      if (!name || !name.trim()) return;
                      const trimmed = name.trim();
                      if (trimmed === '全部' || trimmed === '未分组') {
                        alert('无法创建系统保留字的分组名称');
                        return;
                      }
                      if (!customGroups.includes(trimmed)) {
                        const updatedCustom = [...customGroups, trimmed];
                        setCustomGroups(updatedCustom);
                        localStorage.setItem('wechat_sticker_custom_groups', JSON.stringify(updatedCustom));
                      }
                      setImportGroup(trimmed);
                      setActiveStickerGroup(trimmed);
                    } else {
                      setImportGroup(val);
                    }
                  }}
                  className="p-1 border border-stone-200 rounded text-xs bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black cursor-pointer"
                >
                  <option value="未分组">未分组</option>
                  {existingGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="_CREATE_NEW_">+ 新增分组...</option>
                </select>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={3}
                placeholder="名称 http://图片链接&#10;名称 http://图片链接"
                className="w-full p-2 border border-stone-200 rounded-lg text-xs font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-stone-50"
              />
              {importError && (
                <p className="text-[10px] text-red-500 font-medium">{importError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsImporting(false); setImportError(''); }}
                  className="flex-1 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 text-[11px] font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchImportSubmit}
                  className="flex-1 py-1.5 rounded-lg text-white text-[11px] font-semibold cursor-pointer transition-colors"
                  style={{ backgroundColor: 'var(--gg-group-btn-color, #a8b39c)' }}
                >
                  确认导入
                </button>
              </div>
            </div>
          )}

          {/* Group Management Toolbar & Tab Scrolling List */}
          <div className="bg-white px-3 py-2 border-b border-stone-200/80 flex flex-col gap-2 shrink-0">
            {/* Create Group Box */}
            {showAddGroupInput ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-top duration-100">
                <input
                  type="text"
                  placeholder="输入新分组名称..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                  className="flex-1 p-1 border border-stone-200 rounded text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
                <button
                  onClick={handleCreateGroup}
                  className="px-2.5 py-1 text-white rounded text-xs font-bold cursor-pointer transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--gg-group-btn-color, #a8b39c)' }}
                >
                  确定
                </button>
                <button
                  onClick={() => { setShowAddGroupInput(false); setNewGroupName(''); }}
                  className="px-2.5 py-1 border border-stone-200 rounded text-stone-500 text-xs hover:bg-stone-50 cursor-pointer"
                >
                  取消
                </button>
              </div>
            ) : editingGroupName ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-top duration-100">
                <span className="text-stone-400 text-[10px]">重命名【{editingGroupName}】:</span>
                <input
                  type="text"
                  value={renameInputValue}
                  onChange={(e) => setRenameInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup()}
                  className="flex-1 p-1 border border-stone-200 rounded text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
                <button
                  onClick={handleRenameGroup}
                  className="px-2.5 py-1 text-white rounded text-xs font-bold cursor-pointer transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--gg-group-btn-color, #a8b39c)' }}
                >
                  更名
                </button>
                <button
                  onClick={() => { setEditingGroupName(null); setRenameInputValue(''); }}
                  className="px-2.5 py-1 border border-stone-200 rounded text-stone-500 text-xs hover:bg-stone-50 cursor-pointer"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-500 text-[10px] flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>分组筛选 & 管理</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAddGroupInput(true)}
                    className="text-[10px] px-2 py-0.5 rounded border border-stone-200 hover:border-stone-400 text-stone-600 bg-stone-50 hover:bg-stone-100 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新建分组</span>
                  </button>
                  {activeStickerGroup !== '全部' && activeStickerGroup !== '未分组' && (
                    <>
                      <button
                        onClick={() => {
                          setEditingGroupName(activeStickerGroup);
                          setRenameInputValue(activeStickerGroup);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded border border-stone-200 hover:border-stone-400 text-stone-600 bg-stone-50 hover:bg-stone-100 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit className="w-2.5 h-2.5" />
                        <span>重命名</span>
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(activeStickerGroup)}
                        className="text-[10px] px-2 py-0.5 rounded border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>删除组</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Horizontal Scroll Group Selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
              {['全部', '未分组', ...existingGroups].map((grp) => {
                const isActive = activeStickerGroup === grp;
                return (
                  <button
                    key={grp}
                    onClick={() => {
                      setActiveStickerGroup(grp);
                      setEditingGroupName(null);
                      setShowAddGroupInput(false);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
                      isActive 
                        ? 'text-white shadow-xs' 
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                    style={isActive ? { backgroundColor: 'var(--gg-group-btn-color, #a8b39c)' } : undefined}
                  >
                    {grp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar */}
          {!isImporting && (
            <div className="p-2 bg-white border-b border-stone-200">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={stickerSearchQuery}
                  onChange={(e) => setStickerSearchQuery(e.target.value)}
                  placeholder={`在【${activeStickerGroup}】中搜索表情包...`}
                  className="w-full bg-stone-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:bg-stone-100/60"
                />
              </div>
            </div>
          )}

          {/* Sticker Grid (With Individual Move Option) */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredStickers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                <Smile className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">该分组下暂无表情包</p>
                <p className="text-[10px] text-stone-400/80 mt-1">点击右上角「导入」或选择表情移动至此</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3">
                {filteredStickers.map(st => (
                  <div key={st.id} className="relative group bg-white rounded-xl p-2 border border-stone-200/60 flex flex-col items-center justify-between shadow-2xs">
                    {st.url ? (
                      <img
                        src={st.url}
                        alt={st.name}
                        className="w-full aspect-square object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center text-[10px] text-stone-400">
                        无图
                      </div>
                    )}
                    
                    {/* Sticker Name */}
                    <span className="text-[10px] text-stone-700 truncate w-full text-center mt-1.5 font-bold">{st.name}</span>
                    
                    {/* Move to another group selector */}
                    <div className="w-full mt-1.5 pt-1 border-t border-stone-100">
                      <select
                        value={st.group || '未分组'}
                        onChange={(e) => handleMoveSticker(st.id, e.target.value)}
                        className="w-full p-0.5 border border-stone-200 rounded text-[9px] bg-stone-50 text-stone-500 cursor-pointer text-center"
                        title="移动分组"
                      >
                        <option value="未分组">未分组</option>
                        {existingGroups.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                        <option value="_CREATE_NEW_">+ 新增分组...</option>
                      </select>
                    </div>

                    <button
                      onClick={() => onUpdateStickers?.(stickers.filter(s => s.id !== st.id))}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full shadow-md active:scale-90 transition-transform cursor-pointer"
                      title="删除表情"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Marriages Archive Modal (保持兼容但没有入口) */}
      {showMarriages && (
        <div className="fixed inset-0 z-50 bg-stone-100 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="h-11 px-3 bg-[#ededed] border-b border-stone-300 flex items-center justify-between shrink-0">
            <button 
              onClick={() => setShowMarriages(false)}
              className="flex items-center gap-0.5 text-stone-800 text-xs font-medium cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>返回</span>
            </button>
            <span className="text-xs font-bold text-stone-800">婚姻档案与婚书</span>
            <div className="w-8" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(!settings.marriages || settings.marriages.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-stone-400">
                <Heart className="w-12 h-12 stroke-[1.5] mb-2 opacity-30 text-rose-500" />
                <p className="text-xs">暂无已缔结的婚姻记录</p>
                <p className="text-[11px] mt-1 text-stone-400">在好友聊天中求婚并完成婚礼仪式后，婚书将永久珍藏在此处</p>
              </div>
            ) : (
              settings.marriages.map((m) => (
                <div 
                  key={m.certificateId}
                  onClick={() => setActiveCertificate(m)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100 hover:border-rose-300 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-rose-400 to-amber-300">
                      <Avatar src={m.partnerAvatar} className="w-full h-full rounded-full" size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">{m.partnerName}</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded-full font-medium">已结为夫妻</span>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1 font-mono">
                        结婚日期：{m.marryDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-rose-600 text-[11px] font-medium">
                    <span>查看婚书</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Active Marriage Certificate Modal */}
      {activeCertificate && (
        <MarriageCertificateModal
          certificate={activeCertificate}
          settings={settings}
          onClose={() => setActiveCertificate(null)}
          actionText="收纳婚书"
        />
      )}

      {/* Footer hint: settings only available on desktop */}
      <div className="px-4 py-3 text-center text-[11px] text-stone-400">
        API 与 AI 模型等参数请在主屏幕「设置」应用中配置
      </div>
    </div>
  );
};
