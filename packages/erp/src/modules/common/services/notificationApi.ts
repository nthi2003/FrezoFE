import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const notificationApi = {
  /** GET /qtht/notification/my — danh sách thông báo user hiện tại (mới nhất trước). */
  getMyNotifications: () =>
    axiosClient.get<ApiResponse<any[]>>('/qtht/notification/my').then((res) => res.data.data),

  /** GET /qtht/notification/unread-count — số badge. */
  getUnreadCount: () =>
    axiosClient
      .get<ApiResponse<{ count: number }>>('/qtht/notification/unread-count')
      .then((res) => res.data.data?.count ?? 0),

  /** PATCH /qtht/notification/{id}/read — đánh dấu 1 thông báo đã đọc. */
  markAsRead: (id: string) =>
    axiosClient.patch<ApiResponse<any>>(`/qtht/notification/${id}/read`).then((res) => res.data),

  /** PATCH /qtht/notification/mark-all-read — đánh dấu tất cả đã đọc (v1.2). */
  markAllRead: () =>
    axiosClient
      .patch<ApiResponse<{ updated: number }>>('/qtht/notification/mark-all-read')
      .then((res) => res.data.data?.updated ?? 0),
}
