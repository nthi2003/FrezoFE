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
  cycleId?: string
  departmentId?: string
  orgId?: string
  parentOkrId?: string
  scopeType?: 'PERSONAL' | 'TEAM' | 'DEPARTMENT' | 'COMPANY'
  objectiveType?: 'COMMITTED' | 'STRETCH'
  crossLinkIds?: string[]
  published?: boolean
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
  cycleId?: string
  departmentId?: string
  orgId?: string
  parentOkrId?: string
  scopeType?: 'PERSONAL' | 'TEAM' | 'DEPARTMENT' | 'COMPANY'
  objectiveType?: 'COMMITTED' | 'STRETCH'
  crossLinkIds?: string[]
  published?: boolean
  startDate?: string
  endDate?: string
  status?: string
  keyResults?: OkrKeyResult[]
}

export interface OkrCheckInRequest {
  note?: string
  keyResults?: Array<{ id: string; currentValue: number }>
}

export interface OkrCycle {
  id: string
  name: string
  status: 'OPEN' | 'CLOSED'
  startDate: string
  endDate: string
}

export interface OkrTimelineStep {
  id: string
  stepName: string
  departmentName?: string
  timeLabel?: string
  detail?: string
  result?: string
  sortOrder?: number
}

export interface OkrFeedbackType {
  id: string
  name: string
}

export interface OkrFeedback {
  id: string
  objectiveId?: string
  targetScope: 'COMPANY' | 'DEPARTMENT'
  targetDepartmentId?: string
  feedbackTypeId: string
  feedbackTypeName?: string
  content: string
  senderPersonId?: string
  createdDate?: string
}

export interface OkrAction {
  id: string
  keyResultId: string
  title: string
  planUrl?: string
  startDate?: string
  endDate?: string
  result?: string
  status: 'TODO' | 'DOING' | 'DONE'
  relatedPersonIds?: string[]
}

export interface OkrCheckInSession {
  id: string
  okrId: string
  employeePersonId: string
  managerPersonId: string
  progress?: string
  delayedWork?: string
  blockers?: string
  solutions?: string
  confidenceLevel: number
  status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED'
  officialUpdate?: string
  managerFeedback?: string
  nextCheckInDate?: string
  completeOkrs?: boolean
  feedback?: Array<{ id: string; parentFeedbackId?: string; authorPersonId: string; content: string }>
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

  publishOkr: (id: string) =>
    axiosClient.post<ApiResponse<OkrDto>>(`/qlns/okrs/${id}/publish`).then((r) => normalizeOkr(r.data.data)),

  listCycles: () =>
    axiosClient.get<ApiResponse<OkrCycle[]>>('/qlns/okr-workflow/cycles').then((r) => r.data.data ?? []),
  createCycle: (body: Omit<OkrCycle, 'id'>) =>
    axiosClient.post<ApiResponse<OkrCycle>>('/qlns/okr-workflow/cycles', body).then((r) => r.data.data),
  updateCycle: (id: string, body: Omit<OkrCycle, 'id'>) =>
    axiosClient.put<ApiResponse<OkrCycle>>(`/qlns/okr-workflow/cycles/${id}`, body).then((r) => r.data.data),
  deleteCycle: (id: string) => axiosClient.delete(`/qlns/okr-workflow/cycles/${id}`),

  listTimeline: () =>
    axiosClient.get<ApiResponse<OkrTimelineStep[]>>('/qlns/okr-workflow/timeline').then((r) => r.data.data ?? []),
  createTimeline: (body: Omit<OkrTimelineStep, 'id'>) =>
    axiosClient.post<ApiResponse<OkrTimelineStep>>('/qlns/okr-workflow/timeline', body).then((r) => r.data.data),
  updateTimeline: (id: string, body: Omit<OkrTimelineStep, 'id'>) =>
    axiosClient.put<ApiResponse<OkrTimelineStep>>(`/qlns/okr-workflow/timeline/${id}`, body).then((r) => r.data.data),
  deleteTimeline: (id: string) => axiosClient.delete(`/qlns/okr-workflow/timeline/${id}`),

  listFeedbackTypes: () =>
    axiosClient.get<ApiResponse<OkrFeedbackType[]>>('/qlns/okr-workflow/feedback-types').then((r) => r.data.data ?? []),
  createFeedbackType: (name: string) =>
    axiosClient.post<ApiResponse<OkrFeedbackType>>('/qlns/okr-workflow/feedback-types', { name }).then((r) => r.data.data),
  updateFeedbackType: (id: string, name: string) =>
    axiosClient.put<ApiResponse<OkrFeedbackType>>(`/qlns/okr-workflow/feedback-types/${id}`, { name }).then((r) => r.data.data),
  deleteFeedbackType: (id: string) => axiosClient.delete(`/qlns/okr-workflow/feedback-types/${id}`),
  listFeedback: () =>
    axiosClient.get<ApiResponse<OkrFeedback[]>>('/qlns/okr-workflow/feedback').then((r) => r.data.data ?? []),
  createFeedback: (body: Omit<OkrFeedback, 'id' | 'feedbackTypeName' | 'senderPersonId' | 'createdDate'>) =>
    axiosClient.post<ApiResponse<OkrFeedback>>('/qlns/okr-workflow/feedback', body).then((r) => r.data.data),

  listActions: (keyResultId: string) =>
    axiosClient.get<ApiResponse<OkrAction[]>>(`/qlns/okr-workflow/key-results/${keyResultId}/actions`).then((r) => r.data.data ?? []),
  createAction: (keyResultId: string, body: Omit<OkrAction, 'id' | 'keyResultId'>) =>
    axiosClient.post<ApiResponse<OkrAction>>(`/qlns/okr-workflow/key-results/${keyResultId}/actions`, body).then((r) => r.data.data),
  updateAction: (id: string, body: Omit<OkrAction, 'id' | 'keyResultId'>) =>
    axiosClient.put<ApiResponse<OkrAction>>(`/qlns/okr-workflow/actions/${id}`, body).then((r) => r.data.data),
  deleteAction: (id: string) => axiosClient.delete(`/qlns/okr-workflow/actions/${id}`),

  listCheckIns: (okrId: string) =>
    axiosClient.get<ApiResponse<OkrCheckInSession[]>>(`/qlns/okr-workflow/okrs/${okrId}/check-ins`).then((r) => r.data.data ?? []),
  createCheckIn: (okrId: string, body: Partial<OkrCheckInSession>) =>
    axiosClient.post<ApiResponse<OkrCheckInSession>>(`/qlns/okr-workflow/okrs/${okrId}/check-ins`, body).then((r) => r.data.data),
  confirmCheckIn: (id: string, body: Partial<OkrCheckInSession>) =>
    axiosClient.post<ApiResponse<OkrCheckInSession>>(`/qlns/okr-workflow/check-ins/${id}/confirm`, body).then((r) => r.data.data),
  addCheckInFeedback: (id: string, body: { parentFeedbackId?: string; content: string }) =>
    axiosClient.post(`/qlns/okr-workflow/check-ins/${id}/feedback`, body),

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
