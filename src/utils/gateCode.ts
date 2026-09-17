/**
 * 网页门禁激活码校验 & 生成工具
 * 支持 16 位短激活码 (带连字符 19 位：WP00-XXXX-XXXX-XXXX)
 * 纯前端 Web Crypto SHA-256 签名校验，20位以内，便于分享与输入
 */

export const GATE_SECRET_SALT = 'WEPHONE_ROCOCO_GATE_SECRET_SALT_2026_KEY';
const BASE_EPOCH = 1735689600000; // 基准时间戳：2025-01-01 00:00:00 UTC

// 预设管理员应急激活码（不区分大小写）
export const MASTER_GATE_CODES = new Set([
  'WEPHONE2026',
  'WEPHONE888',
  'WEPHONE666',
  'VIP2026'
]);

// RSA 公钥（保留以向下兼容旧版 RSA 激活码）
export const GATE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApkrXphcJKGWKM/12wKg4
BmrtZ36McIPnt1m2Uq0wBefi8aabBgLLT7zy0uJlWCpZAn0qQ3VLpn1/38xq14rr
yKmWNkvkxpyvrF2LjClxRULaWjTKVRdrXlDntcB5zye3eI1VPi83pQ7Lz8EECMq8
CIAcy2VTFLJCpgF9f2z0zcfXo9IfYZxIubnCXXIcQZLCk1N6C8WKhxHb1rLBM/LZ
q8Px0/tOLMft4X9/X39G2PeO/DLXpoac7MzMU/dHQihr5ZOOPyqgjyhymvnlnEpe
HTmVnYSCF1x9lJ76pevToxlwO1HEX+mBXkDTY/AThTillD9Td06H8RtGdwoKQGV2
XQIDAQAB
-----END PUBLIC KEY-----`;

/**
 * SHA-256 计算 Hex 字符串
 */
export async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * 生成 16 位短激活码（格式：WP00-XXXX-XXXX-XXXX，带连字符共 19 位，20位以内）
 * @param expireDays 有效天数（0 表示永久有效）
 */
export async function generateShortGateCode(expireDays = 0): Promise<string> {
  const prefix = 'WP';
  let expireHex = '0000';
  if (expireDays > 0) {
    const expireTimestamp = Date.now() + expireDays * 86400 * 1000;
    const daysFromEpoch = Math.max(1, Math.floor((expireTimestamp - BASE_EPOCH) / (86400 * 1000)));
    expireHex = (daysFromEpoch & 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
  }
  
  // 4 字符随机 Nonce (Hex)
  const nonceArr = new Uint8Array(2);
  crypto.getRandomValues(nonceArr);
  const nonceHex = Array.from(nonceArr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  // Payload: 10 字符 = WP (2) + expireHex (4) + nonceHex (4)
  const payload = `${prefix}${expireHex}${nonceHex}`;
  
  // Checksum: SHA-256(SALT:payload) 前 6 位
  const hash = await sha256Hex(`${GATE_SECRET_SALT}:${payload}`);
  const checksum = hash.substring(0, 6);
  
  // 16 位纯字符
  const raw16 = `${payload}${checksum}`;
  
  // 格式化为 4-4-4-4
  return `${raw16.slice(0, 4)}-${raw16.slice(4, 8)}-${raw16.slice(8, 12)}-${raw16.slice(12, 16)}`;
}

/**
 * 校验门禁激活码（支持 20 位以内短码、管理员码及 RSA 兼容码）
 */
export async function verifyGateCode(code: string): Promise<{
  valid: boolean;
  error?: string;
  payload?: { bread?: number; expire: number; serial: string; type?: string };
}> {
  try {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: '请输入门禁激活码' };
    }

    const trimmed = code.trim().replace(/[\s\r\n]/g, '');
    if (!trimmed) {
      return { valid: false, error: '激活码不能为空' };
    }

    // 1. 检查管理员预置码
    const upperRaw = trimmed.replace(/-/g, '').toUpperCase();
    if (MASTER_GATE_CODES.has(upperRaw) || MASTER_GATE_CODES.has(trimmed.toUpperCase())) {
      return {
        valid: true,
        payload: {
          expire: 0,
          serial: `ADMIN_${upperRaw}`,
          type: 'master'
        }
      };
    }

    // 2. 检查 16 位短激活码（含或不含连字符，长度在 16~19 位）
    if (upperRaw.length === 16 && upperRaw.startsWith('WP')) {
      const payload = upperRaw.slice(0, 10);
      const checksum = upperRaw.slice(10, 16);
      
      const expectedHash = await sha256Hex(`${GATE_SECRET_SALT}:${payload}`);
      const expectedChecksum = expectedHash.substring(0, 6);
      
      if (checksum !== expectedChecksum) {
        return { valid: false, error: '门禁激活码无效或已被篡改' };
      }
      
      const expireHex = payload.slice(2, 6);
      let expireTimestamp = 0;
      if (expireHex !== '0000') {
        const daysFromEpoch = parseInt(expireHex, 16);
        expireTimestamp = BASE_EPOCH + (daysFromEpoch + 1) * 86400 * 1000;
        if (Date.now() > expireTimestamp) {
          return { valid: false, error: '门禁激活码已过期，请获取最新激活码' };
        }
      }
      
      return {
        valid: true,
        payload: {
          expire: expireTimestamp,
          serial: upperRaw,
          type: 'short_code'
        }
      };
    }

    // 3. 兼容旧版 RSA-PSS Base64URL 激活码 (Payload.Signature 格式)
    if (trimmed.includes('.')) {
      const parts = trimmed.split('.');
      if (parts.length === 2) {
        return await verifyLegacyRsaCode(parts[0], parts[1]);
      }
    }

    return { valid: false, error: '激活码格式不正确（请输入 16 位短激活码，如 WP00-XXXX-XXXX-XXXX）' };
  } catch (err: any) {
    return { valid: false, error: err?.message || '门禁码校验异常' };
  }
}

/**
 * 校验旧版 RSA-PSS 代码
 */
async function verifyLegacyRsaCode(payloadB64: string, signatureB64: string) {
  try {
    function b64UrlDecode(str: string): Uint8Array {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) base64 += '=';
      const raw = atob(base64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return bytes;
    }

    const payloadString = new TextDecoder().decode(b64UrlDecode(payloadB64));
    const payloadData = JSON.parse(payloadString);

    if (payloadData.expire && payloadData.expire > 0 && payloadData.expire < Date.now()) {
      return { valid: false, error: '门禁码已过期' };
    }

    const cleanPem = GATE_PUBLIC_KEY_PEM
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');
    const binaryDer = b64UrlDecode(cleanPem);

    const publicKey = await crypto.subtle.importKey(
      'spki',
      binaryDer.buffer as ArrayBuffer,
      { name: 'RSA-PSS', hash: 'SHA-256' },
      true,
      ['verify']
    );

    const signatureBytes = b64UrlDecode(signatureB64);
    const dataBytes = new TextEncoder().encode(payloadB64);

    const isValid = await crypto.subtle.verify(
      { name: 'RSA-PSS', saltLength: 32 },
      publicKey,
      signatureBytes,
      dataBytes
    );

    if (!isValid) {
      return { valid: false, error: '门禁码签名验证失败' };
    }

    return { valid: true, payload: payloadData };
  } catch {
    return { valid: false, error: '旧版激活码解析失败' };
  }
}
