// ============================================================
// ProductCombobox — Select chung cho chọn sản phẩm (GRN / PR / Shrinkage…)
// ============================================================

import { useMemo } from 'react'
import { Select } from '@frezo/ui'
import { formatProductLabel } from '../utils/displayUtils'

export interface ProductComboboxItem {
  id: string
  code?: string
  name?: string
  productCode?: string
  productName?: string
}

export interface ProductComboboxProps {
  products: ProductComboboxItem[]
  value: string
  onChange: (productId: string) => void
  placeholder?: string
  className?: string
  showSearch?: boolean
  showClear?: boolean
  'aria-label'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}

export function ProductCombobox({
  products,
  value,
  onChange,
  placeholder = 'Chọn sản phẩm…',
  className,
  showSearch = true,
  showClear = false,
  'aria-label': ariaLabel = 'Chọn sản phẩm',
  'aria-invalid': ariaInvalid,
}: ProductComboboxProps) {
  const options = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = []
    for (const p of products ?? []) {
      if (!p?.id) continue
      const label = formatProductLabel(p)
      if (!label || label === '—') continue
      opts.push({ value: p.id, label })
    }
    return opts
  }, [products])

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
