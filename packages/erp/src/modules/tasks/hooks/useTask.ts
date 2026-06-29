import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi, ticketApi, tagApi } from '../services/taskApi'
import { toast } from 'sonner'

export function useTasks(params?: any) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskApi.getAll(params),
    select: (res: any) => res?.data ?? [],
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => taskApi.create(data),
    onSuccess: () => {
      toast.success('Thêm task thành công')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taskApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật task thành công')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa task thành công')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
