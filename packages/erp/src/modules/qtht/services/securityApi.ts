// ============================================================
// FREZO ERP — Security API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const ipBlacklistApi = {
  ban: (data: any) => axiosClient.post<ApiResponse<any>>('/qtht/ip-blacklist/ban', data).then(res => res.data),
  unban: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qtht/ip-blacklist/unban/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/qtht/ip-blacklist', { params }).then(res => res.data),
}

export const ipWhitelistApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/qtht/ip-whitelist', data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qtht/ip-whitelist/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/qtht/ip-whitelist', { params }).then(res => res.data),
  check: (params?: any) => axiosClient.get<ApiResponse<any>>('/qtht/ip-whitelist/check', { params }).then(res => res.data),
}

export const ipTrustApi = {
  create: (data: any) => axiosClient.post<ApiResponse<any>>('/qtht/ip-trust', data).then(res => res.data),
  update: (id: string, data: any) => axiosClient.put<ApiResponse<any>>(`/qtht/ip-trust/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/qtht/ip-trust/${id}`).then(res => res.data),
  getById: (id: string) => axiosClient.get<ApiResponse<any>>(`/qtht/ip-trust/${id}`).then(res => res.data),
  getAll: (params?: any) => axiosClient.get<ApiResponse<any>>('/qtht/ip-trust', { params }).then(res => res.data),
}

export const internalGatewayApi = {
  blockIp: (data: any) => axiosClient.post<ApiResponse<any>>('/qtht/internal-gateway/block-ip', data).then(res => res.data),
  getBlacklist: () => axiosClient.get<ApiResponse<any>>('/qtht/internal-gateway/blacklist').then(res => res.data),
  getWhitelist: () => axiosClient.get<ApiResponse<any>>('/qtht/internal-gateway/whitelist').then(res => res.data),
}
