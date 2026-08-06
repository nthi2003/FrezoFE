import type { StatusColor, StatusConfig } from '@frezo/ui'

export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export const PUBLISH_STATUS_CONFIG: Record<PublishStatus, StatusConfig> = {
  DRAFT: { label: 'Bản nháp', color: 'neutral' },
  PUBLISHED: { label: 'Đã xuất bản', color: 'success' },
  ARCHIVED: { label: 'Lưu trữ', color: 'warning' },
}

export function resolvePublishStatus(status?: string | null): StatusConfig {
  const key = (status || 'DRAFT').toUpperCase()
  const cfg = PUBLISH_STATUS_CONFIG[key as PublishStatus]
  if (cfg) return cfg
  return { label: status || '—', color: 'neutral' as StatusColor }
}
