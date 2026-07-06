import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface DashboardSummary {
  ordersToday: number;
  ordersThisMonth: number;
  ordersChangePercent: number;
  revenueThisMonth: number;
  totalEmployees: number;
  newEmployees: number;
  totalWarehouses: number;
  lowStockProducts: number;
  totalProductsInStock: number;
  pendingTasks: number;
  todayAttendance: number;
  newArticles: number;
  expiringContracts: any[];
}

export const dashboardApi = {
  getSummary: () =>
    axiosClient.get<ApiResponse<DashboardSummary>>('/qtht/dashboard/summary').then(res => res.data),
    
  exportAttendance: () =>
    axiosClient.get('/qtht/dashboard/export/attendance', { responseType: 'blob' }),

  getProfitChart: (days = 7) =>
    axiosClient.get<ApiResponse<any>>(`/product/dashboard/profit-chart?days=${days}`).then(res => res.data),

  getPriceFluctuation: () =>
    axiosClient.get<ApiResponse<any>>('/product/dashboard/price-fluctuation').then(res => res.data),

  getMarketComparison: () =>
    axiosClient.get<ApiResponse<any>>('/product/dashboard/market-comparison').then(res => res.data),
    
  getLoginByDay: () =>
    axiosClient.get<ApiResponse<any>>('/auth/statistic/login-by-day').then(res => res.data),
}
