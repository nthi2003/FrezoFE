import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'
import type { NotificationItem } from '../types'

export const notificationApi = {
  /** GET /qtht/notification/my — danh sách thông báo user hiện tại (mới nhất trước). */
  getMyNotifications: () =>
    axiosClient
      .get<ApiResponse<NotificationItem[]>>('/qtht/notification/my')
      .then((res) => unwrapList<NotificationItem>(res.data)),

  /** GET /qtht/notification/unread-count — số badge. */
  getUnreadCount: () =>
    axiosClient
      .get<ApiResponse<{ count: number }>>('/qtht/notification/unread-count')
      .then((res) => res.data.data?.count ?? 0),

  /** PATCH /qtht/notification/{id}/read — đánh dấu 1 thông báo đã đọc. */
  markAsRead: (id: string) =>
    axiosClient.patch<ApiResponse<string>>(`/qtht/notification/${id}/read`).then((res) => res.data),

  /** PATCH /qtht/notification/mark-all-read — đánh dấu tất cả đã đọc. */
  markAllRead: () =>
    axiosClient
      .patch<ApiResponse<{ updated: number }>>('/qtht/notification/mark-all-read')
      .then((res) => res.data.data?.updated ?? 0),
}
