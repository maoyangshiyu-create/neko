import React, { useState, useEffect } from 'react';
import { WeChatTab, Contact, ChatMessage, WorldBookItem, PhoneSettings, MomentPost, FavoriteItem, StickerItem, ContactMemory } from '../../../types/phone';
import { getBubbleBgStyle } from '../../../utils/bubbleStyle';
import { ChatList } from './ChatList';
import { ChatRoom } from './ChatRoom';
import { ContactsView } from './ContactsView';
import { MomentsView } from './MomentsView';
import { MeView } from './MeView';
import { 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  MessageCircle, 
  Users, 
  Compass, 
  User, 
  Camera
} from 'lucide-react';

interface WeChatAppProps {
  onReturnToDesktop: () => void;
  contacts: Contact[];
  messages: Record<string, ChatMessage[]>;
  worldBooks: WorldBookItem[];
  settings: PhoneSettings;
  moments: MomentPost[];
  onUpdateSettings: (s: Partial<PhoneSettings>) => void;
  onSendMessage: (contactId: string, msg: Partial<ChatMessage>) => void;
  onDeleteMessage?: (contactId: string, messageId: string) => void;
  onEditMessage?: (contactId: string, messageId: string, newContent: string) => void;
  onUpdateMessage?: (contactId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  onRecallMessage?: (contactId: string, messageId: string) => void;
  onAddContact: (contact: Partial<Contact>) => void;
  onUpdateContact: (contactId: string, updates: Partial<Contact>) => void;
  onDeleteContact: (contactId: string) => void;
  onAddMoment: (post: Partial<MomentPost>) => void;
  onLikeMoment: (momentId: string, userName: string) => void;
  onCommentMoment: (momentId: string, comment: { authorName: string; content: string }) => void;
  onOpenSettingsApp: () => void;
  onActiveContactChange?: (contactId: string | null) => void;
  initialActiveContactId?: string | null;
  favorites?: FavoriteItem[];
  stickers?: StickerItem[];
  onUpdateStickers?: (stickers: StickerItem[]) => void;
  onToggleFavorite?: (msg: ChatMessage, senderName: string, senderAvatar: string) => void;
  contactMemories?: Record<string, ContactMemory>;
  onUpdateContactMemory?: (contactId: string, memory: ContactMemory) => void;
}

const RenderTabIconItem: React.FC<{
  active: boolean;
  customIcon?: string;
  defaultIcon: React.ReactNode;
  fogColor?: string;
  badge?: React.ReactNode;
}> = ({ active, customIcon, defaultIcon, fogColor, badge }) => {
  const effectiveFog = fogColor || (customIcon ? 'rgba(7, 193, 96, 0.25)' : undefined);

  return (
    <div className="relative flex items-center justify-center shrink-0 w-5 h-5">
      {/* 模糊圆形雾 (仅在该标签被选中时显示) */}
      {active && effectiveFog && effectiveFog !== 'transparent' && effectiveFog !== 'none' && (
        <div
          className="absolute rounded-full pointer-events-none transition-all duration-300 z-0"
          style={{
            width: '22px',
            height: '22px',
            backgroundColor: effectiveFog,
            filter: 'blur(5px)',
            opacity: 0.95,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* 自定义贴图图标（不覆盖文字，等比例缩小，图标本身保持原色） */}
      {customIcon ? (
        <img
          src={customIcon}
          alt="Tab Icon"
          className="w-5 h-5 object-contain relative z-10 shrink-0 pointer-events-none"
        />
      ) : (
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {defaultIcon}
        </div>
      )}

      {badge}
    </div>
  );
};

export const WeChatApp: React.FC<WeChatAppProps> = ({
  onReturnToDesktop,
  contacts,
  messages,
  worldBooks,
  settings,
  moments,
  onUpdateSettings,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onUpdateMessage,
  onRecallMessage,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onAddMoment,
  onLikeMoment,
  onCommentMoment,
  onOpenSettingsApp,
  onActiveContactChange,
  initialActiveContactId,
  favorites = [],
  stickers = [],
  onUpdateStickers,
  onToggleFavorite,
  contactMemories = {},
  onUpdateContactMemory
}) => {
  const [activeTab, setActiveTab] = useState<WeChatTab>('chats');
  const [activeContactId, setActiveContactId] = useState<string | null>(initialActiveContactId || null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    if (onActiveContactChange) {
      onActiveContactChange(activeContactId);
    }
  }, [activeContactId, onActiveContactChange]);

  // Active contact if inside chat room
  const activeContact = contacts.find(c => c.id === activeContactId);

  // Total unread WeChat messages
  const totalUnread = contacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Note: Contacts now support affection level (好感度) and relationship status (关系状态: friend, dating, engaged, married)
  // which are seamlessly updated via the chat room and settings drawer.

  // If inside chat room, render ChatRoom directly (it has its own custom header)
  if (activeContactId && activeContact) {
    return (
      <ChatRoom
        contact={activeContact}
        allContacts={contacts}
        messages={messages[activeContactId] || []}
        worldBooks={worldBooks}
        settings={settings}
        onBack={() => {
          setActiveContactId(null);
          onUpdateContact(activeContact.id, { unreadCount: 0 });
        }}
        onSendMessage={(msg) => onSendMessage(activeContact.id, msg)}
        onDeleteMessage={(msgId) => onDeleteMessage?.(activeContact.id, msgId)}
        onEditMessage={(msgId, newContent) => onEditMessage?.(activeContact.id, msgId, newContent)}
        onUpdateMessage={(msgId, updates) => onUpdateMessage?.(activeContact.id, msgId, updates)}
        onRecallMessage={(msgId) => onRecallMessage?.(activeContact.id, msgId)}
        onUpdateContact={onUpdateContact}
        onDeleteContact={(id) => {
          onDeleteContact(id);
          setActiveContactId(null);
        }}
        favorites={favorites}
        stickers={stickers}
        onToggleFavorite={onToggleFavorite}
        contactMemories={contactMemories}
        onUpdateContactMemory={onUpdateContactMemory}
        onUpdateSettings={onUpdateSettings}
      />
    );
  }

  // Titles mapping
  const titles: Record<WeChatTab, string> = {
    chats: '微信',
    contacts: '通讯录',
    moments: '朋友圈',
    me: '我'
  };

  // Active DIY Theme assets & styles
  const activeTheme = settings.activeDIYThemeId && settings.diyThemes
    ? settings.diyThemes.find(t => t.id === settings.activeDIYThemeId)
    : null;
  const headerBgImg = activeTheme?.assets?.headerBg;
  const tabbarBgImg = activeTheme?.assets?.tabbarBg;
  const wechatBgImg = activeTheme?.assets?.chatlistBg || activeTheme?.assets?.wechatBg;

  const tabIcons = {
    chats: activeTheme?.assets?.tabIconChats || activeTheme?.assets?.tabIcons?.chats,
    contacts: activeTheme?.assets?.tabIconContacts || activeTheme?.assets?.tabIcons?.contacts,
    moments: activeTheme?.assets?.tabIconMoments || activeTheme?.assets?.tabIcons?.moments,
    me: activeTheme?.assets?.tabIconMe || activeTheme?.assets?.tabIcons?.me,
  };

  const fogColor = activeTheme?.css?.['--gg-tabbar-icon-fog-color'];

  return (
    <div
      className="h-full w-full flex flex-col select-none relative overflow-hidden"
      style={{
        backgroundColor: 'var(--gg-page-bg, #ededed)'
      }}
    >
      {/* 2.2 顶部标题栏（拥有独立实体背景与高 z-index，绝不让列表背景图作为顶栏背景） */}
      <div
        className={`h-11 px-3 ${headerBgImg ? 'border-b-0' : 'border-b border-stone-300/70'} flex items-center justify-between shrink-0 z-30 relative overflow-hidden`}
        style={{
          backgroundColor: headerBgImg ? 'transparent' : (activeTheme?.css?.['--gg-header-bg'] || '#ededed'),
          color: 'var(--gg-header-text, var(--gg-text-primary, #111827))',
          backdropFilter: headerBgImg ? undefined : 'blur(var(--gg-header-blur, 12px))',
          borderBottom: headerBgImg ? 'none' : undefined
        }}
      >
        {/* 无 headerBg 时提供保底不透明背景，防止列表背景图透视 */}
        {!headerBgImg && (
          <div 
            className="absolute inset-0 pointer-events-none -z-1" 
            style={{ backgroundColor: activeTheme?.css?.['--gg-header-bg'] || '#ededed' }} 
          />
        )}
        {headerBgImg && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={getBubbleBgStyle({
              isUser: false,
              prefix: 'header',
              editingTheme: activeTheme,
              bubbleBgUrl: headerBgImg,
              isDot9: activeTheme?.css?.['--gg-is-dot9-headerBg'] !== 'false',
            })}
          />
        )}
        {/* 左侧返回箭头（返回桌面） */}
        <button
          onClick={onReturnToDesktop}
          className="flex items-center gap-0.5 text-xs font-medium cursor-pointer active:scale-90 transition-transform relative z-10"
          style={{ color: 'inherit' }}
          title="返回手机桌面"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>桌面</span>
        </button>

        {/* 中间显示当前页面标题 */}
        <span className="font-bold text-xs relative z-10" style={{ color: 'inherit' }}>
          {titles[activeTab]}
          {activeTab === 'chats' && totalUnread > 0 && ` (${totalUnread})`}
        </span>

        {/* 右侧根据页面显示不同按钮 */}
        <div className="flex items-center gap-1 relative z-10">
          {activeTab === 'chats' && (
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-800 cursor-pointer active:scale-90 transition-transform"
              title="添加好友/群聊"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {activeTab === 'me' && (
            <button
              onClick={onOpenSettingsApp}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-800 cursor-pointer active:scale-90 transition-transform"
              title="设置"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content (平铺微信壁纸，覆盖聊天列表、通讯录、朋友圈、我) */}
      <div 
        className="flex-1 overflow-hidden relative z-10 bg-cover bg-center"
        style={{
          backgroundImage: wechatBgImg ? `url(${wechatBgImg})` : undefined,
          backgroundColor: wechatBgImg ? 'transparent' : 'var(--gg-page-bg, #ededed)'
        }}
      >
        {activeTab === 'chats' && (
          <ChatList
            contacts={contacts}
            messages={messages}
            settings={settings}
            onSelectContact={(id) => {
              setActiveContactId(id);
              onUpdateContact(id, { unreadCount: 0 });
            }}
            onAddContact={onAddContact}
            onUpdateContact={onUpdateContact}
            onDeleteContact={onDeleteContact}
            showAddMenu={showAddMenu}
            onCloseAddMenu={() => setShowAddMenu(false)}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsView
            contacts={contacts}
            onSelectContact={(id) => {
              setActiveContactId(id);
              onUpdateContact(id, { unreadCount: 0 });
            }}
            onUpdateContact={onUpdateContact}
            onDeleteContact={onDeleteContact}
            hasWechatBg={Boolean(wechatBgImg)}
          />
        )}

        {activeTab === 'moments' && (
          <MomentsView
            moments={moments}
            settings={settings}
            contacts={contacts}
            worldBooks={worldBooks}
            onUpdateSettings={onUpdateSettings}
            onAddMoment={onAddMoment}
            onLikeMoment={onLikeMoment}
            onCommentMoment={onCommentMoment}
          />
        )}

        {activeTab === 'me' && (
          <MeView
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onOpenSettingsApp={onOpenSettingsApp}
            favorites={favorites}
            stickers={stickers}
            onUpdateStickers={onUpdateStickers}
            onToggleFavorite={onToggleFavorite}
            hasWechatBg={Boolean(wechatBgImg)}
            contacts={contacts}
          />
        )}
      </div>

      {/* 2.2 底部 TabBar (拥有独立实体背景与高 z-index，绝不让列表背景图作为底栏背景) */}
      <div
        className={`h-12 ${tabbarBgImg ? 'border-t-0' : 'border-t border-stone-300/80'} flex items-center justify-around shrink-0 z-30 relative overflow-hidden`}
        style={{
          backgroundColor: tabbarBgImg ? 'transparent' : (activeTheme?.css?.['--gg-tabbar-bg'] || '#f7f7f7'),
          borderTop: tabbarBgImg ? 'none' : undefined
        }}
      >
        {/* 无 tabbarBg 时提供保底不透明背景，防止列表背景图透视 */}
        {!tabbarBgImg && (
          <div 
            className="absolute inset-0 pointer-events-none -z-1" 
            style={{ backgroundColor: activeTheme?.css?.['--gg-tabbar-bg'] || '#f7f7f7' }} 
          />
        )}
        {tabbarBgImg && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={getBubbleBgStyle({
              isUser: false,
              prefix: 'tabbar',
              editingTheme: activeTheme,
              bubbleBgUrl: tabbarBgImg,
              isDot9: activeTheme?.css?.['--gg-is-dot9-tabbarBg'] !== 'false',
            })}
          />
        )}
        {/* 聊天 */}
        <button
          onClick={() => setActiveTab('chats')}
          className="flex-1 flex flex-col items-center justify-center py-1 relative cursor-pointer active:scale-90 transition-transform z-10"
          style={{
            color: activeTab === 'chats'
              ? 'var(--gg-tabbar-active-label-color, var(--gg-accent-color, #a8b39c))'
              : 'var(--gg-tabbar-label-color, var(--gg-text-secondary, #6b7280))'
          }}
        >
          <RenderTabIconItem
            active={activeTab === 'chats'}
            customIcon={tabIcons.chats}
            defaultIcon={<MessageCircle className="w-5 h-5" />}
            fogColor={fogColor}
            badge={
              totalUnread > 0 ? (
                <span
                  className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center z-20"
                  style={{ backgroundColor: 'var(--gg-accent-color, #a8b39c)' }}
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              ) : undefined
            }
          />
          <span className="text-[10px] mt-0.5">微信</span>
        </button>

        {/* 通讯录 */}
        <button
          onClick={() => setActiveTab('contacts')}
          className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-90 transition-transform z-10"
          style={{
            color: activeTab === 'contacts'
              ? 'var(--gg-tabbar-active-label-color, var(--gg-accent-color, #a8b39c))'
              : 'var(--gg-tabbar-label-color, var(--gg-text-secondary, #6b7280))'
          }}
        >
          <RenderTabIconItem
            active={activeTab === 'contacts'}
            customIcon={tabIcons.contacts}
            defaultIcon={<Users className="w-5 h-5" />}
            fogColor={fogColor}
          />
          <span className="text-[10px] mt-0.5">通讯录</span>
        </button>

        {/* 朋友圈 */}
        <button
          onClick={() => setActiveTab('moments')}
          className="flex-1 flex flex-col items-center justify-center py-1 relative cursor-pointer active:scale-90 transition-transform z-10"
          style={{
            color: activeTab === 'moments'
              ? 'var(--gg-tabbar-active-label-color, var(--gg-accent-color, #a8b39c))'
              : 'var(--gg-tabbar-label-color, var(--gg-text-secondary, #6b7280))'
          }}
        >
          <RenderTabIconItem
            active={activeTab === 'moments'}
            customIcon={tabIcons.moments}
            defaultIcon={<Compass className="w-5 h-5" />}
            fogColor={fogColor}
            badge={
              <span
                className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full z-20"
                style={{ backgroundColor: 'var(--gg-accent-color, #a8b39c)' }}
              />
            }
          />
          <span className="text-[10px] mt-0.5">朋友圈</span>
        </button>

        {/* 我 */}
        <button
          onClick={() => setActiveTab('me')}
          className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-90 transition-transform z-10"
          style={{
            color: activeTab === 'me'
              ? 'var(--gg-tabbar-active-label-color, var(--gg-accent-color, #a8b39c))'
              : 'var(--gg-tabbar-label-color, var(--gg-text-secondary, #6b7280))'
          }}
        >
          <RenderTabIconItem
            active={activeTab === 'me'}
            customIcon={tabIcons.me}
            defaultIcon={<User className="w-5 h-5" />}
            fogColor={fogColor}
          />
          <span className="text-[10px] mt-0.5">我</span>
        </button>
      </div>
    </div>
  );
};
