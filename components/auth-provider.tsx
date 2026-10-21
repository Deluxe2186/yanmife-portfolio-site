'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, AUTH_STORAGE_KEY } from '@/lib/supabase/client';
import { SIGNOUT_REASON_KEY, type SignOutReason } from '@/lib/admin-session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Pass a reason when the site signs you out itself, so the login page can explain. */
  signOut: (reason?: SignOutReason) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: 'not implemented' }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async (reason?: SignOutReason) => {
    try {
      if (reason) sessionStorage.setItem(SIGNOUT_REASON_KEY, reason);
      else sessionStorage.removeItem(SIGNOUT_REASON_KEY);
    } catch {
      // the message is only a courtesy
    }
    // Ask the server to end the session. If that call fails (for example you are
    // offline), the library keeps the session stored. So clear it from this
    // browser ourselves, otherwise the admin would stay open.
    const clearHere = () => {
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // ignore
      }
      setSession(null);
      setUser(null);
    };
    try {
      const { error } = await supabase.auth.signOut();
      if (error) clearHere();
    } catch {
      clearHere();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
