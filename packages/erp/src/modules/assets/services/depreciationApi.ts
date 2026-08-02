// ============================================================
// Depreciation API — /asset/depreciation
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

const BASE = '/asset/depreciation'

export interface DepreciationScheduleDto {
  id: string
  assetId: string
  assetCode?: string
  assetName?: string
  method?: string
  startDate?: string
  months?: number
  /** Nguyên giá tài sản (purchasePrice). */
  purchasePrice?: number
  monthlyAmount?: number
  remainingValue?: number
  status?: string
}

export interface DepreciationPostingDto {
  id: string
  periodYear: number
  periodMonth: number
  totalAmount?: number
  scheduleCount?: number
  journalEntryId?: string
  status?: string
  errorMessage?: string
}

export const depreciationApi = {
  generate: (params: {
    assetId: string
    method?: string
    months?: number
  }) =>
    axiosClient
      .post<ApiResponse<DepreciationScheduleDto>>(
        `${BASE}/schedules/generate`,
        null,
        { params },
      )
      .then((r) => r.data.data),

  listSchedules: (assetId?: string) =>
    axiosClient
      .get<ApiResponse<DepreciationScheduleDto[]>>(`${BASE}/schedules`, {
        params: assetId ? { assetId } : undefined,
      })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  preview: (year: number, month: number) =>
    axiosClient
      .get<ApiResponse<DepreciationPostingDto>>(`${BASE}/preview`, {
        params: { year, month },
      })
      .then((r) => r.data.data),

  post: (year: number, month: number) =>
    axiosClient
      .post<ApiResponse<DepreciationPostingDto>>(`${BASE}/post`, null, {
        params: { year, month },
      })
      .then((r) => r.data.data),

  listPostings: (year?: number, month?: number) =>
    axiosClient
      .get<ApiResponse<DepreciationPostingDto[]>>(`${BASE}/postings`, {
        params: {
          ...(year != null ? { year } : {}),
          ...(month != null ? { month } : {}),
        },
      })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),
}
