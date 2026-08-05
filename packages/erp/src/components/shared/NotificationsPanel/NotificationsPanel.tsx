// ============================================================
// NotificationsPanel — Slack/Linear-style dropdown trong Header
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, MoreHorizontal, AlertCircle } from 'lucide-react'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
} from '@/modules/common/hooks/useNotification'
import { resolveNotificationUrl } from '@/modules/common/utils/resolveNotificationUrl'
import {
  groupNotificationsByTime,
  isNotificationRead,
} from '@/modules/common/utils/notificationHelpers'
import { NotificationRow } from '@/modules/common/components/NotificationRow'
import type { NotificationItem } from '@/modules/common/types'

interface Props {
  onClose: () => void
}

export function NotificationsPanel({ onClose }: Props) {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useNotifications()
  const { data: unreadFromApi } = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const notifications = useMemo<NotificationItem[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  )

  const filtered = useMemo(() => {
    if (tab === 'unread') return notifications.filter((n) => !isNotificationRead(n))
    return notifications
  }, [notifications, tab])

  const unreadCount = useMemo(() => {
    if (typeof unreadFromApi === 'number') return unreadFromApi
    return notifications.filter((n) => !isNotificationRead(n)).length
  }, [unreadFromApi, notifications])

  const groups = useMemo(() => groupNotificationsByTime(filtered), [filtered])

  const handleClick = (n: NotificationItem) => {
    if (!isNotificationRead(n) && n.id) markRead.mutate(n.id)
    const url = resolveNotificationUrl(n)
    if (url) {
      navigate(url)
      onClose()
    }
  }

  const handleMarkAllRead = () => {
    const unreadIds = notifications
      .filter((n) => !isNotificationRead(n) && n.id)
      .map((n) => n.id!)
    if (unreadIds.length > 0) markAll.mutate(unreadIds)
  }

  return (
    <div className="w-[380px] bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[70vh]">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-neutral-500" />
          <span className="font-semibold text-neutral-800">Thông báo</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markAll.isPending}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:text-neutral-300 disabled:cursor-not-allowed inline-flex items-center gap-1"
          title="Đánh dấu tất cả đã đọc"
        >
          <CheckCheck size={13} /> Đọc hết
        </button>
      </div>

      <div className="px-2 py-1.5 border-b border-neutral-100 flex items-center gap-1 bg-neutral-50/50">
        {(['all', 'unread'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`h-7 px-2.5 rounded-md text-xs font-semibold transition ${
              tab === t
                ? 'bg-white text-primary-700 shadow-sm border border-neutral-200'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t === 'all' ? 'Tất cả' : 'Chưa đọc'}
            {t === 'unread' && unreadCount > 0 && (
              <span className="ml-1 text-primary-600">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
            <AlertCircle size={28} className="text-rose-500 mb-2" />
            <p className="text-sm font-medium text-neutral-800">
              {(error as { response?: { status?: number } })?.response?.status === 401
                ? 'Phiên hết hạn (401)'
                : 'Không tải được thông báo'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-xs font-medium text-primary-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-neutral-400">
            <Bell size={32} className="opacity-30 mb-2" />
            <p className="text-sm font-medium">
              {tab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
            </p>
            <p className="text-xs mt-1">Thông báo mới sẽ hiện ở đây</p>
          </div>
        ) : (
          <>
            {groups.today.length > 0 && (
              <NotifSection title="Hôm nay" items={groups.today} onItemClick={handleClick} />
            )}
            {groups.thisWeek.length > 0 && (
              <NotifSection title="Tuần này" items={groups.thisWeek} onItemClick={handleClick} />
            )}
            {groups.older.length > 0 && (
              <NotifSection title="Cũ hơn" items={groups.older} onItemClick={handleClick} />
            )}
          </>
        )}
      </div>

      <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400">
          {notifications.length} thông báo · cập nhật mỗi 30 giây
        </span>
        <button
          type="button"
          onClick={() => {
            navigate('/notifications')
            onClose()
          }}
          className="text-[11px] font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
        >
          Xem tất cả <MoreHorizontal size={11} />
        </button>
      </div>
    </div>
  )
}

function NotifSection({
  title,
  items,
  onItemClick,
}: {
  title: string
  items: NotificationItem[]
  onItemClick: (n: NotificationItem) => void
}) {
  return (
    <div>
      <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        {title}
      </div>
      {items.map((n) => (
        <NotificationRow
          key={n.id || `${title}-${n.createdDate}`}
          n={n}
          variant="compact"
          onClick={() => onItemClick(n)}
        />
      ))}
    </div>
  )
}
