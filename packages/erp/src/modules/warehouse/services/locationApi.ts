// ============================================================
// Warehouse location API
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface WarehouseLocationDto {
  id: string
  zoneId?: string
  zoneName?: string
  aisle?: string
  rack?: string
  level?: string
  bin?: string
  barcode?: string
  isActive?: boolean
}

export function formatLocationLabel(loc: WarehouseLocationDto): string {
  const zone = loc.zoneName || 'Zone'
  const pos = [loc.aisle, loc.rack, loc.level, loc.bin].filter(Boolean).join('-')
  return pos ? `${zone} — ${pos}` : zone
}

export const locationApi = {
  byWarehouse: (warehouseId: string) =>
    axiosClient
      .get<ApiResponse<WarehouseLocationDto[]>>(
        `/warehouse/location/by-warehouse/${warehouseId}`,
      )
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),
}
