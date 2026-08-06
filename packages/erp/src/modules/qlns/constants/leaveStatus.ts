import { CheckCircle2, Clock, XCircle, Ban } from 'lucide-react'
import type { StatusColor, StatusConfig } from '@frezo/ui'
import type { LeaveStatus } from '../services/leaveApi'

export const LEAVE_STATUS_CONFIG: Record<
  LeaveStatus,
  StatusConfig & { short: string; icon: typeof CheckCircle2 }
> = {
  PENDING_MANAGER: {
    label: 'Chờ QL trực tiếp duyệt',
    short: 'Chờ QL',
    color: 'warning',
    icon: Clock,
  },
  PENDING_HR: {
    label: 'Chờ HR chốt',
    short: 'Chờ HR',
    color: 'info',
    icon: Clock,
  },
  APPROVED: {
    label: 'Đã duyệt',
    short: 'Duyệt',
    color: 'success',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Từ chối',
    short: 'Từ chối',
    color: 'danger',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Đã huỷ',
    short: 'Huỷ',
    color: 'neutral',
    icon: Ban,
  },
  PENDING: {
    label: 'Chờ duyệt (legacy)',
    short: 'Chờ duyệt',
    color: 'warning',
    icon: Clock,
  },
}

export function resolveLeaveStatus(status?: LeaveStatus | string | null): StatusConfig & {
  short: string
  icon: typeof CheckCircle2
} {
  const key = (status || 'PENDING_MANAGER') as LeaveStatus
  return LEAVE_STATUS_CONFIG[key] ?? LEAVE_STATUS_CONFIG.PENDING_MANAGER
}
