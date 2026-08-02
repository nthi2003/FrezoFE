import { useQuery } from '@tanstack/react-query'
import { batchApi } from '../services/batchApi'

export function useBatches(params?: {
  warehouseId?: string
  productId?: string
}) {
  return useQuery({
    queryKey: ['warehouse', 'batches', params],
    queryFn: () => batchApi.list(params),
  })
}

export function useFefoSuggest(
  warehouseId: string | undefined,
  productId: string | undefined,
  qty: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ['warehouse', 'fefo', warehouseId, productId, qty],
    queryFn: () =>
      batchApi.fefoSuggest({
        warehouseId: warehouseId!,
        productId: productId!,
        qty,
      }),
    enabled: enabled && !!warehouseId && !!productId && qty > 0,
  })
}

export function useBatch(id: string | undefined) {
  return useQuery({
    queryKey: ['warehouse', 'batch', id],
    queryFn: () => batchApi.get(id!),
    enabled: !!id,
  })
}
