import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const settingApi = {
  getSettings: () =>
    axiosClient.get<ApiResponse<any[]>>('/qtht/setting').then(res => res.data.data),
    
  getByOrgId: (orgId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qtht/setting/org/${orgId}`).then(res => res.data.data ?? res.data),

  updateSetting: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qtht/setting/${id}`, data).then(res => res.data.data ?? res.data),

  createSetting: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qtht/setting', data).then(res => res.data.data ?? res.data),

  backupSystem: () =>
    axiosClient.post<ApiResponse<string>>('/qtht/system/backup').then(res => res.data.message),
}
