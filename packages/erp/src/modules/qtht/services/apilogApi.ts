import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

// ============================================================
// Types
// ============================================================

export interface ApiLogItem {
  id: string
  uri?: string
  method?: string
  ipAddress?: string
  username?: string
  statusCode?: number
  duration?: number
  effFrom?: string
  effTo?: string
  requestBody?: string
  responseBody?: string
  createdDate?: string
}

export interface ApiLogListResponse {
  items: ApiLogItem[]
  total: number
  current: number
  pageSize: number
}

export interface ApiLogStats {
  total: number
  success: number
  failed: number
  avgDuration: number
  totalTrend: number
  failedTrend: number
}

export interface ApiLogFilter {
  pageNumber?: number
  pageSize?: number
  search?: string
  method?: string
  statusCode?: number
  ipAddress?: string
  username?: string
  uri?: string
  durationMin?: number
  durationMax?: number
  /** ISO-8601 datetime (VD: 2026-07-01T00:00:00) */
  fromDate?: string
  toDate?: string
}

// ============================================================
// API
// ============================================================

export const apilogApi = {
  getLogs: (params?: ApiLogFilter) =>
    axiosClient
      .get<ApiResponse<ApiLogListResponse>>('/qtht/api-log', { params })
      .then((res) => res.data.data),

  getStats: (params?: ApiLogFilter) =>
    axiosClient
      .get<ApiResponse<ApiLogStats>>('/qtht/api-log/stats', { params })
      .then((res) => res.data.data),

  getById: (id: string) =>
    axiosClient.get<ApiResponse<ApiLogItem>>(`/qtht/api-log/${id}`).then((res) => res.data.data),

  deleteBulk: (days: number) =>
    axiosClient
      .delete<ApiResponse<string>>(`/qtht/api-log/bulk/${days}`)
      .then((res) => res.data.message),

  delete: (id: string) =>
    axiosClient.delete<ApiResponse<unknown>>(`/qtht/api-log/${id}`).then((res) => res.data),
}
