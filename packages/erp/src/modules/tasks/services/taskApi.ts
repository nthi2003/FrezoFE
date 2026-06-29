import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const taskApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/task/task', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/task/task/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/task/task/${id}`).then(res => res.data),
  getById: (id: string) => axiosClient.get<ApiResponse<any>>(`/task/task/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/task/task', { params }).then(res => res.data),
  assign: (id: string, assigneeId: string) =>
    axiosClient.patch<ApiResponse<any>>(`/task/task/${id}/assign/${assigneeId}`).then(res => res.data),
  updateStatus: (id: string, data: { status: string }) =>
    axiosClient.patch<ApiResponse<any>>(`/task/task/${id}/status`, data).then(res => res.data),
}

export const ticketApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/task/ticket', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/task/ticket/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/task/ticket/${id}`).then(res => res.data),
  getById: (id: string) => axiosClient.get<ApiResponse<any>>(`/task/ticket/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/task/ticket', { params }).then(res => res.data),
  assign: (id: string, assigneeId: string) =>
    axiosClient.patch<ApiResponse<any>>(`/task/ticket/${id}/assign/${assigneeId}`).then(res => res.data),
  updateStatus: (id: string, data: { status: string }) =>
    axiosClient.patch<ApiResponse<any>>(`/task/ticket/${id}/status`, data).then(res => res.data),
}

export const tagApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/task/tag', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/task/tag/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/task/tag/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/task/tag', { params }).then(res => res.data),
}
