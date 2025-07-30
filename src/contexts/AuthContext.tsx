import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'client';
}

interface AuthContextType {
  user: User | null;
  login: () => Promise<boolean>;
  register: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // No user, no auth
  const value: AuthContextType = {
    user: null,
    login: async () => false,
    register: async () => false,
    logout: () => {},
    isLoading: false,
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
