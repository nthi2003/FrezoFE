import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const hrSetupApi = {
  // Job positions
  listJobPositions: () =>
    axiosClient.get<ApiResponse<any>>('/qlns/job-position').then((r) => r.data),
  createJobPosition: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/job-position', data).then((r) => r.data),
  updateJobPosition: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/job-position/${id}`, data).then((r) => r.data),
  deleteJobPosition: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qlns/job-position/${id}`).then((r) => r.data),
  checkCategoryUsage: (categoryCode: string) =>
    axiosClient
      .get<ApiResponse<any>>('/qlns/job-position/category-usage', { params: { categoryCode } })
      .then((r) => r.data),

  // Payroll components (phụ cấp / khấu trừ)
  listPayrollComponents: () =>
    axiosClient.get<ApiResponse<any>>('/qlns/payroll-component').then((r) => r.data),
  createPayrollComponent: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/payroll-component', data).then((r) => r.data),
  updatePayrollComponent: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/payroll-component/${id}`, data).then((r) => r.data),
  deletePayrollComponent: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qlns/payroll-component/${id}`).then((r) => r.data),

  // Work history
  listWorkHistory: (personId: string) =>
    axiosClient
      .get<ApiResponse<any>>('/qlns/person-work-history', { params: { personId } })
      .then((r) => r.data),
  createWorkHistory: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/person-work-history', data).then((r) => r.data),
  deleteWorkHistory: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qlns/person-work-history/${id}`).then((r) => r.data),

  // Statistics
  getPersonStatistics: (params?: { from?: string; to?: string }) =>
    axiosClient.get<ApiResponse<any>>('/qlns/person-statistics', { params }).then((r) => r.data),
}
