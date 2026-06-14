import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const statisticsApi = {
  getLoginByDay: (params?: { from?: string; to?: string }) =>
    axiosClient.get<ApiResponse<any>>('/auth/statistic/login-by-day', { params }).then(res => res.data),
}
