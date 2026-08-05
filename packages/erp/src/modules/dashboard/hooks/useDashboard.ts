import { useQuery, useMutation } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { dashboardApi, type DashboardSummary } from '../services/dashboardApi'

// Backend trả ApiResponse<T> — hook select ra data để component xài trực tiếp.
// unwrapList dùng cho các endpoint trả list/array; endpoint object dùng res?.data.

export function useDashboardSummary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dashboard_summary'],
    queryFn: dashboardApi.getSummary,
    select: (res: any): DashboardSummary | undefined => res?.data ?? res,
    enabled: options?.enabled ?? true,
  })
}

export function useExportAttendance() {
  return useMutation({
    mutationFn: dashboardApi.exportAttendance,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(new Blob([blob as any]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'BaoCao_DiemDanh.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
  })
}

export function useProfitChart(days = 7) {
  return useQuery({
    queryKey: ['dashboard_profit_chart', days],
    queryFn: () => dashboardApi.getProfitChart(days),
    select: unwrapList,
  })
}

export function usePriceFluctuation() {
  return useQuery({
    queryKey: ['dashboard_price_fluctuation'],
    queryFn: dashboardApi.getPriceFluctuation,
    select: unwrapList,
  })
}

export function useMarketComparison() {
  return useQuery({
    queryKey: ['dashboard_market_comparison'],
    queryFn: dashboardApi.getMarketComparison,
    select: unwrapList,
  })
}

export function useLoginByDay() {
  return useQuery({
    queryKey: ['dashboard_login_by_day'],
    queryFn: dashboardApi.getLoginByDay,
    select: (res: any): Record<string, number> => (res?.data ?? res) as Record<string, number>,
  })
}
