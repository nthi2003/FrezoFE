import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@frezo/types'

export interface UserDTO {
  id?: number
  username: string
  email: string
  fullName: string
  phone?: string
  status: number
  personId?: string
  orgId?: string
  departmentId?: string
  roleIds?: number[]
}

export interface RegisterRequest {
  username: string
  password?: string
  email?: string
  fullname?: string
  dataAction: number
  personId?: string
  roleIds?: string[]
  orgId?: string
  departmentId?: string
}

export const userApi = {
  getUsers: (page: number, size: number, search?: string) =>
    axiosClient
      .get<ApiResponse<{ items: UserDTO[]; total: number; current: number; pageSize: number }>>(API.QTHT.USERS, {
        params: { page, size, search },
      })
      .then((res) => res.data.data),

  createUser: (data: RegisterRequest) =>
    axiosClient
      .post<ApiResponse<string>>(API.QTHT.USER_REGISTER, data)
      .then((res) => res.data.data),

  updateUser: (id: string | number, data: Partial<UserDTO>) =>
    axiosClient
      .put<ApiResponse<UserDTO>>(API.QTHT.USER_BY_ID(String(id)), data)
      .then((res) => res.data.data),

  deleteUser: (id: string | number) =>
    axiosClient
      .delete<ApiResponse<void>>(API.QTHT.USER_BY_ID(String(id)))
      .then((res) => res.data),

  activeUser: (id: string | number) =>
    axiosClient
      .put<ApiResponse<string>>(API.QTHT.USER_BY_ID(String(id)) + '/active')
      .then((res) => res.data.data),

  lockUser: (id: string | number) =>
    axiosClient
      .put<ApiResponse<string>>(API.QTHT.USER_BY_ID(String(id)) + '/lock')
      .then((res) => res.data.data),

  resetPassword: (id: string | number) =>
    axiosClient
      .post<ApiResponse<string>>(API.QTHT.USER_BY_ID(String(id)) + '/reset-password')
      .then((res) => res.data.data),

  assignRole: (username: string, roleCode: string, appCode: string = 'QTHT') =>
    axiosClient
      .post<ApiResponse<string>>(API.QTHT.USER_ASSIGN_ROLE, null, {
        params: { username, roleCode, appCode },
      })
      .then((res) => res.data.data),

  getUserById: (id: string) =>
    axiosClient
      .get<ApiResponse<UserDTO>>(API.QTHT.USER_BY_ID(id))
      .then(res => res.data.data),

  getUserRoles: (username: string) =>
    axiosClient
      .get<ApiResponse<any[]>>(API.QTHT.USER_ROLES(username))
      .then(res => res.data.data),
}
