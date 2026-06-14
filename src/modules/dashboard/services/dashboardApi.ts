import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@/types/api.types'

export interface DashboardSummary {
  totalPersons: number;
  totalContracts: number;
  pendingLeaves: number;
  activeTickets: number;
  revenue?: number;
}

export const dashboardApi = {
  getSummary: () =>
    axiosClient.get<ApiResponse<DashboardSummary>>('/qtht/dashboard/summary').then((res) => res.data.data),
    
  exportAttendance: () =>
    axiosClient.get('/qtht/dashboard/export/attendance', { responseType: 'blob' }),
}
