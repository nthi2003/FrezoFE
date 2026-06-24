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
  sendTest: (id: string, data: { recipients: string[]; params?: Record<string, any> }) =>
    axiosClient.post<ApiResponse<any>>(`/email/template/${id}/send-test`, data).then(res => res.data),
}

export const emailGroupApi = {
  getAll: () =>
    axiosClient.get<ApiResponse<any>>('/email/group').then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/email/group/${id}`).then(res => res.data),
  create: (data: { name: string; description?: string; emails: string[] }) =>
    axiosClient.post<ApiResponse<any>>('/email/group', data).then(res => res.data),
  update: (id: string, data: { name: string; description?: string; emails: string[] }) =>
    axiosClient.put<ApiResponse<any>>(`/email/group/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/email/group/${id}`).then(res => res.data),
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
