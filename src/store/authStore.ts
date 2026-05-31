import { create } from 'zustand';
import { User, Family } from '../types';

interface AuthState {
  user: User | null;
  family: Family | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setFamily: (family: Family | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  family: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setFamily: (family) => set({ family }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, family: null });
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/routes/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      set({ user: data.user, family: data.family });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, fullName) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/routes/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      set({ user: data.user, family: data.family });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('token');

      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response = await fetch('/api/routes/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: data.user, family: data.family });
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      set({ isLoading: false });
    }
  },
}));
