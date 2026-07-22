// ============================================================
// QLNS Performance / OKR — khớp BE OkrController + PerformanceReviewController
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface OkrKeyResult {
  id?: string
  title: string
  targetValue: number
  currentValue: number
  unit?: string
  sortOrder?: number
  progress?: number
}

export interface OkrDto {
  id: string
  title: string
  description?: string
  ownerPersonId?: string
  periodLabel?: string
  startDate?: string
  endDate?: string
  status?: string
  /** BE primary */
  progress?: number
  /** Alias BE — cùng giá trị progress */
  progressPct?: number
  keyResults?: OkrKeyResult[]
}

export interface OkrRequest {
  title: string
  description?: string
  ownerPersonId?: string
  periodLabel?: string
  startDate?: string
  endDate?: string
  status?: string
  keyResults?: OkrKeyResult[]
}

export interface PerformanceReviewDto {
  id: string
  cycleId: string
  personId: string
  managerPersonId?: string
  selfScore?: number
  managerScore?: number
  selfComment?: string
  managerComment?: string
  status: string
  submittedAt?: string
  scoredAt?: string
}

export interface PerformanceReviewRequest {
  cycleId: string
  personId: string
  managerPersonId?: string
  selfScore?: number
  selfComment?: string
}

export interface ManagerScoreRequest {
  managerScore: number
  managerComment?: string
}

function normalizeOkr(o: OkrDto): OkrDto {
  const progress = o.progressPct ?? o.progress ?? 0
  return { ...o, progress, progressPct: progress }
}

export const performanceApi = {
  listOkrs: (ownerPersonId?: string) =>
    axiosClient
      .get<ApiResponse<OkrDto[]>>('/qlns/okrs', {
        params: ownerPersonId ? { ownerPersonId } : undefined,
      })
      .then((r) =>
        (Array.isArray(r.data.data) ? r.data.data : []).map(normalizeOkr),
      ),

  createOkr: (body: OkrRequest) =>
    axiosClient
      .post<ApiResponse<OkrDto>>('/qlns/okrs', body)
      .then((r) => normalizeOkr(r.data.data)),

  updateOkr: (id: string, body: Partial<OkrRequest>) =>
    axiosClient
      .put<ApiResponse<OkrDto>>(`/qlns/okrs/${id}`, body)
      .then((r) => normalizeOkr(r.data.data)),

  listReviews: (params?: { cycleId?: string; personId?: string }) =>
    axiosClient
      .get<ApiResponse<PerformanceReviewDto[]>>('/qlns/performance-reviews', {
        params,
      })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  createReview: (body: PerformanceReviewRequest) =>
    axiosClient
      .post<ApiResponse<PerformanceReviewDto>>('/qlns/performance-reviews', body)
      .then((r) => r.data.data),

  submitReview: (id: string) =>
    axiosClient
      .post<ApiResponse<PerformanceReviewDto>>(
        `/qlns/performance-reviews/${id}/submit`,
      )
      .then((r) => r.data.data),

  managerScore: (id: string, body: ManagerScoreRequest) =>
    axiosClient
      .post<ApiResponse<PerformanceReviewDto>>(
        `/qlns/performance-reviews/${id}/manager-score`,
        body,
      )
      .then((r) => r.data.data),
}
