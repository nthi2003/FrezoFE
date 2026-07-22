// ============================================================
// ApprovalInboxPage — hộp thư duyệt cá nhân (FZ-003 / FE-1)
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Loader2, ClipboardCheck,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, PageGuideButton } from '@frezo/ui'
import { toast } from 'sonner'
import {
  useMyApprovals, useApproveRequest, useRejectRequest,
} from '../hooks/useApprovals'
import {
  SUBJECT_TYPE_LABEL,
  type ApprovalRequestDto,
  type ApprovalStatus,
} from '../types'
import { usePermission } from '@/lib/hooks/usePermission'
import { APPROVAL_INBOX_GUIDE } from '../constants/approvals.guide'

type FilterTab = 'pending' | 'all'

const STATUS_TONE: Record<ApprovalStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã huỷ',
}

export function ApprovalInboxPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>('pending')
  const { data: rows = [], isLoading } = useMyApprovals(tab)
  const approve = useApproveRequest()
  const reject = useRejectRequest()
  const canApprove = usePermission('APPROVALS.APPROVE')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentMap, setCommentMap] = useState<Record<string, string>>({})

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === 'PENDING').length,
    [rows],
  )

  const onApprove = (id: string) => {
    approve.mutate(
      { id, comment: commentMap[id]?.trim() },
      { onSuccess: () => setExpandedId(null) },
    )
  }

  const onReject = (id: string) => {
    const c = commentMap[id]?.trim()
    if (!c || c.length < 3) {
      toast.error('Lý do từ chối tối thiểu 3 ký tự')
      setCommentMap((m) => ({ ...m, [id]: m[id] || '' }))
      setExpandedId(id)
      return
    }
    reject.mutate(
      { id, comment: c },
      { onSuccess: () => setExpandedId(null) },
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Hộp thư duyệt"
        description="Duyệt đơn nghiệp vụ đang chờ bạn — nghỉ phép, lương, PR… (không phải trang thiết kế quy trình)."
        actions={<PageGuideButton guide={APPROVAL_INBOX_GUIDE} />}
      />

      <div className="rounded-xl border border-primary-100 bg-primary-50/50 px-4 py-2.5 text-sm text-primary-900">
        Cần cấu hình template visual? Đó là{' '}
        <button
          type="button"
          className="font-semibold underline underline-offset-2 text-primary-700"
          onClick={() => navigate('/qtht/workflows')}
        >
          /qtht/workflows
        </button>
        {' '}(Admin) — khác với hộp duyệt này. Flow theo subject:{' '}
        <button
          type="button"
          className="font-semibold underline underline-offset-2 text-primary-700"
          onClick={() => navigate('/approval/flows')}
        >
          /approval/flows
        </button>
        .
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(
          [
            { key: 'pending' as const, label: 'Chờ tôi duyệt', count: pendingCount },
            { key: 'all' as const, label: 'Tất cả', count: undefined },
          ]
        ).map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition ${
                active
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span
                  className={`min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center ${
                    active ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Bạn chưa có gì cần duyệt"
            description={
              tab === 'pending'
                ? 'Khi có yêu cầu mới (nghỉ phép, lương, hợp đồng…), chúng sẽ xuất hiện ở đây.'
                : 'Chưa có lịch sử duyệt.'
            }
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <InboxRow
                key={row.id}
                row={row}
                expanded={expandedId === row.id}
                comment={commentMap[row.id] || ''}
                onToggle={() =>
                  setExpandedId((id) => (id === row.id ? null : row.id))
                }
                onCommentChange={(v) =>
                  setCommentMap((m) => ({ ...m, [row.id]: v }))
                }
                onApprove={() => onApprove(row.id)}
                onReject={() => onReject(row.id)}
                busy={approve.isPending || reject.isPending}
                canApprove={canApprove}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// Row
// ------------------------------------------------------------

function InboxRow({
  row,
  expanded,
  comment,
  onToggle,
  onCommentChange,
  onApprove,
  onReject,
  busy,
  canApprove,
}: {
  row: ApprovalRequestDto
  expanded: boolean
  comment: string
  onToggle: () => void
  onCommentChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  busy: boolean
  canApprove: boolean
}) {
  const isPending = row.status === 'PENDING'
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-neutral-50 transition"
      >
        <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 mt-0.5">
          <ClipboardCheck size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-900 truncate">
              {row.subjectSummary}
            </span>
            <span
              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${STATUS_TONE[row.status]}`}
            >
              {STATUS_LABEL[row.status]}
            </span>
          </div>
          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>
              {SUBJECT_TYPE_LABEL[row.subjectType] || row.subjectType}
            </span>
            <span className="text-neutral-300">·</span>
            <span>
              {row.requestedByName || row.requestedBy}
            </span>
            <span className="text-neutral-300">·</span>
            <span>{formatWhen(row.requestedAt)}</span>
            {row.totalSteps != null && (
              <>
                <span className="text-neutral-300">·</span>
                <span>
                  Bước {row.currentStep}/{row.totalSteps}
                </span>
              </>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronDown size={16} className="text-neutral-400 shrink-0 mt-1" />
        ) : (
          <ChevronRight size={16} className="text-neutral-400 shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pl-[3.75rem] space-y-3 bg-neutral-50/60 border-t border-neutral-100">
          <p className="text-sm text-neutral-700 pt-3">{row.subjectSummary}</p>
          {isPending && canApprove && (
            <>
              <textarea
                rows={2}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                placeholder="Ghi chú (bắt buộc khi từ chối)…"
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={busy}
                  onClick={onApprove}
                >
                  <CheckCircle2 size={14} /> Duyệt
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  disabled={busy}
                  onClick={onReject}
                >
                  <XCircle size={14} /> Từ chối
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    const mins = Math.floor((Date.now() - d.getTime()) / 60_000)
    if (mins < 60) return `${Math.max(1, mins)} phút trước`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} giờ trước`
    return d.toLocaleDateString('vi-VN')
  } catch {
    return ''
  }
}
