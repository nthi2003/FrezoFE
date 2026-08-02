import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shrinkageApi, type ShrinkageCreateRequest } from '../services/shrinkageApi'
import { toast } from 'sonner'

export function useShrinkageList(params?: {
  warehouseId?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['warehouse', 'shrinkage', params],
    queryFn: () => shrinkageApi.list(params),
  })
}

export function useCreateShrinkage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ShrinkageCreateRequest) => shrinkageApi.create(body),
    onSuccess: () => {
      toast.success('Đã tạo phiếu hao hụt')
      void qc.invalidateQueries({ queryKey: ['warehouse', 'shrinkage'] })
      void qc.invalidateQueries({ queryKey: ['warehouse', 'batches'] })
    },
    onError: () => toast.error('Không tạo được phiếu hao hụt'),
  })
}

export function useConfirmShrinkage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shrinkageApi.confirm(id),
    onSuccess: () => {
      toast.success('Đã ghi nhận hao hụt — tồn lô đã cập nhật')
      void qc.invalidateQueries({ queryKey: ['warehouse', 'shrinkage'] })
      void qc.invalidateQueries({ queryKey: ['warehouse', 'batches'] })
    },
    onError: () => toast.error('Không xác nhận được hao hụt'),
  })
}
