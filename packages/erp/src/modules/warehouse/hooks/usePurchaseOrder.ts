import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { purchaseOrderApi } from '../services/purchaseOrderApi'

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['warehouse', 'purchase-orders'],
    queryFn: () => purchaseOrderApi.list(),
  })
}

export function usePurchaseOrder(id?: string) {
  return useQuery({
    queryKey: ['warehouse', 'purchase-orders', id],
    queryFn: () => purchaseOrderApi.get(id!),
    enabled: !!id,
  })
}

export function useCreatePoFromPr() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prId: string) => purchaseOrderApi.fromPr(prId),
    onSuccess: (po) => {
      toast.success(`Đã tạo đơn mua hàng ${po?.code || po?.id || ''}`)
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-requests'] })
    },
    onError: () => toast.error('Tạo đơn mua hàng từ yêu cầu thất bại'),
  })
}

export function useConfirmPurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchaseOrderApi.confirm(id),
    onSuccess: () => {
      toast.success('Đã xác nhận đơn mua hàng')
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-orders'] })
    },
    onError: () => toast.error('Xác nhận đơn mua hàng thất bại'),
  })
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchaseOrderApi.receive(id),
    onSuccess: () => {
      toast.success('Đã nhận hàng (receive stub)')
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-orders'] })
    },
    onError: () => toast.error('Receive thất bại'),
  })
}
