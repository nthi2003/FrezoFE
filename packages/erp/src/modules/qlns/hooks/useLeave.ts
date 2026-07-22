import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { toast } from 'sonner'
import { leaveRequestApi, type LeaveRequestItem, type LeaveHistoryItem } from '../services/leaveApi'
import { approvalApi } from '@/modules/approval/services/approvalApi'
import { SubjectType } from '@/modules/approval/types'

const QK_PENDING = ['leave_requests', 'pending'] as const
const QK_MY = (cid: string) => ['leave_requests', 'my', cid] as const
const QK_HISTORY = (id: string) => ['leave_requests', 'history', id] as const

/** Đơn CẦN TÔI DUYỆT — server tự lọc theo role. */
export function useLeaveRequests(page = 1, size = 10) {
  return useQuery({
    queryKey: [...QK_PENDING, page, size],
    queryFn: () => leaveRequestApi.getPending(page, size),
    select: unwrapList as unknown as (raw: unknown) => LeaveRequestItem[],
  })
}

/** Đơn CỦA TÔI — tất cả trạng thái. */
export function useMyLeaveRequests(contractId?: string) {
  return useQuery({
    queryKey: QK_MY(contractId || ''),
    queryFn: () => leaveRequestApi.getMyRequests(contractId!),
    enabled: !!contractId,
    select: unwrapList as unknown as (raw: unknown) => LeaveRequestItem[],
  })
}

/** Timeline audit trail cho drawer chi tiết. */
export function useLeaveHistory(requestId?: string) {
  return useQuery({
    queryKey: QK_HISTORY(requestId || ''),
    queryFn: () => leaveRequestApi.getHistory(requestId!),
    enabled: !!requestId,
    select: (raw: any) => (raw?.data ?? raw) as LeaveHistoryItem[],
  })
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['leave_requests'] })
  qc.invalidateQueries({ queryKey: ['notifications'] })
  qc.invalidateQueries({ queryKey: ['approvals'] })
}

/** Resolve approval request id cho leave subject — không gọi endpoint 410. */
async function resolveLeaveApprovalId(leaveId: string): Promise<string> {
  try {
    const bySubject = await approvalApi.bySubject(SubjectType.LEAVE, leaveId)
    if (bySubject?.id && bySubject.status === 'PENDING') return bySubject.id
  } catch {
    /* by-subject có thể chưa sẵn — fallback inbox my */
  }
  const page = await approvalApi.listMy('pending')
  const hit = (page?.content ?? []).find(
    (a) =>
      a.subjectType === SubjectType.LEAVE &&
      a.subjectId === leaveId &&
      a.status === 'PENDING',
  )
  if (!hit?.id) {
    throw new Error(
      'Không tìm thấy Approval pending cho đơn này. Mở /approval/inbox để duyệt.',
    )
  }
  return hit.id
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => leaveRequestApi.create(data),
    onSuccess: () => {
      toast.success('Đã gửi đơn xin nghỉ phép — chờ Approval')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không gửi được đơn'),
  })
}

/** Duyệt qua Approval API — không gọi leave-request/.../approve (410). */
export function useApproveLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (leaveId: string) => {
      const approvalId = await resolveLeaveApprovalId(leaveId)
      return approvalApi.approve(approvalId, {})
    },
    onSuccess: () => {
      toast.success('Đã duyệt đơn (Approval)')
      invalidateAll(qc)
    },
    onError: (e: any) =>
      toast.error(
        e?.message || e?.response?.data?.message || 'Không duyệt được — thử Approval Inbox',
      ),
  })
}

type RejectArgs = { id: string; reason: string } | { id: string; data: { reason?: string } }

/** Từ chối qua Approval API — không gọi leave-request/.../reject (410). */
export function useRejectLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: RejectArgs) => {
      const reason = 'reason' in args ? args.reason : (args.data?.reason ?? '')
      const approvalId = await resolveLeaveApprovalId(args.id)
      return approvalApi.reject(approvalId, { comment: reason })
    },
    onSuccess: () => {
      toast.success('Đã từ chối đơn (Approval)')
      invalidateAll(qc)
    },
    onError: (e: any) =>
      toast.error(
        e?.message || e?.response?.data?.message || 'Không từ chối được — thử Approval Inbox',
      ),
  })
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leaveRequestApi.cancel(id),
    onSuccess: () => {
      toast.success('Đã huỷ đơn')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không huỷ được'),
  })
}
