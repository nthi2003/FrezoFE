// ============================================================
// FREZO ERP — Leave & LeaveRequest API Service
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const leaveApi = {
  createLeave: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/leave', data).then(res => res.data),
  
  approveLeave: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/leave/${id}/approve`).then(res => res.data),

  getLeaveByPerson: (personId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/leave/person/${personId}`).then(res => res.data)
}

export const leaveRequestApi = {
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/leave-request', data).then(res => res.data),

  getMyRequests: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/leave-request/my/${contractId}`).then(res => res.data),

  getPending: () =>
    axiosClient.get<ApiResponse<any>>('/qlns/leave-request/pending').then(res => res.data),

  approve: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/leave-request/${id}/approve`).then(res => res.data),

  reject: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/leave-request/${id}/reject`, data).then(res => res.data)
}
