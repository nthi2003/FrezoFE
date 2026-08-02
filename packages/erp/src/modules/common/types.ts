// ============================================================
// FREZO ERP — Common module types (notifications)
// ============================================================

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string

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
  priority?: NotificationPriority
}

export interface NotifDeepLinkInput {
  actionUrl?: string | null
  link?: string | null
  type?: string | null
  entityType?: string | null
  entityId?: string | null
}
