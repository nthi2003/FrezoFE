import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList, unwrapPage, type Paginated } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'
import type { NotificationItem } from '../types'

export interface NotificationListParams {
  /** 1-based */
  page?: number
  size?: number
  /** all | unread | urgent */
  tab?: string
  type?: string
  search?: string
}

export interface NotificationStats {
  count: number
  total: number
  urgent: number
}

export const notificationApi = {
  /**
   * GET /qtht/notification/my — danh sách (mới nhất trước).
   * BE trả PageResponse `{ items, total, totalPages, pageNumber, pageSize }`.
   * Không truyền size → BE lấy hết trong 1 trang (tương thích bell/lobby).
   */
  getMyNotifications: (params?: NotificationListParams) =>
    axiosClient
      .get<ApiResponse<unknown>>('/qtht/notification/my', { params })
      .then((res) => unwrapList<NotificationItem>(res.data)),

  /** GET /qtht/notification/my — kèm meta phân trang. */
  getMyNotificationsPage: (params: NotificationListParams): Promise<Paginated<NotificationItem>> =>
    axiosClient
      .get<ApiResponse<unknown>>('/qtht/notification/my', { params })
      .then((res) => unwrapPage<NotificationItem>(res.data)),

  /**
   * GET /qtht/notification/unread-count — badge số chưa đọc.
   * BE có thể trả thêm total/urgent; hook cũ chỉ cần count.
   */
  getUnreadCount: () =>
    axiosClient
      .get<ApiResponse<{ count?: number }>>('/qtht/notification/unread-count')
      .then((res) => res.data.data?.count ?? 0),

  /** Stats đầy đủ cho trang /notifications (total / unread / urgent). */
  getNotificationStats: () =>
    axiosClient
      .get<ApiResponse<Partial<NotificationStats>>>('/qtht/notification/unread-count')
      .then((res) => {
        const d = res.data.data
        return {
          count: d?.count ?? 0,
          total: d?.total ?? 0,
          urgent: d?.urgent ?? 0,
        } satisfies NotificationStats
      }),

  /** PATCH /qtht/notification/{id}/read — đánh dấu 1 thông báo đã đọc. */
  markAsRead: (id: string) =>
    axiosClient.patch<ApiResponse<string>>(`/qtht/notification/${id}/read`).then((res) => res.data),

  /** PATCH /qtht/notification/mark-all-read — đánh dấu tất cả đã đọc. */
  markAllRead: () =>
    axiosClient
      .patch<ApiResponse<{ updated: number }>>('/qtht/notification/mark-all-read')
      .then((res) => res.data.data?.updated ?? 0),
}
