// ============================================================
// ApprovalTimeline — embed vào detail record (LEAVE, PAYROLL…)
// ============================================================

import {
  CheckCircle2, XCircle, Clock, Send, SkipForward, Loader2,
} from 'lucide-react'
import { useApprovalTimelineBySubject } from '../hooks/useApprovals'
import type { ApprovalStepAction, ApprovalStepDto } from '../types'

interface Props {
  subjectType: string
  subjectId: string
  /** Class bổ sung cho container. */
  className?: string
}

const ACTION_META: Record<
  ApprovalStepAction,
  { label: string; icon: typeof Clock; tone: string; line: string }
> = {
  SUBMITTED: {
    label: 'Gửi yêu cầu',
    icon: Send,
    tone: 'bg-blue-100 text-blue-700',
    line: 'bg-blue-300',
  },
  APPROVED: {
    label: 'Đã duyệt',
    icon: CheckCircle2,
    tone: 'bg-emerald-100 text-emerald-700',
    line: 'bg-emerald-300',
  },
  REJECTED: {
    label: 'Từ chối',
    icon: XCircle,
    tone: 'bg-rose-100 text-rose-700',
    line: 'bg-rose-300',
  },
  SKIPPED: {
    label: 'Bỏ qua',
    icon: SkipForward,
    tone: 'bg-neutral-100 text-neutral-500',
    line: 'bg-neutral-200',
  },
  PENDING: {
    label: 'Đang chờ',
    icon: Clock,
    tone: 'bg-amber-100 text-amber-700',
    line: 'bg-amber-200',
  },
}

export function ApprovalTimeline({ subjectType, subjectId, className }: Props) {
  const { data: steps = [], isLoading } = useApprovalTimelineBySubject(
    subjectType,
    subjectId,
  )

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-neutral-500 py-4 ${className || ''}`}>
        <Loader2 size={14} className="animate-spin" /> Đang tải timeline…
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <div className={`text-sm text-neutral-400 py-3 ${className || ''}`}>
        Chưa có luồng duyệt gắn với bản ghi này.
      </div>
    )
  }

  return (
    <ol className={`relative space-y-0 ${className || ''}`}>
      {steps.map((step, idx) => (
        <TimelineRow
          key={`${step.stepOrder}-${step.action}-${idx}`}
          step={step}
          isLast={idx === steps.length - 1}
        />
      ))}
    </ol>
  )
}

function TimelineRow({
  step,
  isLast,
}: {
  step: ApprovalStepDto
  isLast: boolean
}) {
  const meta = ACTION_META[step.action] || ACTION_META.PENDING
  const Icon = meta.icon
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span
          className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${meta.line}`}
          aria-hidden
        />
      )}
      <div
        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.tone}`}
      >
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-neutral-800">
            {step.approverName}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {meta.label}
          </span>
        </div>
        {step.comment && (
          <p className="text-xs text-neutral-600 mt-0.5 leading-snug">
            “{step.comment}”
          </p>
        )}
        {step.actionedAt && (
          <p className="text-[11px] text-neutral-400 mt-1">
            {formatWhen(step.actionedAt)}
          </p>
        )}
      </div>
    </li>
  )
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
