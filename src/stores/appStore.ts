// ============================================================
// FREZO ERP — App Store (Zustand)
// Sidebar state, theme, app-wide config
// ============================================================

import { create } from 'zustand'
import { storage, STORAGE_KEYS } from '@/lib/utils/storage'

interface AppStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (val: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarCollapsed: storage.get<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED) ?? false,

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed
      storage.set(STORAGE_KEYS.SIDEBAR_COLLAPSED, next)
      return { sidebarCollapsed: next }
    }),

  setSidebarCollapsed: (val) => {
    storage.set(STORAGE_KEYS.SIDEBAR_COLLAPSED, val)
    set({ sidebarCollapsed: val })
  },
}))
