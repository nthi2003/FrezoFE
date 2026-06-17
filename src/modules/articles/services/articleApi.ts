import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const articleApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qtbv/articles', { params }).then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qtbv/articles/${id}`).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qtbv/articles', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qtbv/articles/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qtbv/articles/${id}`).then(res => res.data),
  getManagers: () =>
    axiosClient.get<ApiResponse<any>>('/qtbv/articles/managers').then(res => res.data),
  getOrganizations: () =>
    axiosClient.get<ApiResponse<any>>('/qtbv/articles/organizations').then(res => res.data),
}
