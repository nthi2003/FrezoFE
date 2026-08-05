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
  updateStatus: (id: string, status: string) =>
    axiosClient
      .patch<ApiResponse<any>>(`/task/task/${id}/status`, null, { params: { status } })
      .then((res) => res.data),
  /** Người giao / admin duyệt DONE → CLOSED hoặc trả IN_PROGRESS */
  review: (id: string, data: { approved: boolean; note?: string }) =>
    axiosClient.post<ApiResponse<any>>(`/task/task/${id}/review`, data).then((res) => res.data),
}

export const ticketApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/task/ticket', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/task/ticket/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/task/ticket/${id}`).then(res => res.data),
  getById: (id: string) => axiosClient.get<ApiResponse<any>>(`/task/ticket/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/task/ticket', { params }).then(res => res.data),
  assign: (id: string, assigneeId: string) =>
    axiosClient.patch<ApiResponse<any>>(`/task/ticket/${id}/assign/${assigneeId}`).then(res => res.data),
  /** BE: PATCH /task/ticket/{id}/status?status= — chỉ đổi status, không đụng assignee/priority/... */
  updateStatus: (id: string, status: string) =>
    axiosClient
      .patch<ApiResponse<any>>(`/task/ticket/${id}/status`, null, { params: { status } })
      .then((res) => res.data),
  /** Người giao / admin duyệt RESOLVED → CLOSED hoặc trả IN_PROGRESS */
  review: (id: string, data: { approved: boolean; note?: string }) =>
    axiosClient.post<ApiResponse<any>>(`/task/ticket/${id}/review`, data).then((res) => res.data),
}

export const tagApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/task/tag', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/task/tag/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/task/tag/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/task/tag', { params }).then(res => res.data),
}

/** Master danh mục Ticket (FR-TASK-CAT) — thay hardcode Bug/Feature. */
export const ticketCategoryApi = {
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/task/ticket-category', data).then((res) => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/task/ticket-category/${id}`, data).then((res) => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/task/ticket-category/${id}`).then((res) => res.data),
  getAll: () =>
    axiosClient.get<ApiResponse<any>>('/task/ticket-category').then((res) => res.data),
  getActive: () =>
    axiosClient.get<ApiResponse<any>>('/task/ticket-category/active').then((res) => res.data),
}
