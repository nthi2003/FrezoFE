import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@frezo/utils'

/**
 * 5 màu semantic — mỗi màu mang 1 ý nghĩa cố định (xem STANDARD section 3.1).
 * KHÔNG tự thêm màu mới (không `blue`, `purple`, `pink`...).
 */
export type StatusColor = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export interface StatusBadgeProps {
  label: string
  color?: StatusColor
  icon?: LucideIcon
  /** `soft` (default) = nền light + text dark. `solid` = nền đậm + text trắng (dùng khi cần nhấn mạnh) */
  variant?: 'soft' | 'solid'
  /** Chỉ hiển thị dot màu (không text) — dùng cho table cell hẹp */
  compact?: boolean
  className?: string
}

const SOFT_COLOR_MAP: Record<StatusColor, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  info: 'bg-info-light text-info-dark',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  danger: 'bg-danger-light text-danger-dark',
}

const SOLID_COLOR_MAP: Record<StatusColor, string> = {
  neutral: 'bg-neutral-600 text-white',
  info: 'bg-info text-white',
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
  danger: 'bg-danger text-white',
}

const DOT_COLOR_MAP: Record<StatusColor, string> = {
  neutral: 'bg-neutral-400',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

/**
 * Badge hiển thị status với semantic color chuẩn Frezo.
 *
 * @example
 * <StatusBadge label="Đang hiệu lực" color="success" icon={CheckCircle} />
 * <StatusBadge label="Chờ duyệt" color="warning" compact />
 *
 * Chuẩn dùng: mỗi module định nghĩa `STATUS_CONFIG` map (status → {label, color, icon})
 * rồi render `<StatusBadge {...STATUS_CONFIG[status]} />` — không hardcode props.
 */
export function StatusBadge({
  label,
  color = 'neutral',
  icon: Icon,
  variant = 'soft',
  compact = false,
  className,
}: StatusBadgeProps) {
  if (compact) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5 text-xs text-neutral-700', className)}
        title={label}
      >
        <span
          className={cn('w-2 h-2 rounded-full', DOT_COLOR_MAP[color])}
          aria-hidden="true"
        />
        <span>{label}</span>
      </span>
    )
  }

  const colorClass = variant === 'solid' ? SOLID_COLOR_MAP[color] : SOFT_COLOR_MAP[color]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        colorClass,
        className,
      )}
    >
      {Icon && <Icon size={12} strokeWidth={2} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  )
}

/**
 * Helper type cho `<Module>_STATUS_CONFIG` map.
 *
 * @example
 * export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, StatusConfig> = {
 *   DRAFT:  { label: 'Nháp',        color: 'neutral', icon: FileText },
 *   ACTIVE: { label: 'Đang hiệu lực', color: 'success', icon: CheckCircle },
 *   ...
 * } as const satisfies Record<ContractStatus, StatusConfig>
 */
export interface StatusConfig {
  label: string
  color: StatusColor
  icon?: LucideIcon
}
