// ============================================================
// FREZO ERP — Role API Service
// ============================================================

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
  // Get list of roles (optional filter by appCode)
  getRoles: (appCode?: string) =>
    axiosClient
      .get<ApiResponse<RoleDTO[]>>('/qlht/roles', { params: { appCode } })
      .then((res) => res.data.data),

  // Create role
  createRole: (data: RoleRequest) =>
    axiosClient
      .post<ApiResponse<RoleDTO>>('/qlht/roles', data)
      .then((res) => res.data.data),

  // Update role
  updateRole: (data: RoleRequest) =>
    axiosClient
      .put<ApiResponse<RoleDTO>>('/qlht/roles', data)
      .then((res) => res.data.data),

  // Delete role
  deleteRole: (code: string, appCode: string) =>
    axiosClient
      .delete<void>('/qlht/roles', { params: { code, appCode } })
      .then((res) => res.data),
}
