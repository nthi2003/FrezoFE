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
  userAgent?: string
  queryString?: string
  module?: string
  errorMessage?: string
  traceId?: string
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

export type StatusGroup = 'all' | '2xx' | '3xx' | '4xx' | '5xx'

export interface ApiLogFilter {
  /** 1-based — BE ApiLogServiceImpl uses ServiceHelper.createPageable (page - 1). */
  pageNumber?: number
  pageSize?: number
  search?: string
  method?: string
  statusCode?: number
  /** Server-side status group filter */
  statusGroup?: StatusGroup
  errorsOnly?: boolean
  ipAddress?: string
  username?: string
  uri?: string
  module?: string
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
