import type { ReactNode } from 'react'
import { Button, Select } from '@frezo/ui'

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

/** Filter bar kho — Select từ `@frezo/ui`, không native `<select>`. */
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
