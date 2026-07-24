// ============================================================
// Comment + user-search API (BE FZ-004 đã ship)
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'
import type {
  CommentAttachment,
  CommentCreatePayload,
  CommentDto,
  CommentUpdatePayload,
  MentionUser,
  PageResponse,
} from './types'

const BASE = '/comments'

export const commentApi = {
  list: (params: {
    subjectType: string
    subjectId: string
    page?: number
    size?: number
  }) =>
    axiosClient
      .get<ApiResponse<PageResponse<CommentDto>>>(BASE, { params })
      .then((r) => r.data.data),

  create: (payload: CommentCreatePayload) =>
    axiosClient
      .post<ApiResponse<CommentDto>>(BASE, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: CommentUpdatePayload) =>
    axiosClient
      .put<ApiResponse<CommentDto>>(`${BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`${BASE}/${id}`).then((r) => r.data),

  /** POST /comments/attachments — multipart MinIO upload */
  uploadAttachment: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axiosClient
      .post<ApiResponse<CommentAttachment>>(`${BASE}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data)
  },

  /** GET /qtht/user/search?q= */
  searchUsers: (q: string) =>
    axiosClient
      .get<ApiResponse<MentionUser[]>>('/qtht/user/search', { params: { q } })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),
}
