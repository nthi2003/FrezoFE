// ============================================================
// Stock Take API — khớp BE StockTakeController
// POST /warehouse/stock-takes
// POST /{id}/start | /submit-counted | /post-variance
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface StockTakeLineDto {
  id?: string
  productId: string
  systemQty?: number | null
  countedQty?: number | null
  /** BE field */
  varianceQty?: number | null
  note?: string
}

export interface StockTakeDto {
  id: string
  code?: string
  warehouseId: string
  warehouseName?: string
  warehouseCode?: string
  takeDate?: string
  status: string
  note?: string
  lines: StockTakeLineDto[]
}

export interface StockTakeCreateRequest {
  warehouseId: string
  takeDate?: string
  note?: string
  /** BE yêu cầu lines:[{productId}] lúc tạo */
  lines: Array<{ productId: string }>
}

export interface StockTakeCountedLine {
  id?: string
  productId: string
  countedQty: number
  note?: string
}

export const stockTakeApi = {
  list: (warehouseId?: string) =>
    axiosClient
      .get<ApiResponse<StockTakeDto[]>>('/warehouse/stock-takes', {
        params: warehouseId ? { warehouseId } : undefined,
      })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  get: (id: string) =>
    axiosClient
      .get<ApiResponse<StockTakeDto>>(`/warehouse/stock-takes/${id}`)
      .then((r) => r.data.data),

  create: (body: StockTakeCreateRequest) =>
    axiosClient
      .post<ApiResponse<StockTakeDto>>('/warehouse/stock-takes', body)
      .then((r) => r.data.data),

  start: (id: string) =>
    axiosClient
      .post<ApiResponse<StockTakeDto>>(`/warehouse/stock-takes/${id}/start`)
      .then((r) => r.data.data),

  submitCounted: (id: string, lines: StockTakeCountedLine[]) =>
    axiosClient
      .post<ApiResponse<StockTakeDto>>(
        `/warehouse/stock-takes/${id}/submit-counted`,
        lines,
      )
      .then((r) => r.data.data),

  postVariance: (id: string) =>
    axiosClient
      .post<ApiResponse<StockTakeDto>>(
        `/warehouse/stock-takes/${id}/post-variance`,
      )
      .then((r) => r.data.data),
}
