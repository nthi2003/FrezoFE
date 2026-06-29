import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const aiDocApi = {
  analyze: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/ai/doc/analyze', data).then(res => res.data),
  review: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/ai/doc/review', data).then(res => res.data),
}
