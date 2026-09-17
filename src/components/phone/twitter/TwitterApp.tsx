import React, { useState, useEffect, useRef } from 'react';
import { 
  Twitter, 
  Home, 
  Search, 
  Bell, 
  Mail, 
  User, 
  MessageCircle, 
  Repeat2, 
  Heart, 
  Share, 
  Image as ImageIcon, 
  Smile, 
  X as XIcon,
  ChevronLeft,
  Send,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contact, PhoneSettings, WorldBookItem, TwitterPost, TwitterComment, ChatMessage } from '../../../types/phone';
import { Avatar } from '../Avatar';
import { callAI } from '../../../services/aiService';
import { compressImage } from '../../../utils/image';

interface TwitterAppProps {
  onReturnToDesktop: () => void;
  settings: PhoneSettings;
  contacts: Contact[];
  worldBooks: WorldBookItem[];
  onForwardToChat?: (contactId: string, message: ChatMessage) => void;
}

// Local storage keys
const POSTS_STORAGE_KEY = 'twitter_local_posts';
const COMMENTS_STORAGE_PREFIX = 'twitter_local_comments_';

export const TwitterApp: React.FC<TwitterAppProps> = ({ 
  onReturnToDesktop, 
  settings, 
  contacts = [], 
  worldBooks = [],
  onForwardToChat
}) => {
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'notifications' | 'messages' | 'profile'>('home');
  const [posts, setPosts] = useState<TwitterPost[]>(() => {
    try {
      const savedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        if (Array.isArray(parsed)) {
          console.log('[Twitter] 已恢复帖子，共', parsed.length, '条');
          return parsed;
        }
      }
    } catch (e) {
      console.error('[Twitter] 读取帖子失败:', e);
    }
    console.log('[Twitter] 没有找到保存的帖子');
    return [];
  });
  const [isPosting, setIsPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState<TwitterPost | null>(null);
  const [postComments, setPostComments] = useState<TwitterComment[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  
  // Specific comment reply state (Multi-turn conversation)
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; authorName: string } | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  
  // Twitter Messages state
  const [selectedChatContact, setSelectedChatContact] = useState<Contact | null>(null);
  const [twitterMessages, setTwitterMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const savedMessages = localStorage.getItem('twitter_local_messages');
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (e) {
      console.error('[Twitter] 读取私信失败:', e);
    }
    return {};
  });
  const [twitterChatInput, setTwitterChatInput] = useState('');
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState<string>(() => {
    try {
      const savedBio = localStorage.getItem('twitter_local_bio');
      if (savedBio) return savedBio;
    } catch (e) {
      console.error('[Twitter] 读取Bio失败:', e);
    }
    return '这是我的本地 X 模拟器。';
  });

  // Banner state
  const [bannerImage, setBannerImage] = useState<string>(() => {
    return localStorage.getItem('twitter_local_banner') || '';
  });
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Forward post modal state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingPost, setForwardingPost] = useState<TwitterPost | null>(null);

  // Save bio to local storage
  useEffect(() => {
    try {
      localStorage.setItem('twitter_local_bio', editBio);
    } catch (err) {
      console.error('[Twitter] 保存Bio失败:', err);
    }
  }, [editBio]);

  // Save banner to local storage
  useEffect(() => {
    if (bannerImage) {
      localStorage.setItem('twitter_local_banner', bannerImage);
    }
  }, [bannerImage]);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImage(raw, 800, 400, 0.7);
        setBannerImage(compressed);
      } catch (err) {
        setBannerImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOpenForwardModal = (post: TwitterPost) => {
    setForwardingPost(post);
    setShowForwardModal(true);
  };

  // Save twitter messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem('twitter_local_messages', JSON.stringify(twitterMessages));
    } catch (err) {
      console.error('[Twitter] 保存私信失败:', err);
    }
  }, [twitterMessages]);

  const handleForwardPost = async (contact: Contact) => {
    if (!forwardingPost || isAiSending) return;
    const contactId = contact.id;

    const forwardedMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: forwardingPost.content,
      type: 'forwarded_tweet',
      authorName: forwardingPost.authorName,
      forwardedAt: Date.now(),
      timestamp: Date.now()
    };

    const updatedMessages = [...(twitterMessages[contactId] || []), forwardedMsg];

    setTwitterMessages(prev => ({
      ...prev,
      [contactId]: updatedMessages
    }));

    setShowForwardModal(false);
    setForwardingPost(null);
    setActiveTab('messages');
    setSelectedChatContact(contact);
    setIsAiSending(true);

    try {
      const contactForAI = { ...contact, enableInnerVoice: false };
      const rawAiReplyText = await callAI({
        contact: contactForAI,
        messages: updatedMessages,
        worldBooks,
        settings
      });
      const aiReplyText = rawAiReplyText
        .replace(/\[心声[:：][^\]]+\]/g, '')
        .replace(/\[语音(?:消息)?[:：]?\s*[^\]]*\]|\[发语音\]/gi, '')
        .trim();

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: aiReplyText,
        timestamp: Date.now(),
        type: 'text',
        senderName: contact.remark || contact.name,
        senderAvatar: contact.avatar
      };

      setTwitterMessages(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), aiReply]
      }));
    } catch (err) {
      console.error('[Twitter] AI DM reply after forward failed:', err);
      const errorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: '[网络异常或API Key未配置，AI 暂时无法回复]',
        timestamp: Date.now(),
        type: 'text',
        senderName: contact.remark || contact.name,
        senderAvatar: contact.avatar
      };
      setTwitterMessages(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), errorReply]
      }));
    } finally {
      setIsAiSending(false);
    }
  };

  const [isAiSending, setIsAiSending] = useState(false);

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPulling = useRef(false);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      isPulling.current = true;
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // 只有在顶部向下划时才触发
      setPullY(Math.min(diff * 0.5, 60));
      // 阻止默认滚动行为，避免系统下拉回弹干扰
      if (diff > 10 && e.cancelable) {
        // e.preventDefault(); // 在某些 React 版本中直接 preventDefault 可能有问题
      }
    } else {
      isPulling.current = false;
      setPullY(0);
    }
  };

  const handleTouchEnd = () => {
    if (isPulling.current && pullY >= 50) {
      handleRefresh();
    }
    isPulling.current = false;
    setPullY(0);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // 同时生成 3 条新的路人帖子
      await Promise.all([
        generateRandomPost(),
        generateRandomPost(),
        generateRandomPost()
      ]);
    } catch (err) {
      console.error('[Twitter] 刷新失败:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendTwitterMessage = async () => {
    if (!twitterChatInput.trim() || !selectedChatContact || isAiSending) return;
    
    const contactId = selectedChatContact.id;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: twitterChatInput.trim(),
      timestamp: Date.now(),
      type: 'text'
    };
    
    const updatedMessages = [...(twitterMessages[contactId] || []), newMessage];
    
    setTwitterMessages(prev => ({
      ...prev,
      [contactId]: updatedMessages
    }));
    setTwitterChatInput('');
    setIsAiSending(true);

    try {
      const contactForAI = { ...selectedChatContact, enableInnerVoice: false };
      const rawAiReplyText = await callAI({
        contact: contactForAI,
        messages: updatedMessages,
        worldBooks,
        settings
      });
      const aiReplyText = rawAiReplyText
        .replace(/\[心声[:：][^\]]+\]/g, '')
        .replace(/\[语音(?:消息)?[:：]?\s*[^\]]*\]|\[发语音\]/gi, '')
        .trim();

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: aiReplyText,
        timestamp: Date.now(),
        type: 'text',
        senderName: selectedChatContact.remark || selectedChatContact.name,
        senderAvatar: selectedChatContact.avatar
      };
      
      setTwitterMessages(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), aiReply]
      }));
    } catch (err) {
      console.error('[Twitter] AI DM reply failed:', err);
      const errorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: '[网络异常或API Key未配置，AI 暂时无法回复]',
        timestamp: Date.now(),
        type: 'text',
        senderName: selectedChatContact.remark || selectedChatContact.name,
        senderAvatar: selectedChatContact.avatar
      };
      setTwitterMessages(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), errorReply]
      }));
    } finally {
      setIsAiSending(false);
    }
  };

  // Save posts to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
      console.log('[Twitter] 帖子已保存，共', posts.length, '条');
    } catch (err) {
      console.error('[Twitter] 保存帖子失败:', err);
    }
  }, [posts]);

  // Load comments whenever a post is selected
  useEffect(() => {
    if (selectedPost) {
      try {
        const savedComments = localStorage.getItem(COMMENTS_STORAGE_PREFIX + selectedPost.id);
        if (savedComments) {
          const parsed = JSON.parse(savedComments);
          if (Array.isArray(parsed)) {
            setPostComments(parsed);
            return;
          }
        }
        setPostComments([]);
      } catch (e) {
        console.error("Failed to parse comments", e);
        setPostComments([]);
      }
    } else {
      setPostComments([]);
    }
  }, [selectedPost?.id]);

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI proactive posting - Daily random passerby posts (4-5 per day)
  useEffect(() => {
    // 检查今天是否已生成过帖子
    const today = new Date().toDateString();
    const lastGenerateDate = localStorage.getItem('twitter_last_generate_date');
    const generatedCount = parseInt(localStorage.getItem('twitter_today_post_count') || '0');
    
    // 如果今天还没生成过，或者生成数量不足5条
    if (lastGenerateDate !== today || generatedCount < 5) {
      const targetCount = 4 + Math.floor(Math.random() * 2); // 4-5条
      const toGenerate = targetCount - generatedCount;
      
      if (toGenerate > 0) {
        for (let i = 0; i < toGenerate; i++) {
          generateRandomPost();
        }
        localStorage.setItem('twitter_last_generate_date', today);
        localStorage.setItem('twitter_today_post_count', String(targetCount));
      }
    }
    
    // 每小时检查一次
    const interval = setInterval(() => {
      const now = new Date().toDateString();
      if (now !== localStorage.getItem('twitter_last_generate_date')) {
        localStorage.setItem('twitter_last_generate_date', now);
        localStorage.setItem('twitter_today_post_count', '0');
      }
    }, 3600000);
    
    return () => clearInterval(interval);
  }, []);

  // 异步获取并存储路人帖子的 AI 评论
  const fetchAndStoreCommentsForPost = async (postId: string, content: string, authorName: string, postTimestamp: number) => {
    try {
      const commentRes = await fetch('/api/twitter/generate-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postContent: content,
          authorName: authorName,
          context: { worldBooks: (worldBooks || []).slice(0, 5) }
        })
      });

      let commentData: any = null;
      if (commentRes.ok) {
        commentData = await commentRes.json();
      }

      const rawReplies = (commentData && Array.isArray(commentData.replies) && commentData.replies.length > 0)
        ? commentData.replies
        : (commentData && Array.isArray(commentData) && commentData.length > 0)
        ? commentData
        : null;

      let aiComments: TwitterComment[] = [];

      if (rawReplies && rawReplies.length > 0) {
        // 随机取 2-4 条评论
        const replyCount = Math.min(rawReplies.length, 2 + Math.floor(Math.random() * 3)); // 2, 3, or 4
        const selectedReplies = rawReplies.slice(0, replyCount);

        aiComments = selectedReplies.map((reply: any, index: number) => ({
          id: `ai_reply_${Date.now()}_${index}`,
          authorId: `ai_user_${Math.floor(100 + Math.random() * 900)}`,
          authorName: reply.authorName || getRandomUsername(),
          authorAvatar: '',
          content: reply.content || '前排支持一下！',
          timestamp: postTimestamp + Math.random() * 600000
        }));
      } else {
        // 本地兜底生成 2-3 条评论
        const localCommentPool = [
          '真的假的？有些震惊。',
          '前排围观吃瓜群众 🍉',
          '赞同，我也觉得是这样！',
          '太真实了，简直我本人。',
          '路过支持一下楼主。',
          '有点意思，收藏了。',
          '哈哈哈哈，有被笑到！'
        ];
        const replyCount = 2 + Math.floor(Math.random() * 2);
        const shuffled = [...localCommentPool].sort(() => 0.5 - Math.random());
        aiComments = shuffled.slice(0, replyCount).map((text, index) => ({
          id: `ai_reply_${Date.now()}_${index}`,
          authorId: `ai_user_${Math.floor(100 + Math.random() * 900)}`,
          authorName: getRandomUsername(),
          authorAvatar: '',
          content: text,
          timestamp: postTimestamp + Math.random() * 600000
        }));
      }

      localStorage.setItem(COMMENTS_STORAGE_PREFIX + postId, JSON.stringify(aiComments));
      
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, commentsCount: aiComments.length } : p
      ));

      // 若用户正在看该帖子，则实时同步刷新评论
      setSelectedPost(current => {
        if (current && current.id === postId) {
          setPostComments(aiComments);
        }
        return current;
      });
    } catch (cErr) {
      console.warn('[Twitter] 为自动生成帖子抓取 AI 评论失败:', cErr);
    }
  };

  // 生成随机路人帖子
  const generateRandomPost = async () => {
    try {
      const topics = [
        '时事', '游戏', '体育', '科技', '娱乐', 
        '生活', '美食', '旅行', '情感', '职场', '色情'
      ];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `你是一个普通网友，在 X (Twitter) 上发布一条关于【${topic}】的帖子。
          
【风格要求】：
- 口语化、真实感强，像真实网友发的
- 长度 10-30 字
- 内容可以轻松、吐槽、分享、讨论
- 不要官方口吻，不要像 AI 生成的
- 不同帖子用不同风格，避免千篇一律

直接输出帖子内容，不要加任何额外文字。`,
          messages: [{ role: 'user', content: '发一条帖子' }],
          temperature: 1.0
        })
      });
      
      const data = await res.json();
      const content = data?.reply?.trim() || generateFallbackPost(topic);
      
      const newPostId = `ai_post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const randomAuthorName = getRandomUsername();
      const randomTimestamp = Date.now() - Math.random() * 3600000;

      const newPost: TwitterPost = {
        id: newPostId,
        authorId: `ai_user_${Math.floor(100 + Math.random() * 900)}`,
        authorName: randomAuthorName,
        authorAvatar: '',
        content: content,
        timestamp: randomTimestamp,
        likesCount: Math.floor(Math.random() * 20),
        commentsCount: 0 // 初始为0，稍后由评论拉取回执更新
      };
      
      setPosts(prev => [newPost, ...prev]);

      // 异步抓取并存储路人帖子的相关评论
      fetchAndStoreCommentsForPost(newPostId, content, randomAuthorName, randomTimestamp);
    } catch (err) {
      console.warn('生成路人帖子失败:', err);
      // 失败时生成备用帖子
      const fallback = generateFallbackPost('日常');
      const newPostId = `ai_post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const randomAuthorName = getRandomUsername();
      const randomTimestamp = Date.now() - Math.random() * 3600000;

      const newPost: TwitterPost = {
        id: newPostId,
        authorId: `ai_user_${Math.floor(100 + Math.random() * 900)}`,
        authorName: randomAuthorName,
        authorAvatar: '',
        content: fallback,
        timestamp: randomTimestamp,
        likesCount: Math.floor(Math.random() * 10),
        commentsCount: 0
      };
      setPosts(prev => [newPost, ...prev]);

      // 异步抓取并存储路人帖子的相关评论
      fetchAndStoreCommentsForPost(newPostId, fallback, randomAuthorName, randomTimestamp);
    }
  };

  // 备用帖子
  const generateFallbackPost = (topic: string) => {
    const fallbacks: Record<string, string[]> = {
      '时事': ['今天这新闻也太离谱了', '有没有人跟我一样看懵了', '这波操作我看不懂'],
      '游戏': ['这游戏真是又爱又恨', '终于上王者了！', '新赛季什么时候开始啊'],
      '体育': ['今天这场比赛看得我血压都高了', '主队终于赢了！', '这裁判是不是眼瞎'],
      '科技': ['AI 发展也太快了', '新手机发布，感觉钱包要空', '这科技真的改变生活'],
      '娱乐': ['这综艺也太好笑了', '新剧追不动了', '这首歌单曲循环中'],
      '生活': ['今天天气真好啊', '周末去哪玩呢', '不想上班不想上班'],
      '美食': ['这家店真的绝了', '自己做饭翻车了', '终于吃到心心念念的'],
      '旅行': ['这里的风景太美了', '攻略做了三天终于出发了', '下次再也不旺季出门了'],
      '情感': ['有些话还是说不出口', '今天心情不太好', '被治愈到了'],
      '职场': ['老板又在画饼了', '今天准时下班！', '这班上的好累'],
      '色情': ['有没有推荐的看片网站', '求求女性向资源', '欲求不满……']
    };
    
    const list = fallbacks[topic] || fallbacks['生活'];
    return list[Math.floor(Math.random() * list.length)];
  };

  // 随机用户名
  const getRandomUsername = () => {
    const names = [
      '吃瓜群众', '冲浪小达人', '深夜哲学家', '奶茶续命中',
      '今天也在摸鱼', '早八受害者', '互联网野人', '你的电子朋友',
      '熬夜冠军🏆', '这条街最靓的仔', '躺平选手', '卷王本王',
      '随缘更新', '发疯文学爱好者', '快乐打工人', 'emo中'
    ];
    return names[Math.floor(Math.random() * names.length)];
  };

  const handleCreatePost = async () => {
    const trimmedContent = newPostContent.trim();
    if (!trimmedContent) return;
    
    setIsPosting(true);
    setAiError(null);
    
    const newPostId = Date.now().toString();
    const authorNickname = settings.userNickname || '我';

    const newPost: TwitterPost = {
      id: newPostId,
      authorId: 'me',
      authorName: authorNickname,
      authorAvatar: settings.userAvatar || '',
      content: trimmedContent,
      timestamp: Date.now(),
      likesCount: 0,
      commentsCount: 0
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostContent('');
    setIsPosting(false);

    // 后台异步请求 AI 生成路人评论
    (async () => {
      try {
        setIsAiGenerating(true);
        console.log(`[Twitter] 正在后台生成路人评论: "${trimmedContent}"`);
        const res = await fetch('/api/twitter/generate-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postContent: trimmedContent,
            authorName: authorNickname,
            context: { worldBooks: (worldBooks || []).slice(0, 5) }
          })
        });

        let data: any = null;
        if (res.ok) {
          data = await res.json();
        }

        const rawReplies = (data && Array.isArray(data.replies) && data.replies.length > 0)
          ? data.replies
          : (data && Array.isArray(data) && data.length > 0)
          ? data
          : null;

        if (rawReplies && rawReplies.length > 0) {
          const aiComments: TwitterComment[] = rawReplies.map((reply: any, index: number) => ({
            id: `ai_reply_${Date.now()}_${index}`,
            authorId: `ai_${reply.avatarId || (index + 1)}`,
            authorName: reply.authorName || '网友',
            authorAvatar: '',
            content: reply.content || '前排支持一下！',
            timestamp: Date.now() + Math.random() * 2000
          }));

          console.log(`[Twitter] 成功获取 ${aiComments.length} 条 AI 路人评论`);
          localStorage.setItem(COMMENTS_STORAGE_PREFIX + newPostId, JSON.stringify(aiComments));
          
          setPosts(prev => prev.map(p => 
            p.id === newPostId ? { ...p, commentsCount: aiComments.length } : p
          ));

          // 如果用户当前正好在查看该帖子，实时刷新评论列表
          setSelectedPost(current => {
            if (current && current.id === newPostId) {
              setPostComments(aiComments);
            }
            return current;
          });
        } else {
          console.log('[Twitter] 没有 AI 评论生成');
        }
      } catch (aiErr) {
        console.warn("[Twitter] AI 评论生成失败:", aiErr);
      } finally {
        setIsAiGenerating(false);
      }
    })();
  };

  const formatCommentTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return new Date(timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  };

  const handleReplyPost = async () => {
    const trimmedReply = replyContent.trim();
    if (!trimmedReply || !selectedPost) return;
    
    setIsReplying(true);
    
    try {
      const userComment: TwitterComment = {
        id: `user_comment_${Date.now()}`,
        authorId: 'me',
        authorName: settings.userNickname || '我',
        authorAvatar: settings.userAvatar || '',
        content: trimmedReply,
        timestamp: Date.now()
      };

      const updatedComments = [...postComments, userComment];
      setPostComments(updatedComments);
      localStorage.setItem(COMMENTS_STORAGE_PREFIX + selectedPost.id, JSON.stringify(updatedComments));
      
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id ? { ...p, commentsCount: updatedComments.length } : p
      ));
      setReplyContent('');
      setIsReplying(false);

      // 后台异步生成路人进一步回复 (作为该用户评论的子回复)
      (async () => {
        try {
          const res = await fetch('/api/twitter/generate-replies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postContent: trimmedReply,
              authorName: settings.userNickname || '我',
              context: { 
                 originalPost: selectedPost.content,
                 recentComments: updatedComments.slice(-2).map(c => c.content)
              }
            })
          });
          
          if (res.ok) {
            const data = await res.json();
            const repliesList = (data && Array.isArray(data.replies)) ? data.replies : (Array.isArray(data) ? data : []);
            if (repliesList.length > 0) {
              const reply = repliesList[0];
              const aiComment: TwitterComment = {
                id: `ai_reply_to_user_${Date.now()}`,
                authorId: `ai_${reply.avatarId || 1}`,
                authorName: reply.authorName || '网友',
                authorAvatar: '',
                content: reply.content || '赞同你的观点！',
                timestamp: Date.now() + 1000,
                parentId: userComment.id
              };
              setPostComments(prev => {
                const next = [...prev, aiComment];
                localStorage.setItem(COMMENTS_STORAGE_PREFIX + selectedPost.id, JSON.stringify(next));
                return next;
              });
              setPosts(prev => prev.map(p => 
                p.id === selectedPost.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
              ));
            }
          }
        } catch (err) {
          console.warn("AI 回复评论失败 (不影响用户评论):", err);
        }
      })();
    } catch (err: any) {
      console.error("回复失败:", err);
      setIsReplying(false);
    }
  };

  const handleSendReply = async () => {
    const trimmed = replyInput.trim();
    if (!trimmed || !replyingTo || !selectedPost) return;
    
    const targetAuthorName = replyingTo.authorName;
    const targetParentId = replyingTo.commentId;
    
    // 1. 添加用户回复，设置 parentId 关联父评论
    const userReply: TwitterComment = {
      id: `reply_${Date.now()}`,
      authorId: 'me',
      authorName: settings.userNickname || '我',
      authorAvatar: settings.userAvatar || '',
      content: trimmed,
      timestamp: Date.now(),
      parentId: targetParentId
    };

    const currentComments = [...postComments, userReply];
    setPostComments(currentComments);
    localStorage.setItem(COMMENTS_STORAGE_PREFIX + selectedPost.id, JSON.stringify(currentComments));

    setPosts(prev => prev.map(p => 
      p.id === selectedPost.id ? { ...p, commentsCount: currentComments.length } : p
    ));
    setReplyInput('');
    setReplyingTo(null);

    // 2. AI 自动回复（模拟真人多轮对话，延迟 1-2 秒，嵌套在用户回复下方）
    setIsAiReplying(true);
    try {
      const response = await fetch('/api/twitter/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentContent: trimmed,
          originalPost: selectedPost.content,
          authorName: targetAuthorName,
          context: currentComments.slice(-5).map(c => ({ authorName: c.authorName, content: c.content }))
        })
      });
      
      let data: any = null;
      if (response.ok) {
        data = await response.json();
      }
      
      const replyText = (data && data.reply) ? data.reply : '哈哈，你说得确实有道理！👍';
      
      const aiReply: TwitterComment = {
        id: `ai_reply_${Date.now()}`,
        authorId: `ai_${Date.now()}`,
        authorName: targetAuthorName,
        authorAvatar: '',
        content: replyText,
        timestamp: Date.now(),
        parentId: userReply.id
      };

      setPostComments(prev => {
        const next = [...prev, aiReply];
        localStorage.setItem(COMMENTS_STORAGE_PREFIX + selectedPost.id, JSON.stringify(next));
        return next;
      });
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      ));
    } catch (err) {
      console.error('AI 回复失败:', err);
    } finally {
      setIsAiReplying(false);
    }
  };

  const handleLikeLocal = (postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p
    ));
  };

  // Helper to get nested replies for a comment
  const getReplies = (parentId: string) => {
    return postComments.filter(c => c.parentId === parentId);
  };

  // Tree recursive comment renderer with connector lines
  const renderCommentNode = (comment: TwitterComment, depth = 0) => {
    const replies = getReplies(comment.id);
    const hasReplies = replies.length > 0;
    const isReplyingThis = replyingTo?.commentId === comment.id;

    return (
      <div key={comment.id} className="relative group/node">
        {/* Comment main row */}
        <div className={`flex gap-2.5 py-2 px-2.5 rounded-xl transition-colors ${
          isReplyingThis ? 'bg-sky-50 ring-1 ring-[#1d9bf0]/40' : 'hover:bg-stone-50/80'
        }`}>
          {/* Avatar and vertical guide connector line */}
          <div className="flex flex-col items-center shrink-0 relative">
            <div className={`${depth === 0 ? 'w-9 h-9' : 'w-7 h-7'} rounded-full overflow-hidden border border-stone-100 shadow-2xs shrink-0 z-10 bg-white`}>
              <Avatar 
                src={comment.authorAvatar} 
                name={comment.authorName || '路人'} 
                className="w-full h-full" 
                size={depth === 0 ? 16 : 14} 
              />
            </div>
            
            {/* Vertical connector line connecting down to children */}
            {hasReplies && (
              <div className="w-0.5 bg-stone-200 flex-1 my-1 rounded-full" />
            )}
          </div>

          {/* Comment content body */}
          <div className="flex-1 min-w-0 pb-0.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className={`font-bold ${depth === 0 ? 'text-[14px]' : 'text-[13px]'} text-stone-900 truncate`}>
                  {comment.authorName}
                </span>
                <span className="text-stone-400 text-[12px] shrink-0">
                  · {formatCommentTime(comment.timestamp)}
                </span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyingTo({ commentId: comment.id, authorName: comment.authorName });
                  setReplyInput('');
                }}
                className={`text-[12px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  isReplyingThis 
                    ? 'bg-[#1d9bf0] text-white' 
                    : 'text-[#1d9bf0] hover:bg-[#1d9bf0]/10'
                }`}
              >
                回复
              </button>
            </div>

            <p className="text-[13.5px] text-stone-800 mt-1 break-words leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        </div>

        {/* Nested Child Replies Tree */}
        {hasReplies && (
          <div className={`relative ${depth < 2 ? 'ml-5 pl-3' : 'ml-3 pl-2.5'} border-l-2 border-stone-200 space-y-1 my-1`}>
            {replies.map(reply => renderCommentNode(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (selectedPost) {
    const rootComments = postComments.filter(c => !c.parentId);

    return (
      <div className="rococo-theme h-full flex flex-col font-sans overflow-hidden" style={{ backgroundColor: 'var(--app-bg, #fdf6f0)', color: 'var(--app-text, #6b4a52)' }}>
        <div className="px-4 py-3 border-b flex items-center gap-6 bg-white sticky top-0 z-20">
          <button onClick={() => { setSelectedPost(null); setReplyingTo(null); }} className="p-1 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
            <ChevronLeft className="w-6 h-6 text-stone-700" />
          </button>
          <span className="font-bold text-lg">帖子</span>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <PostCard post={posts.find(p => p.id === selectedPost.id) || selectedPost} onLike={() => handleLikeLocal(selectedPost.id)} onForward={handleOpenForwardModal} isDetail />
          
          {/* Top Post Reply Box (发给帖主的回复) */}
          <div className="p-4 border-b">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Avatar src={settings.userAvatar} className="w-full h-full" size={16} />
              </div>
              <div className="flex-1">
                <textarea 
                  className="w-full placeholder-stone-500 focus:outline-none resize-none pt-2 text-sm"
                  placeholder="发布你的回复..."
                  rows={2}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={handleReplyPost}
                    disabled={!replyContent.trim() || isReplying}
                    className="bg-[#1d9bf0] text-white px-4 py-1.5 rounded-full font-bold text-sm hover:bg-[#1a8cd8] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isReplying ? '回复中' : '回复'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 特定评论回复模式输入栏 */}
          {replyingTo && (
            <div className="p-3 bg-stone-50 border-b border-stone-200 sticky top-0 z-10 animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs text-[#1d9bf0] font-bold flex items-center gap-1">
                  <span>正在回复</span>
                  <span className="bg-[#1d9bf0]/10 px-1.5 py-0.5 rounded text-[#1d9bf0]">@{replyingTo.authorName}</span>
                </span>
                <button 
                  onClick={() => { setReplyingTo(null); setReplyInput(''); }} 
                  className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer text-xs"
                >
                  ✕ 取消
                </button>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-stone-200 p-1.5 shadow-xs">
                <input
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder={`回复 @${replyingTo.authorName}...`}
                  className="flex-1 bg-transparent text-xs px-2 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  autoFocus
                />
                <button 
                  onClick={handleSendReply}
                  disabled={!replyInput.trim() || isAiReplying}
                  className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white px-3 py-1 rounded-full font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isAiReplying ? '回复中' : '回复'}
                </button>
              </div>
            </div>
          )}

          {/* AI 思考中指示 */}
          {isAiReplying && (
            <div className="p-2.5 bg-sky-50/70 border-b border-sky-100 text-sky-700 text-xs flex items-center gap-2 justify-center animate-pulse">
              <div className="w-2 h-2 bg-[#1d9bf0] rounded-full animate-bounce" />
              <span>路人正在思考回复中...</span>
            </div>
          )}

          {/* 树形评论列表 */}
          <div className="p-3 divide-y divide-stone-100">
            {rootComments.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-sm">
                还没有评论，快来抢沙发！
              </div>
            ) : (
              rootComments.map(rootComment => (
                <div key={rootComment.id} className="py-2.5 first:pt-0">
                  {renderCommentNode(rootComment, 0)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="twitter-white-locked h-full flex flex-col font-sans overflow-hidden" style={{ backgroundColor: 'var(--app-bg, #fdf6f0)', color: 'var(--app-text, #6b4a52)' }}>
      <div className="px-4 py-3 border-b flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-100">
           <Avatar src={settings.userAvatar} className="w-full h-full" size={12} />
        </div>
        <Twitter className="w-6 h-6 text-black fill-current" />
        <button onClick={onReturnToDesktop} className="p-1 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
          <XIcon className="w-5 h-5 text-stone-500" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar pb-20 relative"
        onTouchStart={activeTab === 'home' ? handleTouchStart : undefined}
        onTouchMove={activeTab === 'home' ? handleTouchMove : undefined}
        onTouchEnd={activeTab === 'home' ? handleTouchEnd : undefined}
      >
        {activeTab === 'home' && (
          <>
            {/* Pull to refresh indicator */}
            <motion.div 
              style={{ height: pullY, opacity: pullY / 50 }}
              className="flex items-center justify-center overflow-hidden bg-stone-50"
            >
              <RefreshCw className={`w-5 h-5 text-[#1d9bf0] ${pullY >= 50 ? 'rotate-180' : ''} transition-transform duration-300`} />
            </motion.div>

            {/* Refreshing spinner */}
            <AnimatePresence>
              {isRefreshing && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 40, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex items-center justify-center bg-white border-b border-stone-100"
                >
                  <Loader2 className="w-5 h-5 text-[#1d9bf0] animate-spin" />
                  <span className="text-xs text-stone-500 ml-2 font-medium">正在获取最新动态...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 border-b flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Avatar src={settings.userAvatar} className="w-full h-full" size={16} />
              </div>
              <div className="flex-1">
                <textarea 
                  className="w-full text-lg placeholder-stone-500 focus:outline-none resize-none pt-1"
                  placeholder="有什么新鲜事？"
                  rows={3}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                
                {aiError && (
                  <div className="text-red-500 text-xs mt-1 mb-2 bg-red-50 p-2 rounded-lg border border-red-100">
                    {aiError}
                  </div>
                )}
                
                {isAiGenerating && (
                  <div className="text-stone-500 text-xs mt-1 mb-2 animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#1d9bf0] rounded-full animate-bounce" />
                    AI 正在生成路人回复...
                  </div>
                )}

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-100">
                  <div className="flex gap-2 text-[#1d9bf0]">
                    <ImageIcon className="w-5 h-5 cursor-pointer hover:bg-[#1d9bf0]/10 rounded-full p-1" />
                    <Smile className="w-5 h-5 cursor-pointer hover:bg-[#1d9bf0]/10 rounded-full p-1" />
                  </div>
                  <button 
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || isPosting}
                    className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white px-4 py-1.5 rounded-full font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                  >
                    {isPosting ? '发布中' : '发布'}
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-stone-100">
              {posts.map(post => (
                <div key={post.id} onClick={() => setSelectedPost(post)}>
                  <PostCard post={post} onLike={() => handleLikeLocal(post.id)} onForward={handleOpenForwardModal} />
                </div>
              ))}
              {posts.length === 0 && (
                <div className="p-10 text-center text-stone-500 text-sm">
                  暂时还没有帖子，快去发布第一条吧！
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'messages' && !selectedChatContact && (
          <div className="flex flex-col h-full bg-white">
            <div className="px-4 py-3 border-b">
              <h2 className="text-xl font-black">私信</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {safeContacts.filter(c => c && !c.isGroup && !c.isAssistant).map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => setSelectedChatContact(contact)}
                  className="p-4 flex gap-3 hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <Avatar src={contact.avatar} name={contact.remark || contact.name} className="w-12 h-12 rounded-full shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm truncate">{contact.remark || contact.name}</span>
                      <span className="text-stone-500 text-[10px]">刚刚</span>
                    </div>
                    <p className="text-stone-500 text-xs truncate mt-0.5">
                      {(twitterMessages[contact.id]?.slice(-1)[0]?.content) || '点击开始聊天'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'messages' && selectedChatContact && (
          <div className="flex flex-col h-full bg-white relative z-40">
            <div className="px-4 py-3 border-b flex items-center gap-4 bg-white sticky top-0">
              <button onClick={() => setSelectedChatContact(null)} className="p-1 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
                <ChevronLeft className="w-6 h-6 text-stone-700" />
              </button>
              <div className="flex items-center gap-2">
                <Avatar src={selectedChatContact.avatar} name={selectedChatContact.remark || selectedChatContact.name} className="w-8 h-8 rounded-full shrink-0" size={14} />
                <span className="font-bold text-sm">{selectedChatContact.remark || selectedChatContact.name}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-20">
              {(twitterMessages[selectedChatContact.id] || []).map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'forwarded_tweet' ? (
                    <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] border ${
                      msg.sender === 'user'
                        ? 'bg-[#1d9bf0]/10 border-[#1d9bf0]/30 text-stone-900 rounded-br-none'
                        : 'bg-stone-100 border-stone-200 text-stone-900 rounded-bl-none'
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d9bf0] mb-1">
                        <Twitter className="w-3.5 h-3.5" />
                        <span>转发的推特帖子</span>
                      </div>
                      <div className="font-bold text-stone-900 text-xs mb-0.5">@{msg.authorName || '网友'}</div>
                      <p className="text-stone-700 whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className="text-[10px] text-stone-400 mt-1 text-right">
                        {new Date(msg.forwardedAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ) : (
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-[13px] ${
                      msg.sender === 'user' 
                        ? 'bg-[#1d9bf0] text-white rounded-br-none' 
                        : 'bg-stone-100 text-stone-900 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 border-t bg-white absolute bottom-0 left-0 right-0">
              <div className="flex items-center gap-2 bg-stone-100 rounded-full px-4 py-2">
                <input 
                  className="flex-1 bg-transparent text-xs focus:outline-none"
                  placeholder="开始新私信"
                  value={twitterChatInput}
                  onChange={(e) => setTwitterChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTwitterMessage()}
                />
                <button 
                  onClick={handleSendTwitterMessage}
                  disabled={!twitterChatInput.trim()}
                  className="text-[#1d9bf0] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex flex-col h-full bg-stone-50 overflow-y-auto">
            <div 
              className="h-32 w-full bg-cover bg-center cursor-pointer relative group shrink-0"
              style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : { backgroundColor: '#1da1f2' }}
              onClick={() => bannerInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="text-white bg-black/50 px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  更换背景
                </span>
              </div>
              <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />
              <div className="absolute -bottom-10 left-4 w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white shadow-sm">
                <Avatar src={settings.userAvatar} className="w-full h-full" size={32} />
              </div>
              <div className="absolute -bottom-6 right-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditingProfile(true); }}
                  className="px-4 py-1 rounded-full border border-stone-300 font-bold text-sm bg-white hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  编辑资料
                </button>
              </div>
            </div>
            <div className="pt-12 px-4 pb-6 bg-white border-b shrink-0">
              <h2 className="text-xl font-black text-stone-900">{settings.userNickname || '我'}</h2>
              <p className="text-stone-500 text-sm">@me</p>
              <p className="mt-3 text-[15px] leading-normal">{editBio}</p>
            </div>
            <div className="divide-y divide-stone-100 bg-white">
              {posts.filter(p => p.authorId === 'me').map(post => (
                <div key={post.id} onClick={() => setSelectedPost(post)}>
                  <PostCard post={post} onLike={() => handleLikeLocal(post.id)} onForward={handleOpenForwardModal} />
                </div>
              ))}
            </div>
          </div>
        )}

        {isEditingProfile && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-[320px] bg-white rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black">编辑资料</h3>
                <button onClick={() => setIsEditingProfile(false)}>
                  <XIcon className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">简介</label>
                  <textarea 
                    className="w-full p-3 bg-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d9bf0]/50 h-24 resize-none"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="w-full py-2.5 bg-black text-white rounded-full font-bold text-sm hover:bg-stone-800 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forward Post to WeChat Modal */}
        {showForwardModal && forwardingPost && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-[320px] bg-white rounded-2xl p-5 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-stone-900">转发推特到私信</h3>
                <button onClick={() => { setShowForwardModal(false); setForwardingPost(null); }}>
                  <XIcon className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl mb-4 border border-stone-200 text-xs">
                <span className="font-bold text-stone-700">@{forwardingPost.authorName}:</span>
                <p className="text-stone-600 mt-1 line-clamp-2">{forwardingPost.content}</p>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-stone-100">
                {safeContacts.filter(c => c && !c.isGroup && !c.isAssistant).map(contact => (
                  <div 
                    key={contact.id}
                    onClick={() => handleForwardPost(contact)}
                    className="flex items-center gap-3 py-2 px-2 hover:bg-stone-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <Avatar src={contact.avatar} name={contact.remark || contact.name} className="w-10 h-10 rounded-full shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-stone-900 truncate">{contact.remark || contact.name}</h4>
                      <p className="text-xs text-stone-400 truncate">{contact.bio || contact.persona?.substring(0, 20)}</p>
                    </div>
                    <span className="text-xs text-[#1d9bf0] font-bold shrink-0">转发</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-16 border-t flex justify-around items-center bg-white absolute bottom-0 left-0 right-0 z-30 px-4">
        <TabItem active={activeTab === 'home'} icon={<Home className="w-6 h-6" />} onClick={() => setActiveTab('home')} />
        <TabItem active={activeTab === 'search'} icon={<Search className="w-6 h-6" />} onClick={() => setActiveTab('search')} />
        <TabItem active={activeTab === 'notifications'} icon={<Bell className="w-6 h-6" />} onClick={() => setActiveTab('notifications')} />
        <TabItem active={activeTab === 'messages'} icon={<Mail className="w-6 h-6" />} onClick={() => setActiveTab('messages')} />
        <TabItem active={activeTab === 'profile'} icon={<User className="w-6 h-6" />} onClick={() => setActiveTab('profile')} />
      </div>
    </div>
  );
};

const TabItem = ({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) => (
  <button onClick={onClick} className={`p-2 transition-all duration-200 cursor-pointer ${active ? 'text-black scale-110' : 'text-stone-400 hover:text-stone-600'}`}>
    {icon}
  </button>
);

const PostCard = ({ post, onLike, onForward, isDetail }: { post: TwitterPost, onLike: () => void, onForward: (post: TwitterPost) => void, isDetail?: boolean }) => {
  return (
    <div className={`p-4 flex gap-3 ${!isDetail && 'hover:bg-stone-50 cursor-pointer group'} transition-colors`}>
      <div className={`${isDetail ? 'w-12 h-12' : 'w-10 h-10'} rounded-full overflow-hidden shrink-0 border border-stone-100 shadow-sm`}>
        <Avatar src={post.authorAvatar} name={post.authorName || '网友'} className="w-full h-full" size={isDetail ? 20 : 16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`flex ${isDetail ? 'flex-col' : 'items-center gap-1.5'} truncate`}>
          <span className="font-bold text-[15px] text-stone-900 truncate">{post.authorName}</span>
          <span className="text-stone-500 text-[13px] truncate">@{post.authorId === 'me' ? 'me' : 'ai'} · {new Date(post.timestamp).toLocaleDateString()}</span>
        </div>
        <p className={`${isDetail ? 'text-lg mt-3' : 'text-[15px] mt-0.5'} leading-relaxed text-stone-800 whitespace-pre-wrap break-words`}>{post.content}</p>
        
        <div className={`flex justify-between mt-3 text-stone-500 ${isDetail ? 'max-w-none px-4' : 'max-w-sm mr-4'}`}>
          <div className="flex items-center gap-1 group/btn hover:text-[#1d9bf0] transition-colors">
            <div className="p-2 rounded-full group-hover/btn:bg-[#1d9bf0]/10 transition-colors">
              <MessageCircle className={`${isDetail ? 'w-6 h-6' : 'w-[18px] h-[18px]'}`} />
            </div>
            {!isDetail && <span className="text-xs font-medium">{post.commentsCount || 0}</span>}
          </div>
          <div className="flex items-center gap-1 group/btn hover:text-[#00ba7c] transition-colors">
            <div className="p-2 rounded-full group-hover/btn:bg-[#00ba7c]/10 transition-colors">
              <Repeat2 className={`${isDetail ? 'w-6 h-6' : 'w-[18px] h-[18px]'}`} />
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="flex items-center gap-1 group/btn hover:text-[#f91880] transition-colors cursor-pointer"
          >
            <div className="p-2 rounded-full group-hover/btn:bg-[#f91880]/10 transition-colors">
              <Heart className={`${isDetail ? 'w-6 h-6' : 'w-[18px] h-[18px]'}`} />
            </div>
            {!isDetail && <span className="text-xs font-medium">{post.likesCount || 0}</span>}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onForward(post); }}
            className="flex items-center gap-1 group/btn hover:text-[#1d9bf0] transition-colors cursor-pointer"
            title="转发到微信"
          >
            <div className="p-2 rounded-full group-hover/btn:bg-[#1d9bf0]/10 transition-colors">
              <Share className={`${isDetail ? 'w-6 h-6' : 'w-[18px] h-[18px]'}`} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
