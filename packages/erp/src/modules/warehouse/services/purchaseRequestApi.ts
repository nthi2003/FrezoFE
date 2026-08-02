// ============================================================
// Purchase Request API — /warehouse/purchase-requests
// from-alerts → List<> ; list → FePage {content,...} ; POST create
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'

export type PurchaseRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export interface PurchaseRequestLineDto {
  id?: string
  productId: string
  productCode?: string
  productName?: string
  qty: number
  unitPrice?: number
  alertId?: string
  note?: string
}

export interface PurchaseRequestDto {
  id: string
  code?: string
  supplierId?: string
  supplierName?: string
  warehouseId?: string
  warehouseName?: string
  warehouseCode?: string
  status: PurchaseRequestStatus | string
  note?: string
  lines: PurchaseRequestLineDto[]
  createdAt?: string
  submittedAt?: string
}

export interface FromAlertsRequest {
  alertIds: string[]
  supplierId?: string
  note?: string
}

export interface PurchaseRequestLineInput {
  productId: string
  warehouseId?: string
  qty: number
  stockAlertId?: string
  note?: string
}

export interface PurchaseRequestSaveRequest {
  supplierId?: string
  warehouseId?: string
  note?: string
  lines?: PurchaseRequestLineInput[]
}

/** @deprecated Use PurchaseRequestSaveRequest */
export type PurchaseRequestUpdateRequest = PurchaseRequestSaveRequest

export const purchaseRequestApi = {
  /** BE: FePage — dùng unwrapList (content / items / array) */
  list: () =>
    axiosClient
      .get<ApiResponse<unknown>>('/warehouse/purchase-requests')
      .then((r) => unwrapList<PurchaseRequestDto>(r.data)),

  get: (id: string) =>
    axiosClient
      .get<ApiResponse<PurchaseRequestDto>>(`/warehouse/purchase-requests/${id}`)
      .then((r) => r.data.data),

  /** BE: List<PurchaseRequestDto> — có thể nhiều PR (group theo supplier) */
  fromAlerts: (body: FromAlertsRequest) =>
    axiosClient
      .post<ApiResponse<PurchaseRequestDto[]>>(
        '/warehouse/purchase-requests/from-alerts',
        body,
      )
      .then((r) => {
        const raw = r.data.data
        if (Array.isArray(raw)) return raw
        if (raw && typeof raw === 'object' && 'id' in (raw as object)) {
          return [raw as PurchaseRequestDto]
        }
        return unwrapList<PurchaseRequestDto>(r.data)
      }),

  create: (body: PurchaseRequestSaveRequest) =>
    axiosClient
      .post<ApiResponse<PurchaseRequestDto>>('/warehouse/purchase-requests', body)
      .then((r) => r.data.data),

  update: (id: string, body: PurchaseRequestSaveRequest) =>
    axiosClient
      .put<ApiResponse<PurchaseRequestDto>>(
        `/warehouse/purchase-requests/${id}`,
        body,
      )
      .then((r) => r.data.data),

  submit: (id: string) =>
    axiosClient
      .post<ApiResponse<PurchaseRequestDto>>(
        `/warehouse/purchase-requests/${id}/submit`,
      )
      .then((r) => r.data.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/warehouse/purchase-requests/${id}`),
}
