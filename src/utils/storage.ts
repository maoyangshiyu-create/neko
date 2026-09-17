/**
 * Robust Dual Storage Layer (IndexedDB + localStorage fallback)
 * Solves the strict ~5MB quota limit of browser localStorage for themes with base64 images,
 * wallpapers, custom bubbles, and icons.
 */

const DB_NAME = 'phone_sim_storage_v1';
const STORE_NAME = 'key_value_store';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[Storage] IndexedDB open error, using localStorage fallback');
          resolve(null);
        };
      } catch (err) {
        console.warn('[Storage] IndexedDB initialization failed:', err);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await getIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  const db = await getIDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function idbRemove(key: string): Promise<boolean> {
  const db = await getIDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function idbClear(): Promise<boolean> {
  const db = await getIDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Clears all data from IndexedDB and localStorage
 */
export async function clearStorage(): Promise<void> {
  await idbClear();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.clear();
    } catch {
      // Ignore
    }
  }
}

/**
 * Strips huge base64 strings so an object fits inside localStorage's 5MB quota
 */
function sanitizeForLocalStorage(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLocalStorage(item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.startsWith('data:image/') && value.length > 50000) {
      // Omit giant base64 images from localStorage (they are stored safely in IndexedDB)
      result[key] = '';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeForLocalStorage(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Saves data to IndexedDB (complete data with large assets) and localStorage (compacted if necessary)
 */
export async function saveItem<T>(key: string, value: T): Promise<void> {
  // 1. Always save full uncompressed data to IndexedDB
  await idbSet(key, value);

  // 2. Also attempt to save to localStorage for instant synchronous hydration
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
    } catch (quotaError) {
      // LocalStorage quota exceeded (typical for base64 themes & wallpapers)
      console.warn(`[Storage] LocalStorage quota exceeded for "${key}", saving sanitized version`);
      try {
        const sanitized = sanitizeForLocalStorage(value);
        window.localStorage.setItem(key, JSON.stringify(sanitized));
      } catch (err) {
        console.warn(`[Storage] Failed to save sanitized version for "${key}" to localStorage:`, err);
      }
    }
  }
}

/**
 * Loads data from IndexedDB, falling back to localStorage
 */
export async function loadItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const idbData = await idbGet<T>(key);
    if (idbData !== null && idbData !== undefined) {
      return idbData;
    }
  } catch (e) {
    console.warn(`[Storage] Failed to load "${key}" from IndexedDB:`, e);
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (e) {
      console.warn(`[Storage] Failed to parse "${key}" from localStorage:`, e);
    }
  }

  return fallback;
}

/**
 * Synchronous initial reader from localStorage for instant 0ms mount
 */
export function getInitialSyncItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const saved = window.localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (e) {
    // Ignore error, fallback
  }
  return fallback;
}
