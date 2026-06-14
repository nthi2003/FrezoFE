import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const attendanceApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlns/attendance', { params }).then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/attendance/${id}`).then(res => res.data),
  checkIn: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/attendance/check-in', data).then(res => res.data),
  checkOut: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/attendance/check-out', data).then(res => res.data),
}
