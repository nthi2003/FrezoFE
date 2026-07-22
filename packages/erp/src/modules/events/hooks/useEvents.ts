import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { eventApi, type EventSaveRequest } from '../services/eventApi'

const QK = ['events'] as const
const QK_LIST = (status?: string) => [...QK, 'list', status || 'all'] as const
const QK_ONE = (id: string) => [...QK, 'one', id] as const

export function useEvents(status?: string) {
  return useQuery({
    queryKey: QK_LIST(status),
    queryFn: () => eventApi.list(status),
  })
}

export function useEvent(id?: string) {
  return useQuery({
    queryKey: QK_ONE(id || ''),
    queryFn: () => eventApi.get(id!),
    enabled: !!id,
  })
}

export function useEventRegistrations(id?: string) {
  return useQuery({
    queryKey: [...QK, 'regs', id || ''],
    queryFn: () => eventApi.registrations(id!),
    enabled: !!id,
  })
}

export function useSaveEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id?: string; body: EventSaveRequest }) =>
      args.id ? eventApi.update(args.id, args.body) : eventApi.create(args.body),
    onSuccess: (_d, vars) => {
      toast.success(vars.id ? 'Đã cập nhật sự kiện' : 'Đã tạo sự kiện')
      qc.invalidateQueries({ queryKey: QK })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response
        ?.data?.message
      toast.error(msg || 'Không lưu được sự kiện')
    },
  })
}

export function usePublishEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => eventApi.publish(id),
    onSuccess: () => {
      toast.success('Đã publish — mở RSVP')
      qc.invalidateQueries({ queryKey: QK })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response
        ?.data?.message
      toast.error(msg || 'Publish thất bại')
    },
  })
}

export function useCancelEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => eventApi.cancel(id),
    onSuccess: () => {
      toast.success('Đã huỷ sự kiện')
      qc.invalidateQueries({ queryKey: QK })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response
        ?.data?.message
      toast.error(msg || 'Huỷ thất bại')
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => eventApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá sự kiện')
      qc.invalidateQueries({ queryKey: QK })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response
        ?.data?.message
      toast.error(msg || 'Xoá thất bại')
    },
  })
}
