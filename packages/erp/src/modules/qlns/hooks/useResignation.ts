import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  resignationApi,
  type ResignationApproveRequest,
  type ResignationCreateRequest,
  type ResignationHandoverRequest,
} from '../services/resignationApi'

const KEY = ['qlns', 'resignation'] as const

export function useResignations(params?: { personId?: string; status?: string }) {
  return useQuery({
    queryKey: [...KEY, params ?? {}],
    queryFn: () => resignationApi.list(params),
  })
}

export function useResignation(id?: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => resignationApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateResignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ResignationCreateRequest) => resignationApi.create(body),
    onSuccess: () => {
      toast.success('Đã tạo đề xuất nghỉ việc')
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: () => toast.error('Tạo đề xuất thất bại'),
  })
}

export function useApproveResignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: ResignationApproveRequest }) =>
      resignationApi.approve(id, body),
    onSuccess: () => {
      toast.success('Đã duyệt timeline nghỉ việc')
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: () => toast.error('Duyệt thất bại'),
  })
}

export function useHandoverResignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ResignationHandoverRequest }) =>
      resignationApi.handover(id, body),
    onSuccess: () => {
      toast.success('Đã xác nhận bàn giao')
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: () => toast.error('Xác nhận bàn giao thất bại — kiểm tra checklist'),
  })
}

export function useSettlePayrollResignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resignationApi.settlePayroll(id),
    onSuccess: () => {
      toast.success('Đã chốt lương tháng cuối')
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: () => toast.error('Chốt lương thất bại'),
  })
}

export function useCompleteResignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resignationApi.complete(id),
    onSuccess: () => {
      toast.success('Hoàn tất offboarding — Person đã deactivate')
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: () => toast.error('Hoàn tất thất bại'),
  })
}

export function useCancelResignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resignationApi.cancel(id),
    onSuccess: () => {
      toast.success('Đã huỷ đơn nghỉ việc')
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: () => toast.error('Huỷ đơn thất bại'),
  })
}
