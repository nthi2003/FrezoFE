import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@/types/api.types'

export const apilogApi = {
  getLogs: () =>
    axiosClient.get<ApiResponse<any[]>>('/apilogs').then(res => res.data.data),
    
  deleteBulk: (days: number) =>
    axiosClient.delete<ApiResponse<string>>(`/apilogs/bulk/${days}`).then(res => res.data.message),
}
