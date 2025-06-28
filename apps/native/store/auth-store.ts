import { create } from 'zustand';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSignedIn: (signedIn: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(set => ({
  user: null,
  isLoading: false,
  isSignedIn: false,
  setUser: user => set({ user, isSignedIn: !!user }),
  setLoading: isLoading => set({ isLoading }),
  setSignedIn: isSignedIn => set({ isSignedIn }),
  clearAuth: () => set({ user: null, isSignedIn: false, isLoading: false }),
}));
