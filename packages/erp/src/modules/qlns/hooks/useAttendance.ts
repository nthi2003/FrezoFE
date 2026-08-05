import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosClient from '@/lib/axios/axiosClient'
import {
  attendanceApi,
  type AttendanceDailyFilter,
  type AttendanceDailyPage,
} from '../services/attendanceApi'
import { toast } from 'sonner'

export function useAttendanceList(params?: any) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceApi.getAll(params),
    select: (res: any) => res?.data ?? { items: [], total: 0 },
  })
}

/**
 * Roster chấm công theo ngày (HR) — ATT-FE-01.
 * Prefer /daily; API tự fallback list?date= khi endpoint chưa sẵn sàng.
 */
export function useAttendanceDaily(params: AttendanceDailyFilter, enabled = true) {
  return useQuery({
    queryKey: ['attendance', 'daily', params],
    queryFn: () => attendanceApi.getDaily(params),
    enabled: enabled && !!params.date,
    select: (res): AttendanceDailyPage =>
      res?.data ?? { items: [], total: 0, source: 'daily' as const },
    // Manual refresh là P1; poll nhẹ 45s khi tab đang mở (P2)
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  })
}

export function useAttendanceById(id: string) {
  return useQuery({
    queryKey: ['attendance', id],
    queryFn: () => attendanceApi.getById(id),
    enabled: !!id,
    select: (res: any) => res?.data ?? null,
  })
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      axiosClient.put(`/qlns/attendance/${id}`, data).then(res => res.data),
    onSuccess: () => {
      toast.success('Cập nhật chấm công thành công')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}

/**
 * Check-in cho user hiện tại. Payload có thể chứa personId, contractId, tọa độ GPS
 * (nếu browser cho phép) và note. Backend tự set attendanceDate = hôm nay nếu bỏ trống.
 *
 * @param opts.skipSuccessToast — khi caller tự show UxEventPopup từ popupEvent
 */
export function useCheckIn(opts?: { skipSuccessToast?: boolean }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => attendanceApi.checkIn(data),
    onSuccess: () => {
      if (!opts?.skipSuccessToast) {
        toast.success('Đã check-in thành công!')
      }
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'my-month'] })
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Không thể check-in, thử lại.'),
  })
}

/**
 * Check-out cho user hiện tại. Backend sẽ tính workMinutes / lateMinutes / overtimeMinutes.
 */
export function useCheckOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => attendanceApi.checkOut(data),
    onSuccess: () => {
      toast.success('Đã check-out. Chúc ngày làm việc hiệu quả!')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'my-month'] })
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Không thể check-out, thử lại.'),
  })
}

/**
 * Lấy bản ghi chấm công hôm nay của 1 person (dùng cho TodayCard).
 * Backend không có endpoint riêng → dùng filter list với date=today + personId, size=1.
 */
export function useMyTodayAttendance(personId?: string) {
  const today = new Date().toISOString().slice(0, 10)
  return useQuery({
    queryKey: ['attendance', 'today', personId, today],
    queryFn: () =>
      attendanceApi.getAll({
        personId,
        date: today,
        pageNumber: 1,
        pageSize: 1,
      }),
    enabled: !!personId,
    select: (res: any) => {
      const items = res?.data?.items ?? []
      return items[0] || null
    },
  })
}

/**
 * Lấy toàn bộ chấm công của 1 person trong tháng — dùng để build heatmap + KPI cá nhân.
 * Size lớn (100) để chắc chắn không bị paginate mất.
 */
export function useMyMonthAttendance(personId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey: ['attendance', 'my-month', personId, month, year],
    queryFn: () =>
      attendanceApi.getAll({
        personId,
        month,
        year,
        pageNumber: 1,
        pageSize: 100,
      }),
    enabled: !!personId && !!month && !!year,
    select: (res: any) => res?.data?.items ?? [],
  })
}
