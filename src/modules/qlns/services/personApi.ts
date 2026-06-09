// ============================================================
// FREZO ERP — Person API Service
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const personApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlns/person/all', { params }).then((res) => res.data),
  
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/person', data).then((res) => res.data),

  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/person/${id}`, data).then((res) => res.data),

  getCombobox: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlns/person/combobox', { params }).then((res) => res.data),

  activate: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/person/${id}/activate`).then((res) => res.data),

  deactivate: (id: string) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/person/${id}/deactivate`).then((res) => res.data),

  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qlns/person/${id}`).then((res) => res.data),

  uploadAvatarTemp: (userName: string, file: File) => {
    const formData = new FormData();
    formData.append('userName', userName);
    formData.append('file', file);
    return axiosClient.post<ApiResponse<any>>('/qlns/person/upload-avatar-temp', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  }
}
