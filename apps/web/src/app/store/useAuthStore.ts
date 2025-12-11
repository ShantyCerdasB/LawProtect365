import { create } from 'zustand';
import type { AuthState } from './interfaces/AuthStoreInterfaces';

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
  login: async () => {
    set({ isAuthenticated: true });
  },
  logout: async () => {
    set({ isAuthenticated: false });
  },
}));

