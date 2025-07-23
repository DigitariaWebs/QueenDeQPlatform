// Cards Collection Types
export interface Card {
  id: string;
  name: string;
  suit: '♦' | '♠' | '♥' | '♣';
  rank: string;
  punchline: string;
  mirrorQuestion: string;
  image: string;
  color: string;
  keywords: string[];
}

export interface JournalEntry {
  id: string;
  cardId: string;
  cardName: string;
  question: string;
  timestamp: number;
}

export interface ProgressState {
  openedCards: Set<string>;
  journalEntries: JournalEntry[];
}

export interface FilterState {
  searchQuery: string;
  selectedSuits: Set<string>;
  selectedKeywords: Set<string>;
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'client';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// UI State Types
export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface AnimationPreferences {
  prefersReducedMotion: boolean;
  enableConfetti: boolean;
  enableTilt: boolean;
}

// Quiz Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  icon: string;
  value: string;
}

export interface QuizResult {
  name: string;
  portrait: string;
  description: string;
  color: string;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: {
    serif: string;
    sans: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
} 