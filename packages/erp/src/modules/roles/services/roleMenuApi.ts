import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@frezo/types'

export const roleMenuApi = {
  getMenusByRole: (roleCode: string) =>
    axiosClient.get<ApiResponse<any[]>>(`/qtht/role-menu/role/${roleCode}`).then(res => res.data.data),

  saveAll: (data: { roleId: string; appCode: string; menuIds: string[] }) =>
    axiosClient.post<ApiResponse<any>>(`/qtht/role-menu/save-all`, data).then(res => res.data.message)
}
