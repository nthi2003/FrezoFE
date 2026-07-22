import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { meetingsApi, type MeetingCreateRequest } from '../services/meetingsApi'

export function useMeetings(dealId?: string) {
  return useQuery({
    queryKey: ['crm', 'meetings', dealId ?? 'all'],
    queryFn: () => meetingsApi.list(dealId),
  })
}

export function useCreateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: MeetingCreateRequest) => meetingsApi.create(body),
    onSuccess: () => {
      toast.success('Đã tạo cuộc họp')
      qc.invalidateQueries({ queryKey: ['crm', 'meetings'] })
    },
    onError: () => toast.error('Tạo cuộc họp thất bại'),
  })
}

export function useCancelMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => meetingsApi.cancel(id),
    onSuccess: () => {
      toast.success('Đã huỷ cuộc họp')
      qc.invalidateQueries({ queryKey: ['crm', 'meetings'] })
    },
    onError: () => toast.error('Huỷ thất bại'),
  })
}
