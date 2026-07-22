import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { approvalFlowApi } from '../services/approvalApi'
import type { ApprovalFlowRequest } from '../types'

export function useApprovalFlows() {
  return useQuery({
    queryKey: ['approval-flows'],
    queryFn: () => approvalFlowApi.list(),
  })
}

export function useCreateApprovalFlow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ApprovalFlowRequest) => approvalFlowApi.create(body),
    onSuccess: () => {
      toast.success('Đã tạo luồng duyệt')
      qc.invalidateQueries({ queryKey: ['approval-flows'] })
    },
    onError: () => toast.error('Tạo luồng thất bại'),
  })
}

export function useUpdateApprovalFlow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ApprovalFlowRequest }) =>
      approvalFlowApi.update(id, body),
    onSuccess: () => {
      toast.success('Đã cập nhật luồng duyệt')
      qc.invalidateQueries({ queryKey: ['approval-flows'] })
    },
    onError: () => toast.error('Cập nhật luồng thất bại'),
  })
}
