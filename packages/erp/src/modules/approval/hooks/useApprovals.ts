import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { approvalApi } from '../services/approvalApi'
import type { ApprovalActionPayload } from '../types'

export function useMyApprovals(status: 'pending' | 'all' = 'pending') {
  return useQuery({
    queryKey: ['approvals', 'my', status],
    queryFn: () => approvalApi.listMy(status),
    select: (page) => page?.content ?? [],
    refetchInterval: 30_000,
  })
}

/** Badge count cho sidebar — chỉ lấy pending. */
export function usePendingApprovalCount() {
  const q = useMyApprovals('pending')
  return {
    count: q.data?.length ?? 0,
    isLoading: q.isLoading,
  }
}

export function useApprovalTimeline(approvalId?: string) {
  return useQuery({
    queryKey: ['approvals', 'timeline', approvalId],
    queryFn: () => approvalApi.timeline(approvalId!),
    enabled: !!approvalId,
  })
}

export function useApprovalTimelineBySubject(
  subjectType?: string,
  subjectId?: string,
) {
  return useQuery({
    queryKey: ['approvals', 'timeline-subject', subjectType, subjectId],
    queryFn: () => approvalApi.timelineBySubject(subjectType!, subjectId!),
    enabled: !!subjectType && !!subjectId,
  })
}

export function useApprovalBySubject(
  subjectType?: string,
  subjectId?: string,
) {
  return useQuery({
    queryKey: ['approvals', 'by-subject', subjectType, subjectId],
    queryFn: () => approvalApi.bySubject(subjectType!, subjectId!),
    enabled: !!subjectType && !!subjectId,
    retry: false,
  })
}

export function useApproveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approvalApi.approve(id, { comment } satisfies ApprovalActionPayload),
    onSuccess: () => {
      toast.success('Đã duyệt yêu cầu')
      qc.invalidateQueries({ queryKey: ['approvals'] })
    },
    onError: () => toast.error('Duyệt thất bại'),
  })
}

export function useRejectRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approvalApi.reject(id, { comment } satisfies ApprovalActionPayload),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu')
      qc.invalidateQueries({ queryKey: ['approvals'] })
    },
    onError: () => toast.error('Từ chối thất bại'),
  })
}
