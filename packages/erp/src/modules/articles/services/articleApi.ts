import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const articleApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qtbv/articles', { params }).then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qtbv/articles/${id}`).then(res => res.data),
  /** Intranet home feed — any authenticated user (no QTBV.VIEW required). */
  getHomeFeed: () =>
    axiosClient.get<ApiResponse<any>>('/qtbv/articles/home-feed').then(res => res.data),
  getHomeFeedById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qtbv/articles/home-feed/${id}`).then(res => res.data),
  /** Public landing articles (fallback if home-feed unavailable). */
  getPublicList: (page = 0, size = 20) =>
    axiosClient
      .get<ApiResponse<any>>('/public/articles', { params: { page, size } })
      .then(res => res.data),
  getPublicById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/public/articles/${id}`).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qtbv/articles', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qtbv/articles/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qtbv/articles/${id}`).then(res => res.data),
  submit: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/qtbv/articles/${id}/submit`).then(res => res.data),
  review: (id: string, data: { approved: boolean; note?: string }) =>
    axiosClient.put<ApiResponse<any>>(`/qtbv/articles/${id}/review`, data).then(res => res.data),
  publish: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/qtbv/articles/${id}/publish`).then(res => res.data),
  getManagers: () =>
    axiosClient.get<ApiResponse<any>>('/qtbv/articles/managers').then(res => res.data),
  getOrganizations: () =>
    axiosClient.get<ApiResponse<any>>('/qtbv/articles/organizations').then(res => res.data),
}
