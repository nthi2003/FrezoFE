// ============================================================
// FREZO ERP — NotificationsList
// Danh sách thông báo dạng full page: có avatar type + tiêu đề +
// nội dung snippet + thời gian + trạng thái đã đọc.
// ============================================================

import {
  CheckCircle2, AlertCircle, Info, XCircle, Bell, Ticket as TicketIcon,
  UserPlus, UserMinus, RefreshCw, Wallet, HandCoins, CalendarClock,
  CalendarCheck2, FileText, Zap, Inbox, MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import { resolveNotificationUrl } from '../utils/resolveNotificationUrl'

export interface NotificationItem {
  id?: string
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

interface NotificationsListProps {
  items: NotificationItem[]
  onItemClick: (n: NotificationItem) => void
}

export function NotificationsList({ items, onItemClick }: NotificationsListProps) {
  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((n) => (
        <NotificationRow key={n.id || `${n.title}-${n.createdDate}`} n={n} onClick={() => onItemClick(n)} />
      ))}
    </ul>
  )
}

function NotificationRow({ n, onClick }: { n: NotificationItem; onClick: () => void }) {
  const cfg = getTypeConfig(n.type)
  const Icon = cfg.icon
  const read = n.isRead === true || n.read === true
  const urgent = n.priority === 'URGENT'
  const clickable = !!resolveNotificationUrl(n)
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full px-4 py-3 flex items-start gap-3 text-left border-l-2 transition-colors ${
          read
            ? 'border-transparent hover:bg-neutral-50'
            : urgent
              ? 'border-rose-500 bg-rose-50/40 hover:bg-rose-50/70'
              : 'border-primary-500 bg-primary-50/30 hover:bg-primary-50/60'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${
            urgent && !read ? 'ring-2 ring-rose-300 ring-offset-1' : ''
          }`}
        >
          <Icon size={16} className={cfg.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-sm truncate ${
                read ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900'
              }`}
            >
              {n.title || n.content?.substring(0, 60) || n.message?.substring(0, 60) || 'Thông báo'}
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
                aria-label="Chưa đọc"
              />
            )}
          </div>
          {(n.content || n.message) && (
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-snug">
              {n.content || n.message}
            </p>
          )}
          <div className="text-[11px] text-neutral-400 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
            <span>{formatWhen(n.createdDate || n.createdAt)}</span>
            {n.senderUsername && (
              <>
                <span className="text-neutral-300">·</span>
                <span>từ @{n.senderUsername}</span>
              </>
            )}
            {n.type && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="uppercase tracking-wider text-neutral-400">{n.type}</span>
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
    </li>
  )
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function getTypeConfig(type?: string): { icon: LucideIcon; bg: string; text: string } {
  const map: Record<string, { icon: LucideIcon; bg: string; text: string }> = {
    SUCCESS: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    ERROR: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-600' },
    WARNING: { icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-600' },
    INFO: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-600' },
    TICKET_CREATED: { icon: TicketIcon, bg: 'bg-blue-50', text: 'text-blue-600' },
    TICKET_ASSIGNED: { icon: UserPlus, bg: 'bg-primary-50', text: 'text-primary-700' },
    TICKET_UNASSIGNED: { icon: UserMinus, bg: 'bg-neutral-100', text: 'text-neutral-600' },
    TICKET_ASSIGNED_TO_OTHER: { icon: UserPlus, bg: 'bg-blue-50', text: 'text-blue-600' },
    TICKET_STATUS_CHANGED: { icon: RefreshCw, bg: 'bg-violet-50', text: 'text-violet-600' },
    TICKET_COMMENTED: { icon: FileText, bg: 'bg-neutral-100', text: 'text-neutral-600' },
    TICKET_RESOLVED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    PAYROLL_CONFIRMED: { icon: Wallet, bg: 'bg-blue-50', text: 'text-blue-600' },
    PAYROLL_PAID: { icon: HandCoins, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    PAYROLL_CALCULATED: { icon: Wallet, bg: 'bg-neutral-100', text: 'text-neutral-600' },
    LEAVE_REQUESTED: { icon: CalendarClock, bg: 'bg-amber-50', text: 'text-amber-600' },
    LEAVE_APPROVED: { icon: CalendarCheck2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    LEAVE_REJECTED: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-600' },
    LEAD_NEW: { icon: Inbox, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    LEAD_ASSIGNED: { icon: UserPlus, bg: 'bg-primary-50', text: 'text-primary-700' },
    LEAD_IMPORTED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    ZALO_MESSAGE: { icon: MessageCircle, bg: 'bg-sky-50', text: 'text-sky-600' },
    URGENT: { icon: Zap, bg: 'bg-rose-100', text: 'text-rose-700' },
  }
  return map[type || 'INFO'] || map.INFO || { icon: Bell, bg: 'bg-neutral-100', text: 'text-neutral-500' }
}

function formatWhen(iso?: string): string {
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
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
