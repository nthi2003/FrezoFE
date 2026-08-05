import * as React from 'react'
import { cn } from '@frezo/utils'

import { AppTooltip } from './tooltip'

export type IconActionTone =
  | 'neutral'
  | 'blue'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'red'
  | 'violet'
  | 'primary'

export interface IconActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  /** Tooltip + aria-label (tiếng Việt). Thay native `title=`. */
  tooltip: string
  tone?: IconActionTone
  /** sm = 28×28 (cột thao tác bảng); md = padded (mặc định). */
  size?: 'sm' | 'md'
}

/** Tất cả tone đều có màu idle (không chỉ hover). `neutral` là xám có chủ đích. */
const toneClasses: Record<IconActionTone, string> = {
  neutral: 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100',
  blue: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
  rose: 'text-rose-600 hover:text-rose-800 hover:bg-rose-50',
  amber: 'text-amber-600 hover:text-amber-800 hover:bg-amber-50',
  emerald: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50',
  red: 'text-red-600 hover:text-red-800 hover:bg-red-50',
  violet: 'text-violet-600 hover:text-violet-800 hover:bg-violet-50',
  primary: 'text-primary-600 hover:text-primary-800 hover:bg-primary-50',
}

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'w-7 h-7',
  md: 'p-1.5',
}

/**
 * Tone chuẩn cho CRUD / approve — dùng thay vì invent tone từng trang.
 * Cụm thao tác trong bảng/danh sách nên dùng `RowActions` (đã áp sẵn tone này).
 *
 * @example
 * <IconActionButton tooltip="Sửa" tone={actionIconTone.edit} onClick={onEdit}>
 */
export const actionIconTone = {
  view: 'blue',
  edit: 'blue',
  copy: 'neutral',
  more: 'neutral',
  delete: 'rose',
  approve: 'emerald',
  reject: 'rose',
} as const satisfies Record<string, IconActionTone>

/**
 * Nút icon-only có tooltip — dùng ở cột thao tác bảng, toolbar hub.
 *
 * @example
 * <IconActionButton tooltip="Sửa" tone={actionIconTone.edit} onClick={onEdit}>
 *   <Pencil size={14} />
 * </IconActionButton>
 */
export function IconActionButton({
  tooltip,
  tone = 'neutral',
  size = 'md',
  className,
  children,
  ...props
}: IconActionButtonProps) {
  return (
    <AppTooltip content={tooltip}>
      <button
        type="button"
        aria-label={tooltip}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors',
          'disabled:opacity-40 disabled:pointer-events-none',
          toneClasses[tone],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </AppTooltip>
  )
}
