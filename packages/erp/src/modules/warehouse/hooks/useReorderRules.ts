import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { warehouseApi } from '../services/warehouseApi'
import type { ReorderRuleRequest } from '../types'

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouse', 'list'],
    queryFn: () => warehouseApi.listWarehouses(),
  })
}

export function useReorderRules(warehouseId?: string) {
  return useQuery({
    queryKey: ['warehouse', 'reorder-rules', warehouseId ?? 'all'],
    queryFn: () => warehouseApi.listReorderRules({ warehouseId }),
    select: (p) => p?.content ?? [],
  })
}

export function useCreateReorderRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ReorderRuleRequest) => warehouseApi.createReorderRule(body),
    onSuccess: () => {
      toast.success('Đã thêm quy tắc tái nhập')
      qc.invalidateQueries({ queryKey: ['warehouse', 'reorder-rules'] })
    },
    onError: () => toast.error('Thêm quy tắc thất bại'),
  })
}

export function useUpdateReorderRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ReorderRuleRequest> }) =>
      warehouseApi.updateReorderRule(id, body),
    onSuccess: () => {
      toast.success('Đã cập nhật quy tắc')
      qc.invalidateQueries({ queryKey: ['warehouse', 'reorder-rules'] })
    },
    onError: () => toast.error('Cập nhật thất bại'),
  })
}

export function useDeleteReorderRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => warehouseApi.deleteReorderRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouse', 'reorder-rules'] })
    },
    onError: () => toast.error('Xoá thất bại'),
  })
}

export function useImportReorderRules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => warehouseApi.importReorderRules(file),
    onSuccess: (res) => {
      toast.success(`Import xong — ${res?.imported ?? 0} dòng (mock)`)
      qc.invalidateQueries({ queryKey: ['warehouse', 'reorder-rules'] })
    },
    onError: () => toast.error('Import thất bại'),
  })
}
