import type { StatusConfig } from '@frezo/ui'

export type DepartmentStatus = 'ACTIVE' | 'INACTIVE'

export const DEPARTMENT_STATUS_CONFIG: Record<DepartmentStatus, StatusConfig> = {
  ACTIVE: { label: 'Hoạt động', color: 'success' },
  INACTIVE: { label: 'Ngừng', color: 'neutral' },
}

export function resolveDepartmentStatus(status?: string | null): StatusConfig {
  const key = ((status || '').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as DepartmentStatus
  return DEPARTMENT_STATUS_CONFIG[key]
}
