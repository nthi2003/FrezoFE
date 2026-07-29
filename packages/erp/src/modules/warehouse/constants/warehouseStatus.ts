// ============================================================
// Warehouse status & label config — single source of truth
// ============================================================

import type { StatusColor, StatusConfig } from '@frezo/ui'

/** GRN / GIN document lifecycle (T3/AMIS: Nháp → Duyệt → Xác nhận) */
export const DOC_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: 'Nháp', color: 'neutral' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', color: 'warning' },
  APPROVED: { label: 'Đã duyệt', color: 'info' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'success' },
  POSTED: { label: 'Đã ghi sổ', color: 'success' },
  DONE: { label: 'Hoàn tất', color: 'success' },
  CANCELLED: { label: 'Đã huỷ', color: 'danger' },
}

/** Purchase Request */
export const PR_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: 'Nháp', color: 'neutral' },
  PENDING: { label: 'Chờ duyệt', color: 'warning' },
  SUBMITTED: { label: 'Chờ duyệt', color: 'warning' },
  IN_APPROVAL: { label: 'Đang duyệt', color: 'warning' },
  WAITING_APPROVAL: { label: 'Đang duyệt', color: 'warning' },
  APPROVED: { label: 'Đã duyệt', color: 'success' },
  REJECTED: { label: 'Từ chối', color: 'danger' },
  CANCELLED: { label: 'Đã huỷ', color: 'neutral' },
}

/** Purchase Order */
export const PO_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: 'Nháp', color: 'neutral' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'info' },
  PARTIAL_RECEIVED: { label: 'Nhận một phần', color: 'warning' },
  RECEIVED: { label: 'Đã nhận đủ', color: 'success' },
  CLOSED: { label: 'Đã đóng', color: 'success' },
  DONE: { label: 'Hoàn tất', color: 'success' },
  CANCELLED: { label: 'Đã huỷ', color: 'danger' },
}

/** Stock take */
export const STOCK_TAKE_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: 'Nháp', color: 'neutral' },
  IN_PROGRESS: { label: 'Đang đếm', color: 'warning' },
  SUBMITTED: { label: 'Đã gửi', color: 'info' },
  POSTED: { label: 'Hoàn tất', color: 'success' },
  CANCELLED: { label: 'Đã huỷ', color: 'danger' },
}

export type WarehouseStatusKind = 'doc' | 'pr' | 'po' | 'stockTake'

const CONFIG_BY_KIND: Record<WarehouseStatusKind, Record<string, StatusConfig>> = {
  doc: DOC_STATUS_CONFIG,
  pr: PR_STATUS_CONFIG,
  po: PO_STATUS_CONFIG,
  stockTake: STOCK_TAKE_STATUS_CONFIG,
}

export function resolveWarehouseStatus(
  status: string | undefined,
  kind: WarehouseStatusKind,
): StatusConfig {
  const key = (status || '').toUpperCase()
  const cfg = CONFIG_BY_KIND[kind][key]
  if (cfg) return cfg
  return { label: status || '—', color: 'neutral' as StatusColor }
}

/** @deprecated Use resolveWarehouseStatus(status, 'doc') */
export function grnGinStatusLabel(status?: string) {
  return resolveWarehouseStatus(status, 'doc').label
}

export function isPendingApprovalStatus(status?: string): boolean {
  const s = (status || '').toUpperCase()
  return ['PENDING', 'SUBMITTED', 'IN_APPROVAL', 'WAITING_APPROVAL', 'PENDING_APPROVAL'].includes(s)
}

/** GIN/GRN issue type — EU labels */
export const ISSUE_TYPE_LABELS: Record<string, string> = {
  SALES: 'Xuất bán',
  INTERNAL_TRANSFER: 'Chuyển kho',
  INTERNAL: 'Xuất nội bộ',
  DAMAGE_RETURN: 'Hủy/hoàn hàng',
  ADJUSTMENT: 'Điều chỉnh',
  SALE: 'Xuất bán',
  TRANSFER: 'Chuyển kho',
  OTHER: 'Khác',
}

export const GIN_ISSUE_TYPE_OPTIONS = [
  { value: 'SALES', label: 'Xuất bán' },
  { value: 'INTERNAL_TRANSFER', label: 'Chuyển kho' },
  { value: 'INTERNAL', label: 'Xuất nội bộ' },
  { value: 'DAMAGE_RETURN', label: 'Hủy/hoàn hàng' },
  { value: 'ADJUSTMENT', label: 'Điều chỉnh' },
] as const

export function issueTypeLabel(type?: string): string {
  if (!type) return '—'
  return ISSUE_TYPE_LABELS[type.toUpperCase()] ?? type
}

/** @deprecated Use issueTypeLabel */
export const ginIssueTypeLabel = issueTypeLabel

export const DOC_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
]

export const PR_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
]

export const PO_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PARTIAL_RECEIVED', label: 'Nhận một phần' },
  { value: 'RECEIVED', label: 'Đã nhận đủ' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
]

export const STOCK_TAKE_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'IN_PROGRESS', label: 'Đang đếm' },
  { value: 'SUBMITTED', label: 'Đã gửi' },
  { value: 'POSTED', label: 'Hoàn tất' },
]

export const GIN_ISSUE_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả loại xuất' },
  ...GIN_ISSUE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]
