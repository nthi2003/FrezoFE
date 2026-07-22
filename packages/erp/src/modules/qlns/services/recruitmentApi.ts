// ============================================================
// FREZO ERP — Recruitment API
// Sync BE: APPLIED → SCREENING → INTERVIEW → OFFER → HIRED | REJECTED
// Requisition: quantity / hiredCount / openDate / description
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export type RequisitionStatus = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'FILLED'

/** Stages khớp RecruitmentConstants BE */
export type ApplicationStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'

export interface Requisition {
  id: string
  title: string
  departmentId?: string
  departmentName?: string
  positionCode?: string
  /** FE alias — map từ BE `quantity` */
  headcount: number
  quantity?: number
  /** FE alias — map từ BE `hiredCount` */
  filledCount?: number
  hiredCount?: number
  status: RequisitionStatus
  jobDescription?: string
  description?: string
  requirements?: string
  hiringManagerUsername?: string
  ownerUsername?: string
  openedDate?: string
  openDate?: string
  closedDate?: string
  closeDate?: string
  createdDate?: string
}

export interface RequisitionRequest {
  title: string
  headcount: number
  quantity?: number
  departmentId?: string
  positionCode?: string
  jobDescription?: string
  description?: string
  requirements?: string
  status?: RequisitionStatus
  hiringManagerUsername?: string
  openDate?: string
}

export interface Application {
  id: string
  requisitionId: string
  requisitionTitle?: string
  candidateName: string
  candidateEmail?: string
  candidatePhone?: string
  candidateId?: string
  source?: string
  stage: ApplicationStage
  ratingScore?: number
  cvUrl?: string
  ownerUsername?: string
  currentAssignee?: string
  createdDate?: string
  appliedDate?: string
  movedAt?: string
  rejectionReason?: string
}

export interface ApplicationFilter {
  requisitionId?: string
  stage?: ApplicationStage
}

async function tolerant404<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404 || status === 501) return fallback
    throw err
  }
}

/** Map BE DTO → FE shape (headcount/filledCount/openedDate). */
export function normalizeRequisition(raw: Record<string, unknown>): Requisition {
  const quantity = Number(raw.quantity ?? raw.headcount ?? 0) || 0
  const hired = Number(raw.hiredCount ?? raw.filledCount ?? 0) || 0
  return {
    ...(raw as unknown as Requisition),
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    status: (raw.status as RequisitionStatus) || 'OPEN',
    headcount: quantity,
    quantity,
    filledCount: hired,
    hiredCount: hired,
    openedDate: (raw.openDate || raw.openedDate) as string | undefined,
    openDate: (raw.openDate || raw.openedDate) as string | undefined,
    jobDescription: (raw.description || raw.jobDescription) as string | undefined,
    description: (raw.description || raw.jobDescription) as string | undefined,
  }
}

/** Map legacy NEW/SCREEN → BE stages. */
export function normalizeStage(stage?: string): ApplicationStage {
  const s = (stage || '').toUpperCase()
  if (s === 'NEW') return 'APPLIED'
  if (s === 'SCREEN') return 'SCREENING'
  if (
    s === 'APPLIED' ||
    s === 'SCREENING' ||
    s === 'INTERVIEW' ||
    s === 'OFFER' ||
    s === 'HIRED' ||
    s === 'REJECTED'
  ) {
    return s
  }
  return 'APPLIED'
}

export function normalizeApplication(raw: Record<string, unknown>): Application {
  return {
    ...(raw as unknown as Application),
    id: String(raw.id ?? ''),
    requisitionId: String(raw.requisitionId ?? ''),
    candidateName: String(raw.candidateName ?? 'Ứng viên'),
    stage: normalizeStage(raw.stage as string),
  }
}

export const recruitmentApi = {
  listRequisitions: () =>
    tolerant404(
      axiosClient
        .get<ApiResponse<unknown[]>>('/qlns/recruitment/requisitions')
        .then((r) => {
          const list = Array.isArray(r.data.data) ? r.data.data : []
          return {
            ...r.data,
            data: list.map((x) =>
              normalizeRequisition(x as Record<string, unknown>),
            ),
          } as ApiResponse<Requisition[]>
        }),
      { data: [] as Requisition[] } as ApiResponse<Requisition[]>,
    ),

  createRequisition: (data: RequisitionRequest) => {
    const body = {
      title: data.title,
      quantity: data.quantity ?? data.headcount,
      departmentId: data.departmentId,
      description: data.description ?? data.jobDescription,
      requirements: data.requirements,
      hiringManagerUsername: data.hiringManagerUsername,
      openDate: data.openDate,
      status: data.status,
    }
    return axiosClient
      .post<ApiResponse<Requisition>>('/qlns/recruitment/requisitions', body)
      .then((r) => ({
        ...r.data,
        data: r.data.data
          ? normalizeRequisition(r.data.data as unknown as Record<string, unknown>)
          : r.data.data,
      }))
  },

  listApplications: (params?: ApplicationFilter) =>
    tolerant404(
      axiosClient
        .get<ApiResponse<unknown[]>>('/qlns/recruitment/applications', { params })
        .then((r) => {
          const list = Array.isArray(r.data.data) ? r.data.data : []
          return {
            ...r.data,
            data: list.map((x) =>
              normalizeApplication(x as Record<string, unknown>),
            ),
          } as ApiResponse<Application[]>
        }),
      { data: [] as Application[] } as ApiResponse<Application[]>,
    ),

  moveApplication: (id: string, stage: ApplicationStage) =>
    axiosClient
      .post<ApiResponse<Application>>(`/qlns/recruitment/applications/${id}/move`, null, {
        params: { stage },
      })
      .then((r) => ({
        ...r.data,
        data: r.data.data
          ? normalizeApplication(r.data.data as unknown as Record<string, unknown>)
          : r.data.data,
      })),

  /** POST …/hire — chuyển HIRED từ OFFER */
  hireApplication: (id: string) =>
    axiosClient
      .post<ApiResponse<Application>>(`/qlns/recruitment/applications/${id}/hire`)
      .then((r) => ({
        ...r.data,
        data: r.data.data
          ? normalizeApplication(r.data.data as unknown as Record<string, unknown>)
          : r.data.data,
      })),
}
