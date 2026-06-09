import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@/types/api.types'

export const roleMenuApi = {
  getMenusByRole: (roleCode: string) =>
    axiosClient.get<ApiResponse<any[]>>(`/qlht/role-menus/role/${roleCode}`).then(res => res.data.data),

  saveAll: (data: any[]) =>
    axiosClient.post<ApiResponse<any>>(`/qlht/role-menus/save-all`, data).then(res => res.data.message)
}
