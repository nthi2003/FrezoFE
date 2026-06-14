import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const contractApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlns/contract', { params }).then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${id}`).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/contract', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/contract/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qlns/contract/${id}`).then(res => res.data),
  getCombobox: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlns/contract/combobox', { params }).then(res => res.data),
  assign: (contractId: string, data: any) =>
    axiosClient.post<ApiResponse<any>>(`/qlns/contract/${contractId}/assign`, data).then(res => res.data),
  getAssign: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/assign`).then(res => res.data),
  updateStatus: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/contract/${id}/update-status`, data).then(res => res.data),
  reject: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/contract/${id}/reject`, data).then(res => res.data),
  getVersions: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/versions`).then(res => res.data),
  getVersionsDiff: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/versions/diff`).then(res => res.data),
}
