// ============================================================
// GIN (PXK) API — /warehouse/gin
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'

export type GinStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CONFIRMED'
  | 'CANCELLED'

export interface GinItemDto {
  id?: string
  ginId?: string
  productId: string
  batchId?: string
  qtyRequested?: number
  qtyIssued?: number
  unitCost?: number
  locationId?: string
}

export interface GinDto {
  id: string
  ginCode?: string
  warehouseId: string
  warehouseName?: string
  warehouseCode?: string
  customerId?: string
  customerName?: string
  orderId?: string
  issueType?: string
  status: GinStatus | string
  documentNo?: string
  documentDate?: string
  transferWarehouseId?: string
  transferWarehouseName?: string
  approvedBy?: string
  approvedAt?: string
  totalValue?: number
  issuedBy?: string
  issuedAt?: string
  note?: string
  createdDate?: string
  items: GinItemDto[]
}

export interface GinCreateRequest {
  warehouseId: string
  customerId?: string
  orderId?: string
  issueType?: string
  documentNo?: string
  documentDate?: string
  transferWarehouseId?: string
  note?: string
  items: Array<{
    productId: string
    batchId?: string
    qtyRequested: number
    unitCost?: number
    locationId?: string
  }>
}

export interface GinConfirmRequest {
  items?: Array<{
    itemId: string
    qtyIssued: number
    batchCode?: string
    locationId?: string
  }>
}

export const ginApi = {
  list: (params?: { status?: string; keyword?: string; page?: number; size?: number }) =>
    axiosClient
      .get<ApiResponse<unknown>>('/warehouse/gin', { params })
      .then((r) => unwrapList<GinDto>(r.data)),

  get: (id: string) =>
    axiosClient
      .get<ApiResponse<GinDto>>(`/warehouse/gin/${id}`)
      .then((r) => r.data.data),

  create: (body: GinCreateRequest) =>
    axiosClient
      .post<ApiResponse<GinDto>>('/warehouse/gin', body)
      .then((r) => r.data.data),

  submit: (id: string) =>
    axiosClient
      .post<ApiResponse<GinDto>>(`/warehouse/gin/${id}/submit`)
      .then((r) => r.data.data),

  approve: (id: string) =>
    axiosClient
      .post<ApiResponse<GinDto>>(`/warehouse/gin/${id}/approve`)
      .then((r) => r.data.data),

  confirm: (id: string, body: GinConfirmRequest = {}) =>
    axiosClient
      .post<ApiResponse<GinDto>>(`/warehouse/gin/${id}/confirm`, body)
      .then((r) => r.data.data),

  cancel: (id: string, reason?: string) =>
    axiosClient
      .post<ApiResponse<unknown>>(`/warehouse/gin/${id}/cancel`, null, {
        params: reason ? { reason } : undefined,
      })
      .then((r) => r.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/warehouse/gin/${id}`),

  printHtml: async (id: string) => {
    const res = await axiosClient.get<string>(`/warehouse/gin/${id}/print`, {
      headers: { Accept: 'text/html' },
      responseType: 'text',
    })
    return typeof res.data === 'string' ? res.data : String(res.data)
  },
}
