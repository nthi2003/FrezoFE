// ============================================================
// CRM Meetings — khớp BE MeetingController / MeetingRequest
// startAt / endAt ; cancel via PUT status=CANCELLED
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface MeetingDto {
  id: string
  title: string
  startAt: string
  endAt?: string
  dealId?: string
  customerId?: string
  location?: string
  meetingLink?: string
  attendees?: string
  status: string
  notes?: string
}

export interface MeetingCreateRequest {
  title: string
  startAt: string
  endAt?: string
  dealId?: string
  customerId?: string
  location?: string
  meetingLink?: string
  attendees?: string
  notes?: string
  status?: string
}

export const meetingsApi = {
  list: (dealId?: string) =>
    axiosClient
      .get<ApiResponse<MeetingDto[]>>('/crm/meetings', {
        params: dealId ? { dealId } : undefined,
      })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  create: (body: MeetingCreateRequest) =>
    axiosClient
      .post<ApiResponse<MeetingDto>>('/crm/meetings', body)
      .then((r) => r.data.data),

  update: (id: string, body: Partial<MeetingCreateRequest>) =>
    axiosClient
      .put<ApiResponse<MeetingDto>>(`/crm/meetings/${id}`, body)
      .then((r) => r.data.data),

  /** Huỷ: PUT status CANCELLED (BE không có POST /cancel) */
  cancel: (id: string) =>
    axiosClient
      .put<ApiResponse<MeetingDto>>(`/crm/meetings/${id}`, {
        status: 'CANCELLED',
      })
      .then((r) => r.data.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/crm/meetings/${id}`),
}
