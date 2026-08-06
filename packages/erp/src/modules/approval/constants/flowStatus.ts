import type { StatusConfig } from '@frezo/ui'

/** Template luồng duyệt — bật/tắt. */
export const FLOW_ACTIVE_STATUS_CONFIG = {
  active: { label: 'Đang kích hoạt', color: 'success' },
  inactive: { label: 'Tắt', color: 'neutral' },
} as const satisfies Record<'active' | 'inactive', StatusConfig>

export function resolveFlowActiveStatus(active: boolean | null | undefined): StatusConfig {
  return active ? FLOW_ACTIVE_STATUS_CONFIG.active : FLOW_ACTIVE_STATUS_CONFIG.inactive
}

/**
 * Badge phụ — flow có đang được gắn runtime cho subjectType hay không
 * (mỗi subjectType chỉ 1 flow active được áp dụng).
 */
export function resolveFlowRuntimeBadge(
  isRuntimeApplied: boolean,
  subjectLabel: string,
): StatusConfig {
  if (isRuntimeApplied) {
    return { label: `Áp dụng: ${subjectLabel}`, color: 'info' }
  }
  return { label: 'Chưa gắn — không tự chạy', color: 'warning' }
}

export const FLOW_ACTIVE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: FLOW_ACTIVE_STATUS_CONFIG.active.label },
  { value: 'inactive', label: FLOW_ACTIVE_STATUS_CONFIG.inactive.label },
]
