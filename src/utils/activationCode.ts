import { isCodeActivated } from './themeStoreDB';

/**
 * 主题商店面包激活码校验 & 生成工具
 * 支持 16 位短激活码 (带连字符 19 位：BD00-64A1-B2C3-D4E5)
 * 纯前端 Web Crypto SHA-256 签名防伪，20位以内，即开即用
 */

export const BREAD_SECRET_SALT = 'WEPHONE_THEME_STORE_BREAD_SALT_2026_KEY';

export interface CodePayload {
  bread: number;
  expire: number; // 毫秒级时间戳，0 表示永不过期
  serial: string; // 唯一序列号
}

export interface VerifyResult {
  valid: boolean;
  error?: string;
  payload?: CodePayload;
}

// 预设管理员/测试赠送码
export const PRESET_BREAD_CODES: Record<string, number> = {
  BREAD888: 888,
  BREAD100: 100,
  BREAD200: 200,
  BREAD500: 500,
  BREAD9999: 9999,
  WEPHONE888: 888,
  VIP888: 888,
};

/**
 * SHA-256 计算 Hex
 */
async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * 生成 16 位面包短激活码（格式：BD00-64A1-B2C3-D4E5，纯字符 16 位，带连字符 19 位，20位以内）
 * @param bread 面包数量 (1 ~ 65535)
 */
export async function generateShortBreadCode(bread = 100): Promise<string> {
  const prefix = 'BD';
  const breadClamp = Math.max(1, Math.min(65535, Math.floor(bread)));
  const breadHex = breadClamp.toString(16).padStart(4, '0').toUpperCase();

  // 4 字符随机 Nonce (Hex) 保证每个激活码序列号唯一
  const nonceArr = new Uint8Array(2);
  crypto.getRandomValues(nonceArr);
  const nonceHex = Array.from(nonceArr).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  // Payload: 10 字符 = BD (2) + breadHex (4) + nonceHex (4)
  const payload = `${prefix}${breadHex}${nonceHex}`;

  // Checksum: SHA-256(SALT:payload) 前 6 位
  const hash = await sha256Hex(`${BREAD_SECRET_SALT}:${payload}`);
  const checksum = hash.substring(0, 6);

  // 16 位纯字符
  const raw16 = `${payload}${checksum}`;

  // 格式化为 4-4-4-4
  return `${raw16.slice(0, 4)}-${raw16.slice(4, 8)}-${raw16.slice(8, 12)}-${raw16.slice(12, 16)}`;
}

/**
 * 校验主题商店激活码 (支持 16 位短码、预设福利码及旧版代码)
 */
export async function verifyActivationCode(code: string): Promise<VerifyResult> {
  const trimmed = code.trim().replace(/[\s\r\n]/g, '');
  if (!trimmed) {
    return { valid: false, error: '请输入激活码' };
  }

  const upperRaw = trimmed.replace(/-/g, '').toUpperCase();

  // 1. 检查预设福利码
  if (PRESET_BREAD_CODES[upperRaw] !== undefined) {
    const serial = `PRESET_${upperRaw}`;
    if (isCodeActivated(serial)) {
      return { valid: false, error: '该福利码已被使用过，无法重复兑换' };
    }
    return {
      valid: true,
      payload: {
        bread: PRESET_BREAD_CODES[upperRaw],
        expire: 0,
        serial,
      },
    };
  }

  // 2. 检查 16 位短激活码 (BD00-64A1-B2C3-D4E5)
  if (upperRaw.length === 16 && upperRaw.startsWith('BD')) {
    const payload = upperRaw.slice(0, 10);
    const checksum = upperRaw.slice(10, 16);

    const expectedHash = await sha256Hex(`${BREAD_SECRET_SALT}:${payload}`);
    const expectedChecksum = expectedHash.substring(0, 6);

    if (checksum !== expectedChecksum) {
      return { valid: false, error: '激活码无效或已被篡改，防伪校验不通过' };
    }

    // 检查重放 (是否已兑换)
    if (isCodeActivated(upperRaw)) {
      return { valid: false, error: '该激活码已被使用过，无法重复兑换' };
    }

    const breadHex = payload.slice(2, 6);
    const breadAmount = parseInt(breadHex, 16) || 100;

    return {
      valid: true,
      payload: {
        bread: breadAmount,
        expire: 0,
        serial: upperRaw,
      },
    };
  }

  // 3. 兼容旧版 RSA-PSS 代码
  if (trimmed.includes('.')) {
    return { valid: false, error: '旧版长激活码已升级，请使用 16 位短激活码' };
  }

  return { valid: false, error: '激活码格式错误（请输入 16 位短激活码，例如 BD00-64XX-XXXX-XXXX）' };
}
