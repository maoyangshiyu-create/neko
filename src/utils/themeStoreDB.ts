/**
 * LocalStorage helpers for Theme Store: Bread Balance, Activated Codes, Purchased Themes
 */

export const STORAGE_KEYS = {
  BREAD_BALANCE: 'wephone_bread_balance_v1',
  ACTIVATED_CODES: 'wephone_activated_codes_v1',
  PURCHASED_THEMES: 'wephone_purchased_themes_v1',
} as const;

export function getBreadBalance(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.BREAD_BALANCE);
    if (val !== null) {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function setBreadBalance(amount: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BREAD_BALANCE, Math.max(0, amount).toString());
  } catch (e) {
    console.error('Error saving bread balance:', e);
  }
}

export function addBread(amount: number): number {
  const current = getBreadBalance();
  const updated = current + amount;
  setBreadBalance(updated);
  return updated;
}

export function deductBread(amount: number): boolean {
  const current = getBreadBalance();
  if (current < amount) return false;
  setBreadBalance(current - amount);
  return true;
}

export function getActivatedCodes(): string[] {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ACTIVATED_CODES);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

export function addActivatedCode(serial: string): void {
  try {
    const current = getActivatedCodes();
    if (!current.includes(serial)) {
      current.push(serial);
      localStorage.setItem(STORAGE_KEYS.ACTIVATED_CODES, JSON.stringify(current));
    }
  } catch (e) {
    console.error('Error saving activated code:', e);
  }
}

export function isCodeActivated(serial: string): boolean {
  const codes = getActivatedCodes();
  return codes.includes(serial);
}

export function getPurchasedThemeIds(): string[] {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.PURCHASED_THEMES);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

export function addPurchasedThemeId(themeId: string): void {
  try {
    const current = getPurchasedThemeIds();
    if (!current.includes(themeId)) {
      current.push(themeId);
      localStorage.setItem(STORAGE_KEYS.PURCHASED_THEMES, JSON.stringify(current));
    }
  } catch (e) {
    console.error('Error saving purchased theme ID:', e);
  }
}

export function isThemePurchased(themeId: string): boolean {
  const ids = getPurchasedThemeIds();
  return ids.includes(themeId);
}
