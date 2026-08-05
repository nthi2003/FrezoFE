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
  /** Chỉ gắn token (trước khi /profile bind user) — không xoá user/avatar đang có. */
  setTokens: (payload: { accessToken: string; refreshToken: string }) => void
  setUser: (user: UserProfile) => void
  logout: () => void
  initFromStorage: () => void
}

/** Restore user từ cache (kèm avatar) để Header/Lobby paint ngay; /profile vẫn sync lại sau. */
function userFromCache(): UserProfile | null {
  const cached = storage.get<UserProfile>(STORAGE_KEYS.USER)
  if (!cached || typeof cached !== 'object') return null
  return cached
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state: restore full user (avatar) so UI không chờ round-trip
  user: userFromCache(),
  accessToken: storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN),
  isAuthenticated: !!storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),

  // Set after login success — user đã map avatarUrl từ API
  setAuth: ({ user, accessToken, refreshToken }) => {
    storage.set(STORAGE_KEYS.USER, user)
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    set({ user, accessToken, refreshToken, isAuthenticated: true })
  },

  setTokens: ({ accessToken, refreshToken }) => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    set({ accessToken, refreshToken, isAuthenticated: true })
  },

  // Update user profile only (gọi sau /profile hoặc upload avatar)
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

  // Restore from localStorage on app init (giữ avatar để paint ngay)
  initFromStorage: () => {
    const user = userFromCache()
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