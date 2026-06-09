import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveApi, leaveRequestApi } from '../services/leaveApi'
import { toast } from 'sonner'

export function useLeaveRequests() {
  return useQuery({
    queryKey: ['leave_requests'],
    queryFn: () => leaveRequestApi.getPending(), // Placeholder: usually gets all/paginated
  })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => leaveRequestApi.create(data),
    onSuccess: () => {
      toast.success('Đã gửi đơn xin nghỉ phép')
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leaveRequestApi.approve(id),
    onSuccess: () => {
      toast.success('Đã duyệt đơn nghỉ phép')
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] })
    },
  })
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => leaveRequestApi.reject(id, data),
    onSuccess: () => {
      toast.success('Đã từ chối đơn nghỉ phép')
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] })
    },
  })
}
