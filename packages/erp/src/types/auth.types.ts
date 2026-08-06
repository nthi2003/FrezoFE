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
  /** Person.id — khớp QTBV article.managerId khi duyệt/xuất bản. */
  personId?: string
  /** Organization.id từ Person — ghim tin / lọc theo đơn vị. */
  orgId?: string
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

// ---- Menu (from /qtht/menu) ----
export interface MenuItem extends BaseEntity {
  name: string
  icon?: string
  path?: string
  parentId?: string
  order?: number
  children?: MenuItem[]
  permission?: string
}
