// FR-UX-15 — Stepper ngang PR → PO → GRN (AMIS/Odoo purchase path)
import { Check, Circle, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@frezo/ui'

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export interface PipelineStep {
  key: string
  label: string
}

interface Props {
  steps: PipelineStep[]
  /** Index bước hiện tại (0-based). Bước < current = done. */
  currentIndex: number
  /** CTA bước kế (label + action hoặc link) */
  nextCta?: {
    label: string
    onClick?: () => void
    href?: string
    disabled?: boolean
    loading?: boolean
  } | null
  /** Hiện link Inbox khi đang chờ duyệt */
  showInboxLink?: boolean
  className?: string
}

export function StatusPipelineStepper({
  steps,
  currentIndex,
  nextCta,
  showInboxLink,
  className,
}: Props) {
  const idx = Math.max(0, Math.min(currentIndex, steps.length - 1))

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface px-4 py-3 space-y-3',
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-1 md:gap-0">
        {steps.map((step, i) => {
          const done = i < idx
          const current = i === idx
          return (
            <li key={step.key} className="flex items-center min-w-0">
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition',
                  done && 'bg-success-light text-success-dark border-success/30',
                  current &&
                    'bg-primary-50 text-primary-800 border-primary-300 ring-1 ring-primary-200',
                  !done &&
                    !current &&
                    'bg-neutral-50 text-neutral-400 border-neutral-200',
                )}
              >
                {done ? (
                  <Check size={12} strokeWidth={2.5} />
                ) : (
                  <Circle
                    size={12}
                    strokeWidth={current ? 2.5 : 1.5}
                    className={current ? 'fill-primary-600 text-primary-600' : undefined}
                  />
                )}
                <span className="truncate">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    'hidden sm:block w-4 md:w-8 h-px mx-0.5',
                    i < idx ? 'bg-success' : 'bg-neutral-200',
                  )}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>

      {(nextCta || showInboxLink) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          {nextCta &&
            (nextCta.href ? (
              <Link to={nextCta.href}>
                <Button size="sm" className="gap-1" disabled={nextCta.disabled}>
                  {nextCta.label}
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="gap-1"
                disabled={nextCta.disabled || nextCta.loading}
                onClick={nextCta.onClick}
              >
                {nextCta.label}
              </Button>
            ))}
          {showInboxLink && (
            <Link to="/approval/inbox">
              <Button variant="outline" size="sm" className="gap-1">
                <Inbox size={13} /> Hộp thư duyệt
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

/** Map status yêu cầu mua → index bước Draft→Duyệt→Đơn mua→Nhận */
export function prStepIndex(status: string): number {
  const s = (status || '').toUpperCase()
  if (s === 'DRAFT') return 0
  if (['PENDING', 'SUBMITTED', 'IN_APPROVAL', 'WAITING_APPROVAL'].includes(s)) return 1
  if (s === 'APPROVED') return 2
  if (['REJECTED', 'CANCELLED'].includes(s)) return 1
  return 0
}

export const PR_PIPELINE: PipelineStep[] = [
  { key: 'draft', label: 'Nháp' },
  { key: 'approve', label: 'Duyệt' },
  { key: 'po', label: 'Tạo đơn mua' },
  { key: 'receive', label: 'Nhận hàng' },
]

/** PO: Draft → Confirmed → Partial/Received */
export function poStepIndex(status: string): number {
  const s = (status || '').toUpperCase()
  if (s === 'DRAFT') return 0
  if (s === 'CONFIRMED') return 1
  if (s === 'PARTIAL_RECEIVED') return 2
  if (['RECEIVED', 'CLOSED', 'DONE'].includes(s)) return 3
  if (s === 'CANCELLED') return 0
  return 0
}

export const PO_PIPELINE: PipelineStep[] = [
  { key: 'draft', label: 'Nháp' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'partial', label: 'Nhận một phần' },
  { key: 'received', label: 'Đã nhận đủ' },
]

/** GRN: Nháp → Chờ duyệt → Đã duyệt → Nhập kho */
export function grnStepIndex(status: string): number {
  const s = (status || '').toUpperCase()
  if (s === 'DRAFT') return 0
  if (s === 'PENDING_APPROVAL') return 1
  if (s === 'APPROVED') return 2
  if (['CONFIRMED', 'POSTED', 'DONE'].includes(s)) return 3
  if (s === 'CANCELLED') return 0
  return 0
}

export const GRN_PIPELINE: PipelineStep[] = [
  { key: 'draft', label: 'Nháp phiếu nhập' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'confirmed', label: 'Đã nhập kho' },
]

/** GIN: Nháp → Chờ duyệt → Đã duyệt → Xuất kho */
export function ginStepIndex(status: string): number {
  const s = (status || '').toUpperCase()
  if (s === 'DRAFT') return 0
  if (s === 'PENDING_APPROVAL') return 1
  if (s === 'APPROVED') return 2
  if (['CONFIRMED', 'POSTED', 'DONE'].includes(s)) return 3
  if (s === 'CANCELLED') return 0
  return 0
}

export const GIN_PIPELINE: PipelineStep[] = [
  { key: 'draft', label: 'Nháp phiếu xuất' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'confirmed', label: 'Đã xuất kho' },
]

/** Stock take: Draft → Counting → Submitted → Posted */
export function stockTakeStepIndex(status: string): number {
  const s = (status || '').toUpperCase()
  if (s === 'DRAFT') return 0
  if (s === 'IN_PROGRESS') return 1
  if (s === 'SUBMITTED') return 2
  if (['POSTED', 'DONE'].includes(s)) return 3
  if (s === 'CANCELLED') return 0
  return 0
}

export const STOCK_TAKE_PIPELINE: PipelineStep[] = [
  { key: 'draft', label: 'Nháp' },
  { key: 'count', label: 'Đang đếm' },
  { key: 'submitted', label: 'Đã gửi' },
  { key: 'posted', label: 'Điều chỉnh tồn' },
]
