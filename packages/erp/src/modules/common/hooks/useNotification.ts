import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../services/notificationApi'
import { resolveNotificationUrl } from '../utils/resolveNotificationUrl'

/**
 * Poll thông báo mỗi 30 giây. Đủ realtime cho ticket/task/leave/payroll workflows
 * (không cần WebSocket client — BE đã push WS nhưng FE hiện tại chưa consume).
 * <p>
 * Nếu về sau nối WS: đổi `refetchInterval` thành `false` khi socket connected.
 */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.getMyNotifications,
    select: (data: any) => (Array.isArray(data) ? data : data?.data ?? []),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    // Không retry 401 — để UI hiện error rõ, không nuốt auth fail
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

/**
 * Ưu tiên bulk /mark-all-read. Fallback per-id chỉ khi 404/501 (BE cũ).
 * Không nuốt 401/403.
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
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => toast.error('Không đánh dấu đã đọc được'),
  })
}

/**
 * Toast realtime khi có notification MỚI (so với snapshot lần poll trước).
 */
export function useNotificationRealtimeToast() {
  const { data } = useNotifications()
  const navigate = useNavigate()
  const seenIdsRef = useRef<Set<string>>(new Set())
  const initialisedRef = useRef(false)

  useEffect(() => {
    if (!Array.isArray(data)) return

    if (!initialisedRef.current) {
      data.forEach((n: any) => n?.id && seenIdsRef.current.add(n.id))
      initialisedRef.current = true
      return
    }

    const newOnes = data.filter((n: any) => n?.id && !seenIdsRef.current.has(n.id))
    newOnes.forEach((n: any) => {
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
