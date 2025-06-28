import { create } from 'zustand';

export const useSidebarStore = create<{
  sidebarVisible: boolean;
  setSidebarVisible: (v: boolean) => void;
}>((set: (fn: (state: { sidebarVisible: boolean }) => { sidebarVisible: boolean }) => void) => ({
  sidebarVisible: true,
  setSidebarVisible: (v: boolean) => {
  
    set(() => ({ sidebarVisible: v }));
  },
})); 