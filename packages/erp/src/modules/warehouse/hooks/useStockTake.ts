import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  stockTakeApi,
  type StockTakeCountedLine,
  type StockTakeCreateRequest,
} from '../services/stockTakeApi'

export function useStockTakes(warehouseId?: string) {
  return useQuery({
    queryKey: ['warehouse', 'stock-takes', warehouseId ?? 'all'],
    queryFn: () => stockTakeApi.list(warehouseId),
  })
}

export function useStockTake(id?: string) {
  return useQuery({
    queryKey: ['warehouse', 'stock-takes', id],
    queryFn: () => stockTakeApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateStockTake() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: StockTakeCreateRequest) => stockTakeApi.create(body),
    onSuccess: () => {
      toast.success('Đã tạo phiếu kiểm kê')
      qc.invalidateQueries({ queryKey: ['warehouse', 'stock-takes'] })
    },
    onError: () => toast.error('Tạo phiếu thất bại'),
  })
}

export function useStartStockTake() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stockTakeApi.start(id),
    onSuccess: () => {
      toast.success('Đã bắt đầu kiểm kê')
      qc.invalidateQueries({ queryKey: ['warehouse', 'stock-takes'] })
    },
    onError: () => toast.error('Start thất bại'),
  })
}

export function useSubmitCounted() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      lines,
    }: {
      id: string
      lines: StockTakeCountedLine[]
    }) => stockTakeApi.submitCounted(id, lines),
    onSuccess: () => {
      toast.success('Đã gửi số lượng đếm')
      qc.invalidateQueries({ queryKey: ['warehouse', 'stock-takes'] })
    },
    onError: () => toast.error('Submit counted thất bại'),
  })
}

export function usePostVariance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stockTakeApi.postVariance(id),
    onSuccess: () => {
      toast.success('Đã post variance')
      qc.invalidateQueries({ queryKey: ['warehouse', 'stock-takes'] })
    },
    onError: () => toast.error('Post variance thất bại'),
  })
}
