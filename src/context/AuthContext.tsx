import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
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
  const { isAuthenticated, isLoading: auth0Loading, user: auth0User } = useAuth0();

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

  // Simplified Auth0 handling - let Auth0 manage its own state
  useEffect(() => {
    if (isAuthenticated && auth0User && !auth0Loading) {
      // Simple check - if Auth0 says we're authenticated, consider ourselves logged in
      // The backend will handle the actual user creation/validation
      const auth0UserData = {
        id: auth0User.sub || '',
        email: auth0User.email || '',
        name: auth0User.name || auth0User.nickname || 'Auth0 User',
        role: 'Tiare',
        isPremium: false,
        authProvider: 'auth0'
      };

      // Store in localStorage to persist the session
      localStorage.setItem('auth_user', JSON.stringify(auth0UserData));
      localStorage.setItem('auth_token', 'auth0-session'); // Placeholder token

      setUser(auth0UserData);
      window.dispatchEvent(new Event('auth:changed'));
    }
  }, [isAuthenticated, auth0User, auth0Loading]);

  const value = useMemo(() => ({ user, loading: loading || auth0Loading, setUser }), [user, loading, auth0Loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


