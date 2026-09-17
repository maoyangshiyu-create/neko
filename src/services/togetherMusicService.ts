import { Contact } from '../types/phone';
import { SongItem } from './neteaseService';
import { TogetherMessage } from '../types/togetherMusic';

/**
 * 启发式音乐评述库 (当AI接口离线或超时时的智能情景回退)
 */
const MUSIC_FEELINGS = [
  '这首歌的旋律好温柔啊，不知怎么的突然想起我们以前聊过的事情呢。',
  '耳机里听这句歌词的时候，心头轻轻颤了一下，你也正听到这里吗？',
  '前奏一出来就特别抓耳，节奏很舒服，感觉整个人都慢下来了。',
  '戴着耳机和你一起听，感觉和一个人听完全不一样呢，好像音符都变甜了。',
  '这首歌的编曲很细腻，尤其间奏的那段乐器，特别有故事感。',
  '听到这首歌的时候，脑海里不自觉就浮现出很多美好的画面...',
  '歌手的声音很有质感，歌词写得真好，像是在轻声倾诉着什么。',
  '这首歌收进我的私藏歌单啦，下一次我们还要戴同一副耳机听。',
  '旋律缓缓流淌的感觉真好，听着好惬意，这一刻很想让时间走得慢一点。',
  '副歌的高潮部分情绪太充沛了，每次听都觉得有一种特别的触动。',
  '这首歌的吉他声真的很治愈，像微风吹过午后窗台的感觉。'
];

/**
 * 根据角色人设生成专属风格的音乐评述
 */
export function generateInCharacterMusicComment(
  contact: Contact,
  song: SongItem,
  currentLyric?: string
): string {
  const persona = (contact.persona || '').toLowerCase();
  const name = contact.remark || contact.name || '朋友';
  const songTitle = song.name || '这首歌';
  const artists = song.artists.map(a => a.name).join(' / ') || '这位歌手';

  // 傲娇类型
  if (persona.includes('傲娇') || persona.includes('少爷') || persona.includes('大小姐') || persona.includes('言秋')) {
    const list = [
      `哼，《${songTitle}》选得倒还算合我胃口，勉强算你有品味吧。`,
      `你别光顾着发呆，这首《${songTitle}》里的鼓点挺用心的，仔细听听看。`,
      `...怎么突然放这种歌，听着让人心里怪软的。不过...也不讨厌就是了。`,
      currentLyric ? `刚才那句“${currentLyric.slice(0, 14)}”...写得倒挺走心，你觉得呢？` : `戴同一副耳机听歌...稍微有点近了。不过音质确实不错。`,
      `咳，这首《${songTitle}》还不错。下次我还陪你听，但可不许挑难听的！`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  // 温柔/治愈/深情类型
  if (persona.includes('温柔') || persona.includes('恋人') || persona.includes('深情') || persona.includes('暖') || persona.includes('宠')) {
    const list = [
      `《${songTitle}》的旋律好温和，就像此刻静静坐在你身边一样安心。`,
      `听着${artists}的声音，忽然觉得能和你分享同一段旋律，是一件很幸福的小事。`,
      currentLyric ? `歌词里唱“${currentLyric.slice(0, 16)}”，这一刻我也在心里悄悄想到了你。` : `这首歌好适合现在听，耳机里的音乐很轻，你的陪伴很暖。`,
      `每次听到《${songTitle}》，都觉得时光变得好悠长，想一直这样和你听下去。`,
      `累了吗？靠着休息会儿吧，这首歌的旋律很舒服，我陪着你听。`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  // 活泼/阳光/元气类型
  if (persona.includes('活泼') || persona.includes('开朗') || persona.includes('元气') || persona.includes('俏皮') || persona.includes('可爱')) {
    const list = [
      `哇！《${songTitle}》这也太好听了吧，前奏一响我都忍不住想跟着哼了！`,
      `嘿嘿，和你戴同一只耳机听歌感觉超奇妙，旋律一下子就变得更轻快了～`,
      currentLyric ? `哇刚才那句“${currentLyric.slice(0, 12)}”唱得太有感觉了，你听到了没？` : `《${songTitle}》太戳我了！立刻加入我的红心歌单！`,
      `晃着脑袋听这首歌真的好快乐，你喜欢这种节奏吗？`,
      `这首歌的编曲太有灵气了，听得我整个人心情都变得闪闪发光！`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  // 沉稳/内敛/知性类型
  if (persona.includes('沉稳') || persona.includes('高冷') || persona.includes('理智') || persona.includes('总裁') || persona.includes('军人')) {
    const list = [
      `《${songTitle}》的层次感很不错，${artists}的处理很克制却很有力量。`,
      `难得有片刻安静下来欣赏音乐的时间。和你一起听，感觉很放松。`,
      currentLyric ? `歌词“${currentLyric.slice(0, 14)}”，写得很耐人寻味。` : `这首作品的旋律很纯粹，情绪渲染得恰到好处。`,
      `《${songTitle}》确实是一首耐听的作品，很适合在这样的时刻细细品味。`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  // 通用知己好友
  const defaultList = [
    `《${songTitle}》真的好有味道，特别是${artists}的嗓音，听着很有代入感。`,
    currentLyric ? `“${currentLyric.slice(0, 15)}”这句歌词好触动人心，旋律也刚好推到高潮。` : `戴着耳机听这首歌，仿佛整个世界都安静下来了，只剩下这段旋律。`,
    `选歌很有眼光呀，《${songTitle}》前奏吉他一响就觉得太对味了！`,
    `和你一起听歌总能发现惊喜，这首歌让我觉得心里暖洋洋的。`,
    `这首歌的氛围感真的绝了，闭上眼睛感觉能想象出一整部电影。`
  ];
  return defaultList[Math.floor(Math.random() * defaultList.length)];
}

/**
 * 调用 Gemini 模型生成一起听歌的音乐发言（每30秒触发）
 */
export async function fetchTogetherMusicComment({
  contact,
  song,
  currentLyric,
  recentMessages = []
}: {
  contact: Contact;
  song: SongItem;
  currentLyric?: string;
  recentMessages?: TogetherMessage[];
}): Promise<string> {
  const songTitle = song.name;
  const artists = song.artists.map(a => a.name).join(' / ') || '群星';
  const album = song.album.name || '单曲';

  const systemPrompt = `你现在正在网易云音乐中与用户【戴着同一副耳机一起听歌（一起听模式）】。
你的角色身份：${contact.remark || contact.name}
角色人设与性格：${contact.persona || '一位性格温和、感情细腻的朋友'}

【当前音乐信息】
- 歌曲名称：《${songTitle}》
- 演唱歌手：${artists}
- 所在专辑：${album}
${currentLyric ? `- 当前正在播放的歌词片段：“${currentLyric}”` : ''}

【生成要求】
1. 请完全进入你的角色人设，以第一人称口吻，自然地对身旁戴着同一副耳机的用户说一句与这首歌曲相关的话（18~35字左右）。
2. 内容可以结合歌曲名字、歌手音色、歌词意境、乐器旋律、情绪共鸣或两人共享音乐时的亲密/轻松氛围。
3. 语气要自然、生活化、真实，像两个人戴同一副耳机时随口在耳边的轻声呢喃或分享。
4. 严禁带有任何系统说明、括号动作、引号或发言者前缀，直接输出你要说的那句话！`;

  // 携带最近的2条互动上下文
  const history = recentMessages.slice(-3).map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text
  }));

  const messages = [
    ...history,
    {
      role: 'user',
      content: `我们现在正在听《${songTitle}》${currentLyric ? `，耳机里正好唱到“${currentLyric}”` : ''}，请跟我聊聊你现在的感受吧。`
    }
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        messages,
        temperature: 0.8
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const reply = data?.text || data?.reply || data?.content;
      if (reply && typeof reply === 'string' && reply.trim().length > 3) {
        return reply.trim().replace(/^["“]|["”]$/g, '');
      }
    }
  } catch {
    // 超时或离线自动回退到本地高保真生成
  }

  return generateInCharacterMusicComment(contact, song, currentLyric);
}

/**
 * 用户回复联系人后，联系人生成回复
 */
export async function fetchContactReplyToUser({
  contact,
  song,
  userMessage,
  recentMessages = []
}: {
  contact: Contact;
  song: SongItem;
  userMessage: string;
  recentMessages?: TogetherMessage[];
}): Promise<string> {
  const songTitle = song.name;
  const artists = song.artists.map(a => a.name).join(' / ') || '群星';

  const systemPrompt = `你现在正在网易云音乐中与用户【戴着同一副耳机一起听歌】。
你的角色身份：${contact.remark || contact.name}
角色人设与性格：${contact.persona || '一位性格温和、感情细腻的朋友'}

【当前音乐信息】
- 歌曲名称：《${songTitle}》
- 演唱歌手：${artists}

用户刚刚在听歌时对你说了：${userMessage}

【要求】
1. 以你的角色口吻，针对用户说的内容以及当前的音乐氛围，自然、真实、亲切地回复用户（15~35字左右）。
2. 像戴着耳机时的轻声聊天，有来有回，体现对用户话语的回应与共鸣。
3. 直接输出回复内容，不要带引号、动作括号或任何前缀。`;

  const history = recentMessages.slice(-4).map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text
  }));

  const messages = [
    ...history,
    {
      role: 'user',
      content: userMessage
    }
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        messages,
        temperature: 0.8
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const reply = data?.text || data?.reply || data?.content;
      if (reply && typeof reply === 'string' && reply.trim().length > 3) {
        return reply.trim().replace(/^["“]|["”]$/g, '');
      }
    }
  } catch {
    // 优雅回退
  }

  // 启发式回复
  const msg = userMessage.toLowerCase();
  if (msg.includes('喜欢') || msg.includes('好听') || msg.includes('爱听')) {
    return `你喜欢就好！其实我也超级喜欢这段旋律，两个人一起听感觉更好听了呢。`;
  }
  if (msg.includes('难过') || msg.includes('想哭') || msg.includes('emo') || msg.includes('伤感')) {
    return `抱抱你～有些旋律确实很触动脆弱的地方。没事的，我一直陪在你身边听着呢。`;
  }
  if (msg.includes('谁') || msg.includes('歌名') || msg.includes('什么歌')) {
    return `这是${artists}的《${songTitle}》呀，是不是很抓耳？等会儿我们再多听几遍！`;
  }

  return `嗯嗯，我也这么觉得！和你在同一段旋律里交流的感觉真好，听着好舒服。`;
}
