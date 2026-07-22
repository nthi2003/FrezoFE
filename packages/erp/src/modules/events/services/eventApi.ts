// ============================================================
// Events Admin API — /events (khớp BE EventController)
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import { unwrapList } from '@frezo/utils'
import type { ApiResponse } from '@frezo/types'

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | string

export interface EventDto {
  id: string
  title: string
  description?: string | null
  location?: string | null
  startAt: string
  endAt?: string | null
  status: EventStatus
  capacity?: number | null
  registeredCount?: number | null
  seatsLeft?: number | null
  coverUrl?: string | null
  organizerUsername?: string | null
  publishedAt?: string | null
  cancelledAt?: string | null
  createdDate?: string | null
  myRsvpStatus?: string | null
}

export interface EventSaveRequest {
  title: string
  description?: string
  location?: string
  startAt: string
  endAt?: string
  capacity?: number | null
  coverUrl?: string
}

export interface EventRegistrationDto {
  id: string
  eventId: string
  username: string
  rsvpStatus: string
  createdDate?: string
}

export const eventApi = {
  list: (status?: string) =>
    axiosClient
      .get<ApiResponse<unknown>>('/events', {
        params: status ? { status } : undefined,
      })
      .then((r) => unwrapList<EventDto>(r.data))
      .catch((err: unknown) => {
        const s = (err as { response?: { status?: number } })?.response?.status
        if (s === 404 || s === 501) return [] as EventDto[]
        throw err
      }),

  calendar: (from?: string, to?: string) =>
    axiosClient
      .get<ApiResponse<EventDto[]>>('/events/calendar', {
        params: { from, to },
      })
      .then((r) => r.data.data ?? []),

  get: (id: string) =>
    axiosClient
      .get<ApiResponse<EventDto>>(`/events/${id}`)
      .then((r) => r.data.data),

  create: (body: EventSaveRequest) =>
    axiosClient
      .post<ApiResponse<EventDto>>('/events', body)
      .then((r) => r.data.data),

  update: (id: string, body: EventSaveRequest) =>
    axiosClient
      .put<ApiResponse<EventDto>>(`/events/${id}`, body)
      .then((r) => r.data.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/events/${id}`),

  publish: (id: string) =>
    axiosClient
      .post<ApiResponse<EventDto>>(`/events/${id}/publish`)
      .then((r) => r.data.data),

  cancel: (id: string) =>
    axiosClient
      .post<ApiResponse<EventDto>>(`/events/${id}/cancel`)
      .then((r) => r.data.data),

  registrations: (id: string) =>
    axiosClient
      .get<ApiResponse<EventRegistrationDto[]>>(`/events/${id}/registrations`)
      .then((r) => r.data.data ?? []),
}
