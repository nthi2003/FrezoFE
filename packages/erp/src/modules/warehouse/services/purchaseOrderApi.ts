// ============================================================
// Purchase Order API — /warehouse/purchase-orders
// from-pr/{prId}, receive, confirm (stub contract)
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PARTIAL_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED'

export interface PurchaseOrderLineDto {
  id?: string
  productId: string
  productCode?: string
  productName?: string
  qtyOrdered: number
  qtyReceived?: number
  unitPrice?: number
}

export interface PurchaseOrderDto {
  id: string
  code?: string
  purchaseRequestId?: string
  supplierId?: string
  supplierName?: string
  warehouseId?: string
  status: PurchaseOrderStatus | string
  note?: string
  lines: PurchaseOrderLineDto[]
  createdAt?: string
  confirmedAt?: string
  receivedAt?: string
}

export const purchaseOrderApi = {
  list: () =>
    axiosClient
      .get<ApiResponse<unknown>>('/warehouse/purchase-orders')
      .then((r) => unwrapList<PurchaseOrderDto>(r.data)),

  get: (id: string) =>
    axiosClient
      .get<ApiResponse<PurchaseOrderDto>>(`/warehouse/purchase-orders/${id}`)
      .then((r) => r.data.data),

  fromPr: (prId: string) =>
    axiosClient
      .post<ApiResponse<PurchaseOrderDto>>(
        `/warehouse/purchase-orders/from-pr/${prId}`,
      )
      .then((r) => r.data.data),

  confirm: (id: string) =>
    axiosClient
      .post<ApiResponse<PurchaseOrderDto>>(
        `/warehouse/purchase-orders/${id}/confirm`,
      )
      .then((r) => r.data.data),

  receive: (id: string, lines?: Array<{ lineId: string; qtyReceived: number }>) =>
    axiosClient
      .post<ApiResponse<PurchaseOrderDto>>(
        `/warehouse/purchase-orders/${id}/receive`,
        lines ?? {},
      )
      .then((r) => r.data.data),
}
