import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const sessionApi = {
  getActive: () =>
    axiosClient.get<ApiResponse<any>>('/auth/session/active').then(res => res.data),
  getActivePaged: (params?: { page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<any>>('/auth/session/active/paged', { params }).then(res => res.data),
  revoke: (id: string) =>
    axiosClient.post<ApiResponse<any>>(`/auth/session/revoke/${id}`).then(res => res.data),
  revokeAll: (currentSessionId: string) =>
    axiosClient.post<ApiResponse<any>>('/auth/session/revoke-all', null, {
      params: { currentSessionId },
    }).then(res => res.data),
  getCount: () =>
    axiosClient.get<ApiResponse<any>>('/auth/session/count').then(res => res.data),
  heartbeat: () =>
    axiosClient.post<ApiResponse<{ ok: boolean }>>('/auth/session/heartbeat').then(res => res.data.data),
}
