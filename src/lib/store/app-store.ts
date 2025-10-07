/**
 * Global application state store using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Server } from '@/types';

interface AppState {
  // Server selection
  selectedServer: Server;
  setSelectedServer: (server: Server) => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Server selection
      selectedServer: 'Americas',
      setSelectedServer: (server) => set({ selectedServer: server }),

      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'albion-dashboard-storage',
      partialize: (state) => ({
        selectedServer: state.selectedServer,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
