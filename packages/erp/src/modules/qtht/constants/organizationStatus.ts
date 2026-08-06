import { type StatusConfig } from '@frezo/ui'
import { AlertCircle, CheckCircle, GitBranch, Power, type LucideIcon } from 'lucide-react'

export type OrganizationStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'MERGED'
  | 'ACQUIRED'
  | 'DISSOLVED'
  | 'LIQUIDATED'

export const ORGANIZATION_STATUS_CONFIG: Record<
  OrganizationStatus,
  StatusConfig & { icon: LucideIcon }
> = {
  ACTIVE: { label: 'Hoạt động', color: 'success', icon: CheckCircle },
  INACTIVE: { label: 'Ngừng hoạt động', color: 'neutral', icon: Power },
  SUSPENDED: { label: 'Tạm ngưng', color: 'warning', icon: AlertCircle },
  MERGED: { label: 'Đã sáp nhập', color: 'info', icon: GitBranch },
  ACQUIRED: { label: 'Đã mua lại', color: 'info', icon: GitBranch },
  DISSOLVED: { label: 'Đã giải thể', color: 'danger', icon: AlertCircle },
  LIQUIDATED: { label: 'Đã thanh lý', color: 'danger', icon: AlertCircle },
}

export function resolveOrganizationStatus(
  status?: string | null,
): StatusConfig & { icon: LucideIcon } {
  const key = (status || 'ACTIVE').toUpperCase() as OrganizationStatus
  return ORGANIZATION_STATUS_CONFIG[key] || ORGANIZATION_STATUS_CONFIG.INACTIVE
}

export const ORGANIZATION_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: ORGANIZATION_STATUS_CONFIG.ACTIVE.label },
  { value: 'INACTIVE', label: ORGANIZATION_STATUS_CONFIG.INACTIVE.label },
  { value: 'SUSPENDED', label: ORGANIZATION_STATUS_CONFIG.SUSPENDED.label },
  { value: 'MERGED', label: ORGANIZATION_STATUS_CONFIG.MERGED.label },
  { value: 'DISSOLVED', label: ORGANIZATION_STATUS_CONFIG.DISSOLVED.label },
]
