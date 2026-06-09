import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@/types/api.types'

export const settingApi = {
  getSettings: () =>
    axiosClient.get<ApiResponse<any[]>>('/settings').then(res => res.data.data),
    
  updateSetting: (id: string, value: string) =>
    axiosClient.put<ApiResponse<any>>(`/settings/${id}`, { value }).then(res => res.data.data),

  backupSystem: () =>
    axiosClient.post<ApiResponse<string>>('/qtht/system/backup').then(res => res.data.message),
}
