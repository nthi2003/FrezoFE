import type { BaseEntity } from './api.types'

// ---- Login ----
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  requiresTwoFactor?: boolean
  message?: string
}

// ---- User Profile ----
export interface UserProfile {
  id: string
  username: string
  email: string
  fullName: string
  avatar?: string
  roles: string[]
  permissions: string[]
  isAdmin: boolean
}

// ---- Auth Store State ----
export interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

// ---- Menu (from /qlht/menus) ----
export interface MenuItem extends BaseEntity {
  name: string
  icon?: string
  path?: string
  parentId?: string
  order?: number
  children?: MenuItem[]
  permission?: string
}
