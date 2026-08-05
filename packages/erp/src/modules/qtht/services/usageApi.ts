import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export type UsageSummary = {
  date: string
  loginsToday: number
  uniqueUsersToday: number
  onlineUsers: number
  activeSessions: number
  onlineWindowMinutes: number
  asOf: string
}

export type PageViewTop = {
  days: number
  total: number
  topModules: { code: string; count: number }[]
  topRoutes: { route: string; count: number }[]
}

export type UserSessionRow = {
  id: string
  username: string
  ipAddress?: string
  userAgent?: string
  deviceInfo?: string
  loginTime?: string
  lastActiveTime?: string
  isActive?: boolean
}

export const usageApi = {
  getSummary: () =>
    axiosClient
      .get<ApiResponse<UsageSummary>>('/auth/statistic/usage-summary')
      .then((res) => res.data.data),

  getLoginByDay: () =>
    axiosClient
      .get<ApiResponse<Record<string, number>>>('/auth/statistic/login-by-day')
      .then((res) => res.data.data),

  getPageViewTop: (days = 1) =>
    axiosClient
      .get<ApiResponse<PageViewTop>>('/qtht/usage/pageviews/top', { params: { days } })
      .then((res) => res.data.data),

  trackPageView: (route: string, moduleCode?: string) =>
    axiosClient
      .post<ApiResponse<void>>('/qtht/usage/pageview', { route, moduleCode })
      .then((res) => res.data),

  heartbeat: () =>
    axiosClient
      .post<ApiResponse<{ ok: boolean }>>('/auth/session/heartbeat')
      .then((res) => res.data.data),

  getOnlineCount: (minutes = 5) =>
    axiosClient
      .get<ApiResponse<{ onlineUsers: number; activeSessions: number }>>(
        '/auth/session/online-count',
        { params: { minutes } },
      )
      .then((res) => res.data.data),

  getAdminSessions: (page = 0, size = 20) =>
    axiosClient
      .get<ApiResponse<{ content: UserSessionRow[]; totalElements: number }>>(
        '/auth/session/admin/active',
        { params: { page, size } },
      )
      .then((res) => res.data.data),

  revokeSession: (id: string) =>
    axiosClient.post<ApiResponse<string>>(`/auth/session/revoke/${id}`).then((res) => res.data),
}
