// ============================================================
// FREZO ERP — Auth Store (Zustand)
// Manages JWT tokens, user profile, isAuthenticated
// ============================================================

import { create } from 'zustand'
import { storage, STORAGE_KEYS } from '@frezo/utils'
import type { UserProfile } from '@frezo/types'

interface AuthStore {
  // State
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (payload: {
    user: UserProfile
    accessToken: string
    refreshToken: string
  }) => void
  setUser: (user: UserProfile) => void
  logout: () => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state: restore from storage
  user: storage.get<UserProfile>(STORAGE_KEYS.USER),
  accessToken: storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN),
  isAuthenticated: !!storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),

  // Set after login success
  setAuth: ({ user, accessToken, refreshToken }) => {
    storage.set(STORAGE_KEYS.USER, user)
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    set({ user, accessToken, refreshToken, isAuthenticated: true })
  },

  // Update user profile only
  setUser: (user) => {
    storage.set(STORAGE_KEYS.USER, user)
    set({ user })
  },

  // Logout: clear all
  logout: () => {
    storage.clear()
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  },

  // Restore from localStorage on app init
  initFromStorage: () => {
    const user = storage.get<UserProfile>(STORAGE_KEYS.USER)
    const accessToken = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN)
    const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN)
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,
    })
  },
}))
