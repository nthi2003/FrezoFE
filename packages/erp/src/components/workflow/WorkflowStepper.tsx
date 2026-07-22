// ============================================================
// WorkflowStepper — component chung hiển thị "đã duyệt đến đâu"
// ------------------------------------------------------------
// Dùng cho mọi entity có approval flow: leave request, asset transfer,
// contract approval, purchase order, ... — chỉ cần truyền `steps` +
// `currentIndex` + `status`.
//
// Layout 2 mode:
//   - horizontal (default) — full width, cho trang detail / panel row
//   - vertical             — compact, cho drawer / sidebar
//
// Visual conventions:
//   - Bước đã hoàn thành: ✓ (emerald)  + line liền
//   - Bước đang xử lý:    ● pulse (primary)
//   - Bước sắp tới:       ○ (neutral)
//   - Bị từ chối / huỷ:   ✕ (rose)   — tô nguyên stepper theo tone lỗi
// ============================================================

import { Check, X, Loader2, Clock, User } from 'lucide-react'

export type WorkflowStepStatus = 'DONE' | 'ACTIVE' | 'PENDING' | 'SKIPPED' | 'REJECTED'

export interface WorkflowStepItem {
  /** Tên bước (Manager, HR, Bàn giao...) */
  label: string
  /** Ai duyệt / phụ trách (username hoặc name). Optional. */
  actor?: string
  /** Thời điểm hoàn tất (ISO). Optional. */
  at?: string
  /** Ghi chú của người duyệt. Optional — hiện dưới label. */
  note?: string
  /** Trạng thái bước — nếu không truyền sẽ được tự suy từ currentIndex. */
  status?: WorkflowStepStatus
}

export interface WorkflowStepperProps {
  steps: WorkflowStepItem[]
  /** Bước hiện tại (0-based). -1 = chưa bắt đầu, >= steps.length = đã xong hết. */
  currentIndex: number
  /** Nếu true → mọi bước còn lại đổi thành REJECTED tone. */
  rejected?: boolean
  /** Nếu true → mọi bước còn lại nhoè + thêm badge "Đã huỷ". */
  cancelled?: boolean
  layout?: 'horizontal' | 'vertical'
  className?: string
}

export function WorkflowStepper({
  steps, currentIndex, rejected, cancelled, layout = 'horizontal', className,
}: WorkflowStepperProps) {
  if (!steps || steps.length === 0) return null

  const resolveStatus = (i: number): WorkflowStepStatus => {
    if (steps[i].status) return steps[i].status!
    if (rejected) {
      if (i < currentIndex) return 'DONE'
      if (i === currentIndex) return 'REJECTED'
      return 'PENDING'
    }
    if (cancelled) return i < currentIndex ? 'DONE' : 'SKIPPED'
    if (i < currentIndex) return 'DONE'
    if (i === currentIndex) return 'ACTIVE'
    return 'PENDING'
  }

  if (layout === 'vertical') {
    return (
      <ol className={`space-y-2 ${className || ''}`}>
        {steps.map((s, i) => (
          <VerticalStep key={i} step={s} status={resolveStatus(i)} index={i} last={i === steps.length - 1} />
        ))}
      </ol>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      {steps.map((s, i) => (
        <HorizontalStep
          key={i}
          step={s}
          status={resolveStatus(i)}
          index={i}
          isLast={i === steps.length - 1}
          nextStatus={i < steps.length - 1 ? resolveStatus(i + 1) : undefined}
        />
      ))}
    </div>
  )
}

// ============================================================
// Horizontal — full width, hiển thị dạng "circle - connector - circle"
// ============================================================

function HorizontalStep({
  step, status, index, isLast, nextStatus,
}: {
  step: WorkflowStepItem
  status: WorkflowStepStatus
  index: number
  isLast: boolean
  nextStatus?: WorkflowStepStatus
}) {
  const cfg = STATUS_CFG[status]
  return (
    <>
      <div className="flex flex-col items-center min-w-0 flex-shrink-0" title={step.label}>
        <div
          className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${cfg.bg} ${cfg.text} ${cfg.ring}`}
        >
          {status === 'DONE' && <Check size={13} strokeWidth={3} />}
          {status === 'ACTIVE' && (
            <>
              <span className="absolute inset-0 rounded-full bg-primary-400/30 animate-ping" />
              <span className="relative">{index + 1}</span>
            </>
          )}
          {status === 'REJECTED' && <X size={13} strokeWidth={3} />}
          {(status === 'PENDING' || status === 'SKIPPED') && <span>{index + 1}</span>}
        </div>
        <div className="mt-1 text-[10px] font-medium text-neutral-600 max-w-[70px] truncate text-center leading-tight">
          {step.label}
        </div>
        {step.actor && (
          <div className="text-[9px] text-neutral-400 max-w-[70px] truncate text-center">
            @{step.actor}
          </div>
        )}
      </div>
      {!isLast && (
        <div
          className={`flex-1 h-0.5 min-w-[16px] rounded transition ${
            (status === 'DONE' && (nextStatus === 'DONE' || nextStatus === 'ACTIVE'))
              ? 'bg-emerald-400'
              : 'bg-neutral-200'
          }`}
        />
      )}
    </>
  )
}

// ============================================================
// Vertical — compact list cho drawer
// ============================================================

function VerticalStep({
  step, status, index, last,
}: { step: WorkflowStepItem; status: WorkflowStepStatus; index: number; last: boolean }) {
  const cfg = STATUS_CFG[status]
  return (
    <li className="relative pl-8">
      {/* Connector line */}
      {!last && (
        <span
          className={`absolute left-3 top-6 bottom-0 w-0.5 ${
            status === 'DONE' ? 'bg-emerald-400' : 'bg-neutral-200'
          }`}
        />
      )}
      {/* Circle */}
      <span
        className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${cfg.bg} ${cfg.text} ${cfg.ring}`}
      >
        {status === 'DONE' && <Check size={11} strokeWidth={3} />}
        {status === 'ACTIVE' && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary-400/30 animate-ping" />
            <span className="relative">{index + 1}</span>
          </>
        )}
        {status === 'REJECTED' && <X size={11} strokeWidth={3} />}
        {(status === 'PENDING' || status === 'SKIPPED') && <span>{index + 1}</span>}
      </span>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-neutral-800">{step.label}</span>
          <StatusBadge status={status} />
        </div>
        {step.actor && (
          <div className="text-[11px] text-neutral-500 mt-0.5 inline-flex items-center gap-1">
            <User size={10} /> {step.actor}
            {step.at && (
              <>
                <span className="text-neutral-300 mx-0.5">·</span>
                <Clock size={10} /> {formatTime(step.at)}
              </>
            )}
          </div>
        )}
        {step.note && (
          <div className="text-[11px] text-neutral-700 mt-1 bg-neutral-50 border border-neutral-100 rounded px-2 py-1 whitespace-pre-wrap">
            {step.note}
          </div>
        )}
      </div>
    </li>
  )
}

function StatusBadge({ status }: { status: WorkflowStepStatus }) {
  if (status === 'DONE')
    return <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Xong</span>
  if (status === 'ACTIVE')
    return (
      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 inline-flex items-center gap-1">
        <Loader2 size={8} className="animate-spin" /> Đang xử lý
      </span>
    )
  if (status === 'REJECTED')
    return <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Từ chối</span>
  if (status === 'SKIPPED')
    return <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">Bỏ qua</span>
  return null
}

// ---- Style config ----

const STATUS_CFG: Record<WorkflowStepStatus, { bg: string; text: string; ring: string }> = {
  DONE:     { bg: 'bg-emerald-500', text: 'text-white',        ring: 'ring-2 ring-emerald-100' },
  ACTIVE:   { bg: 'bg-primary-500', text: 'text-white',        ring: 'ring-4 ring-primary-100' },
  PENDING:  { bg: 'bg-neutral-100', text: 'text-neutral-500',  ring: 'ring-1 ring-neutral-200' },
  SKIPPED:  { bg: 'bg-neutral-100', text: 'text-neutral-400',  ring: 'ring-1 ring-neutral-200' },
  REJECTED: { bg: 'bg-rose-500',    text: 'text-white',        ring: 'ring-2 ring-rose-100' },
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}
