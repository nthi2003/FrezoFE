// ============================================================
// NotificationRow — shared row cho panel + full page list
// ============================================================

import type { NotificationItem } from '../types'
import { resolveNotificationUrl } from '../utils/resolveNotificationUrl'
import {
  formatNotificationWhen,
  getNotificationBody,
  getNotificationCreatedAt,
  getNotificationTitle,
  getNotificationTypeConfig,
  isNotificationRead,
} from '../utils/notificationHelpers'

export interface NotificationRowProps {
  n: NotificationItem
  onClick: () => void
  variant?: 'compact' | 'full'
  showTypeBadge?: boolean
}

export function NotificationRow({
  n,
  onClick,
  variant = 'full',
  showTypeBadge = false,
}: NotificationRowProps) {
  const cfg = getNotificationTypeConfig(n.type)
  const Icon = cfg.icon
  const read = isNotificationRead(n)
  const urgent = n.priority === 'URGENT'
  const clickable = !!resolveNotificationUrl(n)
  const compact = variant === 'compact'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 text-left border-l-2 transition-colors ${
        compact ? 'px-4 py-2.5' : 'px-4 py-3'
      } ${
        read
          ? 'border-transparent hover:bg-neutral-50'
          : urgent
            ? `border-rose-500 ${compact ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'bg-rose-50/40 hover:bg-rose-50/70'}`
            : `border-primary-500 ${compact ? 'bg-primary-50/30 hover:bg-primary-50/60' : 'bg-primary-50/30 hover:bg-primary-50/60'}`
      }`}
    >
      <div
        className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} flex items-center justify-center shrink-0 ${cfg.bg} ${
          urgent && !read ? 'ring-2 ring-rose-300 ring-offset-1' : ''
        }`}
      >
        <Icon size={compact ? 14 : 16} className={cfg.text} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-sm truncate ${
              read ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900'
            }`}
          >
            {getNotificationTitle(n, compact ? 40 : 60)}
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
        {getNotificationBody(n) && (
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-snug">
            {getNotificationBody(n)}
          </p>
        )}
        <div
          className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-neutral-400 mt-1 font-medium flex items-center gap-1.5 flex-wrap`}
        >
          <span>{formatNotificationWhen(getNotificationCreatedAt(n))}</span>
          {n.senderUsername && (
            <>
              <span className="text-neutral-300">·</span>
              <span>từ @{n.senderUsername}</span>
            </>
          )}
          {showTypeBadge && n.type && (
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
  )
}