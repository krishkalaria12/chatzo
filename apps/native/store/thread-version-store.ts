import { create } from 'zustand';

interface ThreadVersionState {
  version: number;
  bump: () => void;
}

export const useThreadVersion = create<ThreadVersionState>(set => ({
  version: 0,
  bump: () => set(state => ({ version: state.version + 1 })),
}));
