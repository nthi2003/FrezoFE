// ============================================================
// GRN (PNK) API — /warehouse/grn
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'

export type GrnStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CONFIRMED'
  | 'CANCELLED'

export interface GrnItemDto {
  id?: string
  grnId?: string
  productId: string
  batchId?: string
  qtyExpected?: number
  qtyReceived?: number
  unitCost?: number
  locationId?: string
}

export interface GrnDto {
  id: string
  grnCode?: string
  purchaseOrderId?: string
  purchaseOrderCode?: string
  warehouseId: string
  warehouseName?: string
  warehouseCode?: string
  supplierId?: string
  supplierName?: string
  status: GrnStatus | string
  invoiceNo?: string
  invoiceDate?: string
  approvedBy?: string
  approvedAt?: string
  totalValue?: number
  receivedBy?: string
  receivedAt?: string
  note?: string
  createdDate?: string
  items: GrnItemDto[]
}

export interface GrnCreateRequest {
  purchaseOrderId?: string
  warehouseId: string
  supplierId?: string
  invoiceNo?: string
  invoiceDate?: string
  note?: string
  items: Array<{
    productId: string
    batchId?: string
    qtyExpected: number
    qtyReceived?: number
    unitCost?: number
    locationId?: string
  }>
}

export interface GrnConfirmRequest {
  items?: Array<{
    itemId: string
    qtyReceived: number
    batchCode?: string
    locationId?: string
  }>
}

export interface GrnUpdateRequest {
  invoiceNo?: string
  invoiceDate?: string
  note?: string
}

export const grnApi = {
  list: (params?: { status?: string; keyword?: string; page?: number; size?: number }) =>
    axiosClient
      .get<ApiResponse<unknown>>('/warehouse/grn', { params })
      .then((r) => unwrapList<GrnDto>(r.data)),

  get: (id: string) =>
    axiosClient
      .get<ApiResponse<GrnDto>>(`/warehouse/grn/${id}`)
      .then((r) => r.data.data),

  create: (body: GrnCreateRequest) =>
    axiosClient
      .post<ApiResponse<GrnDto>>('/warehouse/grn', body)
      .then((r) => r.data.data),

  update: (id: string, body: GrnUpdateRequest) =>
    axiosClient
      .put<ApiResponse<GrnDto>>(`/warehouse/grn/${id}`, body)
      .then((r) => r.data.data),

  submit: (id: string) =>
    axiosClient
      .post<ApiResponse<GrnDto>>(`/warehouse/grn/${id}/submit`)
      .then((r) => r.data.data),

  approve: (id: string) =>
    axiosClient
      .post<ApiResponse<GrnDto>>(`/warehouse/grn/${id}/approve`)
      .then((r) => r.data.data),

  confirm: (id: string, body: GrnConfirmRequest = {}) =>
    axiosClient
      .post<ApiResponse<GrnDto>>(`/warehouse/grn/${id}/confirm`, body)
      .then((r) => r.data.data),

  cancel: (id: string, reason?: string) =>
    axiosClient
      .post<ApiResponse<unknown>>(`/warehouse/grn/${id}/cancel`, null, {
        params: reason ? { reason } : undefined,
      })
      .then((r) => r.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/warehouse/grn/${id}`),

  /** HTML print — mở cửa sổ in */
  printHtml: async (id: string) => {
    const res = await axiosClient.get<string>(`/warehouse/grn/${id}/print`, {
      headers: { Accept: 'text/html' },
      responseType: 'text',
    })
    return typeof res.data === 'string' ? res.data : String(res.data)
  },
}
