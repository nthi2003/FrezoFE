// FR-HR-UX — Pipeline stepper khớp HR_WORKFLOW_QLNS.md (4 luồng nghiệp vụ)
import type { PipelineStep } from '../../warehouse/components/StatusPipelineStepper'

/** Luồng 1 — Onboarding / Thử việc */
export const ONBOARDING_PIPELINE: PipelineStep[] = [
  { key: 'provision', label: 'Cấp TK & thiết bị' },
  { key: 'training', label: 'Đào tạo hội nhập' },
  { key: 'handover', label: 'Bàn giao & mentor' },
  { key: 'probation', label: 'Đánh giá thử việc' },
]

/** Map wizard UI (1–3) + % checklist → index pipeline nghiệp vụ (0–3). */
export function onboardingStepIndex(wizardStep: number, progressPct = 0): number {
  if (wizardStep <= 1) return 0
  if (wizardStep === 2) return 1
  if (progressPct < 60) return 2
  if (progressPct < 100) return 3
  return 3
}

/**
 * Luồng 2 — Chấm công (Time hub).
 * Không gồm «Duyệt & chi trả» (thừa — đã nằm trong trang Tính lương / Bảng lương).
 * Các bước time không render trên Payroll hub.
 */
export const ATTENDANCE_PAYROLL_PIPELINE: PipelineStep[] = [
  { key: 'daily', label: 'Chấm công ngày' },
  { key: 'leave_ot', label: 'Duyệt nghỉ & OT' },
  { key: 'summary', label: 'Tổng hợp công' },
  { key: 'calc', label: 'Tính lương' },
]

export function attendanceWorkflowStepIndex(activeTab: string): number {
  if (activeTab === 'leaves') return 1
  return 0
}

/** Luồng 3 — KPI / OKR */
export const KPI_PIPELINE: PipelineStep[] = [
  { key: 'set', label: 'Đặt KPI/OKR' },
  { key: 'checkin', label: 'Theo dõi giữa kỳ' },
  { key: 'review', label: 'Đánh giá cuối kỳ' },
  { key: 'profile', label: 'Cập nhật hồ sơ' },
]

export function kpiStepIndex(avgProgress: number, hasReviews: boolean): number {
  if (!hasReviews && avgProgress === 0) return 0
  if (avgProgress > 0 && avgProgress < 80) return 1
  if (avgProgress >= 80 && !hasReviews) return 2
  return hasReviews ? 3 : 1
}

/** Luồng 4 — Nghỉ việc / Offboarding */
export const OFFBOARDING_PIPELINE: PipelineStep[] = [
  { key: 'request', label: 'Đề xuất nghỉ' },
  { key: 'approve', label: 'Duyệt & timeline' },
  { key: 'handover', label: 'Bàn giao TS' },
  { key: 'settle', label: 'Chốt lương' },
  { key: 'archive', label: 'Thu hồi & lưu HS' },
]

/** Map status BE → index pipeline offboarding (0–4). */
export function offboardingStepIndex(status?: string): number {
  switch (status) {
    case 'REQUESTED':
      return 0
    case 'APPROVED':
      return 1
    case 'HANDOVER_DONE':
      return 2
    case 'PAYROLL_SETTLED':
      return 3
    case 'COMPLETED':
      return 4
    case 'CANCELLED':
      return 0
    default:
      return 0
  }
}

/** Wizard UI step (1–5) từ status — dùng cho stepper admin. */
export function offboardingWizardStep(status?: string): 1 | 2 | 3 | 4 | 5 {
  const idx = offboardingStepIndex(status)
  if (status === 'COMPLETED') return 5
  return Math.min(5, Math.max(1, idx + 1)) as 1 | 2 | 3 | 4 | 5
}
