import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@frezo/types'

export interface ProfileInfo {
  id: string
  username: string
  name: string
  email: string
  avatarUrl?: string
  dataAction?: number
  personId?: string
  phone?: string
  jobTitle?: string
  orgId?: string
  isAdmin?: boolean
}

export interface LoginHistoryItem {
  id: string
  userName: string
  loginTime: string
  ipAddress: string
  userAgent: string
  status: string
}

export interface PersonDocument {
  id: string
  personId: string
  type: 'CV' | 'CERTIFICATE' | 'ACHIEVEMENT'
  title?: string
  description?: string
  fileName?: string
  fileUrl?: string
  fileSize?: number
  contentType?: string
  createdDate?: string
}

export const profileApi = {
  getProfile: () =>
    axiosClient
      .get<ApiResponse<ProfileInfo>>(API.AUTH.PROFILE)
      .then((res) => res.data.data),

  getLoginHistory: () =>
    axiosClient
      .get<ApiResponse<LoginHistoryItem[]>>(API.AUTH.LOGIN_HISTORY)
      .then((res) => res.data.data),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosClient
      .post<ApiResponse<string>>(API.AUTH.AVATAR_UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data.data)
  },

  // ---- Person Documents ----
  getDocuments: (personId: string, type?: string) =>
    axiosClient
      .get<ApiResponse<PersonDocument[]>>(API.PERSON_DOCUMENT.LIST(personId), {
        params: type ? { type } : undefined,
      })
      .then((res) => res.data.data),

  uploadDocument: (personId: string, type: string, file: File, title?: string, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    if (title) formData.append('title', title)
    if (description) formData.append('description', description)
    return axiosClient
      .post<ApiResponse<PersonDocument>>(API.PERSON_DOCUMENT.UPLOAD(personId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data.data)
  },

  deleteDocument: (personId: string, documentId: string) =>
    axiosClient
      .delete<ApiResponse<void>>(API.PERSON_DOCUMENT.DELETE(personId, documentId))
      .then((res) => res.data),
}
