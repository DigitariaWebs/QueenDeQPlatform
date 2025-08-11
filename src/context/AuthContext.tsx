import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '@/services/authService';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial hydrate from localStorage
    try {
      const json = localStorage.getItem('auth_user');
      setUser(json ? (JSON.parse(json) as AuthUser) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth_user') {
        try {
          setUser(e.newValue ? (JSON.parse(e.newValue) as AuthUser) : null);
        } catch {
          setUser(null);
        }
      }
    };

    const onAuthChanged = () => {
      try {
        const json = localStorage.getItem('auth_user');
        setUser(json ? (JSON.parse(json) as AuthUser) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:changed', onAuthChanged as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:changed', onAuthChanged as EventListener);
    };
  }, []);

  const value = useMemo(() => ({ user, loading, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


