// ============================================================
// Resignation API — khớp BE ResignationRequestController
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export type ResignationStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'HANDOVER_DONE'
  | 'PAYROLL_SETTLED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface ResignationDto {
  id: string
  requestCode: string
  personId: string
  personName?: string
  expectedLastDay?: string
  actualLastDay?: string
  reason?: string
  status: ResignationStatus
  managerApprovedBy?: string
  managerApprovedAt?: string
  hrConfirmedBy?: string
  hrConfirmedAt?: string
  laptopReturned?: boolean
  badgeReturned?: boolean
  docsHandedOver?: boolean
  handoverNote?: string
  handoverAt?: string
  payrollSettledAt?: string
  userRevokedAt?: string
  completedAt?: string
  createdDate?: string
  createdBy?: string
}

export interface ResignationCreateRequest {
  personId: string
  expectedLastDay: string
  reason?: string
}

export interface ResignationApproveRequest {
  actualLastDay?: string
  note?: string
}

export interface ResignationHandoverRequest {
  laptopReturned: boolean
  badgeReturned: boolean
  docsHandedOver: boolean
  note?: string
}

export const resignationApi = {
  list: (params?: { personId?: string; status?: string }) =>
    axiosClient
      .get<ApiResponse<ResignationDto[]>>('/qlns/resignation', { params })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  getById: (id: string) =>
    axiosClient
      .get<ApiResponse<ResignationDto>>(`/qlns/resignation/${id}`)
      .then((r) => r.data.data),

  create: (body: ResignationCreateRequest) =>
    axiosClient
      .post<ApiResponse<ResignationDto>>('/qlns/resignation', body)
      .then((r) => r.data.data),

  approve: (id: string, body?: ResignationApproveRequest) =>
    axiosClient
      .post<ApiResponse<ResignationDto>>(`/qlns/resignation/${id}/approve`, body ?? {})
      .then((r) => r.data.data),

  handover: (id: string, body: ResignationHandoverRequest) =>
    axiosClient
      .post<ApiResponse<ResignationDto>>(`/qlns/resignation/${id}/handover`, body)
      .then((r) => r.data.data),

  settlePayroll: (id: string) =>
    axiosClient
      .post<ApiResponse<ResignationDto>>(`/qlns/resignation/${id}/settle-payroll`)
      .then((r) => r.data.data),

  complete: (id: string) =>
    axiosClient
      .post<ApiResponse<ResignationDto>>(`/qlns/resignation/${id}/complete`)
      .then((r) => r.data.data),

  cancel: (id: string) =>
    axiosClient
      .post<ApiResponse<ResignationDto>>(`/qlns/resignation/${id}/cancel`)
      .then((r) => r.data.data),
}
