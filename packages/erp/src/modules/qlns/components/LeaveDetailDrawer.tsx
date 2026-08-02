// ============================================================
// LeaveDetailDrawer — Approval module (không duyệt local)
// Duyệt/Từ chối qua /approvals/{id}/… hoặc Inbox
// ============================================================

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X, Calendar, User, Paperclip, MessageSquare, Send,
  CheckCircle2, XCircle, Ban, Clock, Loader2, ExternalLink, Inbox,
} from 'lucide-react'
import { Button, ConfirmDialog } from '@frezo/ui'
import { toast } from 'sonner'
import { useCancelLeaveRequest } from '../hooks/useLeave'
import type { LeaveRequestItem, LeaveStatus } from '../services/leaveApi'
import { LEAVE_TYPES } from '../constants/schema'
import { ApprovalTimeline } from '@/modules/approval/components/ApprovalTimeline'
import {
  useApproveRequest,
  useRejectRequest,
  useMyApprovals,
  useApprovalBySubject,
} from '@/modules/approval/hooks/useApprovals'
import { SubjectType } from '@/modules/approval/types'
import { Can, PermissionButton } from '@/lib/permissions'
import { useAnyPermission } from '@/lib/hooks/usePermission'

interface Props {
  lead: LeaveRequestItem
  currentUsername?: string
  isAdmin?: boolean
  onClose: () => void
}

export function LeaveDetailDrawer({ lead, currentUsername, isAdmin, onClose }: Props) {
  const cancel = useCancelLeaveRequest()
  const approve = useApproveRequest()
  const reject = useRejectRequest()
  const { data: myPending = [] } = useMyApprovals('pending')
  const { data: bySubject } = useApprovalBySubject(SubjectType.LEAVE, lead.id)
  const canApprovePerm = useAnyPermission(['LEAVE.APPROVE', 'APPROVALS.APPROVE'])

  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const status = (lead.status || 'PENDING_MANAGER') as LeaveStatus
  const type = LEAVE_TYPES.find((t) => t.value === lead.leaveType)
  const isMyRequest = lead.createdBy === currentUsername
  const canCancel =
    (status === 'PENDING_MANAGER' || status === 'PENDING_HR' || status === 'PENDING') &&
    (isMyRequest || isAdmin)
  const isTerminal =
    status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELLED'

  const pendingApproval = useMemo(() => {
    if (bySubject?.status === 'PENDING') return bySubject
    return (
      myPending.find(
        (a) =>
          a.subjectType === SubjectType.LEAVE &&
          a.subjectId === lead.id &&
          a.status === 'PENDING',
      ) || null
    )
  }, [bySubject, myPending, lead.id])

  const canActAsApprover = !!pendingApproval && canApprovePerm

  const handleApprove = () => {
    if (!pendingApproval) return
    approve.mutate({ id: pendingApproval.id }, { onSuccess: onClose })
  }

  const handleReject = () => {
    if (!pendingApproval) return
    if (rejectReason.trim().length < 3) {
      toast.error('Lý do từ chối tối thiểu 3 ký tự')
      return
    }
    reject.mutate(
      { id: pendingApproval.id, comment: rejectReason.trim() },
      { onSuccess: onClose },
    )
  }

  const handleCancel = () => setCancelConfirmOpen(true)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">
        <div className="p-5 border-b border-neutral-100 bg-gradient-to-br from-primary-50/50 to-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold shrink-0">
                {(lead.personName || lead.createdBy || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-neutral-900 truncate">
                  {lead.personName || lead.createdBy || 'N/A'}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5 inline-flex items-center gap-2">
                  {type && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        type.paid
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {type.label}
                    </span>
                  )}
                  <StatusPill status={status} />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <section>
            <SectionTitle>Chi tiết đơn</SectionTitle>
            <InfoRow icon={Calendar} label="Từ ngày" value={fmtDate(lead.startDate)} />
            <InfoRow icon={Calendar} label="Đến ngày" value={fmtDate(lead.endDate)} />
            {lead.durationDays != null && (
              <InfoRow icon={Clock} label="Số ngày" value={`${lead.durationDays} ngày`} />
            )}
            <InfoRow icon={User} label="Người gửi" value={lead.createdBy} />
          </section>

          {lead.reason && (
            <section>
              <SectionTitle>Lý do</SectionTitle>
              <div className="text-sm text-neutral-800 bg-neutral-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap border border-neutral-100">
                {lead.reason}
              </div>
            </section>
          )}

          {lead.attachmentUrl && (
            <section>
              <SectionTitle>File đính kèm</SectionTitle>
              <a
                href={lead.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 hover:border-primary-300 text-sm text-primary-700"
              >
                <Paperclip size={14} />
                <span className="truncate max-w-[280px]">
                  {lead.attachmentUrl.split('/').pop() || 'File'}
                </span>
                <ExternalLink size={12} className="text-neutral-400" />
              </a>
            </section>
          )}

          {!isTerminal && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Đơn đang chờ Approval. Duyệt tại Inbox hoặc bên dưới nếu bạn là approver.
            </div>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <SectionTitle>Luồng Approval</SectionTitle>
              <Link
                to="/approval/inbox"
                className="text-xs text-primary-700 hover:underline inline-flex items-center gap-1"
              >
                <Inbox size={12} /> Mở Inbox
              </Link>
            </div>
            <ApprovalTimeline subjectType={SubjectType.LEAVE} subjectId={lead.id} />
          </section>
        </div>

        {!isTerminal && (
          <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4 space-y-3">
            {rejectMode && canActAsApprover ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
                  <MessageSquare size={12} /> Lý do từ chối (tối thiểu 3 ký tự)
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-rose-200 bg-rose-50/30 text-sm outline-none resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRejectMode(false)
                      setRejectReason('')
                    }}
                    className="flex-1"
                  >
                    Huỷ
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={reject.isPending || rejectReason.trim().length < 3}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                  >
                    {reject.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Từ chối
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {canCancel && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={cancel.isPending}
                    className="gap-1.5 text-neutral-600"
                  >
                    <Ban size={14} /> Huỷ đơn
                  </Button>
                )}
                {canActAsApprover && (
                  <Can anyOf={['LEAVE.APPROVE', 'APPROVALS.APPROVE']}>
                    <PermissionButton
                      anyOf={['LEAVE.APPROVE', 'APPROVALS.APPROVE']}
                      variant="outline"
                      onClick={() => setRejectMode(true)}
                      className="flex-1 gap-1.5 text-rose-600 border-rose-200"
                    >
                      <XCircle size={14} /> Từ chối
                    </PermissionButton>
                    <PermissionButton
                      anyOf={['LEAVE.APPROVE', 'APPROVALS.APPROVE']}
                      onClick={handleApprove}
                      disabled={approve.isPending}
                      className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {approve.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Duyệt
                    </PermissionButton>
                  </Can>
                )}
                {!canActAsApprover && !canCancel && (
                  <Link
                    to="/approval/inbox"
                    className="w-full text-center text-xs text-primary-700 py-2 hover:underline"
                  >
                    Mở Approval Inbox để duyệt
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => {
          cancel.mutate(lead.id, {
            onSuccess: () => {
              setCancelConfirmOpen(false)
              onClose()
            },
          })
        }}
        title="Huỷ đơn nghỉ này?"
        message="Đơn sẽ chuyển sang trạng thái Đã huỷ. Thao tác không thể hoàn tác."
        confirmText="Huỷ đơn"
        cancelText="Giữ lại"
        variant="warning"
        isLoading={cancel.isPending}
      />
    </>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
      {children}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <Icon size={13} className="text-neutral-400 shrink-0" />
      <span className="text-neutral-500 w-24 text-xs shrink-0">{label}</span>
      <span className="text-neutral-800 font-medium truncate">
        {value || <span className="text-neutral-400">—</span>}
      </span>
    </div>
  )
}

function StatusPill({ status }: { status: LeaveStatus }) {
  const map: Record<string, { label: string; tone: string; dot: string }> = {
    PENDING_MANAGER: {
      label: 'Chờ Approval',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    PENDING_HR: {
      label: 'Chờ Approval',
      tone: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    PENDING: {
      label: 'Chờ Approval',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    APPROVED: {
      label: 'Đã duyệt',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      label: 'Từ chối',
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    CANCELLED: {
      label: 'Đã huỷ',
      tone: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      dot: 'bg-neutral-400',
    },
  }
  const s = map[status] || map.PENDING
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.tone}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function fmtDate(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
