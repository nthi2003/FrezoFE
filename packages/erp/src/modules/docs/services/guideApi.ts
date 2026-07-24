// ============================================================
// Guide CMS API — FR-DOC-03 / FR-DOC-04
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface GuideSummary {
  id: string
  slug: string
  title: string
  module?: string | null
  summary?: string | null
  sortOrder?: number | null
  published?: boolean
  updatedBy?: string | null
  updatedDate?: string | null
}

export interface GuideDetail extends GuideSummary {
  body: string
  createdBy?: string | null
  createdDate?: string | null
}

export interface GuideSavePayload {
  slug: string
  title: string
  body: string
  module?: string
  summary?: string
  sortOrder?: number
  published?: boolean
}

export const guideApi = {
  listPublished: () =>
    axiosClient
      .get<ApiResponse<GuideSummary[]>>('/qtht/guides/published')
      .then((res) => res.data),

  getPublishedBySlug: (slug: string) =>
    axiosClient
      .get<ApiResponse<GuideDetail>>(`/qtht/guides/published/${encodeURIComponent(slug)}`)
      .then((res) => res.data),

  listAll: () =>
    axiosClient.get<ApiResponse<GuideSummary[]>>('/qtht/guides').then((res) => res.data),

  getById: (id: string) =>
    axiosClient.get<ApiResponse<GuideDetail>>(`/qtht/guides/${id}`).then((res) => res.data),

  create: (data: GuideSavePayload) =>
    axiosClient.post<ApiResponse<GuideDetail>>('/qtht/guides', data).then((res) => res.data),

  update: (id: string, data: GuideSavePayload) =>
    axiosClient.put<ApiResponse<GuideDetail>>(`/qtht/guides/${id}`, data).then((res) => res.data),

  publish: (id: string) =>
    axiosClient
      .put<ApiResponse<GuideDetail>>(`/qtht/guides/${id}/publish`)
      .then((res) => res.data),

  unpublish: (id: string) =>
    axiosClient
      .put<ApiResponse<GuideDetail>>(`/qtht/guides/${id}/unpublish`)
      .then((res) => res.data),

  delete: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/qtht/guides/${id}`).then((res) => res.data),
}
