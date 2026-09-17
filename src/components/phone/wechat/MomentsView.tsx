import React, { useState, useRef, useEffect } from 'react';
import { MomentPost, PhoneSettings, Contact, WorldBookItem } from '../../../types/phone';
import { Camera, Heart, MessageSquare, Sparkles, Image as ImageIcon, X, Settings } from 'lucide-react';
import { compressImage } from '../../../utils/image';
import { Avatar } from '../Avatar';
import { getBubbleBgStyle } from '../../../utils/bubbleStyle';

interface MomentsViewProps {
  moments: MomentPost[];
  settings: PhoneSettings;
  contacts: Contact[];
  worldBooks?: WorldBookItem[];
  onUpdateSettings: (s: Partial<PhoneSettings>) => void;
  onAddMoment: (post: Partial<MomentPost>) => void;
  onLikeMoment: (momentId: string, userName: string) => void;
  onCommentMoment: (momentId: string, comment: { authorName: string; content: string }) => void;
}

export const MomentsView: React.FC<MomentsViewProps> = ({
  moments,
  settings,
  contacts,
  worldBooks = [],
  onUpdateSettings,
  onAddMoment,
  onLikeMoment,
  onCommentMoment
}) => {
  const [showPostModal, setShowPostModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingAiPost, setIsGeneratingAiPost] = useState(false);

  const activeTheme = settings.activeDIYThemeId && settings.diyThemes
    ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
    : undefined;

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [commentInputId, setCommentInputId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<{ authorName: string } | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Handle Avatar Change
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[Avatar] 朋友圈选择个人头像文件:', file.name, file.size);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const raw = reader.result as string;
          const compressed = await compressImage(raw, 160, 160, 0.8);
          onUpdateSettings({ userAvatar: compressed });
          console.log('[Avatar] 朋友圈头像更新成功并已保存');
        } catch (err) {
          console.error('[Avatar] 朋友圈头像压缩失败:', err);
          onUpdateSettings({ userAvatar: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('更换头像失败:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Handle Cover Change
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(base64, 800, 600, 0.7);
      onUpdateSettings({ momentsCoverUrl: compressed });
    } catch (err) {
      console.error('更换封面失败:', err);
      alert('更换封面失败，请重试');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Handle Post Image Upload
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const fileList: File[] = Array.from(files);
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) {
          alert('请选择图片格式的文件（如 JPG、PNG 等）！');
          continue;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('读取图片文件失败'));
            }
          };
          reader.onerror = () => reject(reader.error || new Error('读取图片文件失败'));
          reader.readAsDataURL(file);
        });

        // Compress image using HTML Canvas to fit cleanly into state and storage
        const compressed = await compressImage(base64, 800, 800, 0.7);
        if (compressed) {
          setPostImages(prev => [...prev, compressed]);
        }
      }
    } catch (err: any) {
      console.error('朋友圈图片上传失败:', err);
      alert('图片上传处理失败，请重试');
    } finally {
      setIsUploadingImage(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Trigger AI Post for specific or random AI contact (Pure Text Only)
  const triggerAiPost = async (targetId?: string) => {
    if (isGeneratingAiPost) return;
    // Strictly exclude group chats from posting moments
    const aiContacts = contacts.filter(c => !c.isGroup && c.group !== '群聊' && !c.id.startsWith('group_') && !c.isAssistant);
    if (aiContacts.length === 0) return;

    let selectedContact = aiContacts[0];
    if (targetId && targetId !== 'random') {
      selectedContact = aiContacts.find(c => c.id === targetId) || aiContacts[0];
    } else {
      selectedContact = aiContacts[Math.floor(Math.random() * aiContacts.length)];
    }

    setIsGeneratingAiPost(true);

    // Calculate current time period in Chinese
    const hour = new Date().getHours();
    let timeOfDay = '日常';
    if (hour >= 6 && hour < 11) timeOfDay = '清晨/上午';
    else if (hour >= 11 && hour < 14) timeOfDay = '中午';
    else if (hour >= 14 && hour < 18) timeOfDay = '下午';
    else if (hour >= 18 && hour < 23) timeOfDay = '晚上';
    else timeOfDay = '深夜';

    try {
      const boundWbs = (worldBooks || []).filter(wb => 
        selectedContact.boundWorldBookIds?.includes(wb.id)
      );

      const resp = await fetch('/api/moments/generate-ai-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: selectedContact.persona,
          name: selectedContact.remark || selectedContact.name,
          group: selectedContact.group,
          worldBooks: boundWbs,
          timeOfDay
        })
      });

      const data = await resp.json();
      if (!resp.ok || !data?.content) {
        throw new Error(data?.error || 'AI 未能成功生成动态内容');
      }

      const content = data.content;

      // AI posts pure text only without any hardcoded images
      onAddMoment({
        authorId: selectedContact.id,
        authorName: selectedContact.remark || selectedContact.name,
        authorAvatar: selectedContact.avatar,
        content: content,
        images: [],
        timestamp: Date.now(),
        likes: [],
        comments: []
      });
    } catch (err: any) {
      console.error('AI 朋友圈生成失败:', err);
      showToast(`AI 发动态失败: ${err.message || '请检查API设置'}`);
    } finally {
      setIsGeneratingAiPost(false);
    }
  };

  // AI 自动发朋友圈 (支持每天一条或隔天一条，同步现实时间)
  useEffect(() => {
    if (!settings.aiAutoPostEnabled) return;

    const checkAndPost = () => {
      const now = Date.now();
      const lastTime = settings.aiAutoPostLastTime || 0;
      const intervalDays = settings.aiAutoPostInterval === 'alternate' ? 2 : 1;
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

      // If lastTime is 0 or interval elapsed:
      if (lastTime === 0 || now - lastTime >= intervalMs) {
        triggerAiPost(settings.aiAutoPostTargetContactId);
        onUpdateSettings({ aiAutoPostLastTime: now });
      }
    };

    // Check immediately on load/mount or when settings change
    checkAndPost();

    // Check every 60 seconds
    const timer = setInterval(checkAndPost, 60000);
    return () => clearInterval(timer);
  }, [
    settings.aiAutoPostEnabled, 
    settings.aiAutoPostInterval, 
    settings.aiAutoPostTargetContactId,
    settings.aiAutoPostLastTime
  ]);

  const handleAiAutoPost = () => {
    triggerAiPost(settings.aiAutoPostTargetContactId);
  };

  const effectiveMomentsBg = activeTheme?.assets?.momentsBg || activeTheme?.assets?.chatlistBg || activeTheme?.assets?.wechatBg;

  return (
    <div 
      className="h-full w-full flex flex-col select-none relative overflow-y-auto overflow-x-hidden"
      style={{
        backgroundColor: effectiveMomentsBg ? 'transparent' : 'var(--gg-moments-feed-bg, #ffffff)'
      }}
    >
      {activeTheme?.assets?.momentsBg && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={getBubbleBgStyle({
            isUser: false,
            prefix: 'moments',
            editingTheme: activeTheme,
            bubbleBgUrl: activeTheme.assets.momentsBg,
            isDot9: activeTheme?.css?.['--gg-is-dot9-momentsBg'] !== 'false',
          })}
        />
      )}
      <div className="relative z-10 flex flex-col w-full h-fit min-h-full">
      {/* Toast message */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-stone-900/90 text-white text-xs shadow-lg backdrop-blur-xs flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden cover input */}
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Header Cover & User Profile Banner */}
      <div className="relative mb-12">
        {/* Cover Image (Clickable to change) */}
        <div
          onClick={() => coverInputRef.current?.click()}
          className="h-44 w-full bg-cover bg-center cursor-pointer relative group bg-gradient-to-br from-stone-700 via-stone-800 to-stone-900"
          style={(activeTheme?.assets?.momentsCoverBg || settings.momentsCoverUrl) ? { backgroundImage: `url('${activeTheme?.assets?.momentsCoverBg || settings.momentsCoverUrl}')` } : undefined}
          title="点击更换朋友圈封面"
        >
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-[11px] text-white bg-black/60 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" /> 更换封面
            </span>
          </div>

          {/* Top Camera button to post moment */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
            {/* AI Auto-post settings button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowSettingsModal(true); }}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-sm backdrop-blur-xs cursor-pointer active:scale-95 flex items-center justify-center"
              title="AI 自动发圈设置"
            >
              {activeTheme?.assets?.momentsSettingsIcon ? (
                <img src={activeTheme.assets.momentsSettingsIcon} alt="设置" className="w-4 h-4 object-contain" />
              ) : (
                <Settings className="w-4 h-4 text-stone-600" />
              )}
            </button>

            {/* AI Auto-post button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleAiAutoPost(); }}
              className="px-2 py-1 rounded-full bg-white/80 hover:bg-white text-stone-800 text-[10px] font-semibold flex items-center gap-1 shadow-sm backdrop-blur-xs cursor-pointer active:scale-95"
              title="让 AI 随机发一条动态"
            >
              {activeTheme?.assets?.momentsAiPostIcon ? (
                <img src={activeTheme.assets.momentsAiPostIcon} alt="AI发圈" className="w-3.5 h-3.5 object-contain" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-500" />
              )}
              <span>AI 发圈</span>
            </button>

            {/* Post button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowPostModal(true); }}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-sm backdrop-blur-xs cursor-pointer active:scale-95 flex items-center justify-center"
              title="发朋友圈"
            >
              {activeTheme?.assets?.momentsPostIcon ? (
                <img src={activeTheme.assets.momentsPostIcon} alt="发朋友圈" className="w-4 h-4 object-contain" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* User Avatar & Name placed over cover edge */}
        <div className="absolute -bottom-8 right-3 flex items-end gap-2.5">
          <span className="text-sm font-bold text-white drop-shadow-md mb-2">
            {settings.userNickname}
          </span>
          <div 
            onClick={() => {
              console.log('[Avatar] 点击朋友圈个人头像，触发文件选择');
              avatarInputRef.current?.click();
            }}
            className="relative group cursor-pointer active:scale-95 transition-transform shrink-0"
            title="点击更换头像"
          >
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            <Avatar
              src={settings.userAvatar}
              name={settings.userNickname}
              className="w-16 h-16 rounded-xl border-2 border-white shadow-md bg-white"
              size={32}
            />
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Signature snippet */}
      <div className="text-right px-4 mb-4">
        <p className="text-[11px] text-stone-400 italic">
          {settings.userSignature}
        </p>
      </div>

      {/* Moments Posts List */}
      <div className="divide-y divide-stone-100 px-3 pb-8 space-y-4">
        {(Array.isArray(moments) ? moments : []).map((post) => {
          const safeLikes = Array.isArray(post.likes) ? post.likes : [];
          const safeComments = Array.isArray(post.comments) ? post.comments : [];
          const isLikedByMe = safeLikes.includes(settings.userNickname);

          return (
            <div key={post.id} className="pt-3 flex gap-2.5 p-2 rounded-xl mb-3 shadow-sm" style={{ backgroundColor: activeTheme?.css?.['--gg-moments-card-bg'] || 'transparent', color: activeTheme?.css?.['--gg-moments-text'] || undefined }}>
              {/* Author Avatar */}
              <Avatar
                src={post.authorAvatar}
                name={post.authorName}
                className="w-9 h-9 rounded-lg shrink-0 shadow-xs"
                size={18}
              />

              {/* Content Column */}
              <div className="flex-1 min-w-0">
                {/* Author Name */}
                <h5 className="font-bold text-xs text-[#576b95] leading-none mb-1">
                  {post.authorName}
                </h5>

                {/* Text Content */}
                <p className="text-xs leading-relaxed mb-2 break-words" style={{ color: activeTheme?.css?.['--gg-moments-text'] || '#292524' }}>
                  {post.content}
                </p>

                {/* Images (Rendered only when present e.g. user manual upload) */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 mb-2 max-w-[220px]">
                    {post.images.map((img, idx) => (
                      img ? (
                        <img
                          key={idx}
                          src={img}
                          alt="动态配图"
                          className="rounded-lg object-cover w-full h-24 border border-stone-200"
                        />
                      ) : null
                    ))}
                  </div>
                )}

                {/* Footer: Time + Like & Comment buttons */}
                <div className="flex items-center justify-between text-[10px] text-stone-400 mb-2">
                  <span>刚刚</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onLikeMoment(post.id, settings.userNickname)}
                      className={`flex items-center gap-1 cursor-pointer hover:text-stone-700 ${
                        isLikedByMe ? 'text-red-500 font-bold' : ''
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{safeLikes.length || '赞'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (commentInputId === post.id && !replyingToComment) {
                          setCommentInputId(null);
                          setReplyingToComment(null);
                        } else {
                          setCommentInputId(post.id);
                          setReplyingToComment(null);
                          setTimeout(() => commentInputRef.current?.focus(), 50);
                        }
                      }}
                      className="flex items-center gap-1 cursor-pointer hover:text-stone-700"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>评论</span>
                    </button>
                  </div>
                </div>

                {/* Likes Box & Comments Box */}
                {(safeLikes.length > 0 || safeComments.length > 0) && (
                  <div className="p-2 rounded-lg bg-[#f7f7f7] text-[11px] space-y-1">
                    {/* Likes line */}
                    {safeLikes.length > 0 && (
                      <div className="flex items-center gap-1 text-[#576b95] font-medium border-b border-stone-200/60 pb-1">
                        <Heart className="w-3 h-3 fill-[#576b95]" />
                        <span>{safeLikes.join(', ')}</span>
                      </div>
                    )}

                    {/* Comments list (Click to reply) */}
                    {safeComments.map((c) => {
                      const replyMatch = c.content.match(/^回复\s*@?([^:：]+)[:：]\s*(.*)$/);
                      const isReply = !!replyMatch;
                      const replyTarget = isReply ? replyMatch[1].trim() : null;
                      const actualText = isReply ? replyMatch[2] : c.content;

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setCommentInputId(post.id);
                            setReplyingToComment({ authorName: c.authorName });
                            setTimeout(() => commentInputRef.current?.focus(), 50);
                          }}
                          className="leading-snug cursor-pointer hover:bg-stone-200/50 rounded px-1 py-0.5 transition-colors"
                          title={`点击回复 @${c.authorName}`}
                        >
                          <span className="font-semibold text-[#576b95]">{c.authorName}</span>
                          {isReply && (
                            <>
                              <span className="text-stone-500 text-[10px] mx-1 font-normal">回复</span>
                              <span className="font-semibold text-[#576b95]">{replyTarget}</span>
                            </>
                          )}
                          <span className="text-stone-800 font-normal">: </span>
                          <span className="text-stone-700">{actualText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Comment Input Box */}
                {commentInputId === post.id && (
                  <div className="mt-2 space-y-1">
                    {replyingToComment && (
                      <div className="flex items-center justify-between text-[10px] text-[#576b95] px-1 font-medium">
                        <span>正在回复 @{replyingToComment.authorName}</span>
                        <button
                          onClick={() => setReplyingToComment(null)}
                          className="text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          取消回复
                        </button>
                      </div>
                    )}
                    <div className="flex gap-1.5 items-center">
                      <input
                        ref={commentInputRef}
                        type="text"
                        placeholder={replyingToComment ? `回复 @${replyingToComment.authorName}：` : "评论..."}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && commentText.trim()) {
                            const finalContent = replyingToComment
                              ? `回复 @${replyingToComment.authorName}: ${commentText.trim()}`
                              : commentText.trim();
                            onCommentMoment(post.id, {
                              authorName: settings.userNickname,
                              content: finalContent
                            });
                            setCommentText('');
                            setCommentInputId(null);
                            setReplyingToComment(null);
                          }
                        }}
                        className="flex-1 p-1.5 bg-stone-100 rounded-lg text-xs focus:outline-none focus:bg-white border border-stone-200"
                      />
                      <button
                        onClick={() => {
                          if (commentText.trim()) {
                            const finalContent = replyingToComment
                              ? `回复 @${replyingToComment.authorName}: ${commentText.trim()}`
                              : commentText.trim();
                            onCommentMoment(post.id, {
                              authorName: settings.userNickname,
                              content: finalContent
                            });
                            setCommentText('');
                            setCommentInputId(null);
                            setReplyingToComment(null);
                          }
                        }}
                        className="px-2.5 py-1 bg-[#a8b39c] text-white text-xs rounded-lg font-medium cursor-pointer"
                      >
                        发送
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 发布朋友圈弹窗 */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div 
            className="w-76 rounded-2xl p-4 shadow-2xl text-xs space-y-3 border transition-all"
            style={{
              backgroundColor: 'var(--gg-group-modal-bg, #ffffff)',
              color: 'var(--gg-group-modal-title-color, #1f2937)',
              borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
            }}
          >
            <div 
              className="flex items-center justify-between pb-2 border-b transition-colors"
              style={{ borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)' }}
            >
              <span 
                className="font-bold text-sm"
                style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}
              >
                发表文字或配图动态
              </span>
              <button onClick={() => setShowPostModal(false)}>
                <X className="w-4 h-4" style={{ color: 'var(--gg-group-modal-close-btn-text, #a8a29e)' }} />
              </button>
            </div>

            <textarea
              placeholder="这一刻的想法..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="w-full p-2 rounded-lg h-20 resize-none leading-relaxed focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all"
              style={{
                backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                color: 'var(--gg-group-modal-input-text, #1f2937)',
                borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
              }}
            />

            {/* Hidden image input */}
            <input
              type="file"
              ref={postImageInputRef}
              onChange={handlePostImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label 
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
                >
                  添加配图 (可多张):
                </label>
                <button
                  type="button"
                  onClick={() => postImageInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="flex items-center gap-1 text-[11px] font-semibold cursor-pointer hover:underline disabled:opacity-50"
                  style={{ color: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)' }}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isUploadingImage ? '处理压缩中...' : '选择图片'}</span>
                </button>
              </div>

              {/* Image previews */}
              {postImages.length > 0 && (
                <div 
                  className="grid grid-cols-3 gap-1.5 mt-1 max-h-32 overflow-y-auto p-1 rounded-lg border transition-all"
                  style={{
                    backgroundColor: 'var(--gg-group-modal-input-bg, #f9fafb)',
                    borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
                  }}
                >
                  {postImages.map((img, idx) => (
                    img ? (
                      <div key={idx} className="relative group aspect-square">
                        <img
                          src={img}
                          alt="预览"
                          className="w-full h-full object-cover rounded-md border"
                          style={{ borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="flex-1 py-1.5 rounded-lg border font-medium cursor-pointer transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--gg-group-modal-close-btn-bg, #ffffff)',
                  color: 'var(--gg-group-modal-close-btn-text, #57534e)',
                  borderColor: 'var(--gg-group-modal-close-btn-border, #e5e7eb)'
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (postText.trim() || postImages.length > 0) {
                    onAddMoment({
                      authorId: 'user',
                      authorName: settings.userNickname,
                      authorAvatar: settings.userAvatar,
                      content: postText.trim() || (postImages.length > 0 ? '分享图片' : '这一刻的想法...'),
                      images: postImages.length > 0 ? [...postImages] : undefined,
                      timestamp: Date.now(),
                      likes: [],
                      comments: []
                    });
                    setPostText('');
                    setPostImages([]);
                    setShowPostModal(false);
                  }
                }}
                disabled={(!postText.trim() && postImages.length === 0) || isUploadingImage}
                className="flex-1 py-1.5 rounded-lg font-semibold disabled:opacity-50 cursor-pointer transition-all active:scale-95 shadow-xs"
                style={{
                  backgroundColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)',
                  color: 'var(--gg-group-modal-primary-btn-text, #ffffff)'
                }}
              >
                {isUploadingImage ? '处理中...' : '发表'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 自动发圈设置弹窗 */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div 
            className="w-80 rounded-2xl p-4 shadow-2xl text-xs space-y-3.5 border transition-all"
            style={{
              backgroundColor: 'var(--gg-group-modal-bg, #ffffff)',
              color: 'var(--gg-group-modal-title-color, #1f2937)',
              borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
            }}
          >
            <div 
              className="flex items-center justify-between pb-2 border-b transition-colors"
              style={{ borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)' }}
            >
              <h4 
                className="font-bold text-sm flex items-center gap-1.5"
                style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}
              >
                <Sparkles className="w-4 h-4 text-amber-500" /> AI 自动发圈设置
              </h4>
              <button onClick={() => setShowSettingsModal(false)} className="cursor-pointer">
                <X className="w-4 h-4" style={{ color: 'var(--gg-group-modal-close-btn-text, #a8a29e)' }} />
              </button>
            </div>

            {/* 开启开关 */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold" style={{ color: 'var(--gg-group-modal-title-color, #1f2937)' }}>开启 AI 自动发圈</span>
                <p className="text-[10px]" style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}>允许 AI 角色根据设定定时自动分享动态</p>
              </div>
              <input
                type="checkbox"
                checked={!!settings.aiAutoPostEnabled}
                onChange={(e) => onUpdateSettings({ aiAutoPostEnabled: e.target.checked })}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)' }}
              />
            </div>

            {/* 选择发圈 AI */}
            <div className="space-y-1">
              <label 
                className="block text-[11px] font-medium"
                style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
              >
                指定发圈 AI 角色:
              </label>
              <select
                value={settings.aiAutoPostTargetContactId || 'random'}
                onChange={(e) => onUpdateSettings({ aiAutoPostTargetContactId: e.target.value })}
                className="w-full p-2 rounded-lg bg-white text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                  color: 'var(--gg-group-modal-input-text, #1f2937)',
                  borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
                }}
              >
                <option value="random">随机所有 AI 好友</option>
                {contacts.filter(c => !c.isGroup && c.group !== '群聊' && !c.id.startsWith('group_') && !c.isAssistant).map(c => (
                  <option key={c.id} value={c.id}>{c.remark || c.name}</option>
                ))}
              </select>
            </div>

            {/* 发圈频率 */}
            <div className="space-y-1">
              <label 
                className="block text-[11px] font-medium"
                style={{ color: 'var(--gg-group-modal-label-color, #78716c)' }}
              >
                发圈频率 (同步现实时间):
              </label>
              <select
                value={settings.aiAutoPostInterval || 'daily'}
                onChange={(e) => onUpdateSettings({ aiAutoPostInterval: e.target.value as 'daily' | 'alternate' })}
                className="w-full p-2 rounded-lg bg-white text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black border transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--gg-group-modal-input-bg, #ffffff)',
                  color: 'var(--gg-group-modal-input-text, #1f2937)',
                  borderColor: 'var(--gg-group-modal-input-border, #e5e7eb)'
                }}
              >
                <option value="daily">每天一条 (约每 24 小时)</option>
                <option value="alternate">隔天一条 (约每 48 小时)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2 rounded-lg font-semibold cursor-pointer transition-all active:scale-95 shadow-xs"
                style={{
                  backgroundColor: 'var(--gg-group-modal-primary-btn-bg, #a8b39c)',
                  color: 'var(--gg-group-modal-primary-btn-text, #ffffff)'
                }}
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
