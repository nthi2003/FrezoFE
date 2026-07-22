import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'
import { API } from '@/lib/axios/apiEndpoints'

/** Trạng thái hiển thị roster ngày (BE displayStatus / filter status). */
export type AttendanceDailyStatus =
  | 'OK'
  | 'LATE'
  | 'NOT_CHECKED_IN'
  | 'CHECKED_IN'
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'LEAVE'
  | 'HOLIDAY'
  | string

export interface AttendanceDailyFilter {
  date: string
  departmentId?: string
  status?: string
  personId?: string
  pageNumber?: number
  pageSize?: number
}

export interface AttendanceDailyRow {
  id?: string
  personId: string
  personName?: string
  departmentId?: string
  departmentName?: string
  attendanceDate?: string
  checkInTime?: string | null
  checkOutTime?: string | null
  checkInLatitude?: number | null
  checkInLongitude?: number | null
  checkOutLatitude?: number | null
  checkOutLongitude?: number | null
  /** Geofence flags nếu BE trả về */
  checkInGeofenceOk?: boolean | null
  checkOutGeofenceOk?: boolean | null
  checkInInsideGeofence?: boolean | null
  checkOutInsideGeofence?: boolean | null
  status?: AttendanceDailyStatus
  displayStatus?: AttendanceDailyStatus
  note?: string | null
  workMinutes?: number | null
  lateMinutes?: number | null
}

export interface AttendanceDailyPage {
  items: AttendanceDailyRow[]
  total: number
  /** `daily` = endpoint /daily; `fallback` = list?date= khi /daily chưa sẵn sàng */
  source: 'daily' | 'fallback'
}

function unwrapPage(raw: unknown): { items: AttendanceDailyRow[]; total: number } {
  const data = (raw as { data?: unknown })?.data ?? raw
  if (Array.isArray(data)) {
    return { items: data as AttendanceDailyRow[], total: data.length }
  }
  const page = data as { items?: AttendanceDailyRow[]; total?: number; content?: AttendanceDailyRow[] } | null
  const items = page?.items ?? page?.content ?? []
  return {
    items: Array.isArray(items) ? items : [],
    total: typeof page?.total === 'number' ? page.total : items.length,
  }
}

function isNotReady(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === 404 || status === 501 || status === 405) return true
  // Trước khi BE thêm /daily, Spring map vào GET /{id} → "daily" not found (thường 400/404)
  const msg = String(
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (err as Error)?.message ||
      '',
  ).toLowerCase()
  return msg.includes('not.found') || msg.includes('not found') || msg.includes('attendance.not')
}

/** Phân biệt PageResponse vs AttendanceResponse (khi /daily còn dính GET /{id}). */
function looksLikeDailyPage(raw: unknown): boolean {
  const data = (raw as { data?: unknown })?.data ?? raw
  if (Array.isArray(data)) return true
  if (data && typeof data === 'object') {
    const o = data as { items?: unknown; content?: unknown }
    return Array.isArray(o.items) || Array.isArray(o.content)
  }
  return false
}

/**
 * Map filter status roster → status list tháng (khi fallback).
 * OK/CHECKED_IN → PRESENT; NOT_CHECKED_IN không map được trên list cũ.
 */
function mapStatusForListFallback(status?: string): string | undefined {
  if (!status) return undefined
  const s = status.toUpperCase()
  if (s === 'OK' || s === 'CHECKED_IN') return 'PRESENT'
  if (s === 'LATE') return 'LATE'
  if (s === 'NOT_CHECKED_IN') return undefined
  return status
}

export const attendanceApi = {
  getAll: (params?: Record<string, unknown>) =>
    axiosClient
      .get<ApiResponse<unknown>>(API.QLNS.ATTENDANCE, { params })
      .then((res) => res.data),

  getById: (id: string) =>
    axiosClient
      .get<ApiResponse<unknown>>(API.QLNS.ATTENDANCE_BY_ID(id))
      .then((res) => res.data),

  checkIn: (data: Record<string, unknown>) =>
    axiosClient
      .post<ApiResponse<unknown>>(API.QLNS.ATTENDANCE_CHECKIN, data)
      .then((res) => res.data),

  checkOut: (data: Record<string, unknown>) =>
    axiosClient
      .post<ApiResponse<unknown>>(API.QLNS.ATTENDANCE_CHECKOUT, data)
      .then((res) => res.data),

  /**
   * Roster công ty theo ngày (ATT-FE-01).
   * Ưu tiên GET /qlns/attendance/daily; nếu BE chưa có (404/501) → fallback list?date=.
   */
  getDaily: async (params: AttendanceDailyFilter): Promise<ApiResponse<AttendanceDailyPage>> => {
    const loadFallback = async (): Promise<ApiResponse<AttendanceDailyPage>> => {
      const listParams: Record<string, unknown> = {
        date: params.date,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
      }
      if (params.personId) listParams.personId = params.personId
      const mappedStatus = mapStatusForListFallback(params.status)
      if (mappedStatus) listParams.status = mappedStatus
      // departmentId chưa hỗ trợ trên list cũ — bỏ qua
      const res = await axiosClient.get<ApiResponse<unknown>>(API.QLNS.ATTENDANCE, {
        params: listParams,
      })
      const page = unwrapPage(res.data)
      return {
        ...(res.data as ApiResponse<AttendanceDailyPage>),
        data: { ...page, source: 'fallback' },
      }
    }

    try {
      const res = await axiosClient.get<ApiResponse<unknown>>(API.QLNS.ATTENDANCE_DAILY, {
        params,
      })
      // BE chưa có /daily → có thể “thành công” nhầm qua GET /{id} hoặc trả body lạ
      if (!looksLikeDailyPage(res.data)) {
        return loadFallback()
      }
      const page = unwrapPage(res.data)
      return {
        ...(res.data as ApiResponse<AttendanceDailyPage>),
        data: { ...page, source: 'daily' },
      }
    } catch (err) {
      if (!isNotReady(err)) throw err
      return loadFallback()
    }
  },

  /**
   * Export roster ngày. BE blob nếu sẵn sàng; caller xử lý lỗi → CSV client.
   */
  exportDaily: async (params: Pick<AttendanceDailyFilter, 'date' | 'departmentId' | 'status' | 'personId'>) => {
    return axiosClient.get(API.QLNS.ATTENDANCE_DAILY_EXPORT, {
      params,
      responseType: 'blob',
    })
  },
}
