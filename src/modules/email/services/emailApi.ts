import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const emailTemplateApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/email/template', { params }).then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/email/template/${id}`).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/email/template', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/email/template/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/email/template/${id}`).then(res => res.data),
}

export const emailConfigApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/email/config', { params }).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/email/config', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/email/config/${id}`, data).then(res => res.data),
  activate: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/email/config/${id}/activate`).then(res => res.data),
  deactivate: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/email/config/${id}/deactivate`).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/email/config/${id}`).then(res => res.data),
  testConnection: (id: string) =>
    axiosClient.post<ApiResponse<any>>(`/email/config/${id}/test-connection`).then(res => res.data),
}
