// ============================================================
// Shrinkage API — /warehouse/shrinkage
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'

export type ShrinkageReason = 'SHRINK' | 'DAMAGE' | 'EXPIRED'
export type ShrinkageStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface ShrinkageLineDto {
  id?: string
  batchId: string
  batchCode?: string
  productId: string
  productCode?: string
  productName?: string
  reason: ShrinkageReason | string
  qty: number
  note?: string
  expiryDate?: string
}

export interface ShrinkageDto {
  id: string
  shrinkageCode?: string
  warehouseId: string
  warehouseName?: string
  status: ShrinkageStatus | string
  note?: string
  confirmedAt?: string
  createdAt?: string
  lines: ShrinkageLineDto[]
}

export interface ShrinkageCreateRequest {
  warehouseId: string
  note?: string
  lines: Array<{
    batchId: string
    productId: string
    reason: string
    qty: number
    note?: string
  }>
}

export const shrinkageApi = {
  list: (params?: { warehouseId?: string; status?: string }) =>
    axiosClient
      .get<ApiResponse<unknown>>('/warehouse/shrinkage', { params })
      .then((r) => unwrapList<ShrinkageDto>(r.data)),

  get: (id: string) =>
    axiosClient
      .get<ApiResponse<ShrinkageDto>>(`/warehouse/shrinkage/${id}`)
      .then((r) => r.data.data),

  create: (body: ShrinkageCreateRequest) =>
    axiosClient
      .post<ApiResponse<ShrinkageDto>>('/warehouse/shrinkage', body)
      .then((r) => r.data.data),

  confirm: (id: string) =>
    axiosClient
      .post<ApiResponse<ShrinkageDto>>(`/warehouse/shrinkage/${id}/confirm`)
      .then((r) => r.data.data),

  cancel: (id: string, reason?: string) =>
    axiosClient
      .post<ApiResponse<unknown>>(`/warehouse/shrinkage/${id}/cancel`, null, {
        params: reason ? { reason } : undefined,
      })
      .then((r) => r.data),
}
