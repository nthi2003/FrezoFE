import type { StatusConfig } from '@frezo/ui'

export const ACTIVE_STATUS_CONFIG = {
  active: { label: 'Kích hoạt', color: 'success' },
  inactive: { label: 'Tắt', color: 'neutral' },
} as const satisfies Record<'active' | 'inactive', StatusConfig>

export function resolveActiveStatus(active: boolean | null | undefined): StatusConfig {
  return active !== false ? ACTIVE_STATUS_CONFIG.active : ACTIVE_STATUS_CONFIG.inactive
}
