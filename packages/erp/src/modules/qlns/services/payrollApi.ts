// ============================================================
// FREZO ERP — Payroll API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

/** 1 dòng lỗi / skip từ calculate-all (BE có thể enrich tên/mã). */
export interface PayrollCalculateItemError {
  personId?: string
  personName?: string
  personCode?: string
  /** VD: SKIPPED / NO_ACTIVE_CONTRACT / message kỹ thuật */
  reason?: string
}

/** Summary từ POST /qlns/payroll/calculate-all — map thẳng vào modal RESULT. */
export interface PayrollCalculateAllResponse {
  month?: number
  year?: number
  successCount?: number
  skippedCount?: number
  errorCount?: number
  totalCandidates?: number
  errors?: PayrollCalculateItemError[]
  warnings?: string[]
}

export const payrollApi = {
  // BE dùng @RequestParam Integer month/year (query string), KHÔNG phải @RequestBody.
  // Truyền qua `params` để axios serialize thành ?month=x&year=y.
  // Method = POST only (GET → 405).
  calculatePerson: (personId: string, data: { month: number; year: number }) =>
    axiosClient
      .post<ApiResponse<any>>(`/qlns/payroll/calculate/${personId}`, null, { params: data })
      .then(res => res.data),

  calculateAll: (data: { month: number; year: number }) =>
    axiosClient
      .post<ApiResponse<PayrollCalculateAllResponse>>('/qlns/payroll/calculate-all', null, { params: data })
      .then(res => res.data),

  bonus: (id: string, data: { bonusAmount: number; reason: string }) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/payroll/${id}/bonus`, null, {
      params: {
        bonus: data.bonusAmount,
        deduction: 0,
        note: data.reason
      }
    }).then(res => res.data),

  confirm: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/payroll/${id}/confirm`).then(res => res.data),

  pay: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/payroll/${id}/pay`).then(res => res.data),

  /** List — luôn gửi pageNumber (defense vs BE NPE khi omit). */
  getAll: (params?: Record<string, unknown>) =>
    axiosClient
      .get<ApiResponse<any>>('/qlns/payroll', {
        params: { pageNumber: 1, pageSize: 10, ...params },
      })
      .then(res => res.data),

  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/payroll/${id}`).then(res => res.data)
}
