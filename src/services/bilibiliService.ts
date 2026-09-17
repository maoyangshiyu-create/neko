import { Contact } from '../types/phone';

export interface BilibiliPage {
  cid: number;
  page: number;
  part: string;
}

export interface BilibiliVideoInfo {
  bvid: string;
  aid: number;
  cid: number;
  pages?: BilibiliPage[];
  title: string;
  desc: string;
  pic: string;
  owner: {
    name: string;
    face: string;
  };
  stat: {
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    like: number;
  };
}

export interface TucaoMessage {
  id: string;
  sender: 'user' | 'ai';
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: number;
}

export async function fetchVideoInfo(bvid: string): Promise<BilibiliVideoInfo> {
  const response = await fetch(`/api/bilibili/video-info?bvid=${bvid}`);
  if (!response.ok) {
    let errorMsg = `获取视频信息失败 (HTTP ${response.status})`;
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const error = await response.json();
        if (error?.error) errorMsg = error.error;
      }
    } catch {
      // Ignore JSON parse errors on error responses
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function generateTucao(
  videoInfo: BilibiliVideoInfo,
  contact: Contact,
  userComment?: string,
  context?: TucaoMessage[]
): Promise<string> {
  const response = await fetch('/api/bilibili/generate-tucao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoInfo: {
        title: videoInfo.title,
        desc: videoInfo.desc ? videoInfo.desc.slice(0, 300) : '',
        owner: { name: videoInfo.owner?.name || '' }
      },
      contactPersona: contact.persona,
      contactName: contact.name,
      userComment,
      context: context?.slice(-5).map(m => ({ role: m.sender, content: m.content }))
    })
  });

  if (!response.ok) {
    let errText = `生成吐槽失败 (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.error) errText = errJson.error;
    } catch {}
    throw new Error(errText);
  }

  const data = await response.json();
  if (!data?.tucao) {
    throw new Error('AI 返回的吐槽内容为空');
  }
  return data.tucao;
}
