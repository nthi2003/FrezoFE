import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  purchaseRequestApi,
  type FromAlertsRequest,
  type PurchaseRequestDto,
  type PurchaseRequestUpdateRequest,
} from '../services/purchaseRequestApi'

export function usePurchaseRequests() {
  return useQuery({
    queryKey: ['warehouse', 'purchase-requests'],
    queryFn: () => purchaseRequestApi.list(),
  })
}

export function usePurchaseRequest(id?: string) {
  return useQuery({
    queryKey: ['warehouse', 'purchase-requests', id],
    queryFn: () => purchaseRequestApi.get(id!),
    enabled: !!id,
  })
}

export function useCreatePrFromAlerts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: FromAlertsRequest) => purchaseRequestApi.fromAlerts(body),
    onSuccess: (list: PurchaseRequestDto[]) => {
      const n = list?.length ?? 0
      toast.success(n > 1 ? `Đã tạo ${n} PR` : `Đã tạo PR ${list?.[0]?.code || list?.[0]?.id || ''}`)
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests'] })
      qc.invalidateQueries({ queryKey: ['warehouse', 'stock-alerts'] })
    },
    onError: () => toast.error('Tạo PR từ alerts thất bại'),
  })
}

export function useUpdatePurchaseRequest(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PurchaseRequestUpdateRequest) =>
      purchaseRequestApi.update(id, body),
    onSuccess: () => {
      toast.success('Đã cập nhật PR')
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests', id] })
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests'] })
    },
    onError: () => toast.error('Cập nhật PR thất bại'),
  })
}

export function useSubmitPurchaseRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchaseRequestApi.submit(id),
    onSuccess: () => {
      toast.success('Đã submit PR → Approval')
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests'] })
      qc.invalidateQueries({ queryKey: ['approvals'] })
    },
    onError: () => toast.error('Submit PR thất bại'),
  })
}
