import type { ReactNode } from 'react'
import { Button } from '@frezo/ui'

export interface WarehouseFilterSelect {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  minWidth?: string
}

interface Props {
  selects: WarehouseFilterSelect[]
  hasActiveFilters?: boolean
  onClear?: () => void
  countLabel?: string
  extra?: ReactNode
}

export function WarehouseFilterBar({
  selects,
  hasActiveFilters,
  onClear,
  countLabel,
  extra,
}: Props) {
  return (
    <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80">
      <div className="flex flex-wrap gap-2 items-center">
        {selects.map((sel) => (
          <select
            key={sel.id}
            className="h-9 border rounded-md px-3 text-sm bg-white min-w-[140px]"
            style={sel.minWidth ? { minWidth: sel.minWidth } : undefined}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            aria-label={sel.label}
          >
            {sel.options.map((opt) => (
              <option key={opt.value || '__all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
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
