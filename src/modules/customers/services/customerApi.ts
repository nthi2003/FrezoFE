import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const customerApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/customer', { params }).then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/customer/${id}`).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/customer', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/customer/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/customer/${id}`).then(res => res.data),
  revealPhone: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/customer/${id}/reveal-phone`).then(res => res.data),
  import: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/customer/import', data).then(res => res.data),
  export: () =>
    axiosClient.get<ApiResponse<any>>('/customer/export').then(res => res.data),
  aiSync: () =>
    axiosClient.post<ApiResponse<any>>('/customer/ai/sync').then(res => res.data),
}

export const nccApi = {
  getAll: () =>
    axiosClient.get<ApiResponse<any>>('/ncc/all').then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/ncc/${id}`).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/ncc', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/ncc/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/ncc/${id}`).then(res => res.data),
  uploadCertificate: (id: string, data: any) =>
    axiosClient.post<ApiResponse<any>>('/ncc/upload-certificate', data).then(res => res.data),
}

export const voucherApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/voucher', { params }).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/voucher', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/voucher/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/voucher/${id}`).then(res => res.data),
  validate: (code: string) =>
    axiosClient.get<ApiResponse<any>>('/voucher/validate', { params: { code } }).then(res => res.data),
}
