'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * The sign-in is kept in sessionStorage, not localStorage. That means it ends
 * when the tab or browser is closed, so opening the admin later always asks
 * for a password. (Supabase's default keeps you signed in for weeks.)
 */
const browserSession = {
  getItem: (key: string) =>
    typeof window === 'undefined' ? null : window.sessionStorage.getItem(key),
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(key);
  },
};

// Remove sign-ins that older versions of this site saved in localStorage.
if (typeof window !== 'undefined') {
  try {
    Object.keys(window.localStorage)
      .filter((key) => /^sb-.*-auth-token/.test(key))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // storage can be blocked; nothing to clean up then
  }
}

/** Where the sign-in is stored in sessionStorage. */
export const AUTH_STORAGE_KEY = 'portfolio-admin-auth';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: browserSession,
    storageKey: AUTH_STORAGE_KEY,
  },
});
