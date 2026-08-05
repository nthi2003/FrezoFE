// ============================================================
// FREZO ERP — NotificationsList
// Danh sách thông báo full page — dùng NotificationRow shared.
// ============================================================

import { NotificationRow } from './NotificationRow'
import type { NotificationItem } from '../types'

export type { NotificationItem }

interface NotificationsListProps {
  items: NotificationItem[]
  onItemClick: (n: NotificationItem) => void
}

export function NotificationsList({ items, onItemClick }: NotificationsListProps) {
  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((n) => (
        <li key={n.id || `${n.title}-${n.createdDate || n.createdAt}`}>
          <NotificationRow
            n={n}
            variant="full"
            showTypeBadge
            onClick={() => onItemClick(n)}
          />
        </li>
      ))}
    </ul>
  )
}
