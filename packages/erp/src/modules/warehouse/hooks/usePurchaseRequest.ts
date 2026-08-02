import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  purchaseRequestApi,
  type FromAlertsRequest,
  type PurchaseRequestDto,
  type PurchaseRequestSaveRequest,
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

export function useCreatePurchaseRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PurchaseRequestSaveRequest) => purchaseRequestApi.create(body),
    onSuccess: (pr) => {
      toast.success(`Đã tạo yêu cầu mua hàng ${pr?.code || ''}`.trim())
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests'] })
    },
    onError: () => toast.error('Tạo yêu cầu mua hàng thất bại'),
  })
}

export function useCreatePrFromAlerts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: FromAlertsRequest) => purchaseRequestApi.fromAlerts(body),
    onSuccess: (list: PurchaseRequestDto[]) => {
      const n = list?.length ?? 0
      toast.success(
        n > 1
          ? `Đã tạo ${n} yêu cầu mua hàng`
          : `Đã tạo yêu cầu mua hàng ${list?.[0]?.code || ''}`.trim(),
      )
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests'] })
      qc.invalidateQueries({ queryKey: ['warehouse', 'stock-alerts'] })
    },
    onError: () => toast.error('Tạo yêu cầu mua hàng từ cảnh báo thất bại'),
  })
}

export function useUpdatePurchaseRequest(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PurchaseRequestSaveRequest) =>
      purchaseRequestApi.update(id, body),
    onSuccess: () => {
      toast.success('Đã cập nhật yêu cầu mua hàng')
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests', id] })
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests'] })
    },
    onError: () => toast.error('Cập nhật yêu cầu mua hàng thất bại'),
  })
}

export function useSubmitPurchaseRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchaseRequestApi.submit(id),
    onSuccess: () => {
      toast.success('Đã gửi duyệt yêu cầu mua hàng')
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests'] })
      qc.invalidateQueries({ queryKey: ['approvals'] })
    },
    onError: () => toast.error('Gửi duyệt yêu cầu mua hàng thất bại'),
  })
}
