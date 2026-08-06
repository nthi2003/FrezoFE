import type { StatusColor, StatusConfig } from '@frezo/ui'
import type { ApprovalStatus } from '../types'

export const APPROVAL_REQUEST_STATUS_CONFIG: Record<ApprovalStatus, StatusConfig> = {
  PENDING: { label: 'Chờ duyệt', color: 'warning' },
  APPROVED: { label: 'Đã duyệt', color: 'success' },
  REJECTED: { label: 'Từ chối', color: 'danger' },
  CANCELLED: { label: 'Đã huỷ', color: 'neutral' },
}

export function resolveApprovalRequestStatus(status: ApprovalStatus | string): StatusConfig {
  const cfg = APPROVAL_REQUEST_STATUS_CONFIG[status as ApprovalStatus]
  if (cfg) return cfg
  return { label: status || '—', color: 'neutral' as StatusColor }
}
