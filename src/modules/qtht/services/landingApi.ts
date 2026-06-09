import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@/types/api.types'

export const landingApi = {
  getConfig: () =>
    axiosClient.get<ApiResponse<any>>('/qtbv/landing-config').then(res => res.data.data),
    
  updateConfig: (data: any) =>
    axiosClient.put<ApiResponse<any>>('/qtbv/landing-config', data).then(res => res.data.data),
}
