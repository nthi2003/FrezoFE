// ============================================================
// Payroll Period API — lock kỳ + Approval subject PAYROLL
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface PayrollPeriodDto {
  id: string
  orgId?: string
  month: number
  year: number
  name?: string
  status?: number | string
  statusLabel?: string
  fromDate?: string
  toDate?: string
  lockedAt?: string
  lockedBy?: string
  note?: string
  workflowInstanceId?: string
  currentTaskId?: string
  currentStepName?: string
}

export interface PayrollPeriodRequest {
  orgId?: string
  month: number
  year: number
  name?: string
  fromDate?: string
  toDate?: string
  note?: string
}

interface PageLike {
  content?: PayrollPeriodDto[]
}

export const payrollPeriodApi = {
  list: (params: { month?: number; year?: number }) =>
    axiosClient
      .get<ApiResponse<PageLike | PayrollPeriodDto[]>>('/qlns/payroll-period', {
        params: { ...params, pageNumber: 1, pageSize: 20 },
      })
      .then((r) => {
        const d = r.data.data
        if (Array.isArray(d)) return d
        return Array.isArray(d?.content) ? d.content : []
      }),

  create: (body: PayrollPeriodRequest) =>
    axiosClient
      .post<ApiResponse<PayrollPeriodDto>>('/qlns/payroll-period', body)
      .then((r) => r.data.data),

  lock: (id: string) =>
    axiosClient
      .put<ApiResponse<PayrollPeriodDto>>(`/qlns/payroll-period/${id}/lock`)
      .then((r) => r.data.data),

  unlock: (id: string) =>
    axiosClient
      .put<ApiResponse<PayrollPeriodDto>>(`/qlns/payroll-period/${id}/unlock`)
      .then((r) => r.data.data),
}
