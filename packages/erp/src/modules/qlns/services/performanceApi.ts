// ============================================================
// QLNS Performance / OKR — khớp BE OkrController + scoping
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

export type OkrScope = 'mine' | 'team' | 'all'

export interface OkrViewerContext {
  personId?: string
  admin: boolean
  manager: boolean
  allowedScopes: OkrScope[]
}

export interface OkrListPayload {
  items: OkrDto[]
  viewer: OkrViewerContext
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

export interface OkrCheckInRequest {
  note?: string
  keyResults?: Array<{ id: string; currentValue: number }>
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

const DEFAULT_VIEWER: OkrViewerContext = {
  admin: false,
  manager: false,
  allowedScopes: ['mine'],
}

function normalizeOkr(o: OkrDto): OkrDto {
  const progress = o.progressPct ?? o.progress ?? 0
  return { ...o, progress, progressPct: progress }
}

function normalizeListPayload(raw: unknown): OkrListPayload {
  if (raw && typeof raw === 'object' && Array.isArray((raw as OkrListPayload).items)) {
    const p = raw as OkrListPayload
    return {
      items: p.items.map(normalizeOkr),
      viewer: {
        ...DEFAULT_VIEWER,
        ...p.viewer,
        allowedScopes: p.viewer?.allowedScopes?.length
          ? p.viewer.allowedScopes
          : ['mine'],
      },
    }
  }
  if (Array.isArray(raw)) {
    return { items: raw.map(normalizeOkr), viewer: DEFAULT_VIEWER }
  }
  return { items: [], viewer: DEFAULT_VIEWER }
}

export const performanceApi = {
  listOkrs: (params?: { scope?: OkrScope; ownerPersonId?: string }) =>
    axiosClient
      .get<ApiResponse<OkrListPayload | OkrDto[]>>('/qlns/okrs', {
        params: {
          scope: params?.scope ?? 'mine',
          ...(params?.ownerPersonId ? { ownerPersonId: params.ownerPersonId } : {}),
        },
      })
      .then((r) => normalizeListPayload(r.data.data)),

  createOkr: (body: OkrRequest) =>
    axiosClient
      .post<ApiResponse<OkrDto>>('/qlns/okrs', body)
      .then((r) => normalizeOkr(r.data.data)),

  updateOkr: (id: string, body: Partial<OkrRequest>) =>
    axiosClient
      .put<ApiResponse<OkrDto>>(`/qlns/okrs/${id}`, body)
      .then((r) => normalizeOkr(r.data.data)),

  checkInOkr: (id: string, body: OkrCheckInRequest) =>
    axiosClient
      .post<ApiResponse<OkrDto>>(`/qlns/okrs/${id}/check-in`, body)
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
