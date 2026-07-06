import { useQuery, useMutation } from '@tanstack/react-query'
import { dashboardApi } from '../services/dashboardApi'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard_summary'],
    queryFn: dashboardApi.getSummary,
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
    }
  })
}

export function useProfitChart(days = 7) {
  return useQuery({
    queryKey: ['dashboard_profit_chart', days],
    queryFn: () => dashboardApi.getProfitChart(days),
  })
}

export function usePriceFluctuation() {
  return useQuery({
    queryKey: ['dashboard_price_fluctuation'],
    queryFn: dashboardApi.getPriceFluctuation,
  })
}

export function useMarketComparison() {
  return useQuery({
    queryKey: ['dashboard_market_comparison'],
    queryFn: dashboardApi.getMarketComparison,
  })
}

export function useLoginByDay() {
  return useQuery({
    queryKey: ['dashboard_login_by_day'],
    queryFn: dashboardApi.getLoginByDay,
  })
}
