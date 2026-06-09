// ============================================================
// FREZO ERP — User API Service
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'

export interface UserDTO {
  id?: number
  username: string
  email: string
  fullName: string // Note: DTO uses fullName, but request uses fullname
  phone?: string
  status: number // 1: Active, 0: Inactive
  roleIds?: number[]
}

export interface RegisterRequest {
  username: string
  password?: string
  email: string
  fullname: string // From BE dto
  dataAction: number
  roleId?: string
  orgId?: string
}

export const userApi = {
  // Get paginated users (/users/all)
  getUsers: (page: number, size: number, search?: string) =>
    axiosClient
      .get<ApiResponse<PaginatedResponse<UserDTO>>>(API.QTHT.USERS, {
        params: { page, size, search },
      })
      .then((res) => res.data.data),

  // Create user (/users/register)
  createUser: (data: RegisterRequest) =>
    axiosClient
      .post<ApiResponse<string>>(API.QTHT.USER_REGISTER, data)
      .then((res) => res.data.data),

  // Update user
  updateUser: (id: string | number, data: Partial<UserDTO>) =>
    axiosClient
      .put<ApiResponse<UserDTO>>(API.QTHT.USER_BY_ID(String(id)), data)
      .then((res) => res.data.data),

  // Delete/Lock user
  deleteUser: (id: string | number) =>
    axiosClient
      .delete<ApiResponse<void>>(API.QTHT.USER_BY_ID(String(id)))
      .then((res) => res.data),

  // Active user
  activeUser: (id: string | number) =>
    axiosClient
      .put<ApiResponse<string>>(API.QTHT.USER_BY_ID(String(id)) + '/active')
      .then((res) => res.data.data),

  // Lock user
  lockUser: (id: string | number) =>
    axiosClient
      .put<ApiResponse<string>>(API.QTHT.USER_BY_ID(String(id)) + '/lock')
      .then((res) => res.data.data),

  // Reset password
  resetPassword: (id: string | number) =>
    axiosClient
      .post<ApiResponse<string>>(API.QTHT.USER_BY_ID(String(id)) + '/reset-password')
      .then((res) => res.data.data),

  // Assign Role
  assignRole: (username: string, roleCode: string, appCode: string = 'QTHT') =>
    axiosClient
      .post<ApiResponse<string>>('/users/assign-role', null, {
        params: { username, roleCode, appCode },
      })
      .then((res) => res.data.data),
}
