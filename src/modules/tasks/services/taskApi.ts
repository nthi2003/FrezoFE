// ============================================================
// FREZO ERP — Task & Ticket & Tag API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const taskApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/api/tasks', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/api/tasks/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/api/tasks/${id}`).then(res => res.data),
  getById: (id: string) => axiosClient.get<ApiResponse<any>>(`/api/tasks/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/api/tasks', { params }).then(res => res.data)
}

export const ticketApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/api/tickets', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/api/tickets/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/api/tickets/${id}`).then(res => res.data),
  getById: (id: string) => axiosClient.get<ApiResponse<any>>(`/api/tickets/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/api/tickets', { params }).then(res => res.data)
}

export const tagApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/api/tags', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/api/tags/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/api/tags/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/api/tags', { params }).then(res => res.data)
}
