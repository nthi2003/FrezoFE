// ============================================================
// FREZO ERP — QTHT System API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const departmentApi = {
  getAll: () => axiosClient.get<ApiResponse<any>>('/qlht/departments').then(res => res.data),
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/qlht/departments', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/qlht/departments/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qlht/departments/${id}`).then(res => res.data),
}

export const organizationApi = {
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/qlht/organization', { params }).then(res => res.data),
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/qlht/organization', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/qlht/organization/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qlht/organization/${id}`).then(res => res.data),
  getCombobox: () => axiosClient.get<ApiResponse<any>>('/qlht/organization/combobox').then(res => res.data),
}

export const permissionApi = {
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/qlht/permissions', { params }).then(res => res.data),
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/qlht/permissions', data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qlht/permissions/${id}`).then(res => res.data),
  getCombobox: () => axiosClient.get<ApiResponse<any>>('/qlht/permissions/combobox').then(res => res.data),
}

export const roleMenuApi = {
  getByRole: (roleCode: string) => axiosClient.get<ApiResponse<any>>(`/qlht/role-menus/role/${roleCode}`).then(res => res.data),
  saveAll: (data: any) => axiosClient.post<ApiResponse<any>>('/qlht/role-menus/save-all', data).then(res => res.data),
}
