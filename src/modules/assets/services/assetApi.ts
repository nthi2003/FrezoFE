import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const assetApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlts/assets', { params }).then(res => res.data),
}
