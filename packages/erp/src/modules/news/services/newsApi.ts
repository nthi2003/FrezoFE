import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const newsApi = {
  getPageData: (organizationId?: string) =>
    axiosClient
      .get<ApiResponse<any>>('/qtbv/news/page-data', {
        params: organizationId ? { organizationId } : undefined,
      })
      .then((res) => res.data),

  getCategories: (organizationId?: string) =>
    axiosClient
      .get<ApiResponse<any>>('/qtbv/news/categories', {
        params: organizationId ? { organizationId } : undefined,
      })
      .then((res) => res.data),

  createCategory: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qtbv/news/categories', data).then((res) => res.data),

  updateCategory: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qtbv/news/categories/${id}`, data).then((res) => res.data),

  deleteCategory: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qtbv/news/categories/${id}`).then((res) => res.data),

  getMottos: () =>
    axiosClient.get<ApiResponse<any>>('/qtbv/news/mottos').then((res) => res.data),

  createMotto: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qtbv/news/mottos', data).then((res) => res.data),

  updateMotto: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qtbv/news/mottos/${id}`, data).then((res) => res.data),

  deleteMotto: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qtbv/news/mottos/${id}`).then((res) => res.data),

  getPins: (organizationId: string) =>
    axiosClient
      .get<ApiResponse<any>>('/qtbv/news/pins', { params: { organizationId } })
      .then((res) => res.data),

  pinArticle: (data: { articleId: string; organizationId: string; sortOrder?: number }) =>
    axiosClient.post<ApiResponse<any>>('/qtbv/news/pins', data).then((res) => res.data),

  unpinArticle: (organizationId: string, articleId: string) =>
    axiosClient
      .delete<ApiResponse<any>>('/qtbv/news/pins', { params: { organizationId, articleId } })
      .then((res) => res.data),
}
