// ============================================================
// Batch/Lot API — /warehouse/batches
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'

export interface StockBatchDto {
  id: string
  batchCode: string
  productId: string
  productCode?: string
  productName?: string
  warehouseId: string
  warehouseName?: string
  supplierId?: string
  supplierName?: string
  grnId?: string
  warehouseLocationId?: string
  locationLabel?: string
  receivedDate?: string
  expiryDate?: string
  qtyOnHand?: number
  status?: string
  daysToExpiry?: number
  expiryWarning?: string
}

export interface FefoBatchSuggestion {
  batchId: string
  batchCode: string
  expiryDate?: string
  qtyAvailable: number
  suggestedQty: number
  daysToExpiry?: number
  expiryWarning?: string
  supplierName?: string
}

export interface FefoSuggestResponse {
  productId: string
  warehouseId: string
  requestedQty: number
  allocatedQty: number
  suggestions: FefoBatchSuggestion[]
}

export const batchApi = {
  list: (params?: { warehouseId?: string; productId?: string }) =>
    axiosClient
      .get<ApiResponse<unknown>>('/warehouse/batches', { params })
      .then((r) => unwrapList<StockBatchDto>(r.data)),

  get: (id: string) =>
    axiosClient
      .get<ApiResponse<StockBatchDto>>(`/warehouse/batches/${id}`)
      .then((r) => r.data.data),

  fefoSuggest: (params: {
    warehouseId: string
    productId: string
    qty: number
  }) =>
    axiosClient
      .get<ApiResponse<FefoSuggestResponse>>('/warehouse/gin/fefo-suggest', {
        params,
      })
      .then((r) => r.data.data),
}
