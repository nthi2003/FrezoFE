import * as React from 'react'
import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@frezo/utils'

import { ConfirmDialog } from './ConfirmDialog'
import { IconActionButton, type IconActionTone } from './IconActionButton'

export type RowActionKind = 'view' | 'edit' | 'copy' | 'more' | 'delete'

interface RowActionPreset {
  icon: LucideIcon
  tone: IconActionTone
  tooltip: string
}

/** Icon / tone / tooltip chuẩn cho cụm thao tác — không tự chế theo từng trang. */
export const rowActionPreset: Record<RowActionKind, RowActionPreset> = {
  view: { icon: Eye, tone: 'blue', tooltip: 'Xem chi tiết' },
  edit: { icon: Pencil, tone: 'blue', tooltip: 'Sửa' },
  copy: { icon: Copy, tone: 'neutral', tooltip: 'Sao chép' },
  more: { icon: MoreHorizontal, tone: 'neutral', tooltip: 'Thao tác khác' },
  delete: { icon: Trash2, tone: 'rose', tooltip: 'Xoá' },
}

/**
 * Thứ tự khuyến nghị: xem → sửa → sao chép → action riêng → xoá.
 * Component chỉ ép `delete` xuống cuối (tránh bấm nhầm), phần còn lại giữ
 * nguyên thứ tự khai báo để trang tự kiểm soát action đặc thù.
 */
const rank = (action: RowAction) => (action.kind === 'delete' ? 1 : 0)

export interface RowActionConfirm {
  title: string
  message?: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
}

export interface RowAction {
  /** Preset chuẩn — tự lấy icon, tone, tooltip. Bỏ trống khi tự khai báo `icon`. */
  kind?: RowActionKind
  /** Khoá React — mặc định theo `kind`. Bắt buộc với action tự khai báo. */
  key?: string
  /** Override icon của preset, hoặc icon cho custom action. */
  icon?: LucideIcon
  /** Override tooltip của preset — cũng là `aria-label` của nút. */
  tooltip?: string
  /** Override tone của preset. */
  tone?: IconActionTone
  /** Không nhận event khi chạy qua `confirm` (dialog đã ngắt khỏi click gốc). */
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  /** Không render action (VD thiếu quyền) — ưu tiên hơn `disabled`. */
  hidden?: boolean
  /**
   * Bật ConfirmDialog nội bộ trước khi chạy `onClick`.
   * Bỏ trống nếu trang đã tự quản ConfirmDialog riêng.
   */
  confirm?: RowActionConfirm
}

export interface RowActionsProps {
  actions: RowAction[]
  /** sm = nút 28×28 / icon 14 (mặc định, cho cột bảng); md = icon 16. */
  size?: 'sm' | 'md'
  /** Căn cụm nút — dùng `end` khi cột thao tác `align: 'right'`. */
  align?: 'start' | 'center' | 'end'
  className?: string
}

const alignClasses: Record<NonNullable<RowActionsProps['align']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
}

/**
 * Cụm icon thao tác chuẩn cho dòng bảng / thẻ danh sách.
 *
 * @example
 * <RowActions
 *   actions={[
 *     { kind: 'view', onClick: () => setDetail(row) },
 *     { kind: 'edit', onClick: () => openEdit(row), hidden: !canUpdate },
 *     { kind: 'delete', onClick: () => setConfirmDelete(row), hidden: !canDelete },
 *   ]}
 * />
 */
export function RowActions({
  actions,
  size = 'sm',
  align = 'start',
  className,
}: RowActionsProps) {
  const [pendingIndex, setPendingIndex] = React.useState<number | null>(null)

  const visible = actions
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => !action.hidden)
    .sort((a, b) => rank(a.action) - rank(b.action) || a.index - b.index)

  if (visible.length === 0) return null

  const iconSize = size === 'sm' ? 14 : 16
  const pending = pendingIndex === null ? null : actions[pendingIndex]

  return (
    <>
      <div
        className={cn('flex items-center gap-1', alignClasses[align], className)}
        onClick={(e) => e.stopPropagation()}
      >
        {visible.map(({ action, index }) => {
          const preset = action.kind ? rowActionPreset[action.kind] : undefined
          const Icon = action.icon ?? preset?.icon
          const tooltip = action.tooltip ?? preset?.tooltip
          if (!Icon || !tooltip) return null
          return (
            <IconActionButton
              key={action.key ?? action.kind ?? index}
              tooltip={tooltip}
              tone={action.tone ?? preset?.tone ?? 'neutral'}
              size={size}
              disabled={action.disabled}
              onClick={(event) => {
                if (action.confirm) {
                  event.preventDefault()
                  setPendingIndex(index)
                  return
                }
                action.onClick(event)
              }}
            >
              <Icon size={iconSize} />
            </IconActionButton>
          )
        })}
      </div>

      {pending?.confirm && (
        <ConfirmDialog
          isOpen
          onClose={() => setPendingIndex(null)}
          onConfirm={() => {
            setPendingIndex(null)
            pending.onClick()
          }}
          title={pending.confirm.title}
          message={pending.confirm.message ?? ''}
          confirmText={pending.confirm.confirmText}
          cancelText={pending.confirm.cancelText}
          variant={pending.confirm.variant ?? 'danger'}
          isLoading={pending.confirm.isLoading}
        />
      )}
    </>
  )
}
