// FR-ACC-UX — Pipeline stepper khớp ACCOUNTING_WORKFLOW.md (3 luồng nghiệp vụ)
import type { PipelineStep } from '../../warehouse/components/StatusPipelineStepper'

/** Luồng 1 — Doanh thu (Revenue) */
export const REVENUE_PIPELINE: PipelineStep[] = [
  { key: 'record', label: 'Ghi nhận đơn & HĐ' },
  { key: 'reconcile', label: 'Đối chiếu & thu tiền' },
  { key: 'accrue', label: 'Ghi nhận DT theo kỳ' },
  { key: 'allocate', label: 'Phân bổ kênh & SP' },
  { key: 'report', label: 'Báo cáo doanh thu' },
]

export function revenueStepIndexForInvoices(
  invoices: Array<{ status: string; glJournalEntryId?: string | null }>,
): number {
  if (!invoices.length) return 0
  const hasDraft = invoices.some((i) => i.status === 'DRAFT')
  const hasReceivable = invoices.some(
    (i) => i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID',
  )
  const hasUnposted = invoices.some(
    (i) =>
      (i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID' || i.status === 'PAID') &&
      !i.glJournalEntryId,
  )
  if (hasDraft) return 0
  if (hasReceivable || hasUnposted) return 1
  return 2
}

export function revenueStepIndexForJournals(
  entries: Array<{ status: string; sourceType?: string | null; source?: string | null }>,
): number {
  const revenuePosted = entries.some((e) => {
    const src = e.sourceType || e.source
    return (
      e.status === 'POSTED' &&
      (src === 'SALES_INVOICE' || src === 'CRM_INVOICE' || src === 'INVOICE')
    )
  })
  return revenuePosted ? 2 : 1
}

export function revenueStepIndexForReports(): number {
  return 4
}

/** Luồng 2 — Kê khai thuế (Tax declaration) */
export const TAX_PIPELINE: PipelineStep[] = [
  { key: 'collect', label: 'Tổng hợp HĐ đầu vào/ra' },
  { key: 'calc', label: 'Tính thuế phải nộp' },
  { key: 'declare', label: 'Lập tờ khai' },
  { key: 'submit', label: 'Nộp / điều chỉnh' },
  { key: 'archive', label: 'Nộp thuế & lưu CT' },
]

export function taxStepIndex(hasVatData: boolean, declared = false): number {
  if (!hasVatData) return 0
  if (declared) return 4
  return 1
}

/** Luồng 3 — Hợp đồng số (Digital contract) */
export const DIGITAL_CONTRACT_PIPELINE: PipelineStep[] = [
  { key: 'draft', label: 'Soạn thảo HĐ' },
  { key: 'internal', label: 'Trình duyệt nội bộ' },
  { key: 'esign', label: 'Gửi ký số' },
  { key: 'verify', label: 'Xác thực chữ ký' },
  { key: 'archive', label: 'Lưu trữ & nhắc gia hạn' },
]

export function digitalContractStepIndex(
  status: string,
  opts?: { signed?: boolean; expiringSoon?: boolean },
): number {
  const signed = opts?.signed
  const s = (status || 'DRAFT').toUpperCase()
  if (s === 'DRAFT') return 0
  if (s === 'PENDING_APPROVAL' || s === 'NEGOTIATING' || s === 'WAITING_FOR_RV' || s === 'RV_REVIEWING') {
    return 1
  }
  if (s === 'ACTIVE' && !signed) return 2
  if (signed && s === 'ACTIVE') return 3
  if (s === 'ACTIVE' || s === 'COMPLETED') return opts?.expiringSoon ? 4 : 4
  if (s === 'SUSPENDED' || s === 'CANCELLED') return 4
  return 0
}

export function digitalContractListStepIndex(
  contracts: Array<{ status: string }>,
): number {
  if (!contracts.length) return 0
  const pending = contracts.some(
    (c) => c.status === 'PENDING_APPROVAL' || c.status === 'NEGOTIATING',
  )
  const draft = contracts.some((c) => c.status === 'DRAFT')
  const active = contracts.some((c) => c.status === 'ACTIVE')
  if (draft) return 0
  if (pending) return 1
  if (active) return 2
  return 0
}
