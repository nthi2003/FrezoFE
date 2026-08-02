// ============================================================
// WarehouseSelect — Select chung cho chọn kho
// ============================================================

import { useMemo } from 'react'
import { Select } from '@frezo/ui'
import { warehouseSelectLabel } from '../utils/displayUtils'

export interface WarehouseSelectItem {
  id: string
  name?: string
  code?: string
}

export interface WarehouseSelectProps {
  warehouses: WarehouseSelectItem[]
  value: string
  onChange: (warehouseId: string) => void
  placeholder?: string
  /** Thêm option đầu (VD "Tất cả kho") — value rỗng */
  emptyOption?: { value?: string; label: string }
  className?: string
  showSearch?: boolean
  showClear?: boolean
  'aria-label'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}

export function WarehouseSelect({
  warehouses,
  value,
  onChange,
  placeholder = 'Chọn kho…',
  emptyOption,
  className,
  showSearch = true,
  showClear = false,
  'aria-label': ariaLabel = 'Chọn kho',
  'aria-invalid': ariaInvalid,
}: WarehouseSelectProps) {
  const options = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = []
    if (emptyOption) {
      opts.push({ value: emptyOption.value ?? '', label: emptyOption.label })
    }
    for (const w of warehouses) {
      if (!w?.id) continue
      opts.push({ value: w.id, label: warehouseSelectLabel(w) })
    }
    return opts
  }, [warehouses, emptyOption])

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      showSearch={showSearch}
      showClear={showClear}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
    />
  )
}
