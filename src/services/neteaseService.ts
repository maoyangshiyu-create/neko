export interface SongArtist {
  id: number;
  name: string;
}

export interface SongAlbum {
  id: number;
  name: string;
  picUrl?: string;
}

export interface SongItem {
  id: number;
  name: string;
  artists: SongArtist[];
  album: SongAlbum;
  duration: number; // in milliseconds
  picUrl?: string;
}

export interface NeteaseUserProfile {
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature?: string;
  vipType?: number;
}

export interface UserPlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  playCount: number;
  subscribed?: boolean;
  userId?: number;
  description?: string;
  creator?: {
    userId: number;
    nickname: string;
    avatarUrl?: string;
  };
}

export const NETEASE_STORAGE_KEYS = {
  COOKIE: 'wephone_netease_cookie',
  USER: 'wephone_netease_user',
  PLAYLIST: 'wephone_netease_playlist',
  CURRENT_SONG: 'wephone_netease_current_song'
};

export function getSavedCookie(): string {
  try {
    return localStorage.getItem(NETEASE_STORAGE_KEYS.COOKIE) || '';
  } catch {
    return '';
  }
}

export function saveCookie(cookie: string): void {
  try {
    if (cookie) {
      localStorage.setItem(NETEASE_STORAGE_KEYS.COOKIE, cookie);
    } else {
      localStorage.removeItem(NETEASE_STORAGE_KEYS.COOKIE);
    }
  } catch (e) {
    console.error('Failed to save NetEase cookie:', e);
  }
}

export function getSavedUser(): NeteaseUserProfile | null {
  try {
    const raw = localStorage.getItem(NETEASE_STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: NeteaseUserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(NETEASE_STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(NETEASE_STORAGE_KEYS.USER);
    }
  } catch (e) {
    console.error('Failed to save NetEase user:', e);
  }
}

/**
 * 1. 获取二维码 unikey
 */
export async function fetchQrKey(): Promise<string> {
  const res = await fetch(`/login/qr/key?timestamp=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`获取二维码 Key 失败 (${res.status})`);
  }
  const data = await res.json();
  const unikey = data?.data?.unikey;
  if (!unikey) {
    throw new Error('未获取到有效 unikey');
  }
  return unikey;
}

/**
 * 2. 获取二维码图片的 base64 与 URL
 */
export async function fetchQrCreate(key: string): Promise<{ qrurl: string; qrimg: string }> {
  const res = await fetch(`/login/qr/create?key=${encodeURIComponent(key)}&platform=web&qrimg=true&timestamp=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`生成二维码失败 (${res.status})`);
  }
  const data = await res.json();
  const qrimg = data?.data?.qrimg;
  const qrurl = data?.data?.qrurl;
  if (!qrimg) {
    throw new Error('二维码图片生成失败');
  }
  return { qrurl, qrimg };
}

/**
 * 3. 轮询二维码扫码状态
 * 800: 二维码过期
 * 801: 等待扫码
 * 802: 待确认
 * 803: 登录成功
 */
export async function checkQrStatus(key: string): Promise<{ code: number; message: string; cookie?: string }> {
  const res = await fetch(`/login/qr/check?key=${encodeURIComponent(key)}&noCookie=true&timestamp=${Date.now()}`);
  if (!res.ok) {
    return { code: 500, message: `校验失败 (${res.status})` };
  }
  const data = await res.json();
  return {
    code: data?.code ?? 500,
    message: data?.message || '',
    cookie: data?.cookie || undefined
  };
}

/**
 * 4. 获取当前用户登录账号及资料
 */
export async function fetchUserAccount(cookie?: string): Promise<NeteaseUserProfile | null> {
  const activeCookie = cookie || getSavedCookie();
  if (!activeCookie) return null;

  const encodedCookie = encodeURIComponent(activeCookie);

  // 辅助函数：根据 userId 进一步获取详细资料（昵称、头像等完整信息）
  const enrichProfileByUid = async (uid: number): Promise<NeteaseUserProfile | null> => {
    try {
      const detailRes = await fetch(`/user/detail?uid=${uid}&cookie=${encodedCookie}&timestamp=${Date.now()}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        const dp = detailData?.profile;
        if (dp) {
          return {
            userId: dp.userId || uid,
            nickname: dp.nickname || '网易云音乐用户',
            avatarUrl: (dp.avatarUrl || '').replace(/^http:/, 'https:'),
            signature: dp.signature,
            vipType: dp.vipType || 0
          };
        }
      }
    } catch {
      // Ignore enrichment error
    }
    return null;
  };

  try {
    // 方案一：优先通过 /login/status 获取（网易云官方 Web 端获取账号与个人资料接口）
    const statusRes = await fetch(`/login/status?cookie=${encodedCookie}&timestamp=${Date.now()}`);
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      const p = statusData?.data?.profile || statusData?.profile;
      const a = statusData?.data?.account || statusData?.account;

      if (p && (p.userId || p.id)) {
        const uid = p.userId || p.id;
        // 如果已有有效昵称
        if (p.nickname && p.nickname !== '云音乐用户') {
          return {
            userId: uid,
            nickname: p.nickname,
            avatarUrl: (p.avatarUrl || '').replace(/^http:/, 'https:'),
            signature: p.signature,
            vipType: p.vipType || a?.vipType || 0
          };
        }
        // 若昵称为空或默认，尝试 user_detail 补充
        const enriched = await enrichProfileByUid(uid);
        if (enriched) return enriched;

        return {
          userId: uid,
          nickname: p.nickname || '网易云音乐用户',
          avatarUrl: (p.avatarUrl || '').replace(/^http:/, 'https:'),
          signature: p.signature,
          vipType: p.vipType || 0
        };
      }

      if (a && a.id) {
        const enriched = await enrichProfileByUid(a.id);
        if (enriched) return enriched;

        return {
          userId: a.id,
          nickname: a.userName?.startsWith('1000_') ? '网易云音乐用户' : (a.userName || '网易云音乐用户'),
          avatarUrl: 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg',
          vipType: a.vipType || 0
        };
      }
    }

    // 方案二：备用 /user/account
    const accRes = await fetch(`/user/account?cookie=${encodedCookie}&timestamp=${Date.now()}`);
    if (accRes.ok) {
      const accData = await accRes.json();
      const p = accData?.profile;
      const a = accData?.account;

      if (p && (p.userId || p.id)) {
        const uid = p.userId || p.id;
        if (p.nickname) {
          return {
            userId: uid,
            nickname: p.nickname,
            avatarUrl: (p.avatarUrl || '').replace(/^http:/, 'https:'),
            signature: p.signature,
            vipType: p.vipType || 0
          };
        }
        const enriched = await enrichProfileByUid(uid);
        if (enriched) return enriched;
      }

      if (a && a.id) {
        const enriched = await enrichProfileByUid(a.id);
        if (enriched) return enriched;

        return {
          userId: a.id,
          nickname: a.userName || '网易云音乐用户',
          avatarUrl: 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg',
          vipType: a.vipType || 0
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('获取用户资料失败:', err);
    return null;
  }
}

/**
 * 4.1 使用 Cookie 直接登录 (支持完整 Cookie 或单独 MUSIC_U)
 */
export async function loginWithCookie(rawCookie: string): Promise<{ profile: NeteaseUserProfile; cookie: string }> {
  let cookie = rawCookie.trim();
  if (!cookie) {
    throw new Error('请输入有效的 Cookie 或 MUSIC_U');
  }

  // 格式化：若用户只输入了 MUSIC_U 的值
  if (!cookie.includes('=')) {
    cookie = `MUSIC_U=${cookie};`;
  } else if (!cookie.includes(';')) {
    cookie = `${cookie};`;
  }

  const profile = await fetchUserAccount(cookie);
  if (!profile) {
    throw new Error('Cookie 校验未通过，请检查是否已过期或复制不完整');
  }

  saveCookie(cookie);
  return { profile, cookie };
}

/**
 * 4.2 游客快速登录
 */
export async function loginAsVisitor(): Promise<{ profile: NeteaseUserProfile; cookie: string }> {
  const res = await fetch(`/register/anonimous?timestamp=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`游客登录请求失败 (${res.status})`);
  }
  const data = await res.json();
  const cookie = data.cookie;
  if (!cookie) {
    throw new Error('未能获取游客登录凭证');
  }

  saveCookie(cookie);
  const profile: NeteaseUserProfile = {
    userId: data.userId || 100000,
    nickname: '网易云游客用户',
    avatarUrl: 'https://p1.music.126.net/VnZiSabbAZRGE4h93driUQ==/109951164232742911.jpg',
    vipType: 0
  };
  return { profile, cookie };
}

/**
 * 5. 搜索单曲列表
 */
export async function searchSongs(keywords: string, limit = 20, offset = 0): Promise<SongItem[]> {
  if (!keywords.trim()) return [];

  const cookie = getSavedCookie();
  const cookieParam = cookie ? `&cookie=${encodeURIComponent(cookie)}` : '';
  const url = `/search?keywords=${encodeURIComponent(keywords.trim())}&type=1&limit=${limit}&offset=${offset}${cookieParam}&timestamp=${Date.now()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`搜索失败 (${res.status})`);
  }
  const data = await res.json();
  const rawSongs = data?.result?.songs || [];

  return rawSongs.map((s: any) => {
    const pic = s.al?.picUrl || s.album?.artist?.img1v1Url || s.artists?.[0]?.img1v1Url || '';
    return {
      id: s.id,
      name: s.name,
      artists: (s.artists || []).map((a: any) => ({ id: a.id, name: a.name })),
      album: {
        id: s.album?.id || s.al?.id || 0,
        name: s.album?.name || s.al?.name || '未知专辑',
        picUrl: pic ? pic.replace(/^http:/, 'https:') : undefined
      },
      duration: s.duration || s.dt || 0,
      picUrl: pic ? pic.replace(/^http:/, 'https:') : undefined
    };
  });
}

/**
 * 6. 获取歌曲音频播放地址
 */
export async function fetchSongPlayUrl(id: number | string): Promise<string> {
  const cookie = getSavedCookie();
  const cookieParam = cookie ? `&cookie=${encodeURIComponent(cookie)}` : '';
  const res = await fetch(`/song/url?id=${id}${cookieParam}&timestamp=${Date.now()}`);
  if (!res.ok) {
    return `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
  }
  const data = await res.json();
  let songUrl = data?.data?.[0]?.url;
  if (songUrl && typeof songUrl === 'string') {
    songUrl = songUrl.replace(/^http:/, 'https:');
    return songUrl;
  }
  // 保底流媒体播放地址
  return `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
}

/**
 * 7. 获取歌曲歌词
 */
export async function fetchSongLyric(id: number | string): Promise<string> {
  const cookie = getSavedCookie();
  const cookieParam = cookie ? `&cookie=${encodeURIComponent(cookie)}` : '';
  try {
    const res = await fetch(`/lyric?id=${id}${cookieParam}&timestamp=${Date.now()}`);
    if (!res.ok) return '';
    const data = await res.json();
    return data?.lrc?.lyric || '';
  } catch {
    return '';
  }
}

/**
 * 8. 获取用户的网易云歌单列表（包括我喜欢的音乐、自建歌单与收藏歌单）
 */
export async function fetchUserPlaylists(userId: number, limit = 50, cookie?: string): Promise<UserPlaylist[]> {
  if (!userId) return [];
  const activeCookie = cookie || getSavedCookie();
  const cookieParam = activeCookie ? `&cookie=${encodeURIComponent(activeCookie)}` : '';
  const res = await fetch(`/user/playlist?uid=${userId}&limit=${limit}${cookieParam}&timestamp=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`获取用户歌单失败 (${res.status})`);
  }
  const data = await res.json();
  const rawPlaylists = data?.playlist || [];

  return rawPlaylists.map((p: any) => ({
    id: p.id,
    name: p.name,
    coverImgUrl: (p.coverImgUrl || '').replace(/^http:/, 'https:'),
    trackCount: p.trackCount || 0,
    playCount: p.playCount || 0,
    subscribed: !!p.subscribed,
    userId: p.userId,
    description: p.description,
    creator: p.creator ? {
      userId: p.creator.userId,
      nickname: p.creator.nickname,
      avatarUrl: (p.creator.avatarUrl || '').replace(/^http:/, 'https:')
    } : undefined
  }));
}

/**
 * 9. 获取歌单详情以及完整歌曲列表
 */
export async function fetchPlaylistDetail(playlistId: number, cookie?: string): Promise<{ playlist: UserPlaylist; songs: SongItem[] }> {
  const activeCookie = cookie || getSavedCookie();
  const cookieParam = activeCookie ? `&cookie=${encodeURIComponent(activeCookie)}` : '';
  const res = await fetch(`/playlist/detail?id=${playlistId}${cookieParam}&timestamp=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`获取歌单详情失败 (${res.status})`);
  }
  const data = await res.json();
  const p = data?.playlist;
  if (!p) {
    throw new Error('歌单数据为空或不存在');
  }

  const rawTracks = p.tracks || [];
  const songs: SongItem[] = rawTracks.map((s: any) => {
    const pic = s.al?.picUrl || s.album?.picUrl || '';
    const artists = (s.ar || s.artists || []).map((a: any) => ({ id: a.id, name: a.name }));
    return {
      id: s.id,
      name: s.name,
      artists,
      album: {
        id: s.al?.id || s.album?.id || 0,
        name: s.al?.name || s.album?.name || '未知专辑',
        picUrl: pic ? pic.replace(/^http:/, 'https:') : undefined
      },
      duration: s.dt || s.duration || 0,
      picUrl: pic ? pic.replace(/^http:/, 'https:') : undefined
    };
  });

  const playlist: UserPlaylist = {
    id: p.id,
    name: p.name,
    coverImgUrl: (p.coverImgUrl || '').replace(/^http:/, 'https:'),
    trackCount: p.trackCount || songs.length,
    playCount: p.playCount || 0,
    subscribed: !!p.subscribed,
    userId: p.userId,
    description: p.description,
    creator: p.creator ? {
      userId: p.creator.userId,
      nickname: p.creator.nickname,
      avatarUrl: (p.creator.avatarUrl || '').replace(/^http:/, 'https:')
    } : undefined
  };

  return { playlist, songs };
}

/**
 * 辅助：格式化毫秒为 mm:ss
 */
export function formatDuration(ms: number): string {
  if (!ms || isNaN(ms)) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
