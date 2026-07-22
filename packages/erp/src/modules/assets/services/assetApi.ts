// ============================================================
// Asset API — Quản lý tài sản (QLTS)
// Backend endpoints tại /qlts/asset[s]:
//   GET     /qlts/assets                 list (filter + paging)
//   GET     /qlts/assets/{id}            detail
//   GET     /qlts/assets/{id}/history    timeline
//   GET     /qlts/assets/stats           KPI stats
//   POST    /qlts/assets                 create
//   PUT     /qlts/assets/{id}            update
//   DELETE  /qlts/assets/{id}            soft delete
//   POST    /qlts/assets/{id}/assign     cấp phát
//   POST    /qlts/assets/{id}/unassign   thu hồi
//   POST    /qlts/assets/{id}/maintenance/start
//   POST    /qlts/assets/{id}/maintenance/end
//   POST    /qlts/assets/{id}/dispose    thanh lý
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN' | 'DISPOSED' | 'LOST'

export interface AssetItem {
  id: string
  code: string
  name: string
  categoryCode?: string | null
  categoryName?: string | null
  brand?: string | null
  model?: string | null
  serialNumber?: string | null
  purchaseDate?: string | null
  purchasePrice?: number | null
  currentValue?: number | null
  warrantyEndDate?: string | null
  status: AssetStatus
  location?: string | null
  assignedPersonId?: string | null
  assignedPersonName?: string | null
  assignedAt?: string | null
  imageUrl?: string | null
  note?: string | null
  createdBy?: string
  createdDate?: string
}

export interface AssetAssignmentItem {
  id: string
  assetId: string
  action: 'ASSIGN' | 'RETURN' | 'MAINTENANCE_START' | 'MAINTENANCE_END' | 'DISPOSE' | 'REPORT_LOST' | 'REPAIR'
  personId?: string | null
  personName?: string | null
  actionDate: string
  note?: string | null
  cost?: number | null
  createdBy?: string
  createdDate?: string
}

export interface AssetStats {
  total: number
  inUse: number
  available: number
  maintenance: number
  disposed: number
  totalValue: number
  warrantyExpiringSoon: number
}

export interface AssetSavePayload {
  code?: string
  name: string
  categoryCode?: string | null
  brand?: string | null
  model?: string | null
  serialNumber?: string | null
  purchaseDate?: string | null
  purchasePrice?: number | null
  currentValue?: number | null
  warrantyEndDate?: string | null
  status?: AssetStatus
  location?: string | null
  imageUrl?: string | null
  note?: string | null
}

export interface AssetListParams {
  keyword?: string
  status?: AssetStatus
  categoryCode?: string
  assignedPersonId?: string
  page?: number
  size?: number
}

// ============================================================
// Transfer Request — workflow ticket cấp phát / thu hồi
// ============================================================

export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HANDED_OVER' | 'CANCELLED'
export type TransferType = 'ASSIGN' | 'RETURN'

export interface TransferRequestItem {
  id: string
  assetId: string
  assetCode?: string | null
  assetName?: string | null
  requestType: TransferType
  status: TransferStatus
  requesterUsername: string
  personId?: string | null
  personName?: string | null
  reason?: string | null
  plannedDate?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  approveNote?: string | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  rejectReason?: string | null
  cancelledAt?: string | null
  handedOverBy?: string | null
  handedOverAt?: string | null
  handoverNote?: string | null
  createdBy?: string
  createdDate?: string
  // ---- Workflow engine enrichment (v2) ----
  /** Nếu != null, ticket đang được lái bởi workflow engine — có thể có N bước tuỳ config. */
  workflowInstanceId?: string | null
  /** Entity type cho engine query — luôn = "ASSET_TRANSFER" khi có instance. */
  workflowEntityType?: string | null
  /** ID task PENDING hiện tại — dùng để hiển thị nút "Duyệt bước: {stepName}". */
  currentTaskId?: string | null
  /** Tên bước hiện tại từ workflow definition. */
  currentStepName?: string | null
}

export interface TransferCreatePayload {
  requestType?: TransferType
  personId?: string
  personName?: string
  reason?: string
  plannedDate?: string
}

export interface TransferListParams {
  status?: TransferStatus
  requestType?: TransferType
  assetId?: string
  personId?: string
  keyword?: string
  page?: number
  size?: number
}

export const assetApi = {
  list: (params?: AssetListParams) =>
    axiosClient
      .get<ApiResponse<{ items: AssetItem[]; total: number }>>('/qlts/assets', { params })
      .then((res) => res.data),

  get: (id: string) =>
    axiosClient.get<ApiResponse<AssetItem>>(`/qlts/assets/${id}`).then((res) => res.data),

  history: (id: string) =>
    axiosClient.get<ApiResponse<AssetAssignmentItem[]>>(`/qlts/assets/${id}/history`).then((res) => res.data),

  stats: () =>
    axiosClient.get<ApiResponse<AssetStats>>('/qlts/assets/stats').then((res) => res.data),

  create: (data: AssetSavePayload) =>
    axiosClient.post<ApiResponse<AssetItem>>('/qlts/assets', data).then((res) => res.data),

  update: (id: string, data: AssetSavePayload) =>
    axiosClient.put<ApiResponse<AssetItem>>(`/qlts/assets/${id}`, data).then((res) => res.data),

  delete: (id: string) =>
    axiosClient.delete<ApiResponse<null>>(`/qlts/assets/${id}`).then((res) => res.data),

  assign: (id: string, personId: string, personName?: string, note?: string) =>
    axiosClient
      .post<ApiResponse<AssetItem>>(`/qlts/assets/${id}/assign`, { personId, personName, note })
      .then((res) => res.data),

  unassign: (id: string, note?: string) =>
    axiosClient.post<ApiResponse<AssetItem>>(`/qlts/assets/${id}/unassign`, { note }).then((res) => res.data),

  startMaintenance: (id: string, note?: string) =>
    axiosClient
      .post<ApiResponse<AssetItem>>(`/qlts/assets/${id}/maintenance/start`, { note })
      .then((res) => res.data),

  endMaintenance: (id: string, note?: string, cost?: number) =>
    axiosClient
      .post<ApiResponse<AssetItem>>(`/qlts/assets/${id}/maintenance/end`, { note, cost })
      .then((res) => res.data),

  dispose: (id: string, note?: string) =>
    axiosClient.post<ApiResponse<AssetItem>>(`/qlts/assets/${id}/dispose`, { note }).then((res) => res.data),
}

export const transferApi = {
  create: (assetId: string, data: TransferCreatePayload) =>
    axiosClient
      .post<ApiResponse<TransferRequestItem>>(`/qlts/assets/${assetId}/transfer-requests`, data)
      .then((res) => res.data),

  list: (params?: TransferListParams) =>
    axiosClient
      .get<ApiResponse<{ items: TransferRequestItem[]; total: number }>>('/qlts/assets/transfer-requests', { params })
      .then((res) => res.data),

  get: (reqId: string) =>
    axiosClient
      .get<ApiResponse<TransferRequestItem>>(`/qlts/assets/transfer-requests/${reqId}`)
      .then((res) => res.data),

  approve: (reqId: string, note?: string) =>
    axiosClient
      .post<ApiResponse<TransferRequestItem>>(`/qlts/assets/transfer-requests/${reqId}/approve`, { note })
      .then((res) => res.data),

  reject: (reqId: string, reason: string) =>
    axiosClient
      .post<ApiResponse<TransferRequestItem>>(`/qlts/assets/transfer-requests/${reqId}/reject`, { reason })
      .then((res) => res.data),

  cancel: (reqId: string) =>
    axiosClient
      .post<ApiResponse<TransferRequestItem>>(`/qlts/assets/transfer-requests/${reqId}/cancel`)
      .then((res) => res.data),

  handover: (reqId: string, note?: string) =>
    axiosClient
      .post<ApiResponse<TransferRequestItem>>(`/qlts/assets/transfer-requests/${reqId}/handover`, { note })
      .then((res) => res.data),
}
