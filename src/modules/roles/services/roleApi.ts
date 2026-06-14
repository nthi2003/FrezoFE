import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export interface RoleDTO {
  id?: string
  code: string
  appCode: string
  name: string
  description: string
  createdDate?: string
  updatedDate?: string
}

export interface RoleRequest {
  code: string
  appCode: string
  name: string
  description: string
}

export const roleApi = {
  getRoles: (appCode?: string) =>
    axiosClient
      .get<ApiResponse<RoleDTO[]>>('/qtht/role', { params: { appCode } })
      .then((res) => res.data.data),

  getCombobox: (appCode?: string) =>
    axiosClient
      .get<ApiResponse<RoleDTO[]>>('/qtht/role/combobox', { params: { appCode } })
      .then(res => res.data.data),

  createRole: (data: RoleRequest) =>
    axiosClient
      .post<ApiResponse<RoleDTO>>('/qtht/role', data)
      .then((res) => res.data.data),

  updateRole: (data: RoleRequest) =>
    axiosClient
      .put<ApiResponse<RoleDTO>>('/qtht/role', data)
      .then((res) => res.data.data),

  deleteRole: (code: string, appCode: string) =>
    axiosClient
      .delete<void>('/qtht/role', { params: { code, appCode } })
      .then((res) => res.data),
}
