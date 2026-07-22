// ============================================================
// FREZO ERP — Approval API (BE module-approval-bom đã ship)
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'
import type {
  ApprovalActionPayload,
  ApprovalFlowDto,
  ApprovalFlowRequest,
  ApprovalRequestDto,
  ApprovalStepDto,
  PageResponse,
} from '../types'

const BASE = '/approvals'
const FLOW_BASE = '/approval-flows'

export const approvalApi = {
  /** GET /approvals/my?status=pending|all */
  listMy: (status: 'pending' | 'all' = 'pending') =>
    axiosClient
      .get<ApiResponse<PageResponse<ApprovalRequestDto>>>(`${BASE}/my`, {
        params: { status },
      })
      .then((r) => r.data.data),

  /** POST /approvals/{id}/approve */
  approve: (id: string, payload: ApprovalActionPayload) =>
    axiosClient
      .post<ApiResponse<ApprovalRequestDto>>(`${BASE}/${id}/approve`, payload)
      .then((r) => r.data.data),

  /** POST /approvals/{id}/reject */
  reject: (id: string, payload: ApprovalActionPayload) =>
    axiosClient
      .post<ApiResponse<ApprovalRequestDto>>(`${BASE}/${id}/reject`, payload)
      .then((r) => r.data.data),

  /** GET /approvals/{id}/timeline */
  timeline: (id: string) =>
    axiosClient
      .get<ApiResponse<ApprovalStepDto[]>>(`${BASE}/${id}/timeline`)
      .then((r) => r.data.data ?? []),

  /** GET /approvals/timeline?subjectType=&subjectId= */
  timelineBySubject: (subjectType: string, subjectId: string) =>
    axiosClient
      .get<ApiResponse<ApprovalStepDto[]>>(`${BASE}/timeline`, {
        params: { subjectType, subjectId },
      })
      .then((r) => r.data.data ?? []),

  /** GET /approvals/by-subject?subjectType=&subjectId= — request gắn subject */
  bySubject: (subjectType: string, subjectId: string) =>
    axiosClient
      .get<ApiResponse<ApprovalRequestDto | null>>(`${BASE}/by-subject`, {
        params: { subjectType, subjectId },
      })
      .then((r) => r.data.data ?? null),
}

export const approvalFlowApi = {
  list: () =>
    axiosClient
      .get<ApiResponse<ApprovalFlowDto[]>>(FLOW_BASE)
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  create: (body: ApprovalFlowRequest) =>
    axiosClient
      .post<ApiResponse<ApprovalFlowDto>>(FLOW_BASE, body)
      .then((r) => r.data.data),

  update: (id: string, body: ApprovalFlowRequest) =>
    axiosClient
      .put<ApiResponse<ApprovalFlowDto>>(`${FLOW_BASE}/${id}`, body)
      .then((r) => r.data.data),
}
