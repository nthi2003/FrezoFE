// ============================================================
// NotificationsPanel — Slack/Linear-style
// Group by time, filter, mark-read, click to navigate
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, AlertCircle, Info, XCircle, Bell, CheckCheck, MoreHorizontal,
  Ticket as TicketIcon, UserPlus, UserMinus, RefreshCw, Wallet, HandCoins,
  CalendarClock, CalendarCheck2, FileText, Zap, Inbox, MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import {
  useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
} from '@/modules/common/hooks/useNotification'
import { resolveNotificationUrl } from '@/modules/common/utils/resolveNotificationUrl'

// ============================================================
// Types
// ============================================================

interface NotificationItem {
  id: string
  /**
   * Loại notification. Có 2 nhóm:
   *  - Generic: SUCCESS | ERROR | WARNING | INFO
   *  - Domain event (v1.2): TICKET_ASSIGNED | TICKET_STATUS_CHANGED | TICKET_UNASSIGNED |
   *    TICKET_ASSIGNED_TO_OTHER | PAYROLL_CONFIRMED | PAYROLL_PAID |
   *    LEAVE_REQUESTED | LEAVE_APPROVED | ...
   */
  type?: string
  title?: string
  content?: string
  message?: string
  createdDate?: string
  createdAt?: string
  isRead?: boolean
  read?: boolean
  actionUrl?: string
  link?: string
  entityType?: string
  entityId?: string
  senderUsername?: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string
}

interface Props {
  onClose: () => void
}

// ============================================================
// Component
// ============================================================

export function NotificationsPanel({ onClose }: Props) {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const notifications: NotificationItem[] = data || []

  const filtered = useMemo(() => {
    if (tab === 'unread') return notifications.filter((n) => !isRead(n))
    return notifications
  }, [notifications, tab])

  const unreadCount = useMemo(() => notifications.filter((n) => !isRead(n)).length, [notifications])

  // Group by time
  const groups = useMemo(() => groupByTime(filtered), [filtered])

  const handleClick = (n: NotificationItem) => {
    if (!isRead(n) && n.id) markRead.mutate(n.id)
    const url = resolveNotificationUrl(n)
    if (url) {
      navigate(url)
      onClose()
    }
  }

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !isRead(n) && n.id).map((n) => n.id)
    if (unreadIds.length > 0) markAll.mutate(unreadIds)
  }

  return (
    <div className="w-[380px] bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[70vh]">
      {/* Header */}
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
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markAll.isPending}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:text-neutral-300 disabled:cursor-not-allowed inline-flex items-center gap-1"
          title="Đánh dấu tất cả đã đọc"
        >
          <CheckCheck size={13} /> Đọc hết
        </button>
      </div>

      {/* Tabs */}
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

      {/* Body */}
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

      {/* Footer */}
      <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400">
          {notifications.length} thông báo · cập nhật mỗi phút
        </span>
        <button
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

// ============================================================
// Section
// ============================================================

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
        <NotifRow key={n.id} n={n} onClick={() => onItemClick(n)} />
      ))}
    </div>
  )
}

function NotifRow({ n, onClick }: { n: NotificationItem; onClick: () => void }) {
  const cfg = getTypeConfig(n.type)
  const Icon = cfg.icon
  const read = isRead(n)
  const urgent = n.priority === 'URGENT'
  const clickable = !!resolveNotificationUrl(n)
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 flex items-start gap-3 border-l-2 transition-colors text-left ${
        read
          ? 'border-transparent hover:bg-neutral-50'
          : urgent
            ? 'border-rose-500 bg-rose-50/30 hover:bg-rose-50/60'
            : 'border-primary-500 bg-primary-50/30 hover:bg-primary-50/60'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${
          urgent && !read ? 'ring-2 ring-rose-300 ring-offset-1' : ''
        }`}
      >
        <Icon size={14} className={cfg.text} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm truncate ${
              read ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900'
            }`}
          >
            {n.title || n.content?.substring(0, 40) || n.message?.substring(0, 40) || 'Thông báo'}
          </span>
          {urgent && !read && (
            <span className="px-1 py-0.5 text-[8px] font-bold text-rose-700 bg-rose-100 rounded uppercase tracking-wider">
              Khẩn
            </span>
          )}
          {!read && (
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ml-auto ${
                urgent ? 'bg-rose-500' : 'bg-primary-500'
              }`}
            />
          )}
        </div>
        {(n.content || n.message) && (
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-snug">
            {n.content || n.message}
          </p>
        )}
        <div className="text-[10px] text-neutral-400 mt-1 font-medium flex items-center gap-1.5">
          <span>{timeAgo(n.createdDate || n.createdAt)}</span>
          {n.senderUsername && (
            <>
              <span className="text-neutral-300">·</span>
              <span>từ @{n.senderUsername}</span>
            </>
          )}
          {clickable && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="text-primary-500">Xem chi tiết →</span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}

// ============================================================
// Helpers
// ============================================================

function isRead(n: NotificationItem): boolean {
  return n.isRead === true || n.read === true
}

function getTypeConfig(type?: string): { icon: LucideIcon; bg: string; text: string } {
  const map: Record<string, { icon: LucideIcon; bg: string; text: string }> = {
    // ---- Generic ----
    SUCCESS: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    ERROR: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-600' },
    WARNING: { icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-600' },
    INFO: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-600' },

    // ---- Ticket domain (v1.2) ----
    TICKET_CREATED: { icon: TicketIcon, bg: 'bg-blue-50', text: 'text-blue-600' },
    TICKET_ASSIGNED: { icon: UserPlus, bg: 'bg-primary-50', text: 'text-primary-700' },
    TICKET_UNASSIGNED: { icon: UserMinus, bg: 'bg-neutral-100', text: 'text-neutral-600' },
    TICKET_ASSIGNED_TO_OTHER: { icon: UserPlus, bg: 'bg-blue-50', text: 'text-blue-600' },
    TICKET_STATUS_CHANGED: { icon: RefreshCw, bg: 'bg-violet-50', text: 'text-violet-600' },
    TICKET_COMMENTED: { icon: FileText, bg: 'bg-neutral-100', text: 'text-neutral-600' },
    TICKET_RESOLVED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },

    // ---- Payroll domain ----
    PAYROLL_CONFIRMED: { icon: Wallet, bg: 'bg-blue-50', text: 'text-blue-600' },
    PAYROLL_PAID: { icon: HandCoins, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    PAYROLL_CALCULATED: { icon: Wallet, bg: 'bg-neutral-100', text: 'text-neutral-600' },

    // ---- Leave / Attendance ----
    LEAVE_REQUESTED: { icon: CalendarClock, bg: 'bg-amber-50', text: 'text-amber-600' },
    LEAVE_APPROVED: { icon: CalendarCheck2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    LEAVE_REJECTED: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-600' },

    // ---- CSKH / Inbox (landing page + Zalo OA leads) ----
    LEAD_NEW: { icon: Inbox, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    LEAD_ASSIGNED: { icon: UserPlus, bg: 'bg-primary-50', text: 'text-primary-700' },
    LEAD_IMPORTED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    ZALO_MESSAGE: { icon: MessageCircle, bg: 'bg-sky-50', text: 'text-sky-600' },

    // ---- Urgent (any) ----
    URGENT: { icon: Zap, bg: 'bg-rose-100', text: 'text-rose-700' },
  }
  return map[type || 'INFO'] || map.INFO
}

function groupByTime(items: NotificationItem[]): {
  today: NotificationItem[]
  thisWeek: NotificationItem[]
  older: NotificationItem[]
} {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000 // last 7 days

  const groups = { today: [] as NotificationItem[], thisWeek: [] as NotificationItem[], older: [] as NotificationItem[] }
  for (const n of items) {
    const iso = n.createdDate || n.createdAt
    const t = iso ? new Date(iso).getTime() : 0
    if (t >= todayStart) groups.today.push(n)
    else if (t >= weekStart) groups.thisWeek.push(n)
    else groups.older.push(n)
  }
  return groups
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'vừa xong'
    if (mins < 60) return `${mins} phút trước`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} ngày trước`
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}
