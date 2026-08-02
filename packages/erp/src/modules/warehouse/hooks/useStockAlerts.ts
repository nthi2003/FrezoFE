import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { warehouseApi } from '../services/warehouseApi'
import type { StockAlertStatus, StockAlertType } from '../types'

export function useStockAlerts(
  status: 'open' | 'resolved' | StockAlertStatus = 'open',
  alertType?: StockAlertType | '',
) {
  return useQuery({
    queryKey: ['warehouse', 'stock-alerts', status, alertType],
    queryFn: () =>
      warehouseApi.listStockAlerts({
        status,
        alertType: alertType || undefined,
      }),
    select: (p) => p?.content ?? [],
    refetchInterval: 60_000,
  })
}

/** Badge count sidebar — số alert OPEN. */
export function useOpenStockAlertCount() {
  const q = useStockAlerts('open')
  return { count: q.data?.length ?? 0, isLoading: q.isLoading }
}

export function useDismissStockAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => warehouseApi.dismissAlert(id),
    onSuccess: () => {
      toast.success('Đã bỏ qua cảnh báo')
      qc.invalidateQueries({ queryKey: ['warehouse', 'stock-alerts'] })
    },
    onError: () => toast.error('Bỏ qua cảnh báo thất bại'),
  })
}
