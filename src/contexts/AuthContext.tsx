import { createContext, useContext, useState, useEffect } from 'react';
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
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Comptes simulés
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'client@example.com',
    firstName: 'Client',
    lastName: 'User',
    role: 'client'
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulation d'un délai d'API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Vérification des credentials (simulation)
      const foundUser = mockUsers.find(u => u.email === email);
      
      if (foundUser && password === 'password123') {
        setUser(foundUser);
        localStorage.setItem('auth_user', JSON.stringify(foundUser));
        return true;
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulation d'un délai d'API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Vérifier si l'email existe déjà
      const existingUser = mockUsers.find(u => u.email === userData.email);
      if (existingUser) {
        return false; // Email déjà utilisé
      }
      
      // Créer un nouveau utilisateur (client par défaut)
      const newUser: User = {
        id: (mockUsers.length + 1).toString(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'client'
      };
      
      mockUsers.push(newUser);
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  // Restaurer l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading
    }}>
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
