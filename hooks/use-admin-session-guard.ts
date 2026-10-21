'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { IDLE_LIMIT_MS, MAX_SESSION_MS, WARNING_MS } from '@/lib/admin-session';

/**
 * Signs the admin out after a period of no activity, and after a maximum
 * session length. Shortly before an idle sign-out it reports how many
 * seconds are left so the page can show a warning.
 */
export function useAdminSessionGuard() {
  const { user, signOut } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActive = useRef(Date.now());
  // Keep the latest values in refs so the timer is not rebuilt on every render.
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;
  const startedAtRef = useRef<number | null>(null);
  startedAtRef.current = user?.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : null;

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    lastActive.current = Date.now();
    let done = false;

    const markActive = () => {
      lastActive.current = Date.now();
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;
    events.forEach((name) => window.addEventListener(name, markActive, { passive: true }));

    // Checking the clock each second also catches a laptop waking from sleep.
    const check = () => {
      if (done) return;
      const now = Date.now();
      const startedAt = startedAtRef.current;
      if (startedAt && now - startedAt > MAX_SESSION_MS) {
        done = true;
        signOutRef.current('expired');
        return;
      }
      const idle = now - lastActive.current;
      if (idle >= IDLE_LIMIT_MS) {
        done = true;
        signOutRef.current('idle');
        return;
      }
      setSecondsLeft(idle >= IDLE_LIMIT_MS - WARNING_MS ? Math.ceil((IDLE_LIMIT_MS - idle) / 1000) : null);
    };

    check();
    const timer = setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);

    return () => {
      events.forEach((name) => window.removeEventListener(name, markActive));
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [userId]);

  const stayActive = useCallback(() => {
    lastActive.current = Date.now();
    setSecondsLeft(null);
  }, []);

  return { secondsLeft, stayActive };
}
