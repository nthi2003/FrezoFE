// ============================================================
// FREZO ERP — Misc API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const publicApi = {
  getLandingConfig: () => axiosClient.get<ApiResponse<any>>('/public/landing/config').then(res => res.data),
  filterProduct: (data: any) => axiosClient.post<ApiResponse<any>>('/public/product/filter', data).then(res => res.data),
  getProductById: (id: string) => axiosClient.get<ApiResponse<any>>(`/public/product/${id}`).then(res => res.data),
  getArticles: (params?: any) => axiosClient.get<ApiResponse<any>>('/public/articles', { params }).then(res => res.data),
  getArticleById: (id: string) => axiosClient.get<ApiResponse<any>>(`/public/articles/${id}`).then(res => res.data),
}

export const commonApi = {
  getManagers: () => axiosClient.get<ApiResponse<any>>('/qtbv/articles/managers').then(res => res.data),
  getOrganizations: () => axiosClient.get<ApiResponse<any>>('/qtbv/articles/organizations').then(res => res.data),
}

export const landingConfigApi = {
  get: () => axiosClient.get<ApiResponse<any>>('/qtbv/landing-config').then(res => res.data),
  update: (data: any) => axiosClient.put<ApiResponse<any>>('/qtbv/landing-config', data).then(res => res.data),
}

export const dashboardApi = {
  getSummary: () => axiosClient.get<ApiResponse<any>>('/api/dashboard/summary').then(res => res.data),
  exportAttendance: (params?: any) => axiosClient.get<ApiResponse<any>>('/api/dashboard/export/attendance', { params, responseType: 'blob' }).then(res => res.data),
}

export const apiLogApi = {
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/apilogs', { params }).then(res => res.data),
  getStats: () => axiosClient.get<ApiResponse<any>>('/apilogs/stats').then(res => res.data),
  getById: (id: string) => axiosClient.get<ApiResponse<any>>(`/apilogs/${id}`).then(res => res.data),
  deleteBulk: (days: number) => axiosClient.delete<ApiResponse<any>>(`/apilogs/bulk/${days}`).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/apilogs/${id}`).then(res => res.data),
}

export const notificationApi = {
  getMy: (params?: any) => axiosClient.get<ApiResponse<any>>('/api/notifications/my', { params }).then(res => res.data),
}

export const settingApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/settings', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/settings/${id}`, data).then(res => res.data),
  getByOrg: (orgId: string) => axiosClient.get<ApiResponse<any>>(`/settings/org/${orgId}`).then(res => res.data),
}

export const systemApi = {
  backup: () => axiosClient.post<ApiResponse<any>>('/qtht/system/backup').then(res => res.data),
}
