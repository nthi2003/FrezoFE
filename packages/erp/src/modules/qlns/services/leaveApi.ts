// ============================================================
// FREZO ERP — Leave & LeaveRequest API Service
// ============================================================
// Duyệt/từ chối: Approval module /approvals/{id}/approve|reject
// (leave-request approve/reject = HTTP 410 — không gọi).
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export type LeaveStatus =
  | 'PENDING_MANAGER'
  | 'PENDING_HR'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PENDING'

export interface LeaveRequestItem {
  id: string
  contractId: string
  personId: string
  personName?: string
  departmentName?: string
  leaveType: string
  startDate: string
  endDate: string
  durationDays?: number
  reason: string
  status: LeaveStatus
  managerUsername?: string | null
  attachmentUrl?: string | null
  managerApprovedBy?: string | null
  managerApprovedAt?: string | null
  hrApprovedBy?: string | null
  hrApprovedAt?: string | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  rejectReason?: string | null
  createdBy?: string
  createdDate?: string
}

export interface LeaveHistoryItem {
  id: string
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CANCEL' | 'AUTO_ROUTE' | 'REASSIGN'
  fromStatus?: string | null
  toStatus?: string | null
  actorUsername?: string | null
  actorRole?: 'REQUESTER' | 'MANAGER' | 'HR' | 'SYSTEM' | string
  comment?: string | null
  createdDate?: string
}

export const leaveApi = {
  createLeave: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/leave', data).then((res) => res.data),

  getLeaveByPerson: (personId: string) =>
    axiosClient
      .get<ApiResponse<any>>(`/qlns/leave/person/${personId}`)
      .then((res) => res.data),
}

export const leaveRequestApi = {
  create: (data: any) =>
    axiosClient
      .post<ApiResponse<LeaveRequestItem>>('/qlns/leave-request', data)
      .then((res) => res.data),

  getMyRequests: (contractId: string) =>
    axiosClient
      .get<ApiResponse<LeaveRequestItem[]>>(`/qlns/leave-request/my/${contractId}`)
      .then((res) => res.data),

  getPending: (page = 1, size = 10) =>
    axiosClient
      .get<ApiResponse<{ items: LeaveRequestItem[]; total: number }>>(
        '/qlns/leave-request/pending',
        { params: { page, size } },
      )
      .then((res) => res.data),

  cancel: (id: string) =>
    axiosClient
      .put<ApiResponse<LeaveRequestItem>>(`/qlns/leave-request/${id}/cancel`)
      .then((res) => res.data),

  getHistory: (id: string) =>
    axiosClient
      .get<ApiResponse<LeaveHistoryItem[]>>(`/qlns/leave-request/${id}/history`)
      .then((res) => res.data),
}
