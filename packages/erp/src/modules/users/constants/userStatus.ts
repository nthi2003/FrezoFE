import type { StatusConfig } from '@frezo/ui'

/** User account status — BE dùng số: 1 = hoạt động, 0 = khóa. */
export type UserStatusCode = 0 | 1

export const USER_STATUS_CONFIG: Record<UserStatusCode, StatusConfig> = {
  1: { label: 'Hoạt động', color: 'success' },
  0: { label: 'Khóa', color: 'danger' },
}

export function resolveUserStatus(status: number | null | undefined): StatusConfig {
  return status === 1 ? USER_STATUS_CONFIG[1] : USER_STATUS_CONFIG[0]
}

/** Options cho filter Select / AppTable (value string để khớp FilterBar). */
export const USER_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: '1', label: USER_STATUS_CONFIG[1].label },
  { value: '0', label: USER_STATUS_CONFIG[0].label },
]
