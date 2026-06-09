import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketApi, tagApi } from '../services/taskApi'
import { toast } from 'sonner'

export function useTickets(params?: any) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketApi.getAll(params),
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => ticketApi.create(data),
    onSuccess: () => {
      toast.success('Tạo ticket thành công')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ticketApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật ticket thành công')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useDeleteTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa ticket thành công')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useTags(params?: any) {
  return useQuery({
    queryKey: ['tags', params],
    queryFn: () => tagApi.getAll(params),
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => tagApi.create(data),
    onSuccess: () => {
      toast.success('Tạo tag thành công')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tagApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật tag thành công')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa tag thành công')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
