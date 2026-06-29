// ============================================================
// FREZO ERP — QTHT System API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const departmentApi = {
  getAll: () => axiosClient.get<ApiResponse<any>>('/qtht/department').then(res => res.data.data ?? res.data),
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/qtht/department', data).then(res => res.data.data ?? res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/qtht/department/${id}`, data).then(res => res.data.data ?? res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qtht/department/${id}`).then(res => res.data.data ?? res.data),
  activate: (id: string) => axiosClient.put<ApiResponse<any>>(`/qtht/department/${id}/activate`).then(res => res.data.data ?? res.data),
  deactivate: (id: string) => axiosClient.put<ApiResponse<any>>(`/qtht/department/${id}/deactivate`).then(res => res.data.data ?? res.data),
  getCombobox: () => axiosClient.get<ApiResponse<any>>('/qtht/department/combobox').then(res => res.data.data ?? res.data),
}

export const organizationApi = {
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/qtht/organization', { params }).then(res => res.data.data ?? res.data),
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/qtht/organization', data).then(res => res.data.data ?? res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/qtht/organization/${id}`, data).then(res => res.data.data ?? res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qtht/organization/${id}`).then(res => res.data.data ?? res.data),
  getCombobox: () => axiosClient.get<ApiResponse<any>>('/qtht/organization/combobox').then(res => res.data.data ?? res.data),
}

export const permissionApi = {
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/qtht/permission', { params }).then(res => res.data.data ?? res.data),
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/qtht/permission', data).then(res => res.data.data ?? res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qtht/permission/${id}`).then(res => res.data.data ?? res.data),
  getCombobox: () => axiosClient.get<ApiResponse<any>>('/qtht/permission/combobox').then(res => res.data.data ?? res.data),
}

export const roleMenuApi = {
  getByRole: (roleCode: string) => axiosClient.get<ApiResponse<any>>(`/qtht/role-menu/role/${roleCode}`).then(res => res.data.data ?? res.data),
  saveAll: (data: any) => axiosClient.post<ApiResponse<any>>('/qtht/role-menu/save-all', data).then(res => res.data.data ?? res.data),
}
