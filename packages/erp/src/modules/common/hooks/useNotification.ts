import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../services/notificationApi'
import { resolveNotificationUrl } from '../utils/resolveNotificationUrl'
import type { NotificationItem } from '../types'

export const NOTIFICATION_QUERY_KEY = ['common', 'notifications'] as const
export const NOTIFICATION_UNREAD_KEY = ['common', 'notifications', 'unread-count'] as const

function invalidateNotificationQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY })
  qc.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_KEY })
}

/**
 * Poll thông báo mỗi 30 giây. Đủ realtime cho ticket/task/leave/payroll workflows.
 * Nếu về sau nối WS: đổi `refetchInterval` thành `false` khi socket connected.
 */
export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEY,
    queryFn: notificationApi.getMyNotifications,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: (count, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401 || status === 403) return false
      return count < 2
    },
  })
}

/** Badge count — ưu tiên API unread-count, đồng bộ với BE. */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_UNREAD_KEY,
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: (count, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401 || status === 403) return false
      return count < 2
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => invalidateNotificationQueries(qc),
  })
}

/**
 * Ưu tiên bulk /mark-all-read. Fallback per-id chỉ khi 404/501 (BE cũ).
 */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      try {
        return await notificationApi.markAllRead()
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 401 || status === 403) throw err
        if (status === 404 || status === 501) {
          await Promise.all(ids.map((id) => notificationApi.markAsRead(id)))
          return ids.length
        }
        throw err
      }
    },
    onSuccess: () => {
      toast.success('Đã đánh dấu tất cả đã đọc')
      invalidateNotificationQueries(qc)
    },
    onError: () => toast.error('Không đánh dấu đã đọc được'),
  })
}

/** Toast realtime khi có notification MỚI (so với snapshot lần poll trước). */
export function useNotificationRealtimeToast() {
  const { data } = useNotifications()
  const navigate = useNavigate()
  const seenIdsRef = useRef<Set<string>>(new Set())
  const initialisedRef = useRef(false)

  useEffect(() => {
    if (!Array.isArray(data)) return

    if (!initialisedRef.current) {
      data.forEach((n) => n?.id && seenIdsRef.current.add(n.id))
      initialisedRef.current = true
      return
    }

    const newOnes = data.filter((n) => n?.id && !seenIdsRef.current.has(n.id))
    newOnes.forEach((n: NotificationItem) => {
      if (!n.id) return
      seenIdsRef.current.add(n.id)
      const isUrgent = n.priority === 'URGENT'
      const title = n.title || 'Thông báo mới'
      const body = n.message || n.content || ''
      const url = resolveNotificationUrl(n)

      const toastFn = isUrgent ? toast.error : toast.info
      toastFn(title, {
        description: body,
        duration: isUrgent ? 8000 : 5000,
        action: url
          ? {
              label: 'Xem',
              onClick: () => navigate(url),
            }
          : undefined,
      })
    })
  }, [data, navigate])
}
