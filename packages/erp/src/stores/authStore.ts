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

/** localStorage không phải nguồn chính cho avatar — bỏ mọi field ảnh khi restore, chờ /profile bind lại. */
function userFromCache(): UserProfile | null {
  const cached = storage.get<Record<string, unknown>>(STORAGE_KEYS.USER)
  if (!cached) return null
  const {
    avatar: _a,
    avatarUrl: _b,
    imageUrl: _c,
    photoUrl: _d,
    photo: _e,
    ...rest
  } = cached
  return rest as unknown as UserProfile
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state: restore from storage (avatar stripped — sync từ API)
  user: userFromCache(),
  accessToken: storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN),
  isAuthenticated: !!storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),

  // Set after login success — chỉ cache user sau khi đã map từ server
  setAuth: ({ user, accessToken, refreshToken }) => {
    storage.set(STORAGE_KEYS.USER, user)
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    set({ user, accessToken, refreshToken, isAuthenticated: true })
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

  // Restore from localStorage on app init (avatar stripped)
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
