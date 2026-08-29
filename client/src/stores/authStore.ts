import { create } from 'zustand';
import { IUser } from '../types/index.js';

interface AuthState {
  user: IUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: IUser | null) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  restore: () => void;
  isAuthenticated: boolean;
}

// Safe localStorage helper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      console.warn(`[Auth] Failed to read ${key} from localStorage (private browsing?)`);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn(`[Auth] Failed to write ${key} to localStorage (storage full or private browsing?)`);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn(`[Auth] Failed to remove ${key} from localStorage`);
    }
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  setUser: (user) => set({ user }),

  setTokens: (token, refreshToken) => {
    safeLocalStorage.setItem('token', token);
    safeLocalStorage.setItem('refreshToken', refreshToken);
    set({ token, refreshToken, isAuthenticated: !!token });
  },

  setToken: (token) => {
    safeLocalStorage.setItem('token', token);
    set({ token, isAuthenticated: !!token });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  logout: () => {
    safeLocalStorage.removeItem('token');
    safeLocalStorage.removeItem('refreshToken');
    safeLocalStorage.removeItem('user');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restore: () => {
    const token = safeLocalStorage.getItem('token');
    const refreshToken = safeLocalStorage.getItem('refreshToken');
    const userStr = safeLocalStorage.getItem('user');

    if (token) {
      let user: IUser | null = null;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch {
        console.warn('[Auth] Failed to parse user data from localStorage');
      }
      set({ token, refreshToken, user, isAuthenticated: true });
    }
  },
}));
