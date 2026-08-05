// ============================================================
// FREZO ERP — NotificationBell
// Icon Bell + badge số chưa đọc + popover dropdown NotificationsPanel.
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { AppTooltip } from '@frezo/ui'
import {
  useNotifications,
  useUnreadNotificationCount,
} from '@/modules/common/hooks/useNotification'
import { countUnreadNotifications } from '@/modules/common/utils/notificationHelpers'
import { NotificationsPanel } from '@/components/shared/NotificationsPanel'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const { data: notifications } = useNotifications()
  const { data: unreadFromApi } = useUnreadNotificationCount()

  const unreadCount =
    typeof unreadFromApi === 'number'
      ? unreadFromApi
      : countUnreadNotifications(Array.isArray(notifications) ? notifications : [])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  return (
    <div className={`relative ${className || ''}`} ref={rootRef}>
      <AppTooltip content="Thông báo">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-colors relative"
          aria-label={
            unreadCount > 0 ? `Thông báo — ${unreadCount} chưa đọc` : 'Thông báo'
          }
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </AppTooltip>

      {open && (
        <div
          className="absolute top-10 right-0 z-50 animate-fade-in"
          role="dialog"
          aria-label="Danh sách thông báo"
        >
          <NotificationsPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
