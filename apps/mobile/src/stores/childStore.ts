import { create } from 'zustand';

interface Child {
  id: string;
  name: string;
  birth_date: string;
  gender: string;
  avatar_url?: string;
}

interface ChildStore {
  children: Child[];
  activeChild: Child | null;
  setChildren: (children: Child[]) => void;
  setActiveChild: (child: Child) => void;
}

export const useChildStore = create<ChildStore>((set) => ({
  children: [],
  activeChild: null,
  setChildren: (children) =>
    set({ children, activeChild: children[0] ?? null }),
  setActiveChild: (child) => set({ activeChild: child }),
}));
