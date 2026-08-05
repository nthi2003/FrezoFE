// ============================================================
// Notification business helpers — đọc/trạng thái/lọc/nhóm
// ============================================================

import { formatRelativeTime } from '@/lib/utils/format'
import {
  DEFAULT_NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_TYPE_LABELS,
  type NotificationTypeConfig,
} from '../constants/notificationTypes'
import type { NotificationItem } from '../types'

export function isNotificationRead(n: NotificationItem): boolean {
  return n.isRead === true || n.read === true
}

export function getNotificationCreatedAt(n: NotificationItem): string | undefined {
  return n.createdDate || n.createdAt
}

export function getNotificationTypeConfig(type?: string): NotificationTypeConfig {
  const t = type || 'INFO'
  if (NOTIFICATION_TYPE_CONFIG[t]) return NOTIFICATION_TYPE_CONFIG[t]
  if (t.startsWith('STOCK') || t.includes('STOCK')) {
    return NOTIFICATION_TYPE_CONFIG.STOCK_ALERT
  }
  return NOTIFICATION_TYPE_CONFIG.INFO ?? DEFAULT_NOTIFICATION_TYPE_CONFIG
}

export function getNotificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type] || type
}

export function getNotificationTitle(n: NotificationItem, maxLen = 60): string {
  if (n.title) return n.title
  const body = n.content || n.message
  if (body) return body.length > maxLen ? `${body.substring(0, maxLen)}…` : body
  return 'Thông báo'
}

export function getNotificationBody(n: NotificationItem): string | undefined {
  return n.content || n.message
}

export function formatNotificationWhen(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    if (days >= 7) {
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return formatRelativeTime(d)
  } catch {
    return ''
  }
}

export function countUnreadNotifications(items: NotificationItem[]): number {
  return items.filter((n) => !isNotificationRead(n)).length
}

export function filterNotifications(
  items: NotificationItem[],
  opts: {
    tab?: 'all' | 'unread' | 'urgent'
    type?: string
    search?: string
  },
): NotificationItem[] {
  let list = items

  if (opts.tab === 'unread') {
    list = list.filter((n) => !isNotificationRead(n))
  } else if (opts.tab === 'urgent') {
    list = list.filter((n) => n.priority === 'URGENT')
  }

  if (opts.type && opts.type !== 'ALL') {
    list = list.filter((n) => (n.type || 'INFO') === opts.type)
  }

  const q = opts.search?.trim().toLowerCase()
  if (q) {
    list = list.filter((n) => {
      const hay = [n.title, n.content, n.message, n.senderUsername]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }

  return list
}

export function computeNotificationStats(items: NotificationItem[]) {
  const total = items.length
  const unread = countUnreadNotifications(items)
  const urgent = items.filter((n) => n.priority === 'URGENT' && !isNotificationRead(n)).length
  return { total, unread, urgent }
}

export function groupNotificationsByTime(items: NotificationItem[]): {
  today: NotificationItem[]
  thisWeek: NotificationItem[]
  older: NotificationItem[]
} {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000

  const groups = {
    today: [] as NotificationItem[],
    thisWeek: [] as NotificationItem[],
    older: [] as NotificationItem[],
  }

  for (const n of items) {
    const iso = getNotificationCreatedAt(n)
    const t = iso ? new Date(iso).getTime() : 0
    if (t >= todayStart) groups.today.push(n)
    else if (t >= weekStart) groups.thisWeek.push(n)
    else groups.older.push(n)
  }

  return groups
}

export function collectNotificationTypes(items: NotificationItem[]): string[] {
  const set = new Set<string>()
  items.forEach((n) => n.type && set.add(n.type))
  return Array.from(set).sort()
}
