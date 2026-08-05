import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

// ============================================================
// Types — khớp contract BE `/qtht/jobs`
// ============================================================

export type SystemJobStatus = 'ENABLED' | 'DISABLED' | 'RUNNING' | 'ERROR'
export type SystemJobRunStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED'

export interface SystemJobDto {
  code: string
  name: string
  description?: string
  moduleCode?: string
  cronExpression: string
  /** Mô tả tiếng Việt do BE sinh (VD "12:00 mỗi ngày"). */
  cronDescription?: string
  enabled: boolean
  status: SystemJobStatus
  lastRunAt?: string
  lastStatus?: SystemJobRunStatus | null
  lastDurationMs?: number
  lastMessage?: string
  nextRunAt?: string
}

export interface SystemJobUpdateRequest {
  cronExpression?: string
  enabled?: boolean
}

export interface SystemJobHistoryDto {
  id: string
  jobCode: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  status: SystemJobRunStatus
  message?: string
  /** SYSTEM khi chạy theo lịch, username khi chạy thủ công. */
  triggeredBy?: string
}

export interface SystemJobHistoryFilter {
  /** 1-based — BE convert `page - 1` khi tạo Pageable. */
  pageNumber?: number
  pageSize?: number
  status?: SystemJobRunStatus | ''
  /** ISO-8601 datetime (VD 2026-08-01T00:00:00). */
  fromDate?: string
  toDate?: string
}

/** Trang dữ liệu chuẩn Spring Page rút gọn. */
export interface FePage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  /** 0-based page index từ BE. */
  number: number
  size: number
}

// ============================================================
// API
// ============================================================

export const jobApi = {
  getJobs: () =>
    axiosClient.get<ApiResponse<SystemJobDto[]>>('/qtht/jobs').then((res) => res.data.data),

  update: (code: string, body: SystemJobUpdateRequest) =>
    axiosClient
      .put<ApiResponse<SystemJobDto>>(`/qtht/jobs/${code}`, body)
      .then((res) => res.data.data),

  run: (code: string) =>
    axiosClient
      .post<ApiResponse<SystemJobDto>>(`/qtht/jobs/${code}/run`)
      .then((res) => res.data.data),

  getHistory: (code: string, params?: SystemJobHistoryFilter) =>
    axiosClient
      .get<ApiResponse<FePage<SystemJobHistoryDto>>>(`/qtht/jobs/${code}/history`, { params })
      .then((res) => res.data.data),

  /** Trả về `count` mốc chạy kế tiếp (ISO datetime) — cũng dùng để validate cron. */
  previewCron: (expression: string, count = 5) =>
    axiosClient
      .get<ApiResponse<string[]>>('/qtht/jobs/preview-cron', { params: { expression, count } })
      .then((res) => res.data.data),
}
