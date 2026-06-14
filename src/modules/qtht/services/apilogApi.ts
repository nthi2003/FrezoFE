import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const apilogApi = {
  getLogs: (params?: { pageNumber?: number; pageSize?: number }) =>
    axiosClient.get<ApiResponse<{ items: any[]; total: number; current: number; pageSize: number }>>('/qtht/api-log', { params }).then(res => res.data.data),
  getStats: () =>
    axiosClient.get<ApiResponse<any>>('/qtht/api-log/stats').then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qtht/api-log/${id}`).then(res => res.data),
  deleteBulk: (days: number) =>
    axiosClient.delete<ApiResponse<string>>(`/qtht/api-log/bulk/${days}`).then(res => res.data.message),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qtht/api-log/${id}`).then(res => res.data),
}
