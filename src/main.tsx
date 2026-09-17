import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MusicProvider } from './contexts/MusicContext';
import './index.css';

// Safe Storage Wrapper to prevent QuotaExceededError crashes
const originalSetItem = Storage.prototype.setItem;

function stripLargeBase64(str: string): string {
  return str.replace(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]{500,}/g, '');
}

Storage.prototype.setItem = function(key, value) {
  try {
    originalSetItem.call(this, key, value);
  } catch (e) {
    console.warn(`[Storage] Failed to set item for key "${key}". Attempting cleanup...`);
    try {
      // 1. Clean up temporary / cache keys (DO NOT delete the target key itself)
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.length; i++) {
        const k = this.key(i);
        if (k && k !== key && (
          k.startsWith('phone_calls_') ||
          k.startsWith('offline_scenedesc_') ||
          k.startsWith('phone_call_last_') ||
          k.startsWith('twitter_comments_') ||
          k.startsWith('twitter_local_') ||
          k.startsWith('selected_wedding_msg_') ||
          k.startsWith('wedding_roles_')
        )) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => this.removeItem(k));
      
      // Retry after cleaning cache
      originalSetItem.call(this, key, value);
    } catch (retryErr1) {
      console.warn(`[Storage] Storage still full for "${key}". Attempting base64 image strip...`);
      try {
        // 2. If value contains massive base64 images, strip them and retry
        const sanitizedValue = stripLargeBase64(value);
        originalSetItem.call(this, key, sanitizedValue);
      } catch (retryErr2) {
        console.warn(`[Storage] Quota exceeded for "${key}". Swallowing error to maintain in-memory stability.`);
        // Gracefully swallow so React runtime never crashes
      }
    }
  }
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MusicProvider>
      <App />
    </MusicProvider>
  </StrictMode>,
);
