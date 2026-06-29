import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const notificationApi = {
  getMyNotifications: () =>
    axiosClient.get<ApiResponse<any[]>>('/qtht/notification/my').then(res => res.data.data),

  markAsRead: (id: string) =>
    axiosClient.patch<ApiResponse<any>>(`/qtht/notification/${id}/read`).then(res => res.data),
}
