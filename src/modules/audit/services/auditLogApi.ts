import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const auditLogApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qtht/audit-logs', { params }).then(res => res.data),
  health: () =>
    axiosClient.get<ApiResponse<any>>('/qtht/audit-logs/health').then(res => res.data),
}
