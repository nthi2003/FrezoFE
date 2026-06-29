import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosClient from '@/lib/axios/axiosClient'
import { attendanceApi } from '../services/attendanceApi'
import { toast } from 'sonner'

export function useAttendanceList(params?: any) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceApi.getAll(params),
    select: (res: any) => res?.data ?? { items: [], total: 0 },
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
