import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const notificationApi = {
  getMyNotifications: () =>
    axiosClient.get<ApiResponse<any[]>>('/api/notifications/my').then(res => res.data.data),
}
