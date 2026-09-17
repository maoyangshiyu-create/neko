/**
 * Bilibili Input Parser
 * Supports:
 * 1. BV ID: BV1xxxxxxxxxx
 * 2. Full URL: https://www.bilibili.com/video/BV1xxxxxxxxxx/?spm_id_from=...
 * 3. Short Link: https://b23.tv/xxxxxxx (Requires backend redirect resolution)
 */

export interface BilibiliInfo {
  bvid: string;
  page: number;
}

export function parseBilibiliInput(input: string): BilibiliInfo | null {
  const text = input.trim();
  if (!text) return null;

  // 1. Direct BV ID
  const bvMatch = text.match(/BV[0-9A-Za-z]{10}/i);
  if (bvMatch) {
    const bvid = bvMatch[0];
    const pMatch = text.match(/[?&]p=([0-9]+)/);
    return {
      bvid,
      page: pMatch ? parseInt(pMatch[1]) : 1
    };
  }

  // 2. URL (Generic)
  try {
    const url = new URL(text.startsWith('http') ? text : `https://${text}`);
    const bvidFromPath = url.pathname.match(/BV[0-9A-Za-z]{10}/i);
    if (bvidFromPath) {
      const p = url.searchParams.get('p');
      return {
        bvid: bvidFromPath[0],
        page: p ? parseInt(p) : 1
      };
    }
  } catch (e) {
    // Ignore URL parse errors
  }

  return null;
}

/**
 * For b23.tv links, we need the server to resolve the redirect
 */
export async function resolveB23Link(url: string): Promise<BilibiliInfo | null> {
  if (!url.includes('b23.tv')) return null;

  try {
    const response = await fetch(`/api/bilibili/resolve-b23?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (data.bvid) {
      return {
        bvid: data.bvid,
        page: data.page || 1
      };
    }
  } catch (e) {
    console.error('Failed to resolve b23 link:', e);
  }
  return null;
}
