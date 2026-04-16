import { create } from 'zustand';
import type { User } from '@awdms/shared';
import { tokenStorage } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: Boolean(tokenStorage.getAccess()),
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setAuth: (user, accessToken, refreshToken) => {
    tokenStorage.set(accessToken, refreshToken);
    set({ user, isAuthenticated: true });
  },
  clear: () => {
    tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
