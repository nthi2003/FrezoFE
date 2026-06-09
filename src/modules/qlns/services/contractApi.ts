// ============================================================
// FREZO ERP — Contract API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const contractApi = {
  reject: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/contract/${id}/reject`, data).then(res => res.data),

  getVersions: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/versions`).then(res => res.data),

  getVersionsDiff: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/versions/diff`).then(res => res.data)
}
