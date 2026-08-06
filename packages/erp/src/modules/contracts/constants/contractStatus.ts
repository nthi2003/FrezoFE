// ============================================================
// FREZO ERP — Contract Status Configuration
// Domain Map: qlns.Contract có 14 state (StatusContarct enum) — chia 2 nhóm:
//   1. State chính:  DRAFT → PENDING_APPROVAL → NEGOTIATING → ACTIVE → SUSPENDED → COMPLETED / CANCELLED
//   2. Luồng OP/RV:  WAITING_FOR_OP → OP_PROCESSING → WAITING_FOR_RV → RV_REVIEWING
//                    → OP_DONE / RV_DONE / RV_REJECTED / OP_REWORK
//
// Dùng với <StatusBadge {...CONTRACT_STATUS_CONFIG[status]} /> từ @frezo/ui.
// (STANDARD section 15.1 — Status Badge System)
// ============================================================

import {
  FileText,
  Clock,
  MessageSquare,
  CheckCircle,
  PauseCircle,
  XCircle,
  Loader2,
  Send,
  UserCheck,
  RotateCcw,
  ThumbsDown,
  AlertTriangle,
} from 'lucide-react'
import type { StatusConfig } from '@frezo/ui'

export type ContractStatus =
  // Luồng chính
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'NEGOTIATING'
  | 'NO_YEP_EFFECTIVE'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'COMPLETED'
  | 'CANCELLED'
  // Luồng giao việc OP/RV
  | 'WAITING_FOR_OP'
  | 'OP_PROCESSING'
  | 'WAITING_FOR_RV'
  | 'RV_REVIEWING'
  | 'OP_DONE'
  | 'RV_DONE'
  | 'RV_REJECTED'
  | 'OP_REWORK'

/**
 * Map từ ContractStatus → {label VN, color semantic, icon Lucide}.
 * Truyền vào <StatusBadge /> — không hardcode màu ở component.
 */
export const CONTRACT_STATUS_CONFIG = {
  DRAFT:            { label: 'Nháp',              color: 'neutral', icon: FileText },
  PENDING_APPROVAL: { label: 'Chờ duyệt',         color: 'warning', icon: Clock },
  NEGOTIATING:      { label: 'Đang đàm phán',     color: 'info',    icon: MessageSquare },
  NO_YEP_EFFECTIVE: { label: 'Chưa có hiệu lực',  color: 'neutral', icon: Clock },
  ACTIVE:           { label: 'Đang hiệu lực',     color: 'success', icon: CheckCircle },
  SUSPENDED:        { label: 'Tạm dừng',          color: 'warning', icon: PauseCircle },
  COMPLETED:        { label: 'Hoàn thành',        color: 'success', icon: CheckCircle },
  CANCELLED:        { label: 'Đã hủy',            color: 'danger',  icon: XCircle },

  // Luồng giao việc OP (Operator) / RV (Reviewer)
  WAITING_FOR_OP:   { label: 'Chờ OP xử lý',      color: 'warning', icon: Clock },
  OP_PROCESSING:    { label: 'OP đang xử lý',     color: 'info',    icon: Loader2 },
  WAITING_FOR_RV:   { label: 'Chờ RV duyệt',      color: 'warning', icon: Send },
  RV_REVIEWING:     { label: 'RV đang duyệt',     color: 'info',    icon: UserCheck },
  OP_DONE:          { label: 'OP hoàn tất',       color: 'success', icon: CheckCircle },
  RV_DONE:          { label: 'RV đã duyệt',       color: 'success', icon: CheckCircle },
  RV_REJECTED:      { label: 'RV từ chối',        color: 'danger',  icon: ThumbsDown },
  OP_REWORK:        { label: 'OP làm lại',        color: 'warning', icon: RotateCcw },
} as const satisfies Record<ContractStatus, StatusConfig>

/** Badge phụ — ACTIVE sắp hết hạn (≤30 ngày), không phải lifecycle status. */
export const CONTRACT_EXPIRING_SOON_BADGE: StatusConfig = {
  label: 'Sắp hết hạn',
  color: 'warning',
  icon: AlertTriangle,
}

/**
 * Options cho <Select /> filter status trong AppTable.
 * Đặt "Tất cả" ở đầu (value = 'ALL' để tương thích AppTable convention).
 */
export const CONTRACT_STATUS_OPTIONS = [
  { value: 'ALL', label: '-- Tất cả trạng thái --' },
  ...Object.entries(CONTRACT_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
]

/**
 * State machine — status nào có thể chuyển sang status nào.
 * Dùng để enable/disable button "Đổi trạng thái" theo current state.
 * (Chỉ là hint FE — server luôn là source of truth cho validation).
 */
export const CONTRACT_STATUS_TRANSITIONS: Partial<Record<ContractStatus, ContractStatus[]>> = {
  DRAFT:            ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['NEGOTIATING', 'ACTIVE', 'CANCELLED'],
  NEGOTIATING:      ['PENDING_APPROVAL', 'ACTIVE', 'CANCELLED'],
  ACTIVE:           ['SUSPENDED', 'COMPLETED', 'CANCELLED'],
  SUSPENDED:        ['ACTIVE', 'CANCELLED'],
  WAITING_FOR_OP:   ['OP_PROCESSING', 'CANCELLED'],
  OP_PROCESSING:    ['OP_DONE', 'WAITING_FOR_RV'],
  WAITING_FOR_RV:   ['RV_REVIEWING'],
  RV_REVIEWING:     ['RV_DONE', 'RV_REJECTED'],
  RV_REJECTED:      ['OP_REWORK'],
  OP_REWORK:        ['OP_PROCESSING'],
}
