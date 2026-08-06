import type { ReactNode } from 'react'
import { Button, Select } from '@frezo/ui'

export interface FilterBarSelect {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  minWidth?: string
}

export interface FilterBarProps {
  /** Nội dung tuỳ biến (ô tìm, chip, toggle…). */
  children?: ReactNode
  /** Select lọc nhanh (kiểu warehouse). */
  selects?: FilterBarSelect[]
  hasActiveFilters?: boolean
  onClear?: () => void
  countLabel?: string
  /** Phần phụ bên phải trước count (VD nút làm mới). */
  extra?: ReactNode
  /** Hub embedded — không dùng -mx-6 (parent không có p-6). */
  inset?: boolean
  className?: string
}

/**
 * FilterBar sticky — chuẩn list page (warehouse / CRM / task).
 * `sticky top-0` + backdrop để lọc luôn thấy khi cuộn bảng.
 * Select dùng `@frezo/ui` Select — không native `<select>`.
 */
export function FilterBar({
  children,
  selects,
  hasActiveFilters,
  onClear,
  countLabel,
  extra,
  inset = false,
  className = '',
}: FilterBarProps) {
  const shellClass = inset
    ? 'sticky top-0 z-10 rounded-lg border border-neutral-200/80 bg-neutral-50/95 backdrop-blur px-3 py-2'
    : 'sticky top-0 z-10 -mx-6 px-6 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80'

  return (
    <div className={`${shellClass} ${className}`}>
      <div className="flex flex-wrap gap-2 items-center">
        {selects?.map((sel) => (
          <div
            key={sel.id}
            className="min-w-[140px]"
            style={sel.minWidth ? { minWidth: sel.minWidth } : undefined}
          >
            <Select
              options={sel.options}
              value={sel.value}
              onChange={sel.onChange}
              placeholder={sel.label}
              aria-label={sel.label}
              showSearch={sel.options.length > 8}
            />
          </div>
        ))}
        {children}
        {extra}
        {hasActiveFilters && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Xoá lọc
          </Button>
        )}
        {countLabel && (
          <span className="text-xs text-neutral-500 ml-auto tabular-nums">{countLabel}</span>
        )}
      </div>
    </div>
  )
}
