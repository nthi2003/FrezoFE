import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const contractApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlns/contract', { params }).then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${id}`).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/qlns/contract', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/contract/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qlns/contract/${id}`).then(res => res.data),
  getCombobox: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/qlns/contract/combobox', { params }).then(res => res.data),
  assign: (contractId: string, data: any) =>
    axiosClient.post<ApiResponse<any>>(`/qlns/contract/${contractId}/assign`, data).then(res => res.data),
  getAssign: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/assign`).then(res => res.data),
  updateStatus: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/contract/${id}/update-status`, data).then(res => res.data),
  reject: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/qlns/contract/${id}/reject`, data).then(res => res.data),
  uploadDocument: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosClient.post<ApiResponse<any>>('/qlns/contract/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  uploadAndExtract: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosClient.post<ApiResponse<any>>('/qlns/contract/upload-and-extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  saveContent: (contractId: string, content: string) =>
    axiosClient.post<ApiResponse<any>>(`/qlns/contract/${contractId}/save-content`, { content }).then(res => res.data),
  aiEdit: (contractId: string, text: string, instruction?: string) =>
    axiosClient.post<ApiResponse<any>>(`/qlns/contract/${contractId}/ai-edit`, { text, instruction: instruction || 'chỉnh sửa văn bản cho chuyên nghiệp, sửa lỗi chính tả và ngữ pháp' }).then(res => res.data),
  aiEditText: (text: string, instruction?: string) =>
    axiosClient.post<ApiResponse<any>>('/qlns/contract/ai-edit', { text, instruction: instruction || 'chỉnh sửa văn bản cho chuyên nghiệp, sửa lỗi chính tả và ngữ pháp' }).then(res => res.data),
  checkAiStatus: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/ai-status`).then(res => res.data),
  getVersions: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/versions`).then(res => res.data),
  getVersionsDiff: (contractId: string) =>
    axiosClient.get<ApiResponse<any>>(`/qlns/contract/${contractId}/versions/diff`).then(res => res.data),

  // Contract templates (file stored in MinIO)
  getTemplates: () =>
    axiosClient.get<ApiResponse<any[]>>('/qlns/contract-template').then(res => res.data),
  createTemplate: (file: File, name: string, type: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    formData.append('type', type)
    return axiosClient.post<ApiResponse<any>>('/qlns/contract-template', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  deleteTemplate: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/qlns/contract-template/${id}`).then(res => res.data),
  getTemplateContent: async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch template content')
    return res.text()
  },
}
