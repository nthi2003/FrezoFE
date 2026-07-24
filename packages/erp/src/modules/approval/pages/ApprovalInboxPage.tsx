// ============================================================
// ApprovalInboxPage — hộp thư duyệt cá nhân (FZ-003 / FE-1)
// FR-UX-05: bulk select PENDING → Duyệt / Từ chối hàng loạt
// ============================================================

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Loader2, ClipboardCheck, Info,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, ErrorState, PageGuideButton, ConfirmDialog, BulkSelectionBar } from '@frezo/ui'
import { toast } from 'sonner'
import {
  useMyApprovals, useApproveRequest, useRejectRequest,
} from '../hooks/useApprovals'
import { approvalApi } from '../services/approvalApi'
import {
  SUBJECT_TYPE_LABEL,
  type ApprovalRequestDto,
  type ApprovalStatus,
} from '../types'
import { usePermission } from '@/lib/hooks/usePermission'
import { APPROVAL_INBOX_GUIDE } from '../constants/approvals.guide'
import { useQueryClient } from '@tanstack/react-query'

type FilterTab = 'pending' | 'all'
type BulkMode = 'approve' | 'reject' | null

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
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<FilterTab>('pending')
  const { data: rows = [], isLoading, isError, refetch, error } = useMyApprovals(tab)
  const approve = useApproveRequest()
  const reject = useRejectRequest()
  const canApprove = usePermission('APPROVALS.APPROVE')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentMap, setCommentMap] = useState<Record<string, string>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState<BulkMode>(null)
  const [bulkRejectReason, setBulkRejectReason] = useState('')
  const [bulkRunning, setBulkRunning] = useState(false)

  const pendingRows = useMemo(
    () => rows.filter((r) => r.status === 'PENDING'),
    [rows],
  )
  const pendingCount = pendingRows.length

  const selectedPending = useMemo(
    () => pendingRows.filter((r) => selectedIds.has(r.id)),
    [pendingRows, selectedIds],
  )

  const allPendingSelected =
    pendingRows.length > 0 && pendingRows.every((r) => selectedIds.has(r.id))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(pendingRows.map((r) => r.id)))
  }

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

  const runBulk = async () => {
    const mode = bulkMode
    if (!mode || selectedPending.length === 0) return
    if (mode === 'reject') {
      const reason = bulkRejectReason.trim()
      if (reason.length < 3) {
        toast.error('Lý do từ chối tối thiểu 3 ký tự')
        return
      }
    }
    setBulkRunning(true)
    const ids = selectedPending.map((r) => r.id)
    const rejectComment = bulkRejectReason.trim()
    let ok = 0
    const errors: string[] = []
    for (const id of ids) {
      try {
        if (mode === 'approve') {
          await approvalApi.approve(id, { comment: undefined })
        } else {
          await approvalApi.reject(id, { comment: rejectComment })
        }
        ok += 1
      } catch {
        const row = selectedPending.find((r) => r.id === id)
        errors.push(row?.subjectSummary || id)
      }
    }
    setBulkRunning(false)
    setBulkMode(null)
    setBulkRejectReason('')
    setSelectedIds(new Set())
    await queryClient.invalidateQueries({ queryKey: ['approvals'] })

    const total = ids.length
    if (ok === total) {
      toast.success(
        mode === 'approve'
          ? `Đã duyệt ${ok}/${total} yêu cầu`
          : `Đã từ chối ${ok}/${total} yêu cầu`,
      )
    } else if (ok > 0) {
      toast.warning(
        `Hoàn tất ${ok}/${total}. Lỗi: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '…' : ''}`,
      )
    } else {
      toast.error(`Không xử lý được. ${errors[0] || 'Thử lại.'}`)
    }
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Hộp thư duyệt"
        description="Duyệt đơn nghiệp vụ đang chờ bạn — nghỉ phép, lương, PR…"
        actions={<PageGuideButton guide={APPROVAL_INBOX_GUIDE} />}
      />

      <div className="flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-sm text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p className="leading-snug">
          Đây là <b>hộp thư duyệt hàng ngày</b>. Thiết kế template quy trình nằm ở{' '}
          <Link to="/qtht/workflows" className="font-semibold underline underline-offset-2 hover:text-sky-700">
            /qtht/workflows
          </Link>
          {' '}— không mở designer khi chỉ cần duyệt đơn.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
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
              onClick={() => {
                setTab(t.key)
                setSelectedIds(new Set())
              }}
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

        {canApprove && pendingRows.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAllPending}
            className="ml-auto text-xs font-medium text-primary-700 hover:underline"
          >
            {allPendingSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả chờ duyệt (${pendingCount})`}
          </button>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải…
          </div>
        ) : isError ? (
          <div className="p-6">
            <ErrorState
              title="Không tải được hộp thư duyệt"
              message={
                (error as { message?: string })?.message
                || 'Kiểm tra kết nối / quyền APPROVALS rồi thử lại.'
              }
              onRetry={() => void refetch()}
            />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Bạn chưa có gì cần duyệt"
            description={
              tab === 'pending'
                ? 'Khi có yêu cầu mới (nghỉ phép, lương, hợp đồng…), chúng sẽ xuất hiện ở đây. Nếu vừa gửi đơn mà không thấy — Admin kiểm tra flow + User có Role duyệt.'
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
                selected={selectedIds.has(row.id)}
                showSelect={canApprove && row.status === 'PENDING'}
                onToggleSelect={() => toggleSelect(row.id)}
                onToggle={() =>
                  setExpandedId((id) => (id === row.id ? null : row.id))
                }
                onCommentChange={(v) =>
                  setCommentMap((m) => ({ ...m, [row.id]: v }))
                }
                onApprove={() => onApprove(row.id)}
                onReject={() => onReject(row.id)}
                busy={approve.isPending || reject.isPending || bulkRunning}
                canApprove={canApprove}
              />
            ))}
          </ul>
        )}
      </div>

      {canApprove && selectedPending.length > 0 && (
        <BulkSelectionBar
          selectedCount={selectedPending.length}
          totalCount={pendingCount}
          onDeselect={() => setSelectedIds(new Set())}
          actions={
            <>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={bulkRunning || selectedPending.length < 1}
                onClick={() => setBulkMode('approve')}
              >
                <CheckCircle2 size={14} /> Duyệt ({selectedPending.length})
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                disabled={bulkRunning || selectedPending.length < 1}
                onClick={() => {
                  setBulkRejectReason('')
                  setBulkMode('reject')
                }}
              >
                <XCircle size={14} /> Từ chối ({selectedPending.length})
              </Button>
            </>
          }
        />
      )}

      <ConfirmDialog
        isOpen={bulkMode === 'approve'}
        onClose={() => !bulkRunning && setBulkMode(null)}
        onConfirm={() => void runBulk()}
        title={`Duyệt ${selectedPending.length} yêu cầu?`}
        message={`Bạn đang duyệt hàng loạt ${selectedPending.length} đơn PENDING. Thao tác không hoàn tác trên bước hiện tại.`}
        confirmText={`Duyệt ${selectedPending.length}`}
        variant="default"
        isLoading={bulkRunning}
      />

      <ConfirmDialog
        isOpen={bulkMode === 'reject'}
        onClose={() => {
          if (bulkRunning) return
          setBulkMode(null)
          setBulkRejectReason('')
        }}
        onConfirm={() => void runBulk()}
        title={`Từ chối ${selectedPending.length} yêu cầu?`}
        message={
          <span className="block space-y-2">
            <span className="block">
              Lý do từ chối bắt buộc (≥ 3 ký tự) — áp dụng cho tất cả đơn đã chọn.
            </span>
            <textarea
              rows={3}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              placeholder="Nhập lý do từ chối…"
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              disabled={bulkRunning}
            />
          </span>
        }
        confirmText={`Từ chối ${selectedPending.length}`}
        variant="danger"
        isLoading={bulkRunning}
      />
    </div>
  )
}

function InboxRow({
  row,
  expanded,
  comment,
  selected,
  showSelect,
  onToggleSelect,
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
  selected: boolean
  showSelect: boolean
  onToggleSelect: () => void
  onToggle: () => void
  onCommentChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  busy: boolean
  canApprove: boolean
}) {
  const isPending = row.status === 'PENDING'
  return (
    <li className={selected ? 'bg-primary-50/40' : undefined}>
      <div className="flex items-start gap-2 px-3 py-3">
        {showSelect && (
          <input
            type="checkbox"
            className="mt-2.5 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-300 cursor-pointer shrink-0"
            checked={selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label="Chọn để duyệt hàng loạt"
          />
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-start gap-3 text-left hover:bg-neutral-50/80 rounded-lg transition px-1 py-0.5"
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
      </div>

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
