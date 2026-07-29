import { useMemo, useState } from 'react'
import { useWarehouses } from './useReorderRules'

export interface FilterOption {
  value: string
  label: string
}

export interface UseWarehouseFiltersOptions {
  statusOptions?: FilterOption[]
  /** Client-side filter by status when API does not support it */
  clientStatusFilter?: boolean
}

export function useWarehouseFilters(options: UseWarehouseFiltersOptions = {}) {
  const { statusOptions = [], clientStatusFilter = false } = options
  const [warehouseId, setWarehouseId] = useState('')
  const [status, setStatus] = useState('')
  const { data: warehouses = [] } = useWarehouses()

  const warehouseOptions = useMemo(
    () => warehouses as Array<{ id: string; name?: string; code?: string }>,
    [warehouses],
  )

  const hasActiveFilters = Boolean(warehouseId || status)

  const clearFilters = () => {
    setWarehouseId('')
    setStatus('')
  }

  return {
    warehouseId,
    setWarehouseId,
    status,
    setStatus,
    warehouses: warehouseOptions,
    statusOptions,
    hasActiveFilters,
    clearFilters,
    clientStatusFilter,
  }
}

/** Filter list client-side by warehouse + status */
export function applyWarehouseListFilters<T extends { status?: string; warehouseId?: string }>(
  list: T[],
  warehouseId: string,
  status: string,
): T[] {
  let result = list
  if (warehouseId) {
    result = result.filter((row) => row.warehouseId === warehouseId)
  }
  if (status) {
    const s = status.toUpperCase()
    result = result.filter((row) => (row.status || '').toUpperCase() === s)
  }
  return result
}
