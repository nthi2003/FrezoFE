// ============================================================
// FREZO ERP — Payroll API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const payrollApi = {
  calculatePerson: (personId: string, data: any) =>
    axiosClient.post<ApiResponse<any>>(`/qlns/payroll/calculate/${personId}`, data).then(res => res.data),

  calculateAll: (data: { month: number; year: number }) =>
    axiosClient.post<ApiResponse<any>>('/qlns/payroll/calculate-all', null, { params: data }).then(res => res.data),

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

  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlns/payroll', { params }).then(res => res.data),

  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/payroll/${id}`).then(res => res.data)
}
