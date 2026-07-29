// ============================================================
// FREZO ERP — Approval module types
// SubjectType dùng CHUNG với Comment (FZ-003 / FZ-004).
// ============================================================

/** Loại đối tượng gắn với approval / comment. */
export enum SubjectType {
  LEAVE = 'LEAVE',
  PAYROLL = 'PAYROLL',
  DEAL = 'DEAL',
  INVOICE = 'INVOICE',
  TICKET = 'TICKET',
  CONTRACT = 'CONTRACT',
  QUOTE = 'QUOTE',
  PURCHASE_REQUEST = 'PURCHASE_REQUEST',
  RECRUITMENT = 'RECRUITMENT',
  GENERIC = 'GENERIC',
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type ApprovalStepAction =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SKIPPED'
  | 'PENDING'

export interface ApprovalRequestDto {
  id: string
  subjectType: SubjectType | string
  subjectId: string
  subjectSummary: string
  currentStep: number
  totalSteps?: number
  requestedBy: string
  requestedByName?: string
  requestedAt: string
  status: ApprovalStatus
  /** Role / username bước hiện tại đang chờ. */
  currentApproverHint?: string
}

export interface ApprovalStepDto {
  id?: string
  stepOrder: number
  approverName: string
  approverUsername?: string
  action: ApprovalStepAction
  comment?: string
  actionedAt?: string
}

export interface ApprovalActionPayload {
  comment?: string
}

export interface ApprovalFlowStepTemplate {
  stepOrder: number
  /** Role code (VD: MANAGER, HR, CFO) — MVP chọn role, không pick user. */
  approverRole: string
  label?: string
}

export interface ApprovalFlowDto {
  id: string
  name: string
  subjectType: SubjectType | string
  steps: ApprovalFlowStepTemplate[]
  active: boolean
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface ApprovalFlowRequest {
  name: string
  subjectType: SubjectType | string
  steps: ApprovalFlowStepTemplate[]
  active?: boolean
  description?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const SUBJECT_TYPE_LABEL: Record<string, string> = {
  [SubjectType.LEAVE]: 'Nghỉ phép',
  [SubjectType.PAYROLL]: 'Bảng lương',
  [SubjectType.DEAL]: 'Cơ hội bán',
  [SubjectType.INVOICE]: 'Hoá đơn',
  [SubjectType.TICKET]: 'Ticket',
  [SubjectType.CONTRACT]: 'Hợp đồng',
  [SubjectType.QUOTE]: 'Báo giá',
  [SubjectType.PURCHASE_REQUEST]: 'Yêu cầu mua',
  [SubjectType.RECRUITMENT]: 'Tuyển dụng',
  [SubjectType.GENERIC]: 'Khác',
}

export const APPROVER_ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'MANAGER', label: 'Quản lý trực tiếp' },
  { value: 'HR', label: 'HR' },
  { value: 'CFO', label: 'CFO / Kế toán trưởng' },
  { value: 'CEO', label: 'Giám đốc' },
  { value: 'DEPARTMENT_HEAD', label: 'Trưởng phòng' },
  { value: 'ADMIN', label: 'Admin hệ thống' },
]
